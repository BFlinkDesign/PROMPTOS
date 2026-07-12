import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CLAIM_STATES = Object.freeze([
  'STATIC-VALID',
  'PUBLIC-EVAL-PASSED',
  'BASELINE-WIN',
  'HOLDOUT-WIN',
  'INDEPENDENTLY-BENCHMARKED',
]);

const FORBIDDEN_REPORT_KEY_MARKERS = Object.freeze([
  'apikey',
  'authorization',
  'cookie',
  'credential',
  'holdoutcases',
  'holdoutlabels',
  'judgerationale',
  'password',
  'passphrase',
  'privatekey',
  'requestheaders',
  'secret',
]);
const FORBIDDEN_REPORT_KEYS = new Set(['headers', 'passwd']);
const SAFE_ACCOUNTING_TOKEN_KEYS = new Set([
  'inputtokens',
  'maxtokens',
  'outputtokens',
  'remainingtokens',
  'totaltokens',
  'usedtokens',
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

export function canonicalText(value) {
  return value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

export function hashFile(filePath) {
  return sha256(canonicalText(fs.readFileSync(filePath, 'utf8')));
}

export function resolveRepoRelativePath(root, relativePath) {
  const portableCharacters = typeof relativePath === 'string'
    && /^[A-Za-z0-9._/-]+$/.test(relativePath);
  const segments = typeof relativePath === 'string' ? relativePath.split('/') : [];
  const hasWindowsReservedSegment = segments.some((segment) => (
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment)
    || segment.endsWith('.')
  ));
  const invalid = typeof relativePath !== 'string'
    || !relativePath
    || !portableCharacters
    || hasWindowsReservedSegment
    || relativePath.includes('\\')
    || path.posix.isAbsolute(relativePath)
    || path.win32.isAbsolute(relativePath)
    || path.posix.normalize(relativePath) !== relativePath
    || relativePath === '..'
    || relativePath.startsWith('../');
  if (invalid) throw new Error('manifest path must be a portable repository-relative path');

  const absoluteRoot = path.resolve(root);
  const resolved = path.resolve(absoluteRoot, ...relativePath.split('/'));
  const fromRoot = path.relative(absoluteRoot, resolved);
  if (!fromRoot || fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) {
    throw new Error('manifest path must be a portable repository-relative path');
  }
  return resolved;
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
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TypeError('usage must be an object');
  }
  function tokenCount(name) {
    const value = raw[name];
    if (value === undefined || value === null) return null;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`${name} must be a non-negative safe integer`);
    }
    return value;
  }
  const inputTokens = tokenCount('input_tokens');
  const outputTokens = tokenCount('output_tokens');
  const hasReportedCost = Object.hasOwn(raw, 'provider_cost_usd');
  if (hasReportedCost && (!Number.isFinite(raw.provider_cost_usd) || raw.provider_cost_usd < 0)) {
    throw new TypeError('provider_cost_usd must be a non-negative finite number');
  }
  if (hasReportedCost) {
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

export function assertAggregateCounts(aggregate) {
  if (!aggregate || !Number.isSafeInteger(aggregate.total) || aggregate.total < 1) {
    throw new Error('evaluation aggregate must contain at least one case');
  }
  if (!Number.isSafeInteger(aggregate.passed) || aggregate.passed < 0) {
    throw new Error('evaluation aggregate passed count must be a non-negative safe integer');
  }
  if (aggregate.passed > aggregate.total) {
    throw new Error('evaluation aggregate passed count cannot exceed total');
  }
  return true;
}

export function assertReceiptConsistency(receipt, context = null) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    throw new Error('evaluation receipt must be an object');
  }
  if (receipt.holdout_eval !== null) {
    throw new Error('receipt schema v1 does not support holdout evidence');
  }
  if (receipt.claim_state === 'STATIC-VALID') {
    if (receipt.public_eval !== null) {
      throw new Error('static-valid receipt cannot contain public evaluation evidence');
    }
    return true;
  }
  if (receipt.claim_state !== 'PUBLIC-EVAL-PASSED') {
    throw new Error('receipt schema v1 does not support the requested claim state');
  }
  if (!context || !Number.isSafeInteger(context.public_case_count) || context.public_case_count < 1) {
    throw new Error('public-pass receipt requires a valid public dataset context');
  }
  const aggregate = receipt.public_eval;
  if (!aggregate || aggregate.failed !== 0) {
    throw new Error('public-pass receipt must record zero failed cases');
  }
  if (!Number.isSafeInteger(aggregate.total) || aggregate.total < 1) {
    throw new Error('public-pass receipt total must be a positive safe integer');
  }
  if (aggregate.total !== context.public_case_count) {
    throw new Error('public-pass receipt case count does not match the dataset');
  }
  if (
    aggregate.dataset_sha256 !== receipt.dataset_sha256
    || aggregate.dataset_sha256 !== context.dataset_sha256
  ) {
    throw new Error('public-pass receipt dataset hash does not match the evaluation context');
  }
  if (
    aggregate.split_sha256 !== receipt.split_sha256
    || aggregate.split_sha256 !== context.split_sha256
  ) {
    throw new Error('public-pass receipt split hash does not match the evaluation context');
  }
  return true;
}

export function assertSafeReport(report, sensitiveValues = []) {
  const normalizeSecurityText = (value) => canonicalText(value).normalize('NFKC');
  const protectedValues = sensitiveValues.filter(
    (value) => typeof value === 'string' && value.length > 0,
  ).map(normalizeSecurityText);
  function assertNoProtectedMaterial(value) {
    if (
      typeof value === 'string'
      && protectedValues.some((sensitive) => (
        normalizeSecurityText(value).includes(sensitive)
      ))
    ) {
      throw new Error('report contains protected source material');
    }
  }
  function inspect(value, path = '$') {
    assertNoProtectedMaterial(value);
    if (Array.isArray(value)) return value.forEach((entry, index) => inspect(entry, `${path}[${index}]`));
    if (!value || typeof value !== 'object') return;
    for (const [key, nested] of Object.entries(value)) {
      const normalizedKey = normalizeSecurityText(key).toLowerCase().replace(/[^a-z0-9]/g, '');
      const tokenKey = normalizedKey.includes('token')
        && !SAFE_ACCOUNTING_TOKEN_KEYS.has(normalizedKey);
      if (
        FORBIDDEN_REPORT_KEYS.has(normalizedKey)
        || FORBIDDEN_REPORT_KEY_MARKERS.some((forbidden) => normalizedKey.includes(forbidden))
        || tokenKey
      ) {
        throw new Error(`report contains forbidden field at ${path}.${key}`);
      }
      assertNoProtectedMaterial(key);
      inspect(nested, `${path}.${key}`);
    }
  }
  inspect(report);
  return true;
}

export async function evaluateConcealedHoldout({ candidate, loadHoldout, provider }) {
  if (!Object.isFrozen(candidate) || sha256(candidate.source) !== candidate.candidate_sha256) {
    throw new Error('candidate must be frozen before holdout access');
  }
  const holdout = await loadHoldout();
  let passed = 0;
  for (const testCase of holdout.cases) {
    const providerInput = deepFreeze({ input: testCase.input });
    const result = await provider(providerInput, candidate);
    if (gradeCase(testCase, result.output)) passed += 1;
  }
  const aggregate = {
    passed,
    total: holdout.cases.length,
    dataset_sha256: holdout.dataset_sha256,
    split_sha256: holdout.split_sha256,
  };
  assertAggregateCounts(aggregate);
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
