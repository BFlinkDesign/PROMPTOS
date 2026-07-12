import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  RetryableOperationError,
  assertAggregateCounts,
  assertComparableCosts,
  assertReceiptConsistency,
  assertSafeReport,
  canonicalText,
  createReplayProvider,
  deriveClaimState,
  evaluateConcealedHoldout,
  executeBounded,
  freezeCandidate,
  gradeCase,
  hashFile,
  normalizeUsage,
  publicGenerationContext,
  resolveRepoRelativePath,
  sha256,
} from '../tools/engine-acceptance-core.mjs';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const manifest = readJson('tests/fixtures/engine/acceptance-manifest.v1.json');
const dataset = readJson(manifest.public_dataset.path);
const replayFixture = readJson(manifest.offline_replay_provider.path);
const holdoutContract = readJson(manifest.holdout_contract.path);

test('manifest hashes bind every tracked input and accepted baseline', () => {
  for (const ref of [manifest.public_dataset, manifest.holdout_contract, manifest.offline_replay_provider]) {
    assert.equal(hashFile(path.join(root, ref.path)), ref.sha256);
  }
  for (const baseline of manifest.baselines) {
    assert.equal(hashFile(path.join(root, baseline.prompt_path)), baseline.prompt_sha256);
  }
});

test('canonical text identity is stable across BOM and platform line endings', () => {
  assert.equal(canonicalText('\uFEFFalpha\r\nbeta\r'), 'alpha\nbeta\n');
  assert.equal(sha256(canonicalText('alpha\r\nbeta\r')), sha256('alpha\nbeta\n'));
});

test('offline replay is input-bound and passes deterministic public graders', async () => {
  const provider = createReplayProvider(replayFixture);
  for (const testCase of dataset.cases) {
    const result = await provider(testCase);
    assert.equal(gradeCase(testCase, result.output), true);
  }
  await assert.rejects(
    provider({ ...dataset.cases[0], input: 'mutated input' }),
    /input hash mismatch/,
  );
});

test('generation context contains only public cases and is immutable', () => {
  const context = publicGenerationContext(dataset);
  assert.equal(Object.isFrozen(context), true);
  assert.equal(Object.isFrozen(context.cases), true);
  assert.equal(Object.hasOwn(context, 'holdout'), false);
  assert.equal(JSON.stringify(context).includes(holdoutContract.dataset_sha256), false);
  assert.throws(() => context.cases.push({}), TypeError);
});

test('concealed holdout loads only after candidate freeze and returns aggregate-only evidence', async () => {
  let loads = 0;
  const hiddenCase = {
    id: 'hidden-1',
    input: 'sealed-input-material',
    grader: { type: 'exact', expected: 'sealed-label-material' },
  };
  const loadHoldout = async () => {
    loads += 1;
    return { ...holdoutContract, cases: [hiddenCase] };
  };
  await assert.rejects(
    evaluateConcealedHoldout({
      candidate: { source: 'candidate', candidate_sha256: sha256('candidate') },
      loadHoldout,
      provider: async () => ({ output: 'sealed-label-material' }),
    }),
    /candidate must be frozen/,
  );
  assert.equal(loads, 0);

  const result = await evaluateConcealedHoldout({
    candidate: freezeCandidate('candidate'),
    loadHoldout,
    provider: async () => ({ output: 'sealed-label-material' }),
  });
  assert.deepEqual(Object.keys(result).sort(), ['dataset_sha256', 'passed', 'split_sha256', 'total']);
  assert.equal(result.passed, 1);
  assert.equal(JSON.stringify(result).includes(hiddenCase.input), false);
  assert.equal(JSON.stringify(result).includes(hiddenCase.grader.expected), false);

  let providerView;
  const attemptedLeak = await evaluateConcealedHoldout({
    candidate: freezeCandidate('candidate'),
    loadHoldout,
    provider: async (visibleCase) => {
      providerView = visibleCase;
      return { output: visibleCase.grader?.expected ?? 'label-not-visible' };
    },
  });
  assert.deepEqual(Object.keys(providerView), ['input']);
  assert.equal(Object.isFrozen(providerView), true);
  assert.equal(attemptedLeak.passed, 0);
});

test('report guard rejects hidden material, credentials, and forbidden nested fields', () => {
  assert.equal(assertSafeReport({ passed: 1, total: 1 }, ['hidden-value']), true);
  assert.throws(() => assertSafeReport({ nested: { authorization: 'Bearer x' } }), /forbidden field/);
  assert.throws(() => assertSafeReport({ summary: 'contains hidden-value' }, ['hidden-value']), /protected/);
  assert.throws(() => assertSafeReport({ apiKey: 'secret' }), /forbidden field/);
  assert.throws(() => assertSafeReport({ headers: { 'x-api-key': 'secret' } }), /forbidden field/);
  assert.throws(() => assertSafeReport({ headers: { 'x-auth-token': 'secret' } }), /forbidden field/);
  assert.throws(() => assertSafeReport({ metadata: { password: 'secret' } }), /forbidden field/);
  assert.throws(() => assertSafeReport({ metadata: { repositoryToken: 'secret' } }), /forbidden field/);
  assert.throws(() => assertSafeReport({ 'x-api-Ｋey': 'secret' }), /forbidden field/);
  assert.throws(() => assertSafeReport({ holdoutCases: ['sealed'] }), /forbidden field/);
  assert.throws(
    () => assertSafeReport({ summary: 'contains first\nsecond' }, ['first\nsecond']),
    /protected/,
  );
  assert.throws(
    () => assertSafeReport({ summary: 'contains first\r\nsecond' }, ['first\nsecond']),
    /protected/,
  );
  assert.throws(() => assertSafeReport({ summary: 'ＫEY' }, ['KEY']), /protected/);
  assert.throws(() => assertSafeReport({ summary: '１２３' }, ['123']), /protected/);
});

test('usage keeps unknown cost unknown and distinguishes provider reports from estimates', () => {
  assert.deepEqual(normalizeUsage({}), {
    source: 'unknown',
    input_tokens: null,
    output_tokens: null,
    cost_usd: null,
    pricing_version: null,
  });
  assert.equal(normalizeUsage({ provider_cost_usd: 0 }).source, 'reported');
  assert.deepEqual(
    normalizeUsage(
      { input_tokens: 1_000_000, output_tokens: 500_000 },
      { version: 'prices-v1', input_usd_per_million: 2, output_usd_per_million: 4 },
    ),
    {
      source: 'estimated',
      input_tokens: 1_000_000,
      output_tokens: 500_000,
      cost_usd: 4,
      pricing_version: 'prices-v1',
    },
  );
  assert.throws(() => normalizeUsage({ input_tokens: -1, output_tokens: 0 }), /input_tokens/);
  assert.throws(() => normalizeUsage({ input_tokens: 0, output_tokens: -1 }), /output_tokens/);
});

test('aggregate counts reject impossible evidence', () => {
  assert.equal(assertAggregateCounts({ passed: 1, total: 1 }), true);
  assert.throws(() => assertAggregateCounts({ passed: 2, total: 1 }), /cannot exceed total/);
  assert.throws(() => assertAggregateCounts({ passed: 0, total: 0 }), /at least one case/);
});

test('receipt evidence is bound to the declared public dataset context', () => {
  const receipt = {
    claim_state: 'PUBLIC-EVAL-PASSED',
    dataset_sha256: 'a'.repeat(64),
    split_sha256: 'b'.repeat(64),
    public_eval: {
      failed: 0,
      total: 3,
      dataset_sha256: 'a'.repeat(64),
      split_sha256: 'b'.repeat(64),
    },
    holdout_eval: null,
  };
  const context = {
    public_case_count: 3,
    dataset_sha256: 'a'.repeat(64),
    split_sha256: 'b'.repeat(64),
  };
  assert.equal(assertReceiptConsistency(receipt, context), true);
  assert.throws(
    () => assertReceiptConsistency({
      ...receipt,
      public_eval: { ...receipt.public_eval, total: 4 },
    }, context),
    /case count/,
  );
  assert.throws(
    () => assertReceiptConsistency({
      ...receipt,
      public_eval: { ...receipt.public_eval, dataset_sha256: 'c'.repeat(64) },
    }, context),
    /dataset hash/,
  );
});

test('manifest paths stay portable and inside the repository', () => {
  assert.equal(
    resolveRepoRelativePath(root, 'tests/fixtures/engine/public-development-dataset.v1.json'),
    path.join(root, 'tests', 'fixtures', 'engine', 'public-development-dataset.v1.json'),
  );
  for (const unsafe of [
    '../outside.json',
    '/tmp/outside.json',
    'C:/Temp/outside.json',
    'C:outside.json',
    'tests/fixtures/engine/public-development-dataset.v1.json:ads',
    'tests\\fixtures\\engine\\public-development-dataset.v1.json',
  ]) {
    assert.throws(() => resolveRepoRelativePath(root, unsafe), /portable repository-relative path/);
  }
});

test('certification rejects unknown or unequal cost bases', () => {
  assert.throws(
    () => assertComparableCosts([{ usage: normalizeUsage({}) }]),
    /unknown costs/,
  );
  assert.throws(
    () => assertComparableCosts([
      { usage: { source: 'estimated', cost_usd: 1, pricing_version: 'v1' } },
      { usage: { source: 'estimated', cost_usd: 1, pricing_version: 'v2' } },
    ]),
    /one pricing basis/,
  );
});

test('claim states cannot skip required evidence gates', () => {
  assert.equal(deriveClaimState({ static_valid: true }), 'STATIC-VALID');
  assert.equal(
    deriveClaimState({ static_valid: true, public_eval_passed: true }),
    'PUBLIC-EVAL-PASSED',
  );
  assert.throws(
    () => deriveClaimState({ static_valid: true, baseline_win: true }),
    /public evaluation pass/,
  );
  assert.throws(
    () => deriveClaimState({ static_valid: true, independently_benchmarked: true }),
    /holdout win/,
  );
});

const limits = {
  timeout_ms: 200,
  max_attempts: 2,
  max_tokens: 20,
  max_cost_usd: 0,
  require_known_cost: true,
};

test('bounded execution accounts retries and enforces attempt and token budgets', async () => {
  let calls = 0;
  const result = await executeBounded(async () => {
    calls += 1;
    if (calls === 1) {
      throw new RetryableOperationError('retry', {
        input_tokens: 2,
        output_tokens: 1,
        provider_cost_usd: 0,
      });
    }
    return {
      output: 'ok',
      usage: { input_tokens: 3, output_tokens: 1, provider_cost_usd: 0 },
    };
  }, limits);
  assert.equal(result.attempts, 2);
  assert.equal(result.total_tokens, 7);

  await assert.rejects(
    executeBounded(async () => ({
      output: 'over',
      usage: { input_tokens: 20, output_tokens: 1, provider_cost_usd: 0 },
    }), limits),
    { name: 'BudgetError' },
  );
});

test('bounded execution times out and cancels operations even when they ignore abort signals', async () => {
  await assert.rejects(
    executeBounded(() => new Promise(() => {}), { ...limits, timeout_ms: 10 }),
    { name: 'TimeoutError' },
  );

  const controller = new AbortController();
  const pending = executeBounded(() => new Promise(() => {}), limits, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
