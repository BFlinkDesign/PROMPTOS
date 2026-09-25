'use strict';

const crypto = require('node:crypto');

const REQUIRED_MARKER = '<!-- promptos:completion-receipt-required -->';
const CLOSING_KEYWORD_RE = /\b(close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)?#(\d+)\b/gi;
const SHA40_RE = /^[a-f0-9]{40}$/;
const SHA64_RE = /^[a-f0-9]{64}$/;

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}`;
  }
  return JSON.stringify(value);
}

function receiptHash(receipt) {
  const copy = { ...receipt };
  delete copy.receipt_sha256;
  return crypto.createHash('sha256').update(stableStringify(copy), 'utf8').digest('hex');
}

function findClosingReferences(text = '') {
  const matches = [];
  for (const match of String(text).matchAll(CLOSING_KEYWORD_RE)) {
    matches.push({
      keyword: match[1].toLowerCase(),
      issueNumber: Number(match[2]),
      index: match.index,
      text: match[0],
    });
  }
  return matches;
}

function validateCompletionReceipt(receipt, { issueNumber, repository } = {}) {
  const errors = [];
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    return { valid: false, errors: ['receipt must be an object'] };
  }
  if (receipt.schema_version !== 1) errors.push('schema_version must equal 1');
  if (!Number.isInteger(receipt.issue_number) || receipt.issue_number < 1) errors.push('issue_number must be a positive integer');
  if (issueNumber && receipt.issue_number !== issueNumber) errors.push('issue_number does not match closed issue');
  if (typeof receipt.repository !== 'string' || !receipt.repository.includes('/')) errors.push('repository must be owner/name');
  if (repository && receipt.repository !== repository) errors.push('repository does not match workflow repository');
  if (!SHA40_RE.test(receipt.implementation_sha || '')) errors.push('implementation_sha must be a 40-character lowercase git SHA');
  if (!SHA40_RE.test(receipt.verified_sha || '')) errors.push('verified_sha must be a 40-character lowercase git SHA');
  if (receipt.implementation_sha && receipt.verified_sha && receipt.implementation_sha !== receipt.verified_sha) {
    errors.push('verified_sha must equal implementation_sha');
  }
  if (!Array.isArray(receipt.acceptance_criteria) || receipt.acceptance_criteria.length === 0) {
    errors.push('acceptance_criteria must be non-empty');
  } else {
    for (const [index, criterion] of receipt.acceptance_criteria.entries()) {
      if (!criterion || typeof criterion.id !== 'string' || !criterion.id.trim()) errors.push(`acceptance_criteria[${index}].id is required`);
      if (criterion?.status !== 'passed') errors.push(`acceptance_criteria[${index}] must be passed`);
      if (typeof criterion?.evidence !== 'string' || !criterion.evidence.trim()) errors.push(`acceptance_criteria[${index}].evidence is required`);
    }
  }
  if (!Array.isArray(receipt.verification) || receipt.verification.length === 0) {
    errors.push('verification must be non-empty');
  } else {
    for (const [index, gate] of receipt.verification.entries()) {
      if (!gate || typeof gate.name !== 'string' || !gate.name.trim()) errors.push(`verification[${index}].name is required`);
      if (gate?.conclusion !== 'success') errors.push(`verification[${index}] must conclude success`);
      if (typeof gate?.evidence !== 'string' || !gate.evidence.trim()) errors.push(`verification[${index}].evidence is required`);
    }
  }
  if (!Array.isArray(receipt.blockers)) errors.push('blockers must be an array');
  else if (receipt.blockers.length) errors.push('blockers must be empty for completion');
  if (typeof receipt.authority !== 'string' || !receipt.authority.trim()) errors.push('authority is required');
  if (typeof receipt.captured_at !== 'string' || Number.isNaN(Date.parse(receipt.captured_at))) errors.push('captured_at must be an ISO timestamp');
  if (!SHA64_RE.test(receipt.receipt_sha256 || '')) errors.push('receipt_sha256 must be a 64-character lowercase SHA-256');
  else if (receipt.receipt_sha256 !== receiptHash(receipt)) errors.push('receipt_sha256 does not match canonical receipt content');
  return { valid: errors.length === 0, errors };
}

function requiresCompletionReceipt(issueBody = '') {
  return String(issueBody).includes(REQUIRED_MARKER);
}

module.exports = {
  CLOSING_KEYWORD_RE,
  REQUIRED_MARKER,
  findClosingReferences,
  receiptHash,
  requiresCompletionReceipt,
  stableStringify,
  validateCompletionReceipt,
};
