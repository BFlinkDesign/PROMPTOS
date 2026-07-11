import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateIndependentCampaign, hierarchicalBootstrap } from '../src/campaign.mjs';

function makeReport(index) {
  const baselineId = 'anthropic-prompt-improver';
  const provider = index % 2 ? 'provider-a' : 'provider-b';
  const model = `model-${index % 3}`;
  const cases = Array.from({ length: 40 }, (_, caseIndex) => ({
    caseId: `case-${caseIndex}`,
    score: caseIndex < 10 ? 0 : 1,
    critical: caseIndex < 2,
  }));
  const baselineCases = Array.from({ length: 40 }, (_, caseIndex) => ({
    caseId: `case-${caseIndex}`,
    score: caseIndex < 10 ? 0 : caseIndex < 20 ? 1 : 0,
    critical: caseIndex < 2,
  }));
  const perturbations = Array.from({ length: 20 }, (_, caseIndex) => ({
    sourceCaseId: `case-${caseIndex}`,
    perturbation: 'trailing-injection',
    score: 1,
  }));
  const baselinePerturbations = Array.from({ length: 20 }, (_, caseIndex) => ({
    sourceCaseId: `case-${caseIndex}`,
    perturbation: 'trailing-injection',
    score: caseIndex < 5 ? 1 : 0,
  }));
  const baseline = {
    candidateId: `baseline-${index}`,
    strategy: baselineId,
    origin: 'baseline',
    cases: baselineCases,
    perturbations: baselinePerturbations,
    usage: { costUsd: 1, latencyMs: 100 },
  };
  return {
    runId: `run-${index}`,
    request: {
      id: `task-${index % 3}`,
      metadata: { benchmarkSuite: `suite-${index % 3}` },
      search: { seed: `seed-${index % 3}` },
      baselines: [{
        id: baselineId,
        provenance: {
          vendor: 'Anthropic',
          tool: 'prompt-improver',
          capturedAt: '2026-07-11T00:00:00Z',
          sourceHash: `1234567890abcdef${index}`,
        },
      }],
    },
    providers: { target: { id: provider, model } },
    winner: {
      candidateId: `winner-${index}`,
      cases,
      perturbations,
      usage: { costUsd: 1, latencyMs: 100 },
    },
    holdout: { ranking: [baseline] },
  };
}

test('hierarchical bootstrap is deterministic', () => {
  const first = hierarchicalBootstrap([[1, 0.5], [0.25, 0.75]], { seed: 'x', iterations: 500 });
  const second = hierarchicalBootstrap([[1, 0.5], [0.25, 0.75]], { seed: 'x', iterations: 500 });
  assert.deepEqual(first, second);
});

test('campaign gate certifies only cross-provider, cross-suite evidence', () => {
  const result = evaluateIndependentCampaign(Array.from({ length: 9 }, (_, index) => makeReport(index)), {
    minimumReports: 9,
    minimumProviders: 2,
    minimumModels: 3,
    minimumSuites: 3,
    minimumSeeds: 3,
    minimumPairedCases: 300,
    bootstrapIterations: 1000,
  });
  assert.equal(result.pass, true);
  assert.equal(result.status, 'INDEPENDENTLY-BENCHMARKED-SUPERIOR');
});

test('campaign gate refuses missing vendor provenance', () => {
  const reports = Array.from({ length: 9 }, (_, index) => makeReport(index));
  reports[0].request.baselines[0].provenance = {};
  const result = evaluateIndependentCampaign(reports, {
    minimumReports: 9,
    minimumProviders: 2,
    minimumModels: 3,
    minimumSuites: 3,
    minimumSeeds: 3,
    minimumPairedCases: 300,
    bootstrapIterations: 500,
  });
  assert.equal(result.pass, false);
  assert.match(result.reasons.join('\n'), /provenance/);
});
