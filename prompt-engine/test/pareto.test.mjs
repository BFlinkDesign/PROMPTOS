import test from 'node:test';
import assert from 'node:assert/strict';
import { paretoFront, rankCandidates } from '../src/pareto.mjs';

function item(id, quality, structural, cost, chars = 100) {
  return {
    candidateId: id,
    metrics: { quality, structural, criticalFailures: 0, promptChars: chars },
    usage: { costUsd: cost, latencyMs: 10 },
  };
}

test('keeps non-dominated quality-cost tradeoffs', () => {
  const front = paretoFront([
    item('a', 0.9, 0.9, 2),
    item('b', 0.85, 0.9, 1),
    item('c', 0.7, 0.7, 3),
  ]);
  assert.deepEqual(new Set(front.map((x) => x.candidateId)), new Set(['a', 'b']));
});

test('assigns increasing Pareto ranks', () => {
  const ranked = rankCandidates([
    item('a', 0.9, 0.9, 2),
    item('b', 0.85, 0.9, 1),
    item('c', 0.7, 0.7, 3),
  ]);
  assert.equal(ranked.find((x) => x.candidateId === 'c').paretoRank, 1);
});
