import { evaluateCandidate } from './benchmark.mjs';
import { normalizeRequest } from './contracts.mjs';
import { paretoFront, rankCandidates } from './pareto.mjs';
import { ROLE_INSTRUCTIONS } from './roles.mjs';
import { claimGate } from './stats.mjs';
import { BudgetLedger } from './providers.mjs';
import { nowIso, redactSecrets, sha256, uniqueBy } from './util.mjs';

export async function optimizePrompt(rawRequest, providers) {
  const request = normalizeRequest(rawRequest);
  validateProviders(providers);
  const ledger = new BudgetLedger(request.search.maxModelCalls);
  const events = [];
  const startedAt = nowIso();
  const emit = (stage, data = {}) => events.push({ sequence: events.length + 1, at: nowIso(), stage, ...redactSecrets(data) });
  emit('run.started', { requestId: request.id, requestHash: sha256(request) });

  const specResult = await invokeRole({
    provider: providers.builder,
    ledger,
    role: 'architect',
    input: {
      objective: request.objective,
      mode: request.mode,
      baselinePrompt: request.baselinePrompt,
      constraints: request.constraints,
      trainingExamples: request.datasets.train.map(safeTrainingCase),
      context: request.context,
    },
    seed: `${request.search.seed}:architect`,
  });
  const spec = validateSpec(specResult.output, request);
  emit('architecture.completed', { specHash: sha256(spec), provider: providerIdentity(providers.builder) });

  const generated = await invokeRole({
    provider: providers.builder,
    ledger,
    role: 'generator',
    input: {
      spec,
      baselinePrompt: request.baselinePrompt,
      populationSize: request.search.populationSize,
      constraints: request.constraints,
      trainingExamples: request.datasets.train.map(safeTrainingCase),
    },
    seed: `${request.search.seed}:generator`,
  });
  let candidates = normalizeGeneratedCandidates(generated.output, request.search.populationSize, 'generated');
  candidates.push(...request.baselines.map((baseline) => candidateFromPrompt(baseline.prompt, baseline.id, 'baseline')));
  if (request.baselinePrompt && !request.baselines.some((item) => item.prompt === request.baselinePrompt)) {
    candidates.push(candidateFromPrompt(request.baselinePrompt, 'input-baseline', 'baseline'));
  }
  candidates = uniqueBy(candidates, (candidate) => candidate.candidateId);
  emit('population.generated', { count: candidates.length, candidateIds: candidates.map((item) => item.candidateId) });

  const evaluatedById = new Map();
  await evaluateNewCandidates({
    candidates,
    evaluatedById,
    cases: request.datasets.validation,
    split: 'validation',
    request,
    spec,
    providers,
    ledger,
    emit,
  });

  for (let generation = 1; generation <= request.search.generations; generation += 1) {
    const ranked = rankCandidates([...evaluatedById.values()].filter((item) => item.eligible));
    const parents = ranked.slice(0, request.search.parentsPerGeneration);
    if (!parents.length) break;
    const children = [];
    for (const parent of parents) {
      const failures = parent.cases
        .filter((item) => item.score < 1)
        .map((item) => ({ caseId: item.caseId, score: item.score, detail: item.detail, tags: item.tags }));
      const critique = await invokeRole({
        provider: providers.critic,
        ledger,
        role: 'critic',
        input: {
          spec,
          candidate: compactCandidate(parent),
          failureSummary: failures,
          structuralFailures: parent.structure.failed,
          generation,
        },
        seed: `${request.search.seed}:critic:${generation}:${parent.candidateId}`,
      });
      const revised = await invokeRole({
        provider: providers.builder,
        ledger,
        role: 'reviser',
        input: {
          spec,
          candidate: compactCandidate(parent),
          critique: critique.output,
          constraints: request.constraints,
          generation,
        },
        seed: `${request.search.seed}:reviser:${generation}:${parent.candidateId}`,
      });
      const child = normalizeRevisedCandidate(revised.output, parent, generation);
      children.push(child);
    }
    const unseenChildren = uniqueBy(children, (candidate) => candidate.candidateId).filter((item) => !evaluatedById.has(item.candidateId));
    if (!unseenChildren.length) {
      emit('generation.stalled', { generation, reason: 'no novel candidates' });
      break;
    }
    await evaluateNewCandidates({
      candidates: unseenChildren,
      evaluatedById,
      cases: request.datasets.validation,
      split: 'validation',
      request,
      spec,
      providers,
      ledger,
      emit,
      generation,
    });
    emit('generation.completed', { generation, newCandidates: unseenChildren.map((item) => item.candidateId) });
  }

  const validationRanking = rankCandidates([...evaluatedById.values()].filter((item) => item.eligible));
  const finalists = validationRanking.slice(0, request.search.holdoutFinalists);
  const baselineCandidates = candidates.filter((item) => item.origin === 'baseline');
  const holdoutCandidates = uniqueBy([...finalists.map(toCandidate), ...baselineCandidates], (item) => item.candidateId);
  emit('holdout.started', { finalistIds: holdoutCandidates.map((item) => item.candidateId), concealedCaseCount: request.datasets.holdout.length });

  const holdoutResults = [];
  for (const candidate of holdoutCandidates) {
    const result = await evaluateCandidate({
      candidate,
      cases: request.datasets.holdout,
      spec,
      constraints: request.constraints,
      targetProvider: providers.target,
      judgeProvider: providers.judge,
      ledger,
      split: 'holdout',
      seed: request.search.seed,
    });
    holdoutResults.push(result);
    emit('candidate.holdout-evaluated', { candidateId: candidate.candidateId, metrics: result.metrics, eligible: result.eligible });
  }

  const holdoutRanking = rankCandidates(holdoutResults.filter((item) => item.eligible));
  const winner = holdoutRanking[0] ?? null;
  const claimBaselineCandidate = candidates.find((item) => item.origin === 'baseline' && item.strategy === request.claim.baselineId);
  const claimBaseline = claimBaselineCandidate
    ? holdoutResults.find((item) => item.candidateId === claimBaselineCandidate.candidateId)
    : null;
  const superiority = claimGate({ candidate: winner, baseline: claimBaseline, policy: request.claim });
  emit('claim.evaluated', { status: superiority.status, reasons: superiority.reasons });
  emit('run.completed', { winnerId: winner?.candidateId ?? null, budget: ledger.snapshot() });

  return {
    schemaVersion: 1,
    runId: `${request.id}-${sha256({ startedAt, request: sha256(request) }).slice(0, 12)}`,
    startedAt,
    completedAt: nowIso(),
    request: redactRequest(request),
    requestHash: sha256(request),
    providers: Object.fromEntries(Object.entries(providers).map(([key, provider]) => [key, providerIdentity(provider)])),
    spec,
    validation: {
      ranking: validationRanking,
      paretoFront: paretoFront(validationRanking),
    },
    holdout: {
      ranking: holdoutRanking,
      paretoFront: paretoFront(holdoutRanking),
    },
    winner,
    superiority,
    budget: ledger.snapshot(),
    events,
    trust: winner ? (superiority.pass ? 'BASELINE-WIN' : 'BENCHMARKED') : 'FAILED',
  };
}

async function evaluateNewCandidates({ candidates, evaluatedById, cases, split, request, spec, providers, ledger, emit, generation = 0 }) {
  for (const candidate of candidates) {
    const result = await evaluateCandidate({
      candidate,
      cases,
      spec,
      constraints: request.constraints,
      targetProvider: providers.target,
      judgeProvider: providers.judge,
      ledger,
      split,
      seed: request.search.seed,
    });
    evaluatedById.set(candidate.candidateId, result);
    emit('candidate.validation-evaluated', { generation, candidateId: candidate.candidateId, metrics: result.metrics, eligible: result.eligible });
  }
}

async function invokeRole({ provider, ledger, role, input, seed }) {
  ledger.reserve(`role:${role}`);
  const result = await provider.invokeRole({
    role,
    instructions: ROLE_INSTRUCTIONS[role],
    input,
    seed,
    maxTokens: 4096,
  });
  ledger.record(result);
  if (!result || !result.output || typeof result.output !== 'object') throw new Error(`${role} provider returned an invalid structured output`);
  return result;
}

function validateSpec(output, request) {
  const task = typeof output.task === 'string' && output.task.trim() ? output.task.trim() : request.objective;
  const variables = Array.isArray(output.variables) ? output.variables.filter((item) => typeof item === 'string' && item.trim()) : request.constraints.requiredVariables;
  return {
    task,
    variables: [...new Set([...request.constraints.requiredVariables, ...variables])],
    successCriteria: stringList(output.successCriteria),
    outputContract: typeof output.outputContract === 'string' ? output.outputContract : '',
    risks: stringList(output.risks),
  };
}

function normalizeGeneratedCandidates(output, populationSize, origin) {
  if (!Array.isArray(output.candidates)) throw new Error('generator output must contain candidates[]');
  return output.candidates
    .filter((item) => item && typeof item.prompt === 'string' && item.prompt.trim())
    .slice(0, populationSize)
    .map((item, index) => candidateFromPrompt(item.prompt, item.strategy || `${origin}-${index + 1}`, origin));
}

function normalizeRevisedCandidate(output, parent, generation) {
  if (typeof output.prompt !== 'string' || !output.prompt.trim()) throw new Error('reviser output must contain a non-empty prompt');
  const candidate = candidateFromPrompt(output.prompt, output.strategy || `${parent.strategy}+g${generation}`, 'evolved');
  candidate.parentId = parent.candidateId;
  return candidate;
}

function candidateFromPrompt(prompt, strategy, origin) {
  const normalized = prompt.trim();
  return {
    candidateId: `candidate-${sha256(normalized).slice(0, 16)}`,
    strategy: String(strategy),
    prompt: normalized,
    origin,
  };
}

function safeTrainingCase(item) {
  return {
    id: item.id,
    input: item.input,
    expected: item.expected,
    rubric: item.rubric,
    tags: item.tags,
  };
}

function compactCandidate(item) {
  return {
    candidateId: item.candidateId,
    strategy: item.strategy,
    prompt: item.prompt,
    metrics: item.metrics,
  };
}

function toCandidate(item) {
  return {
    candidateId: item.candidateId,
    strategy: item.strategy,
    prompt: item.prompt,
    origin: item.origin,
    parentId: item.parentId,
  };
}

function providerIdentity(provider) {
  return { id: provider.id, model: provider.model };
}

function validateProviders(providers) {
  for (const key of ['builder', 'critic', 'target', 'judge']) {
    if (!providers?.[key]) throw new Error(`providers.${key} is required`);
  }
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : [];
}

function redactRequest(request) {
  return {
    ...request,
    context: redactSecrets(request.context),
    datasets: {
      train: request.datasets.train,
      validation: request.datasets.validation,
      holdout: request.datasets.holdout.map((item) => ({ id: item.id, critical: item.critical, tags: item.tags, metric: item.metric })),
    },
  };
}
