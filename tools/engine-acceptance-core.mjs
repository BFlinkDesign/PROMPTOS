import crypto from 'node:crypto';
import fs from 'node:fs';

export const CLAIM_STATES = Object.freeze([
  'STATIC-VALID',
  'PUBLIC-EVAL-PASSED',
  'BASELINE-WIN',
  'HOLDOUT-WIN',
  'INDEPENDENTLY-BENCHMARKED',
]);

const FORBIDDEN_REPORT_KEYS = new Set([
  'api_key',
  'authorization',
  'holdout_cases',
  'holdout_labels',
  'judge_rationale',
  'provider_secret',
  'request_headers',
  'repository_secret',
]);

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortValue(nested)]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashJson(value) {
  return sha256(canonicalJson(value));
}

export function hashFile(filePath) {
  return sha256(fs.readFileSync(filePath));
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function publicGenerationContext(dataset) {
  return deepFreeze(JSON.parse(JSON.stringify({
    dataset_id: dataset.dataset_id,
    version: dataset.version,
    cases: dataset.cases,
  })));
}

export function freezeCandidate(source) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('candidate source is required before evaluation');
  }
  return Object.freeze({ source, candidate_sha256: sha256(source) });
}

export function gradeCase(testCase, output) {
  const grader = testCase.grader;
  if (grader.type === 'exact') return output === grader.expected;
  if (grader.type === 'contains_all') {
    const normalized = String(output).toLowerCase();
    return grader.values.every((value) => normalized.includes(value.toLowerCase()));
  }
  if (grader.type === 'json_keys') {
    try {
      const parsed = JSON.parse(output);
      return parsed && typeof parsed === 'object'
        && grader.required.every((key) => Object.hasOwn(parsed, key));
    } catch {
      return false;
    }
  }
  throw new Error(`unsupported deterministic grader: ${grader.type}`);
}

export function createReplayProvider(fixture) {
  const responses = new Map(fixture.responses.map((response) => [response.case_id, response]));
  return async (testCase) => {
    const response = responses.get(testCase.id);
    if (!response) throw new Error(`offline replay has no response for ${testCase.id}`);
    if (response.input_sha256 !== sha256(testCase.input)) {
      throw new Error(`offline replay input hash mismatch for ${testCase.id}`);
    }
    return { output: response.output, usage: response.usage };
  };
}

export function normalizeUsage(raw = {}, pricing = null) {
  const inputTokens = Number.isInteger(raw.input_tokens) ? raw.input_tokens : null;
  const outputTokens = Number.isInteger(raw.output_tokens) ? raw.output_tokens : null;
  if (Number.isFinite(raw.provider_cost_usd) && raw.provider_cost_usd >= 0) {
    return {
      source: 'reported',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: raw.provider_cost_usd,
      pricing_version: raw.provider_pricing_version ?? null,
    };
  }
  if (inputTokens !== null && outputTokens !== null && pricing) {
    const cost = (
      (inputTokens * pricing.input_usd_per_million)
      + (outputTokens * pricing.output_usd_per_million)
    ) / 1_000_000;
    return {
      source: 'estimated',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
      pricing_version: pricing.version,
    };
  }
  return {
    source: 'unknown',
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: null,
    pricing_version: null,
  };
}

export function assertComparableCosts(receipts) {
  const usages = receipts.map((receipt) => receipt.usage);
  if (usages.some((usage) => usage.source === 'unknown' || usage.cost_usd === null)) {
    throw new Error('certification cannot compare unknown costs');
  }
  const versions = new Set(usages.map((usage) => usage.pricing_version ?? 'provider-reported'));
  if (versions.size !== 1) throw new Error('certification requires one pricing basis');
  return true;
}

export function assertSafeReport(report, sensitiveValues = []) {
  function inspect(value, path = '$') {
    if (Array.isArray(value)) return value.forEach((entry, index) => inspect(entry, `${path}[${index}]`));
    if (!value || typeof value !== 'object') return;
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_REPORT_KEYS.has(key.toLowerCase())) {
        throw new Error(`report contains forbidden field at ${path}.${key}`);
      }
      inspect(nested, `${path}.${key}`);
    }
  }
  inspect(report);
  const serialized = canonicalJson(report);
  for (const sensitive of sensitiveValues.filter(Boolean)) {
    if (serialized.includes(sensitive)) throw new Error('report contains protected source material');
  }
  return true;
}

export async function evaluateConcealedHoldout({ candidate, loadHoldout, provider }) {
  if (!Object.isFrozen(candidate) || sha256(candidate.source) !== candidate.candidate_sha256) {
    throw new Error('candidate must be frozen before holdout access');
  }
  const holdout = await loadHoldout();
  let passed = 0;
  for (const testCase of holdout.cases) {
    const result = await provider(testCase, candidate);
    if (gradeCase(testCase, result.output)) passed += 1;
  }
  const aggregate = {
    passed,
    total: holdout.cases.length,
    dataset_sha256: holdout.dataset_sha256,
    split_sha256: holdout.split_sha256,
  };
  assertSafeReport(aggregate, holdout.cases.flatMap((testCase) => [
    testCase.input,
    testCase.grader.expected,
    ...(testCase.grader.values ?? []),
    ...(testCase.grader.required ?? []),
  ]));
  return aggregate;
}

export function deriveClaimState(evidence) {
  if (!evidence.static_valid) return null;
  if (evidence.independently_benchmarked && !evidence.holdout_win) {
    throw new Error('independent benchmark requires a holdout win');
  }
  if (evidence.holdout_win && !evidence.baseline_win) {
    throw new Error('holdout win requires a baseline win');
  }
  if (evidence.baseline_win && !evidence.public_eval_passed) {
    throw new Error('baseline win requires a public evaluation pass');
  }
  if (evidence.independently_benchmarked) return 'INDEPENDENTLY-BENCHMARKED';
  if (evidence.holdout_win) return 'HOLDOUT-WIN';
  if (evidence.baseline_win) return 'BASELINE-WIN';
  if (evidence.public_eval_passed) return 'PUBLIC-EVAL-PASSED';
  return 'STATIC-VALID';
}

export class RetryableOperationError extends Error {
  constructor(message, usage = {}) {
    super(message);
    this.name = 'RetryableOperationError';
    this.usage = usage;
  }
}

function namedError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

export async function executeBounded(operation, limits, externalSignal = null) {
  const started = Date.now();
  let attempts = 0;
  let tokens = 0;
  let cost = 0;

  function account(rawUsage) {
    const usage = normalizeUsage(rawUsage, limits.pricing ?? null);
    if (usage.input_tokens === null || usage.output_tokens === null) {
      throw namedError('BudgetError', 'token usage is unknown');
    }
    tokens += usage.input_tokens + usage.output_tokens;
    if (tokens > limits.max_tokens) throw namedError('BudgetError', 'token budget exceeded');
    if (usage.cost_usd === null) {
      if (limits.require_known_cost) throw namedError('BudgetError', 'cost is unknown');
    } else {
      cost += usage.cost_usd;
      if (cost > limits.max_cost_usd) throw namedError('BudgetError', 'cost budget exceeded');
    }
    return usage;
  }

  while (attempts < limits.max_attempts) {
    attempts += 1;
    if (externalSignal?.aborted) throw namedError('AbortError', 'operation cancelled');
    const remaining = limits.timeout_ms - (Date.now() - started);
    if (remaining <= 0) throw namedError('TimeoutError', 'operation timed out');
    const controller = new AbortController();
    let rejectCancellation;
    const cancellation = new Promise((_, reject) => {
      rejectCancellation = reject;
    });
    const onAbort = () => {
      controller.abort();
      rejectCancellation(namedError('AbortError', 'operation cancelled'));
    };
    externalSignal?.addEventListener('abort', onAbort, { once: true });
    let timer;
    try {
      const result = await Promise.race([
        operation({ attempt: attempts, signal: controller.signal }),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(namedError('TimeoutError', 'operation timed out'));
          }, remaining);
        }),
        cancellation,
      ]);
      const usage = account(result.usage);
      return { ...result, usage, attempts, total_tokens: tokens, total_cost_usd: cost };
    } catch (error) {
      if (error instanceof RetryableOperationError) account(error.usage);
      if (
        error.name === 'AbortError'
        || error.name === 'TimeoutError'
        || error.name === 'BudgetError'
        || !(error instanceof RetryableOperationError)
        || attempts >= limits.max_attempts
      ) throw error;
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onAbort);
    }
  }
  throw new Error('bounded operation exhausted');
}
