'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  executeMerge,
  runWithRetries,
  validatePolicy,
} = require('./review-pipeline-gate.cjs');

const STATUS_MARKER = '<!-- review-pipeline:status -->';
const THREAT_PATTERN = /semgrep|codeql|security|guardian|socket/i;

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

async function loadRollup(github, owner, repo, headSha) {
  const nodes = [];
  let after = null;
  do {
    const result = await github.graphql(`
      query ReviewPipelineRollup($owner: String!, $repo: String!, $sha: GitObjectID!, $after: String) {
        repository(owner: $owner, name: $repo) {
          object(oid: $sha) {
            ... on Commit {
              statusCheckRollup {
                contexts(first: 100, after: $after) {
                  nodes {
                    __typename
                    ... on CheckRun {
                      databaseId
                      name
                      status
                      conclusion
                      startedAt
                      completedAt
                      detailsUrl
                      checkSuite { app { slug } }
                    }
                    ... on StatusContext {
                      id
                      context
                      state
                      createdAt
                      targetUrl
                    }
                  }
                  pageInfo { hasNextPage endCursor }
                }
              }
            }
          }
        }
      }
    `, { owner, repo, sha: headSha, after });
    const contexts = result.repository?.object?.statusCheckRollup?.contexts;
    if (!contexts) break;
    for (const node of contexts.nodes || []) {
      if (node.__typename === 'CheckRun') {
        nodes.push({
          kind: 'check_run',
          id: node.databaseId,
          name: node.name,
          appSlug: node.checkSuite?.app?.slug || 'unknown-app',
          status: node.status,
          conclusion: node.conclusion,
          headSha,
          startedAt: node.startedAt,
          completedAt: node.completedAt,
          detailsUrl: node.detailsUrl,
        });
      } else if (node.__typename === 'StatusContext') {
        nodes.push({
          kind: 'status',
          id: node.id,
          context: node.context,
          state: node.state,
          headSha,
          createdAt: node.createdAt,
          targetUrl: node.targetUrl,
        });
      }
    }
    after = contexts.pageInfo?.hasNextPage ? contexts.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}

async function loadEvidence({ github, owner, repo, headSha, core, attempt }) {
  const snapshot = {
    checkRuns: [],
    rollup: [],
    workflowRuns: [],
    statuses: [],
    sourceErrors: [],
  };
  const read = async (source, operation) => {
    try {
      snapshot[source] = await operation();
    } catch (error) {
      const detail = `${source}: ${messageOf(error)}`;
      snapshot.sourceErrors.push(detail);
      core.warning(`Review evidence source unavailable (${detail}).`);
    }
  };

  await read('checkRuns', () => github.paginate(github.rest.checks.listCheckRunsForRef, {
    owner,
    repo,
    ref: headSha,
    filter: 'all',
    per_page: 100,
  }));
  await read('rollup', () => loadRollup(github, owner, repo, headSha));
  await read('workflowRuns', async () => {
    const runs = await github.paginate(github.rest.actions.listWorkflowRunsForRepo, {
      owner,
      repo,
      head_sha: headSha,
      per_page: 100,
    });
    return runs.filter((run) => run.name !== 'Review Pipeline');
  });
  await read('statuses', () => github.paginate(github.rest.repos.listCommitStatusesForRef, {
    owner,
    repo,
    ref: headSha,
    per_page: 100,
  }));

  const appSlugs = [...new Set(snapshot.checkRuns.map((run) => run.app?.slug || 'unknown-app'))].sort();
  core.info(JSON.stringify({
    event: 'review_pipeline_evidence',
    attempt,
    headSha,
    counts: {
      checkRuns: snapshot.checkRuns.length,
      rollup: snapshot.rollup.length,
      workflowRuns: snapshot.workflowRuns.length,
      statuses: snapshot.statuses.length,
      sourceErrors: snapshot.sourceErrors.length,
    },
    appSlugs,
  }));
  return snapshot;
}

async function resolvePullRequest({ github, context, owner, repo, defaultBranch, core }) {
  let branch = null;
  let eventSha = null;
  let eventPrNumber = null;
  if (context.eventName === 'workflow_dispatch') {
    branch = context.payload.inputs?.branch || null;
  } else if (context.eventName === 'workflow_run') {
    branch = context.payload.workflow_run?.head_branch || null;
    eventSha = context.payload.workflow_run?.head_sha || null;
    eventPrNumber = context.payload.workflow_run?.pull_requests?.[0]?.number || null;
  } else if (context.eventName === 'check_suite') {
    branch = context.payload.check_suite?.head_branch || null;
    eventSha = context.payload.check_suite?.head_sha || null;
    eventPrNumber = context.payload.check_suite?.pull_requests?.[0]?.number || null;
  } else if (context.eventName === 'status') {
    eventSha = context.payload.sha || null;
  }

  let candidate = null;
  if (eventPrNumber) {
    candidate = (await github.rest.pulls.get({ owner, repo, pull_number: eventPrNumber })).data;
  } else {
    const open = await github.paginate(github.rest.pulls.list, {
      owner,
      repo,
      state: 'open',
      per_page: 100,
    });
    candidate = open.find((pr) => {
      const sameRepository = pr.head?.repo?.full_name === `${owner}/${repo}`;
      if (!sameRepository) return false;
      if (branch) return pr.head.ref === branch;
      return eventSha && pr.head.sha === eventSha;
    }) || null;
  }

  if (!candidate) {
    core.info(`No open pull request matched branch=${branch || 'n/a'} sha=${eventSha || 'n/a'}.`);
    return null;
  }
  if (candidate.head?.repo?.full_name !== `${owner}/${repo}`) {
    core.info(`PR #${candidate.number} has an untrusted fork head; autonomous evaluation is disabled.`);
    return null;
  }
  const pr = (await github.rest.pulls.get({ owner, repo, pull_number: candidate.number })).data;
  core.info(JSON.stringify({
    event: 'review_pipeline_candidate',
    pr: pr.number,
    base: pr.base.ref,
    defaultBranch,
    branch: pr.head.ref,
    eventSha,
    authoritativeHeadSha: pr.head.sha,
    draft: pr.draft,
  }));
  return { pr, eventSha };
}

async function createStatusHelpers({ github, owner, repo, pr, branch, headSha }) {
  async function setStatus(body) {
    const text = `${STATUS_MARKER}\n${body}`;
    const comments = await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: pr.number,
      per_page: 100,
    });
    const existing = comments.find((comment) => comment.body?.includes(STATUS_MARKER));
    if (existing) {
      await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body: text });
    } else {
      await github.rest.issues.createComment({ owner, repo, issue_number: pr.number, body: text });
    }
  }

  async function upsertAlert(kind, detail) {
    const label = kind === 'threat' ? 'threat' : 'broke';
    const title = `[pipeline] PR #${pr.number} blocked: ${kind.toUpperCase()}`;
    const issues = await github.paginate(github.rest.issues.listForRepo, {
      owner,
      repo,
      state: 'open',
      labels: label,
      per_page: 100,
    });
    const existing = issues.find((issue) => issue.title === title);
    const body = [
      `Automated gate flagged **${kind.toUpperCase()}** on PR #${pr.number} (\`${branch}\`).`,
      '',
      detail,
      '',
      `Head: \`${headSha.slice(0, 9)}\` - PR: #${pr.number}`,
      'This issue auto-closes when the gating checks go green.',
    ].join('\n');
    if (existing) {
      await github.rest.issues.update({ owner, repo, issue_number: existing.number, body });
    } else {
      await github.rest.issues.create({ owner, repo, title, body, labels: [label, 'pipeline'] });
    }
  }

  async function closeAlerts() {
    for (const label of ['broke', 'threat']) {
      const issues = await github.paginate(github.rest.issues.listForRepo, {
        owner,
        repo,
        state: 'open',
        labels: label,
        per_page: 100,
      });
      const title = `[pipeline] PR #${pr.number} blocked: ${label.toUpperCase()}`;
      for (const issue of issues.filter((item) => item.title === title)) {
        await github.rest.issues.update({ owner, repo, issue_number: issue.number, state: 'closed' });
      }
    }
  }

  return { closeAlerts, setStatus, upsertAlert };
}

async function deleteBranchIfUnchanged({ branch, expectedSha, getRef, deleteRef }) {
  let current;
  try {
    current = await getRef(`heads/${branch}`);
  } catch (error) {
    if (error?.status === 404) return { state: 'preserved', reason: 'branch_missing' };
    throw error;
  }
  const currentSha = current?.object?.sha || current?.data?.object?.sha || null;
  if (currentSha !== expectedSha) {
    return { state: 'preserved', reason: 'branch_moved', currentSha, expectedSha };
  }
  await deleteRef(`heads/${branch}`);
  return { state: 'deleted', sha: expectedSha };
}

async function runGitHubReviewPipeline({ github, context, core, retry = {}, policy: policyOverride }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const repository = (await github.rest.repos.get({ owner, repo })).data;
  const defaultBranch = repository.default_branch;
  const policy = policyOverride || JSON.parse(fs.readFileSync(
    path.join(process.env.GITHUB_WORKSPACE || process.cwd(), '.github', 'review-pipeline-policy.json'),
    'utf8',
  ));
  validatePolicy(policy);
  try {
    const rate = (await github.rest.rateLimit.get()).data.rate;
    core.info(JSON.stringify({
      event: 'review_pipeline_rate_limit',
      remaining: rate.remaining,
      limit: rate.limit,
      reset: rate.reset,
    }));
  } catch (error) {
    core.warning(`Rate-limit metadata unavailable: ${messageOf(error)}`);
  }

  const resolved = await resolvePullRequest({ github, context, owner, repo, defaultBranch, core });
  if (!resolved) return { state: 'skipped', reason: 'no_matching_pr' };
  const { pr, eventSha } = resolved;
  const branch = pr.head.ref;
  const headSha = pr.head.sha;
  const status = await createStatusHelpers({ github, owner, repo, pr, branch, headSha });

  const decision = await runWithRetries({
    pr,
    defaultBranch,
    eventSha,
    policy,
    refreshPr: async () => (await github.rest.pulls.get({ owner, repo, pull_number: pr.number })).data,
    maxAttempts: retry.maxAttempts ?? 6,
    requiredStableObservations: retry.requiredStableObservations ?? policy.stableObservations,
    delayMs: retry.delayMs ?? 10_000,
    sleep: retry.sleep,
    loadEvidence: (attempt, currentPr) => loadEvidence({
      github,
      owner,
      repo,
      headSha: currentPr.head.sha,
      core,
      attempt,
    }),
  });
  core.setOutput('decision', decision.state);
  core.info(JSON.stringify({
    event: 'review_pipeline_decision',
    pr: pr.number,
    headSha,
    state: decision.state,
    reason: decision.reason,
    attempt: decision.attempt,
    observedChecks: decision.checks?.length || 0,
    missingRequired: decision.missingRequired || [],
    apps: decision.apps || [],
  }));

  if (decision.state === 'skipped') {
    core.info(`Review Pipeline skipped PR #${pr.number}: ${decision.reason}.`);
    return decision;
  }
  if (decision.state === 'failed') {
    const kind = decision.failed.some((item) => THREAT_PATTERN.test(`${item.name} ${item.appSlug}`))
      ? 'threat'
      : 'broke';
    const detail = decision.failed
      .map((item) => `- ${item.name} (${item.appSlug}): \`${item.conclusion}\`${item.url ? ` - ${item.url}` : ''}`)
      .join('\n');
    await status.upsertAlert(kind, detail);
    await status.setStatus(`### Pipeline: BLOCKED (${kind.toUpperCase()})\nFailing check(s):\n${detail}`);
    return decision;
  }
  if (decision.state !== 'ready') {
    const details = decision.reason === 'evidence_disagreement'
      ? 'Check sources disagree for the same head SHA. No merge was attempted.'
      : decision.reason === 'required_checks_missing'
        ? `Required checks never became visible: ${(decision.missingRequired || []).join(', ')}. No merge was attempted.`
        : decision.reason === 'checks_pending_after_retry'
        ? 'Checks did not settle within the bounded observation window. No merge was attempted.'
        : 'No authoritative CI evidence became visible within the bounded observation window. No merge was attempted.';
    await status.setStatus(`### Pipeline: waiting\n${details}\n\nHead: \`${headSha.slice(0, 9)}\``);
    core.warning(`Review Pipeline fail-closed for PR #${pr.number}: ${decision.reason}.`);
    return decision;
  }

  const mergeResult = await executeMerge({
    pr,
    expectedHeadSha: headSha,
    refetchPr: async () => (await github.rest.pulls.get({ owner, repo, pull_number: pr.number })).data,
    merge: async (request) => (await github.rest.pulls.merge({ owner, repo, ...request })).data,
    sleep: retry.sleep,
    receiptDelayMs: retry.receiptDelayMs ?? 1_000,
  });
  if (mergeResult.state !== 'merged') {
    await status.setStatus(`### Pipeline: merge blocked\nAll observed checks were green, but the merge precondition failed: \`${mergeResult.reason}\`.`);
    core.warning(`Merge blocked for PR #${pr.number}: ${mergeResult.reason}.`);
    return mergeResult;
  }

  try {
    const deletion = await deleteBranchIfUnchanged({
      branch,
      expectedSha: headSha,
      getRef: async (ref) => (await github.rest.git.getRef({ owner, repo, ref })).data,
      deleteRef: async (ref) => github.rest.git.deleteRef({ owner, repo, ref }),
    });
    core.info(JSON.stringify({ event: 'review_pipeline_branch_cleanup', branch, ...deletion }));
  } catch (error) {
    core.warning(`Branch cleanup failed closed: ${messageOf(error)}`);
  }
  await status.closeAlerts();
  await status.setStatus(`### Pipeline: MERGED\nAll observed gates were green for \`${headSha.slice(0, 9)}\`; the SHA-bound squash merge completed.`);
  core.setOutput('receipt', JSON.stringify(mergeResult.receipt));
  core.info(JSON.stringify({ event: 'review_pipeline_merge_receipt', ...mergeResult.receipt }));
  return mergeResult;
}

module.exports = {
  deleteBranchIfUnchanged,
  loadEvidence,
  loadRollup,
  resolvePullRequest,
  runGitHubReviewPipeline,
};
