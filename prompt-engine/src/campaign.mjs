import { createSeededRandom, mean, nowIso, sha256 } from './util.mjs';

export function evaluateIndependentCampaign(reports, rawPolicy = {}) {
  if (!Array.isArray(reports) || !reports.length) throw new Error('campaign requires at least one run report');
  const policy = {
    baselineId: rawPolicy.baselineId ?? 'anthropic-prompt-improver',
    minimumReports: rawPolicy.minimumReports ?? 9,
    minimumProviders: rawPolicy.minimumProviders ?? 2,
    minimumModels: rawPolicy.minimumModels ?? 3,
    minimumSuites: rawPolicy.minimumSuites ?? 3,
    minimumSeeds: rawPolicy.minimumSeeds ?? 3,
    minimumPairedCases: rawPolicy.minimumPairedCases ?? 300,
    minimumRunWinRate: rawPolicy.minimumRunWinRate ?? 0.75,
    minimumAbsoluteGain: rawPolicy.minimumAbsoluteGain ?? 0,
    minimumRobustnessGain: rawPolicy.minimumRobustnessGain ?? 0,
    confidenceLevel: rawPolicy.confidenceLevel ?? 0.95,
    bootstrapIterations: rawPolicy.bootstrapIterations ?? 10000,
    maxCostRatio: rawPolicy.maxCostRatio ?? 1.25,
    maxLatencyRatio: rawPolicy.maxLatencyRatio ?? 1.25,
    requireAnthropicProvenance: rawPolicy.requireAnthropicProvenance ?? true,
  };

  const reasons = [];
  const groups = [];
  const providers = new Set();
  const models = new Set();
  const suites = new Set();
  const seeds = new Set();
  let criticalDelta = 0;
  let candidateCost = 0;
  let baselineCost = 0;
  let candidateLatency = 0;
  let baselineLatency = 0;
  let provenancePasses = 0;

  for (const report of reports) {
    const candidate = report.winner;
    const baseline = report.holdout?.ranking?.find((item) => item.strategy === policy.baselineId && item.origin === 'baseline');
    if (!candidate || !baseline) {
      reasons.push(`run ${report.runId ?? 'unknown'} lacks winner or baseline ${policy.baselineId}`);
      continue;
    }
    const baselineManifest = report.request?.baselines?.find((item) => item.id === policy.baselineId);
    if (baselineManifest && validAnthropicProvenance(baselineManifest.provenance)) provenancePasses += 1;

    const baselineByCase = new Map(baseline.cases.map((item) => [item.caseId, item]));
    const deltas = [];
    const robustnessDeltas = [];
    let candidateCritical = 0;
    let baselineCritical = 0;
    for (const item of candidate.cases) {
      const control = baselineByCase.get(item.caseId);
      if (!control) continue;
      deltas.push(item.score - control.score);
      if (item.critical && item.score < 1) candidateCritical += 1;
      if (control.critical && control.score < 1) baselineCritical += 1;
    }
    const baselinePerturbations = new Map((baseline.perturbations ?? []).map((item) => [`${item.sourceCaseId}:${item.perturbation}`, item]));
    for (const item of candidate.perturbations ?? []) {
      const control = baselinePerturbations.get(`${item.sourceCaseId}:${item.perturbation}`);
      if (control) robustnessDeltas.push(item.score - control.score);
    }
    if (!deltas.length) {
      reasons.push(`run ${report.runId ?? 'unknown'} has no paired holdout cases`);
      continue;
    }

    groups.push({
      runId: report.runId,
      deltas,
      robustnessDeltas,
      meanDelta: mean(deltas),
      meanRobustnessDelta: robustnessDeltas.length ? mean(robustnessDeltas) : 0,
    });
    criticalDelta += candidateCritical - baselineCritical;
    candidateCost += Number(candidate.usage?.costUsd ?? 0);
    baselineCost += Number(baseline.usage?.costUsd ?? 0);
    candidateLatency += Number(candidate.usage?.latencyMs ?? 0);
    baselineLatency += Number(baseline.usage?.latencyMs ?? 0);
    const target = report.providers?.target ?? {};
    providers.add(target.id ?? 'unknown');
    models.add(`${target.id ?? 'unknown'}:${target.model ?? 'unknown'}`);
    suites.add(report.request?.metadata?.benchmarkSuite ?? report.request?.id ?? 'unknown');
    seeds.add(report.request?.search?.seed ?? 'unknown');
  }

  const pairedCases = groups.reduce((sum, group) => sum + group.deltas.length, 0);
  const runWins = groups.filter((group) => group.meanDelta > policy.minimumAbsoluteGain).length;
  const runWinRate = groups.length ? runWins / groups.length : 0;
  const quality = groups.length
    ? hierarchicalBootstrap(groups.map((group) => group.deltas), {
        seed: 'promptos-independent-quality',
        iterations: policy.bootstrapIterations,
        confidenceLevel: policy.confidenceLevel,
      })
    : null;
  const robustnessGroups = groups.map((group) => group.robustnessDeltas).filter((values) => values.length);
  const robustness = robustnessGroups.length
    ? hierarchicalBootstrap(robustnessGroups, {
        seed: 'promptos-independent-robustness',
        iterations: policy.bootstrapIterations,
        confidenceLevel: policy.confidenceLevel,
      })
    : null;
  const costRatio = safeRatio(candidateCost, baselineCost);
  const latencyRatio = safeRatio(candidateLatency, baselineLatency);

  requireAtLeast(reports.length, policy.minimumReports, 'reports', reasons);
  requireAtLeast(providers.size, policy.minimumProviders, 'providers', reasons);
  requireAtLeast(models.size, policy.minimumModels, 'provider/model combinations', reasons);
  requireAtLeast(suites.size, policy.minimumSuites, 'benchmark suites', reasons);
  requireAtLeast(seeds.size, policy.minimumSeeds, 'seeds', reasons);
  requireAtLeast(pairedCases, policy.minimumPairedCases, 'paired holdout cases', reasons);
  if (runWinRate < policy.minimumRunWinRate) reasons.push(`run win rate ${fmt(runWinRate)} is below ${fmt(policy.minimumRunWinRate)}`);
  if (!quality || quality.lower <= policy.minimumAbsoluteGain) reasons.push(`quality confidence lower bound ${fmt(quality?.lower)} does not exceed ${fmt(policy.minimumAbsoluteGain)}`);
  if (!robustness) reasons.push('no paired perturbation evidence exists');
  else if (robustness.lower < policy.minimumRobustnessGain) reasons.push(`robustness confidence lower bound ${fmt(robustness.lower)} is below ${fmt(policy.minimumRobustnessGain)}`);
  if (criticalDelta > 0) reasons.push(`critical failures increased by ${criticalDelta}`);
  if (costRatio > policy.maxCostRatio) reasons.push(`aggregate cost ratio ${fmt(costRatio)} exceeds ${fmt(policy.maxCostRatio)}`);
  if (latencyRatio > policy.maxLatencyRatio) reasons.push(`aggregate latency ratio ${fmt(latencyRatio)} exceeds ${fmt(policy.maxLatencyRatio)}`);
  if (policy.requireAnthropicProvenance && provenancePasses !== reports.length) {
    reasons.push(`Anthropic improver provenance validated for ${provenancePasses}/${reports.length} reports`);
  }

  const evidence = {
    reports: reports.length,
    validPairedRuns: groups.length,
    providers: [...providers].sort(),
    models: [...models].sort(),
    suites: [...suites].sort(),
    seeds: [...seeds].sort(),
    pairedCases,
    runWinRate,
    criticalDelta,
    costRatio,
    latencyRatio,
    provenancePasses,
  };
  return {
    schemaVersion: 1,
    campaignId: `campaign-${sha256({ reportIds: reports.map((item) => item.runId), policy }).slice(0, 16)}`,
    evaluatedAt: nowIso(),
    status: reasons.length ? 'UNPROVEN' : 'INDEPENDENTLY-BENCHMARKED-SUPERIOR',
    pass: reasons.length === 0,
    baselineId: policy.baselineId,
    reasons: [...new Set(reasons)],
    policy,
    evidence,
    statistics: { quality, robustness },
  };
}

export function hierarchicalBootstrap(groups, { seed, iterations = 10000, confidenceLevel = 0.95 }) {
  if (!groups.length || groups.some((group) => !group.length)) throw new Error('hierarchical bootstrap requires non-empty groups');
  const random = createSeededRandom(seed);
  const samples = [];
  const observed = mean(groups.flat());
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sampledGroups = [];
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[Math.floor(random() * groups.length)];
      const sampled = [];
      for (let caseIndex = 0; caseIndex < group.length; caseIndex += 1) {
        sampled.push(group[Math.floor(random() * group.length)]);
      }
      sampledGroups.push(mean(sampled));
    }
    samples.push(mean(sampledGroups));
  }
  samples.sort((a, b) => a - b);
  const alpha = 1 - confidenceLevel;
  return {
    observed,
    lower: quantile(samples, alpha / 2),
    upper: quantile(samples, 1 - alpha / 2),
    confidenceLevel,
    iterations,
    groups: groups.length,
    cases: groups.reduce((sum, group) => sum + group.length, 0),
  };
}

function validAnthropicProvenance(value) {
  return Boolean(
    value &&
      String(value.vendor ?? '').toLowerCase() === 'anthropic' &&
      /prompt[- ]?improver/i.test(String(value.tool ?? '')) &&
      typeof value.capturedAt === 'string' &&
      typeof value.sourceHash === 'string' &&
      value.sourceHash.length >= 16,
  );
}

function requireAtLeast(actual, required, label, reasons) {
  if (actual < required) reasons.push(`${label}: ${actual}; minimum is ${required}`);
}

function safeRatio(value, baseline) {
  if (baseline === 0) return value === 0 ? 1 : Number.POSITIVE_INFINITY;
  return value / baseline;
}

function quantile(sorted, probability) {
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function fmt(value) {
  return Number.isFinite(value) ? Number(value).toFixed(4) : String(value);
}
