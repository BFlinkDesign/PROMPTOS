const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  evaluateEvidence,
  executeMerge,
  runWithRetries,
  validatePolicy,
} = require('../tools/review-pipeline-gate.cjs');

const HEAD = 'cfe96aec30b4055902dc50f1f92652c7a6065b9b';

function pr(overrides = {}) {
  return {
    number: 28,
    state: 'open',
    draft: false,
    head: { sha: HEAD, ref: 'fix/review-pipeline-check-visibility' },
    base: { ref: 'main' },
    ...overrides,
  };
}

function check(overrides = {}) {
  return {
    id: 10,
    name: 'npm run verify',
    status: 'completed',
    conclusion: 'success',
    started_at: '2026-07-11T20:00:00Z',
    completed_at: '2026-07-11T20:01:00Z',
    app: { slug: 'github-actions' },
    head_sha: HEAD,
    html_url: 'https://example.test/check/10',
    ...overrides,
  };
}

test('rejects a policy that could silently disable required checks', () => {
  assert.throws(() => validatePolicy({
    schemaVersion: 1,
    requiredChecks: [],
    additionalObservedChecksAreGating: false,
    stableObservations: 1,
  }), /requiredChecks|additionalObservedChecksAreGating|stableObservations/);
});

test('accepts the tracked versioned policy', () => {
  const policy = require('../.github/review-pipeline-policy.json');
  assert.doesNotThrow(() => validatePolicy(policy));
  assert.equal(policy.requiredChecks.length, 8);
});

test('privileged workflow_run executes only the trusted pinned adapter', () => {
  const workflow = fs.readFileSync(path.join(process.cwd(), '.github', 'workflows', 'review-pipeline.yml'), 'utf8');
  assert.match(workflow, /actions\/checkout@[a-f0-9]{40}/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/);
  assert.match(workflow, /persist-credentials: false/);
});

test('maintenance promotion and branch cleanup remain SHA-bound', () => {
  const workflow = fs.readFileSync(path.join(process.cwd(), '.github', 'workflows', 'review-pipeline.yml'), 'utf8');
  assert.match(workflow, /const testedSha = context\.payload\.workflow_run\.head_sha/);
  assert.match(workflow, /maintenanceRef\.data\.object\.sha !== testedSha/);
  assert.match(workflow, /sha: testedSha/);
  assert.match(workflow, /receipt\.merge_commit_sha !== merged\.sha/);
  assert.match(workflow, /current !== expectedSha/);
  assert.match(workflow, /current !== observedSha/);
});

test('retries when the Checks API is temporarily empty', async () => {
  const snapshots = [
    { checkRuns: [], rollup: [], workflowRuns: [], statuses: [] },
    { checkRuns: [check()], rollup: [], workflowRuns: [], statuses: [] },
    { checkRuns: [check()], rollup: [], workflowRuns: [], statuses: [] },
  ];
  const sleeps = [];

  const result = await runWithRetries({
    pr: pr(),
    defaultBranch: 'main',
    maxAttempts: 3,
    delayMs: 25,
    loadEvidence: async () => snapshots.shift(),
    sleep: async (ms) => sleeps.push(ms),
  });

  assert.equal(result.state, 'ready');
  assert.equal(result.attempt, 3);
  assert.deepEqual(sleeps, [25, 25]);
});

test('does not treat empty installed-app check suites as gating evidence', async () => {
  const result = await runWithRetries({
    pr: pr(),
    defaultBranch: 'main',
    maxAttempts: 3,
    delayMs: 1,
    loadEvidence: async (attempt) => attempt === 1
      ? { checkSuites: [{ app: { slug: 'cursor' }, status: 'queued', latest_check_runs_count: 0 }] }
      : { checkRuns: [check()] },
    sleep: async () => {},
  });

  assert.equal(result.state, 'ready');
  assert.equal(result.attempt, 3);
});

test('gates third-party checks on the authoritative PR head', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    snapshot: {
      checkRuns: [
        check(),
        check({ id: 20, name: 'CodeRabbit', app: { slug: 'coderabbitai' } }),
        check({ id: 30, name: 'GitGuardian Security Checks', app: { slug: 'gitguardian' } }),
      ],
    },
  });

  assert.equal(result.state, 'ready');
  assert.deepEqual(result.apps.sort(), ['coderabbitai', 'gitguardian', 'github-actions']);
});

test('ignores a stale workflow event for an earlier SHA', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    eventSha: '1111111111111111111111111111111111111111',
    snapshot: { checkRuns: [check()] },
  });

  assert.equal(result.state, 'skipped');
  assert.equal(result.reason, 'stale_event_sha');
});

test('uses the newest rerun instead of preserving an older failure', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    snapshot: {
      checkRuns: [
        check({ id: 9, conclusion: 'failure', completed_at: '2026-07-11T19:01:00Z' }),
        check({ id: 10, conclusion: 'success', completed_at: '2026-07-11T20:01:00Z' }),
      ],
    },
  });

  assert.equal(result.state, 'ready');
  assert.equal(result.checks.length, 1);
  assert.equal(result.checks[0].id, 10);
});

test('retries an early workflow_run event until checks settle', async () => {
  const result = await runWithRetries({
    pr: pr(),
    defaultBranch: 'main',
    maxAttempts: 3,
    delayMs: 1,
    loadEvidence: async (attempt) => ({
      checkRuns: [check(attempt === 1
        ? { status: 'in_progress', conclusion: null, completed_at: null }
        : {})],
    }),
    sleep: async () => {},
  });

  assert.equal(result.state, 'ready');
  assert.equal(result.attempt, 3);
});

test('waits for a stable complete check set so late third-party checks are gated', async () => {
  const result = await runWithRetries({
    pr: pr(),
    defaultBranch: 'main',
    maxAttempts: 4,
    delayMs: 1,
    loadEvidence: async (attempt) => {
      if (attempt === 1) return { checkRuns: [check()] };
      if (attempt === 2) {
        return { checkRuns: [
          check(),
          check({ id: 20, name: 'CodeRabbit', app: { slug: 'coderabbitai' }, status: 'in_progress', conclusion: null, completed_at: null }),
        ] };
      }
      return { checkRuns: [
        check(),
        check({ id: 20, name: 'CodeRabbit', app: { slug: 'coderabbitai' } }),
      ] };
    },
    sleep: async () => {},
  });

  assert.equal(result.state, 'ready');
  assert.equal(result.attempt, 4);
  assert.deepEqual(result.apps.sort(), ['coderabbitai', 'github-actions']);
});

test('fails closed when bounded retry exhausts without visible checks', async () => {
  const result = await runWithRetries({
    pr: pr(),
    defaultBranch: 'main',
    maxAttempts: 3,
    delayMs: 1,
    loadEvidence: async () => ({ checkRuns: [], rollup: [], workflowRuns: [], statuses: [] }),
    sleep: async () => {},
  });

  assert.equal(result.state, 'blocked');
  assert.equal(result.reason, 'no_check_evidence');
  assert.equal(result.attempt, 3);
});

test('fails closed when authoritative evidence sources disagree', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    snapshot: {
      checkRuns: [check({ conclusion: 'success' })],
      rollup: [{
        kind: 'check_run',
        id: 10,
        name: 'npm run verify',
        appSlug: 'github-actions',
        status: 'completed',
        conclusion: 'failure',
        headSha: HEAD,
        completedAt: '2026-07-11T20:01:00Z',
      }],
    },
  });

  assert.equal(result.state, 'blocked');
  assert.equal(result.reason, 'evidence_disagreement');
});

test('fails closed when GraphQL and REST legacy statuses disagree', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    snapshot: {
      rollup: [{
        kind: 'status',
        id: 'rollup-status',
        context: 'legacy/deploy',
        state: 'success',
        headSha: HEAD,
        createdAt: '2026-07-11T20:00:00Z',
      }],
      statuses: [{
        id: 44,
        context: 'legacy/deploy',
        state: 'failure',
        sha: HEAD,
        created_at: '2026-07-11T20:00:00Z',
        updated_at: '2026-07-11T20:01:00Z',
      }],
    },
  });

  assert.equal(result.state, 'blocked');
  assert.equal(result.reason, 'evidence_disagreement');
});

test('fails closed when any evidence source errors despite visible green checks', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    snapshot: {
      checkRuns: [check()],
      sourceErrors: ['rollup: permission denied'],
    },
  });

  assert.equal(result.state, 'blocked');
  assert.equal(result.reason, 'check_sources_unavailable');
});

test('fails closed when no checks are configured or observed', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    snapshot: {},
  });

  assert.equal(result.state, 'blocked');
  assert.equal(result.reason, 'no_check_evidence');
});

test('fails closed when a versioned required check has not appeared', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    policy: {
      requiredChecks: [
        { appSlug: 'github-actions', name: 'npm run verify' },
        { appSlug: 'coderabbitai', name: 'CodeRabbit' },
      ],
    },
    snapshot: { checkRuns: [check()] },
  });

  assert.equal(result.state, 'blocked');
  assert.equal(result.reason, 'required_checks_missing');
  assert.deepEqual(result.missingRequired, ['check:coderabbitai:CodeRabbit']);
});

test('requires success rather than skipped or neutral for policy-required checks', () => {
  const result = evaluateEvidence({
    pr: pr(),
    defaultBranch: 'main',
    policy: { requiredChecks: [{ appSlug: 'github-actions', name: 'npm run verify' }] },
    snapshot: { checkRuns: [check({ conclusion: 'skipped' })] },
  });

  assert.equal(result.state, 'failed');
  assert.equal(result.reason, 'required_checks_not_successful');
});

test('refuses stacked feature-base pull requests', () => {
  const result = evaluateEvidence({
    pr: pr({ base: { ref: 'codex/prompt-engine-acceptance-contract' } }),
    defaultBranch: 'main',
    snapshot: { checkRuns: [check()] },
  });

  assert.equal(result.state, 'skipped');
  assert.equal(result.reason, 'unsupported_base');
});

test('skips draft pull requests', () => {
  const result = evaluateEvidence({
    pr: pr({ draft: true }),
    defaultBranch: 'main',
    snapshot: { checkRuns: [check()] },
  });

  assert.equal(result.state, 'skipped');
  assert.equal(result.reason, 'draft_pr');
});

test('passes the verified head SHA to merge and emits a receipt', async () => {
  const mergeCalls = [];
  let reads = 0;
  const result = await executeMerge({
    pr: pr(),
    expectedHeadSha: HEAD,
    refetchPr: async () => {
      reads += 1;
      return reads === 1
        ? pr()
        : pr({ state: 'closed', merged_at: '2026-07-11T20:05:00Z', merge_commit_sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
    },
    merge: async (request) => {
      mergeCalls.push(request);
      return { merged: true, sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', message: 'Pull Request successfully merged' };
    },
    now: () => '2026-07-11T20:05:00.000Z',
  });

  assert.equal(mergeCalls.length, 1);
  assert.equal(mergeCalls[0].sha, HEAD);
  assert.equal(result.state, 'merged');
  assert.equal(result.receipt.prNumber, 28);
  assert.equal(result.receipt.verifiedHeadSha, HEAD);
  assert.equal(result.receipt.mergeSha, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
});

test('refuses merge when the PR head changes after evaluation', async () => {
  let mergeCalled = false;
  const result = await executeMerge({
    pr: pr(),
    expectedHeadSha: HEAD,
    refetchPr: async () => pr({ head: { sha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', ref: 'fix/review-pipeline-check-visibility' } }),
    merge: async () => { mergeCalled = true; },
  });

  assert.equal(result.state, 'blocked');
  assert.equal(result.reason, 'head_changed_before_merge');
  assert.equal(mergeCalled, false);
});

test('does not certify or delete after an unverified merge response', async () => {
  let reads = 0;
  const result = await executeMerge({
    pr: pr(),
    expectedHeadSha: HEAD,
    refetchPr: async () => {
      reads += 1;
      return reads === 1
        ? pr()
        : pr({ state: 'closed', merged_at: '2026-07-11T20:05:00Z', merge_commit_sha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' });
    },
    merge: async () => ({ merged: true, sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', message: 'merged' }),
    receiptAttempts: 1,
    sleep: async () => {},
  });

  assert.equal(result.state, 'merged_unverified');
  assert.equal(result.reason, 'merge_receipt_mismatch');
});
