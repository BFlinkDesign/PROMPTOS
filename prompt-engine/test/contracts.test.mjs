import test from 'node:test';
import assert from 'node:assert/strict';
import { ContractError, normalizeRequest } from '../src/contracts.mjs';

const valid = {
  objective: 'Classify a support ticket accurately.',
  baselinePrompt: 'Classify {{input}}.',
  datasets: {
    validation: [{ id: 'v1', input: 'x', expected: 'x', metric: { type: 'exact' } }],
    holdout: [{ id: 'h1', input: 'y', expected: 'y', metric: { type: 'exact' } }],
  },
};

test('normalizes a valid request and freezes it', () => {
  const request = normalizeRequest(valid);
  assert.equal(request.mode, 'improve');
  assert.equal(request.constraints.requiredVariables[0], 'input');
  assert.ok(Object.isFrozen(request));
});

test('requires a holdout split', () => {
  assert.throws(
    () => normalizeRequest({ ...valid, datasets: { validation: valid.datasets.validation, holdout: [] } }),
    ContractError,
  );
});

test('rejects duplicate case ids across splits', () => {
  assert.throws(
    () => normalizeRequest({
      ...valid,
      datasets: {
        validation: [{ id: 'same', input: 'x', expected: 'x' }],
        holdout: [{ id: 'same', input: 'y', expected: 'y' }],
      },
    }),
    /duplicate case id/,
  );
});
