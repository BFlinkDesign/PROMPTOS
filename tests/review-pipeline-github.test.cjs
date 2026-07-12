const test = require('node:test');
const assert = require('node:assert/strict');

const {
  deleteBranchIfUnchanged,
  resolvePullRequest,
  runGitHubReviewPipeline,
} = require('../tools/review-pipeline-github.cjs');

const HEAD = 'cfe96aec30b4055902dc50f1f92652c7a6065b9b';
const MERGE_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function pullRequest() {
  return {
    number: 28,
    state: 'open',
    draft: false,
    head: {
      sha: HEAD,
      ref: 'fix/review-pipeline-check-visibility',
      repo: { full_name: 'BFlinkDesign/PROMPTOS' },
    },
    base: { ref: 'main' },
  };
}

test('status events resolve only the same-repository PR for the event SHA', async () => {
  const candidates = [
    { ...pullRequest(), number: 99, head: { ...pullRequest().head, repo: { full_name: 'fork/PROMPTOS' } } },
    pullRequest(),
  ];
  const github = {
    paginate: async () => candidates,
    rest: {
      pulls: {
        list: async () => ({ data: candidates }),
        get: async ({ pull_number: number }) => ({ data: candidates.find((item) => item.number === number) }),
      },
    },
  };
  const result = await resolvePullRequest({
    github,
    context: { eventName: 'status', payload: { sha: HEAD } },
    owner: 'BFlinkDesign',
    repo: 'PROMPTOS',
    defaultBranch: 'main',
    core: { info: () => {} },
  });

  assert.equal(result.pr.number, 28);
  assert.equal(result.eventSha, HEAD);
});

test('PR-number events reject fork heads before privileged evaluation', async () => {
  const forkPr = {
    ...pullRequest(),
    number: 77,
    head: { ...pullRequest().head, repo: { full_name: 'outside/PROMPTOS' } },
  };
  const github = {
    rest: { pulls: { get: async () => ({ data: forkPr }) } },
  };
  const result = await resolvePullRequest({
    github,
    context: {
      eventName: 'check_suite',
      payload: { check_suite: { head_branch: forkPr.head.ref, head_sha: HEAD, pull_requests: [{ number: 77 }] } },
    },
    owner: 'BFlinkDesign',
    repo: 'PROMPTOS',
    defaultBranch: 'main',
    core: { info: () => {} },
  });

  assert.equal(result, null);
});

test('preserves a branch that moved after the verified merge head', async () => {
  let deleted = false;
  const result = await deleteBranchIfUnchanged({
    branch: 'fix/review-pipeline-check-visibility',
    expectedSha: HEAD,
    getRef: async () => ({ object: { sha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' } }),
    deleteRef: async () => { deleted = true; },
  });

  assert.equal(result.state, 'preserved');
  assert.equal(result.reason, 'branch_moved');
  assert.equal(deleted, false);
});

test('GitHub adapter performs a SHA-bound squash merge and emits a receipt', async () => {
  const mergeCalls = [];
  let merged = false;
  const outputs = new Map();
  const comments = [];
  const checkRun = {
    id: 10,
    name: 'npm run verify',
    status: 'completed',
    conclusion: 'success',
    head_sha: HEAD,
    started_at: '2026-07-11T20:00:00Z',
    completed_at: '2026-07-11T20:01:00Z',
    app: { slug: 'github-actions' },
    html_url: 'https://example.test/check/10',
  };

  const endpoints = {
    listCheckRunsForRef: async () => ({ data: [checkRun] }),
    listWorkflowRunsForRepo: async () => ({ data: [] }),
    listCommitStatusesForRef: async () => ({ data: [] }),
    listComments: async () => ({ data: comments }),
    listForRepo: async () => ({ data: [] }),
    listPulls: async () => ({ data: [pullRequest()] }),
  };
  const github = {
    paginate: async (method, args) => (await method(args)).data,
    graphql: async () => ({
      repository: {
        object: {
          statusCheckRollup: {
            contexts: {
              nodes: [{
                __typename: 'CheckRun',
                databaseId: 10,
                name: 'npm run verify',
                status: 'COMPLETED',
                conclusion: 'SUCCESS',
                startedAt: '2026-07-11T20:00:00Z',
                completedAt: '2026-07-11T20:01:00Z',
                detailsUrl: 'https://example.test/check/10',
                checkSuite: { app: { slug: 'github-actions' } },
              }],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    }),
    rest: {
      actions: { listWorkflowRunsForRepo: endpoints.listWorkflowRunsForRepo },
      checks: { listCheckRunsForRef: endpoints.listCheckRunsForRef },
      git: {
        deleteRef: async () => ({ data: {} }),
        getRef: async () => ({ data: { object: { sha: HEAD } } }),
      },
      issues: {
        createComment: async ({ body }) => {
          comments.push({ id: 1, body });
          return { data: comments[0] };
        },
        listComments: endpoints.listComments,
        listForRepo: endpoints.listForRepo,
        update: async () => ({ data: {} }),
        updateComment: async ({ body }) => {
          comments[0].body = body;
          return { data: comments[0] };
        },
      },
      pulls: {
        get: async () => {
          return { data: merged
            ? { ...pullRequest(), state: 'closed', merged_at: '2026-07-11T20:05:00Z', merge_commit_sha: MERGE_SHA }
            : pullRequest() };
        },
        list: endpoints.listPulls,
        merge: async (request) => {
          mergeCalls.push(request);
          merged = true;
          return { data: { merged: true, sha: MERGE_SHA, message: 'merged' } };
        },
      },
      rateLimit: { get: async () => ({ data: { rate: { remaining: 4999, limit: 5000, reset: 1 } } }) },
      repos: {
        get: async () => ({ data: { default_branch: 'main' } }),
        listCommitStatusesForRef: endpoints.listCommitStatusesForRef,
      },
    },
  };
  const core = {
    info: () => {},
    warning: () => {},
    setOutput: (name, value) => outputs.set(name, value),
  };
  const context = {
    eventName: 'workflow_run',
    repo: { owner: 'BFlinkDesign', repo: 'PROMPTOS' },
    payload: {
      workflow_run: {
        head_branch: 'fix/review-pipeline-check-visibility',
        head_sha: HEAD,
        pull_requests: [{ number: 28 }],
      },
    },
  };

  const result = await runGitHubReviewPipeline({
    github,
    context,
    core,
    policy: {
      schemaVersion: 1,
      requiredChecks: [{ appSlug: 'github-actions', name: 'npm run verify' }],
      additionalObservedChecksAreGating: true,
      stableObservations: 2,
    },
    retry: { delayMs: 0, sleep: async () => {} },
  });

  assert.equal(result.state, 'merged');
  assert.equal(mergeCalls.length, 1);
  assert.equal(mergeCalls[0].sha, HEAD);
  assert.equal(mergeCalls[0].merge_method, 'squash');
  assert.equal(outputs.get('decision'), 'ready');
  const receipt = JSON.parse(outputs.get('receipt'));
  assert.equal(receipt.verifiedHeadSha, HEAD);
  assert.equal(receipt.mergeSha, MERGE_SHA);
});
