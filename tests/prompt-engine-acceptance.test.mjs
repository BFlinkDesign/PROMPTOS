import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  RetryableOperationError,
  assertComparableCosts,
  assertSafeReport,
  createReplayProvider,
  deriveClaimState,
  evaluateConcealedHoldout,
  executeBounded,
  freezeCandidate,
  gradeCase,
  hashFile,
  normalizeUsage,
  publicGenerationContext,
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
});

test('report guard rejects hidden material, credentials, and forbidden nested fields', () => {
  assert.equal(assertSafeReport({ passed: 1, total: 1 }, ['hidden-value']), true);
  assert.throws(() => assertSafeReport({ nested: { authorization: 'Bearer x' } }), /forbidden field/);
  assert.throws(() => assertSafeReport({ summary: 'contains hidden-value' }, ['hidden-value']), /protected/);
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
