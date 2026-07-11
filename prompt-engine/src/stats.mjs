import { createSeededRandom, mean } from './util.mjs';

export function pairedBootstrapDelta(candidateScores, baselineScores, {
  seed = 'bootstrap',
  iterations = 5000,
  confidenceLevel = 0.95,
} = {}) {
  if (!Array.isArray(candidateScores) || !Array.isArray(baselineScores)) throw new TypeError('scores must be arrays');
  if (candidateScores.length !== baselineScores.length) throw new Error('paired score arrays must have equal length');
  if (!candidateScores.length) throw new Error('at least one paired score is required');
  const deltas = candidateScores.map((value, index) => value - baselineScores[index]);
  const observed = mean(deltas);
  const random = createSeededRandom(seed);
  const samples = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let total = 0;
    for (let index = 0; index < deltas.length; index += 1) {
      total += deltas[Math.floor(random() * deltas.length)];
    }
    samples.push(total / deltas.length);
  }
  samples.sort((a, b) => a - b);
  const alpha = 1 - confidenceLevel;
  return {
    observed,
    lower: quantile(samples, alpha / 2),
    upper: quantile(samples, 1 - alpha / 2),
    confidenceLevel,
    iterations,
    n: deltas.length,
  };
}

export function claimGate({ candidate, baseline, policy }) {
  const reasons = [];
  if (!baseline) reasons.push(`required baseline ${policy.baselineId} is absent`);
  if (!candidate) reasons.push('candidate result is absent');
  if (reasons.length) return { status: 'unproven', pass: false, reasons };

  const candidateScores = candidate.cases.map((item) => item.score);
  const baselineById = new Map(baseline.cases.map((item) => [item.caseId, item]));
  const pairedCandidate = [];
  const pairedBaseline = [];
  for (const item of candidate.cases) {
    const control = baselineById.get(item.caseId);
    if (!control) continue;
    pairedCandidate.push(item.score);
    pairedBaseline.push(control.score);
  }
  if (pairedCandidate.length < policy.minimumHoldoutCases) {
    reasons.push(`holdout has ${pairedCandidate.length} paired cases; minimum is ${policy.minimumHoldoutCases}`);
  }

  const stats = pairedCandidate.length
    ? pairedBootstrapDelta(pairedCandidate, pairedBaseline, {
        seed: `${candidate.candidateId}:${baseline.candidateId}`,
        confidenceLevel: policy.confidenceLevel,
      })
    : null;
  if (stats && stats.observed < policy.minimumAbsoluteGain) reasons.push(`observed gain ${format(stats.observed)} is below ${format(policy.minimumAbsoluteGain)}`);
  if (stats && stats.lower <= policy.minimumAbsoluteGain) reasons.push(`confidence lower bound ${format(stats.lower)} does not exceed required gain ${format(policy.minimumAbsoluteGain)}`);

  const candidateCritical = candidate.cases.filter((item) => item.critical && item.score < 1).length;
  const baselineCritical = baseline.cases.filter((item) => item.critical && item.score < 1).length;
  if (candidateCritical - baselineCritical > policy.criticalRegressionTolerance) {
    reasons.push(`critical failures increased from ${baselineCritical} to ${candidateCritical}`);
  }

  const costRatio = ratio(candidate.usage.costUsd, baseline.usage.costUsd);
  const latencyRatio = ratio(candidate.usage.latencyMs, baseline.usage.latencyMs);
  if (costRatio > policy.maxCostRatio) reasons.push(`cost ratio ${format(costRatio)} exceeds ${policy.maxCostRatio}`);
  if (latencyRatio > policy.maxLatencyRatio) reasons.push(`latency ratio ${format(latencyRatio)} exceeds ${policy.maxLatencyRatio}`);

  return {
    status: reasons.length ? 'unproven' : 'superior',
    pass: reasons.length === 0,
    reasons,
    statistics: stats,
    costRatio,
    latencyRatio,
    pairedCases: pairedCandidate.length,
  };
}

function quantile(sorted, probability) {
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function ratio(value, baseline) {
  if (baseline === 0) return value === 0 ? 1 : Number.POSITIVE_INFINITY;
  return value / baseline;
}

function format(value) {
  return Number.isFinite(value) ? value.toFixed(4) : String(value);
}
