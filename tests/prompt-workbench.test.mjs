import assert from 'node:assert/strict';
import test from 'node:test';

import { generatePrompt, improvePrompt, scorePrompt } from '../tools/scoring-core.mjs';

test('generator emits a deterministic structurally complete prompt', () => {
  const request = {
    title: 'Repository repair and release decision',
    objective: 'Inspect [REPOSITORY PATH] and deliver [TARGET BEHAVIOR].',
    inputs: ['REPOSITORY PATH', 'TARGET BEHAVIOR', 'GATE COMMAND'],
    constraints: 'Preserve user changes and do not modify production without explicit authority.',
    verification: 'Run [GATE COMMAND], inspect the final diff, and verify the live behavior.',
    output: 'Return Action, Evidence, Authority, Blockers, Next checkpoint, and Fallback.',
  };

  const first = generatePrompt(request);
  const second = generatePrompt(request);

  assert.equal(first, second);
  assert.match(first, /^# Repository repair and release decision/m);
  assert.match(first, /\[REPOSITORY PATH\]/);
  assert.match(first, /Do not invent missing evidence/);
  assert.deepEqual(scorePrompt(first), {
    total: 100,
    factors: {
      title: 15,
      bodyLength: 15,
      inputs: 15,
      verification: 20,
      outputContract: 20,
      boundaries: 15,
    },
  });
});

test('generator rejects a missing objective instead of fabricating one', () => {
  assert.throws(() => generatePrompt({ title: 'Missing objective' }), /objective is required/i);
});

test('improver preserves the source and repairs only missing structural contracts', () => {
  const source = 'Summarize the repository.\n';
  const result = improvePrompt(source);

  assert.equal(result.sourceText, source);
  assert.notEqual(result.candidateText, source);
  assert.ok(result.candidateText.includes(source));
  assert.deepEqual(result.originalScore.total, 0);
  assert.equal(result.candidateScore.total, 100);
  assert.deepEqual(result.changes.map((change) => change.factor), [
    'title',
    'inputs',
    'verification',
    'outputContract',
    'boundaries',
  ]);
});

test('improver is idempotent for a structurally complete prompt', () => {
  const source = generatePrompt({
    title: 'Stable prompt',
    objective: 'Complete [TASK] using [SOURCE].',
    inputs: ['TASK', 'SOURCE'],
  });
  const first = improvePrompt(source);
  const second = improvePrompt(first.candidateText);

  assert.equal(first.candidateText, source);
  assert.deepEqual(first.changes, []);
  assert.equal(second.candidateText, source);
  assert.deepEqual(second.changes, []);
});

test('improver does not pad a length-only gap to game the structural score', () => {
  const source = '# Tiny\n\nRun [TASK], verify evidence, return output, and do not invent facts.';
  const result = improvePrompt(source);

  assert.equal(result.candidateText, source);
  assert.deepEqual(result.changes, []);
  assert.equal(result.candidateScore.total, 85);
  assert.deepEqual(result.unresolved, [
    'Expand the prompt body to at least 250 characters after trimming outer whitespace.',
  ]);
});
