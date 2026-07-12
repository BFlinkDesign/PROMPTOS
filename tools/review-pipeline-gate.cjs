'use strict';

const PASSING_CONCLUSIONS = new Set(['success', 'neutral', 'skipped']);
const SELF_JOBS = new Set([
  'gate -> merge | alert',
  'promote maintenance -> master',
  'prune merged branches',
]);

function validatePolicy(policy) {
  const errors = [];
  if (!policy || policy.schemaVersion !== 1) errors.push('schemaVersion must equal 1');
  if (!Array.isArray(policy?.requiredChecks) || policy.requiredChecks.length === 0) {
    errors.push('requiredChecks must be a non-empty array');
  } else {
    const identities = new Set();
    for (const [index, check] of policy.requiredChecks.entries()) {
      if (!check || typeof check.appSlug !== 'string' || !check.appSlug.trim()
        || typeof check.name !== 'string' || !check.name.trim()) {
        errors.push(`requiredChecks[${index}] must contain non-empty appSlug and name`);
        continue;
      }
      const identity = `${check.appSlug}:${check.name}`;
      if (identities.has(identity)) errors.push(`requiredChecks contains duplicate ${identity}`);
      identities.add(identity);
      if (check.allowedConclusions !== undefined) {
        const allowed = check.allowedConclusions;
        const valid = new Set(['success', 'neutral', 'skipped']);
        if (!Array.isArray(allowed) || allowed.length === 0
          || !allowed.includes('success')
          || allowed.some((item) => !valid.has(item))
          || new Set(allowed).size !== allowed.length) {
          errors.push(`requiredChecks[${index}].allowedConclusions must be unique, include success, and contain only success, neutral, or skipped`);
        }
      }
    }
  }
  if (policy?.additionalObservedChecksAreGating !== true) {
    errors.push('additionalObservedChecksAreGating must equal true');
  }
  if (!Number.isInteger(policy?.stableObservations) || policy.stableObservations < 2) {
    errors.push('stableObservations must be an integer >= 2');
  }
  if (errors.length) throw new Error(`Invalid review pipeline policy: ${errors.join('; ')}`);
  return policy;
}

function timestamp(value) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function latestByIdentity(items) {
  const latest = new Map();
  for (const item of items) {
    const current = latest.get(item.identity);
    const itemOrder = Math.max(timestamp(item.completedAt), timestamp(item.startedAt), Number(item.id) || 0);
    const currentOrder = current
      ? Math.max(timestamp(current.completedAt), timestamp(current.startedAt), Number(current.id) || 0)
      : -1;
    if (!current || itemOrder >= currentOrder) latest.set(item.identity, item);
  }
  return [...latest.values()];
}

function normalizeCheckRun(run, source = 'checks') {
  const appSlug = run.app?.slug || run.appSlug || 'unknown-app';
  const name = run.name || 'unnamed-check';
  return {
    source,
    kind: 'check_run',
    id: run.id,
    identity: `check:${appSlug}:${name}`,
    name,
    appSlug,
    status: String(run.status || '').toLowerCase(),
    conclusion: run.conclusion == null ? null : String(run.conclusion).toLowerCase(),
    headSha: run.head_sha || run.headSha || null,
    startedAt: run.started_at || run.startedAt || null,
    completedAt: run.completed_at || run.completedAt || null,
    url: run.html_url || run.detailsUrl || run.url || null,
  };
}

function normalizeStatus(status, source = 'statuses') {
  const context = status.context || status.name || 'unnamed-status';
  const state = String(status.state || status.status || '').toLowerCase();
  return {
    source,
    kind: 'status',
    id: status.id,
    identity: `status:${context}`,
    name: context,
    appSlug: 'legacy-status',
    status: state === 'pending' ? 'in_progress' : 'completed',
    conclusion: state === 'success' ? 'success' : (state === 'pending' ? null : state),
    headSha: status.sha || status.headSha || null,
    startedAt: status.created_at || status.createdAt || null,
    completedAt: status.updated_at || status.updatedAt || null,
    url: status.target_url || status.targetUrl || null,
  };
}

function normalizeWorkflowRun(run) {
  const name = run.name || run.workflowName || 'unnamed-workflow';
  return {
    source: 'actions',
    kind: 'workflow_run',
    id: run.id,
    identity: `workflow:${name}`,
    name,
    appSlug: 'github-actions',
    status: String(run.status || '').toLowerCase(),
    conclusion: run.conclusion == null ? null : String(run.conclusion).toLowerCase(),
    headSha: run.head_sha || run.headSha || null,
    startedAt: run.run_started_at || run.created_at || run.startedAt || null,
    completedAt: run.updated_at || run.completedAt || null,
    url: run.html_url || run.url || null,
  };
}

function stateKey(item) {
  return `${item.status}:${item.conclusion || ''}`;
}

function resolveEvidence(snapshot, headSha) {
  const restChecks = latestByIdentity((snapshot.checkRuns || [])
    .map((run) => normalizeCheckRun(run, 'checks'))
    .filter((item) => !SELF_JOBS.has(item.name) && (!item.headSha || item.headSha === headSha)));
  const rollupItems = (snapshot.rollup || []).map((item) => item.kind === 'status'
    ? normalizeStatus(item, 'rollup')
    : normalizeCheckRun(item, 'rollup'))
    .filter((item) => !SELF_JOBS.has(item.name) && (!item.headSha || item.headSha === headSha));
  const latestRollup = latestByIdentity(rollupItems);
  const restStatuses = latestByIdentity((snapshot.statuses || [])
    .map((status) => normalizeStatus(status))
    .filter((item) => !item.headSha || item.headSha === headSha));

  const disagreements = [];
  const restByIdentity = new Map(restChecks.map((item) => [item.identity, item]));
  const restStatusByIdentity = new Map(restStatuses.map((item) => [item.identity, item]));
  for (const alternate of latestRollup) {
    const primary = alternate.kind === 'status'
      ? restStatusByIdentity.get(alternate.identity)
      : restByIdentity.get(alternate.identity);
    if (primary && stateKey(primary) !== stateKey(alternate)) {
      disagreements.push({ identity: alternate.identity, primary, alternate });
    }
  }

  let checks = restChecks.length ? [...restChecks] : [...latestRollup];
  if (restChecks.length) {
    for (const alternate of latestRollup) {
      if (!restByIdentity.has(alternate.identity)) checks.push(alternate);
    }
  }

  const existing = new Set(checks.map((item) => item.identity));
  for (const status of restStatuses) {
    if (!existing.has(status.identity)) checks.push(status);
    else checks = checks.map((item) => item.identity === status.identity
      ? latestByIdentity([item, status])[0]
      : item);
  }

  if (checks.length === 0) {
    checks = latestByIdentity((snapshot.workflowRuns || [])
      .map(normalizeWorkflowRun)
      .filter((item) => !SELF_JOBS.has(item.name) && (!item.headSha || item.headSha === headSha)));
  }

  return { checks: latestByIdentity(checks), disagreements };
}

function evaluateEvidence({ pr, defaultBranch, eventSha, policy = {}, snapshot = {} }) {
  if (!pr || pr.state !== 'open') return { state: 'skipped', reason: 'pr_not_open' };
  if (pr.draft) return { state: 'skipped', reason: 'draft_pr' };

  const allowedBases = new Set([defaultBranch, 'maintenance']);
  if (!allowedBases.has(pr.base?.ref)) {
    return { state: 'skipped', reason: 'unsupported_base', base: pr.base?.ref || null };
  }

  const headSha = pr.head?.sha;
  if (!headSha) return { state: 'blocked', reason: 'missing_head_sha' };
  if (eventSha && eventSha !== headSha) {
    return { state: 'skipped', reason: 'stale_event_sha', eventSha, headSha };
  }
  if (snapshot.sourceErrors?.length) {
    return {
      state: 'blocked',
      reason: 'check_sources_unavailable',
      headSha,
      sourceErrors: snapshot.sourceErrors,
      checks: [],
      apps: [],
    };
  }

  const { checks, disagreements } = resolveEvidence(snapshot, headSha);
  if (disagreements.length) {
    return { state: 'blocked', reason: 'evidence_disagreement', headSha, disagreements, checks };
  }
  if (checks.length === 0) {
    return {
      state: 'blocked',
      reason: snapshot.sourceErrors?.length ? 'check_sources_unavailable' : 'no_check_evidence',
      headSha,
      sourceErrors: snapshot.sourceErrors || [],
      checks: [],
      apps: [],
    };
  }

  const observedIdentities = new Set(checks.map((item) => item.identity));
  const requiredIdentities = (policy.requiredChecks || [])
    .map((item) => `check:${item.appSlug}:${item.name}`);
  const missingRequired = requiredIdentities.filter((identity) => !observedIdentities.has(identity));
  if (missingRequired.length) {
    return {
      state: 'blocked',
      reason: 'required_checks_missing',
      headSha,
      checks,
      missingRequired,
      apps: [...new Set(checks.map((item) => item.appSlug))],
    };
  }

  const requiredPolicy = new Map((policy.requiredChecks || []).map((item) => [
    `check:${item.appSlug}:${item.name}`,
    new Set(item.allowedConclusions || ['success']),
  ]));
  const requiredNotSuccessful = checks.filter((item) => requiredPolicy.has(item.identity)
    && item.status === 'completed'
    && !requiredPolicy.get(item.identity).has(item.conclusion));
  if (requiredNotSuccessful.length) {
    return {
      state: 'failed',
      reason: 'required_checks_not_successful',
      headSha,
      checks,
      failed: requiredNotSuccessful,
      apps: [...new Set(checks.map((item) => item.appSlug))],
    };
  }

  const failed = checks.filter((item) => item.status === 'completed' && !PASSING_CONCLUSIONS.has(item.conclusion));
  const pending = checks.filter((item) => item.status !== 'completed' || item.conclusion == null);
  const apps = [...new Set(checks.map((item) => item.appSlug))];
  if (failed.length) return { state: 'failed', reason: 'failed_checks', headSha, checks, failed, apps };
  if (pending.length) return { state: 'pending', reason: 'checks_pending', headSha, checks, pending, apps };
  return { state: 'ready', reason: 'all_observed_checks_green', headSha, checks, apps };
}

async function runWithRetries({
  pr,
  defaultBranch,
  eventSha,
  policy = {},
  refreshPr,
  loadEvidence,
  maxAttempts = 6,
  requiredStableObservations = 2,
  delayMs = 10_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  let decision;
  let stableFingerprint = null;
  let stableObservations = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const currentPr = refreshPr ? await refreshPr(pr.number) : pr;
    const snapshot = await loadEvidence(attempt, currentPr);
    decision = { ...evaluateEvidence({ pr: currentPr, defaultBranch, eventSha, policy, snapshot }), attempt };
    if (decision.state === 'ready') {
      const fingerprint = JSON.stringify(decision.checks
        .map((item) => `${item.identity}:${item.status}:${item.conclusion || ''}`)
        .sort());
      if (fingerprint === stableFingerprint) stableObservations += 1;
      else {
        stableFingerprint = fingerprint;
        stableObservations = 1;
      }
      decision.stableObservations = stableObservations;
      if (stableObservations >= requiredStableObservations) return decision;
      if (attempt < maxAttempts) {
        await sleep(delayMs);
        continue;
      }
      return { ...decision, state: 'blocked', reason: 'check_visibility_not_stable' };
    }
    stableFingerprint = null;
    stableObservations = 0;
    const retryable = decision.state === 'pending'
      || (decision.state === 'blocked' && [
        'no_check_evidence',
        'check_sources_unavailable',
        'required_checks_missing',
        'evidence_disagreement',
      ].includes(decision.reason));
    if (!retryable) return decision;
    if (attempt < maxAttempts) await sleep(delayMs);
  }
  return {
    ...decision,
    state: 'blocked',
    reason: decision.reason === 'checks_pending' ? 'checks_pending_after_retry' : decision.reason,
  };
}

async function executeMerge({
  pr,
  expectedHeadSha,
  refetchPr,
  merge,
  now = () => new Date().toISOString(),
  receiptAttempts = 3,
  receiptDelayMs = 1_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const current = await refetchPr(pr.number);
  if (!current || current.state !== 'open' || current.draft) {
    return { state: 'blocked', reason: 'pr_changed_before_merge' };
  }
  if (current.head?.sha !== expectedHeadSha) {
    return {
      state: 'blocked',
      reason: 'head_changed_before_merge',
      expectedHeadSha,
      currentHeadSha: current.head?.sha || null,
    };
  }

  const response = await merge({
    pull_number: current.number,
    merge_method: 'squash',
    sha: expectedHeadSha,
  });
  if (!response?.merged) {
    return { state: 'blocked', reason: 'merge_rejected', message: response?.message || 'Merge was not accepted.' };
  }

  let mergedPr = null;
  for (let attempt = 1; attempt <= receiptAttempts; attempt += 1) {
    mergedPr = await refetchPr(pr.number);
    const receiptMatches = mergedPr?.state === 'closed'
      && Boolean(mergedPr.merged_at)
      && mergedPr.merge_commit_sha === response.sha;
    if (receiptMatches) break;
    if (attempt < receiptAttempts) await sleep(receiptDelayMs);
  }
  if (mergedPr?.state !== 'closed' || !mergedPr.merged_at || mergedPr.merge_commit_sha !== response.sha) {
    return {
      state: 'merged_unverified',
      reason: 'merge_receipt_mismatch',
      expectedMergeSha: response.sha || null,
      observedMergeSha: mergedPr?.merge_commit_sha || null,
      observedState: mergedPr?.state || null,
    };
  }

  return {
    state: 'merged',
    receipt: {
      schemaVersion: 1,
      prNumber: current.number,
      base: current.base?.ref || null,
      headBranch: current.head?.ref || null,
      verifiedHeadSha: expectedHeadSha,
      mergeSha: response.sha || null,
      mergeMethod: 'squash',
      mergedAt: now(),
    },
  };
}

module.exports = {
  evaluateEvidence,
  executeMerge,
  latestByIdentity,
  normalizeCheckRun,
  normalizeStatus,
  normalizeWorkflowRun,
  resolveEvidence,
  runWithRetries,
  validatePolicy,
};
