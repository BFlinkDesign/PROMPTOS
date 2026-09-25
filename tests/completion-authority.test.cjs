const test = require('node:test');
const assert = require('node:assert/strict');
const {
  findClosingReferences,
  receiptHash,
  requiresCompletionReceipt,
  validateCompletionReceipt,
} = require('../tools/completion-authority.cjs');

const SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function receipt(overrides = {}) {
  const value = {
    schema_version: 1,
    issue_number: 40,
    repository: 'BFlinkDesign/PROMPTOS',
    implementation_sha: SHA,
    verified_sha: SHA,
    default_branch_head_sha: SHA,
    acceptance_criteria: [{ id: 'compiler.ir', status: 'passed', evidence: 'run://verify/1' }],
    verification: [{ name: 'npm run verify', conclusion: 'success', evidence: 'run://verify/1' }],
    blockers: [],
    authority: 'independent review of verified SHA',
    captured_at: '2026-09-25T14:00:00Z',
    receipt_sha256: '',
    ...overrides,
  };
  value.receipt_sha256 = receiptHash(value);
  return value;
}

test('detects closing keywords even when natural-language prose negates them', () => {
  assert.deepEqual(findClosingReferences('this does not close #40').map((m) => m.issueNumber), [40]);
  assert.deepEqual(findClosingReferences('do not fix #40').map((m) => m.issueNumber), [40]);
  assert.deepEqual(findClosingReferences('this does not resolve: #40').map((m) => m.issueNumber), [40]);
});

test('normal issue references are not closing references', () => {
  assert.deepEqual(findClosingReferences('see #40; implementation remains open'), []);
});

test('explicit closing syntax is detected', () => {
  const matches = findClosingReferences('Closes #44 and fixes BFlinkDesign/PROMPTOS#40');
  assert.deepEqual(matches.map((m) => m.issueNumber), [44, 40]);
});

test('completion marker is explicit and deterministic', () => {
  assert.equal(requiresCompletionReceipt('<!-- promptos:completion-receipt-required -->'), true);
  assert.equal(requiresCompletionReceipt('ordinary issue'), false);
});

test('valid completion receipt binds issue, repository, SHA, gates and hash', () => {
  const value = receipt();
  const result = validateCompletionReceipt(value, {
    issueNumber: 40,
    repository: 'BFlinkDesign/PROMPTOS',
    currentDefaultHeadSha: SHA,
  });
  assert.deepEqual(result, { valid: true, errors: [] });
});

test('receipt fails closed on wrong issue, failed criteria, blockers or stale default head', () => {
  const value = receipt({
    issue_number: 41,
    acceptance_criteria: [{ id: 'compiler.ir', status: 'failed', evidence: 'run://verify/1' }],
    blockers: ['provider lane not verified'],
  });
  value.receipt_sha256 = receiptHash(value);
  const result = validateCompletionReceipt(value, {
    issueNumber: 40,
    repository: 'BFlinkDesign/PROMPTOS',
    currentDefaultHeadSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /issue_number|must be passed|blockers|stale/);
});

test('receipt hash prevents post-verification mutation', () => {
  const value = receipt();
  value.authority = 'mutated after hashing';
  const result = validateCompletionReceipt(value, { issueNumber: 40, repository: 'BFlinkDesign/PROMPTOS' });
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /receipt_sha256/);
});
