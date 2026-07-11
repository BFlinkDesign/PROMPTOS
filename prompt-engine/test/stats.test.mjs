import test from 'node:test';
import assert from 'node:assert/strict';
import { claimGate, pairedBootstrapDelta } from '../src/stats.mjs';

function result(id, scores, cost = 1, latency = 100) {
  return {
    candidateId: id,
    cases: scores.map((score, index) => ({ caseId: `case-${index}`, score, critical: index < 2 })),
    usage: { costUsd: cost, latencyMs: latency },
  };
}

test('paired bootstrap is deterministic for the same seed', () => {
  const a = pairedBootstrapDelta([1, 1, 1, 0], [0, 0, 1, 0], { seed: 'same', iterations: 500 });
  const b = pairedBootstrapDelta([1, 1, 1, 0], [0, 0, 1, 0], { seed: 'same', iterations: 500 });
  assert.deepEqual(a, b);
});

test('claim gate refuses undersized evidence', () => {
  const gate = claimGate({
    candidate: result('candidate', [1, 1, 1, 1]),
    baseline: result('baseline', [0, 0, 0, 0]),
    policy: {
      baselineId: 'baseline',
      minimumHoldoutCases: 30,
      minimumAbsoluteGain: 0,
      confidenceLevel: 0.95,
      maxCostRatio: 2,
      maxLatencyRatio: 2,
      criticalRegressionTolerance: 0,
    },
  });
  assert.equal(gate.pass, false);
  assert.match(gate.reasons.join('\n'), /minimum is 30/);
});

test('claim gate can certify a decisive paired win', () => {
  const candidateScores = Array.from({ length: 40 }, () => 1);
  const baselineScores = Array.from({ length: 40 }, (_, index) => (index < 10 ? 1 : 0));
  const gate = claimGate({
    candidate: result('candidate', candidateScores),
    baseline: result('baseline', baselineScores),
    policy: {
      baselineId: 'baseline',
      minimumHoldoutCases: 30,
      minimumAbsoluteGain: 0,
      confidenceLevel: 0.95,
      maxCostRatio: 2,
      maxLatencyRatio: 2,
      criticalRegressionTolerance: 0,
    },
  });
  assert.equal(gate.pass, true);
  assert.equal(gate.status, 'superior');
  assert.ok(gate.statistics.lower > 0);
});
