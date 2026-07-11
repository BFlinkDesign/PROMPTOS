import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { optimizePrompt } from '../src/orchestrator.mjs';
import { HeuristicProvider, ReplayProvider } from '../src/providers.mjs';

const fixture = JSON.parse(await fs.readFile(new URL('../fixtures/request.json', import.meta.url), 'utf8'));

test('optimizes through a bounded agent team and selects a JSON-contract prompt', async () => {
  const provider = new HeuristicProvider();
  const report = await optimizePrompt(fixture, {
    builder: provider,
    critic: provider,
    target: provider,
    judge: provider,
  });
  assert.ok(report.winner);
  assert.match(report.winner.prompt, /json/i);
  assert.equal(report.winner.metrics.quality, 1);
  assert.ok(report.budget.calls <= fixture.search.maxModelCalls);
  assert.ok(report.events.some((event) => event.stage === 'holdout.started'));
});

test('never exposes holdout inputs to architect, generator, critic, or reviser', async () => {
  const holdoutSecrets = fixture.datasets.holdout.map((item) => item.input);
  const heuristic = new HeuristicProvider();
  const guard = new ReplayProvider({
    id: 'guarded-builder',
    handler: async (call) => {
      if (call.kind === 'role') {
        const serialized = JSON.stringify(call.input);
        for (const secret of holdoutSecrets) assert.equal(serialized.includes(secret), false, `${call.role} received holdout input`);
        return heuristic.handler(call);
      }
      return heuristic.handler(call);
    },
  });
  const report = await optimizePrompt(fixture, {
    builder: guard,
    critic: guard,
    target: heuristic,
    judge: heuristic,
  });
  assert.ok(report.winner);
});
