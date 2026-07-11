import { deepFreeze, sha256 } from './util.mjs';

const MODES = new Set(['generate', 'improve']);
const METRICS = new Set(['exact', 'contains-all', 'regex', 'json-equals', 'json-valid', 'llm-judge']);

export class ContractError extends Error {
  constructor(message, path = '$') {
    super(`${path}: ${message}`);
    this.name = 'ContractError';
    this.path = path;
  }
}

export function normalizeRequest(raw) {
  assertObject(raw, '$');
  const mode = raw.mode ?? (raw.baselinePrompt ? 'improve' : 'generate');
  if (!MODES.has(mode)) throw new ContractError('mode must be generate or improve', '$.mode');
  assertString(raw.objective, '$.objective', 12);
  if (mode === 'improve') assertString(raw.baselinePrompt, '$.baselinePrompt', 1);

  const datasets = raw.datasets ?? {};
  const train = normalizeCases(datasets.train ?? [], '$.datasets.train');
  const validation = normalizeCases(datasets.validation ?? [], '$.datasets.validation');
  const holdout = normalizeCases(datasets.holdout ?? [], '$.datasets.holdout');
  if (!validation.length) throw new ContractError('at least one validation case is required', '$.datasets.validation');
  if (!holdout.length) throw new ContractError('at least one holdout case is required', '$.datasets.holdout');
  assertUniqueCaseIds([...train, ...validation, ...holdout]);

  const search = {
    seed: String(raw.search?.seed ?? 'promptos-default-seed'),
    populationSize: integer(raw.search?.populationSize ?? 4, 2, 20, '$.search.populationSize'),
    generations: integer(raw.search?.generations ?? 2, 0, 12, '$.search.generations'),
    parentsPerGeneration: integer(raw.search?.parentsPerGeneration ?? 2, 1, 8, '$.search.parentsPerGeneration'),
    maxModelCalls: integer(raw.search?.maxModelCalls ?? 250, 1, 100000, '$.search.maxModelCalls'),
    holdoutFinalists: integer(raw.search?.holdoutFinalists ?? 3, 1, 10, '$.search.holdoutFinalists'),
  };
  search.parentsPerGeneration = Math.min(search.parentsPerGeneration, search.populationSize);
  search.holdoutFinalists = Math.min(search.holdoutFinalists, search.populationSize + search.generations * search.parentsPerGeneration);

  const constraints = {
    maxPromptChars: integer(raw.constraints?.maxPromptChars ?? 12000, 200, 100000, '$.constraints.maxPromptChars'),
    requiredVariables: stringArray(raw.constraints?.requiredVariables ?? ['input'], '$.constraints.requiredVariables'),
    requiredPhrases: stringArray(raw.constraints?.requiredPhrases ?? [], '$.constraints.requiredPhrases'),
    forbiddenPhrases: stringArray(raw.constraints?.forbiddenPhrases ?? [], '$.constraints.forbiddenPhrases'),
    maxCandidateCostUsd: finite(raw.constraints?.maxCandidateCostUsd ?? 5, 0, 100000, '$.constraints.maxCandidateCostUsd'),
    maxLatencyMs: finite(raw.constraints?.maxLatencyMs ?? 120000, 1, 3600000, '$.constraints.maxLatencyMs'),
  };

  const baselines = normalizeBaselines(raw.baselines ?? (raw.baselinePrompt ? [{ id: 'input-baseline', prompt: raw.baselinePrompt }] : []));
  const claim = {
    baselineId: String(raw.claim?.baselineId ?? 'anthropic-prompt-improver'),
    minimumHoldoutCases: integer(raw.claim?.minimumHoldoutCases ?? 30, 1, 100000, '$.claim.minimumHoldoutCases'),
    minimumAbsoluteGain: finite(raw.claim?.minimumAbsoluteGain ?? 0, -1, 1, '$.claim.minimumAbsoluteGain'),
    confidenceLevel: finite(raw.claim?.confidenceLevel ?? 0.95, 0.8, 0.999, '$.claim.confidenceLevel'),
    maxCostRatio: finite(raw.claim?.maxCostRatio ?? 1.25, 0.01, 100, '$.claim.maxCostRatio'),
    maxLatencyRatio: finite(raw.claim?.maxLatencyRatio ?? 1.25, 0.01, 100, '$.claim.maxLatencyRatio'),
    criticalRegressionTolerance: finite(raw.claim?.criticalRegressionTolerance ?? 0, 0, 1, '$.claim.criticalRegressionTolerance'),
  };

  const normalized = {
    schemaVersion: 1,
    id: raw.id ? String(raw.id) : `opt-${sha256({ mode, objective: raw.objective }).slice(0, 12)}`,
    mode,
    objective: raw.objective.trim(),
    baselinePrompt: raw.baselinePrompt?.trim() ?? null,
    context: raw.context ?? {},
    constraints,
    datasets: { train, validation, holdout },
    baselines,
    search,
    claim,
    metadata: raw.metadata ?? {},
  };
  return deepFreeze(normalized);
}

function normalizeCases(cases, path) {
  if (!Array.isArray(cases)) throw new ContractError('must be an array', path);
  return cases.map((item, index) => {
    const itemPath = `${path}[${index}]`;
    assertObject(item, itemPath);
    assertString(item.id, `${itemPath}.id`, 1);
    if (item.input === undefined) throw new ContractError('input is required', `${itemPath}.input`);
    const metric = normalizeMetric(item.metric ?? { type: item.expected === undefined ? 'llm-judge' : 'exact' }, `${itemPath}.metric`);
    if (metric.type !== 'llm-judge' && item.expected === undefined && metric.type !== 'json-valid') {
      throw new ContractError(`expected is required for ${metric.type}`, `${itemPath}.expected`);
    }
    return deepFreeze({
      id: String(item.id),
      input: item.input,
      expected: item.expected,
      rubric: item.rubric ?? null,
      metric,
      critical: Boolean(item.critical),
      tags: stringArray(item.tags ?? [], `${itemPath}.tags`),
      perturbations: stringArray(item.perturbations ?? [], `${itemPath}.perturbations`),
      metadata: item.metadata ?? {},
    });
  });
}

function normalizeMetric(metric, path) {
  assertObject(metric, path);
  if (!METRICS.has(metric.type)) throw new ContractError(`unsupported metric ${metric.type}`, `${path}.type`);
  if (metric.type === 'regex') assertString(metric.pattern, `${path}.pattern`, 1);
  if (metric.type === 'contains-all') {
    const values = stringArray(metric.values ?? [], `${path}.values`);
    if (!values.length) throw new ContractError('values cannot be empty', `${path}.values`);
    return { ...metric, values };
  }
  return { ...metric };
}

function normalizeBaselines(items) {
  if (!Array.isArray(items)) throw new ContractError('must be an array', '$.baselines');
  const ids = new Set();
  return items.map((item, index) => {
    const path = `$.baselines[${index}]`;
    assertObject(item, path);
    assertString(item.id, `${path}.id`, 1);
    assertString(item.prompt, `${path}.prompt`, 1);
    if (ids.has(item.id)) throw new ContractError(`duplicate baseline id ${item.id}`, `${path}.id`);
    ids.add(item.id);
    return deepFreeze({ id: String(item.id), prompt: item.prompt, provenance: item.provenance ?? {} });
  });
}

function assertUniqueCaseIds(cases) {
  const seen = new Set();
  for (const item of cases) {
    if (seen.has(item.id)) throw new ContractError(`duplicate case id ${item.id}`, '$.datasets');
    seen.add(item.id);
  }
}

function assertObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ContractError('must be an object', path);
}

function assertString(value, path, minLength = 0) {
  if (typeof value !== 'string' || value.trim().length < minLength) throw new ContractError(`must be a string with at least ${minLength} characters`, path);
}

function integer(value, min, max, path) {
  if (!Number.isInteger(value) || value < min || value > max) throw new ContractError(`must be an integer from ${min} to ${max}`, path);
  return value;
}

function finite(value, min, max, path) {
  if (!Number.isFinite(value) || value < min || value > max) throw new ContractError(`must be a finite number from ${min} to ${max}`, path);
  return value;
}

function stringArray(value, path) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new ContractError('must be an array of strings', path);
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}
