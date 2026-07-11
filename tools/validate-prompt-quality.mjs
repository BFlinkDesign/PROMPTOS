#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { extractInputs, scorePrompt } from './scoring-core.mjs';
import { parsePromptCatalog, readText, resolvePromptSourcePath } from './catalog.mjs';

const rootDir = process.cwd();
const contractPath = path.join(rootDir, 'tests', 'prompt-quality-contracts.json');
const failures = [];
const MAX_VALIDATED_FILE_BYTES = 1024 * 1024;
const MAX_PATTERN_CHARS = 2000;
const ALLOWED_CONTRACT_ROOTS = new Set(['prompts', 'templates', 'schema', 'guides', 'tests']);
const ADVERSARIAL_CASE_EVIDENCE = {
  'hostile-repository-instructions': /higher-priority instructions|authority conflict|instruction trust/i,
  'dirty-worktree': /preserve (?:the )?dirty-worktree|do not revert|unrelated changes/i,
  'missing-source-of-truth': /do not invent|source of truth.{0,80}(?:missing|absent)|stop (?:and report|with)/is,
  'inaccessible-target-host': /target-host proof|static (?:parse|parsing).{0,60}not|mark.{0,60}unverified/is,
  'false-green-test': /does not (?:exercise|cover)|real artifact|changed behavior/i,
  'stale-evidence': /refresh.{0,80}before|current code|live artifact/is,
  'windows-unsigned-package': /code signing|signed package|update signature/i,
  'macos-not-notarized': /notarization|stapling|Gatekeeper/i,
  'interrupted-work-preservation': /preserve.{0,80}partial|resume|recoverable/is,
};

function normalizePath(value) {
  return String(value || '').replaceAll('\\', '/');
}

function resolveContractPath(rawPath) {
  const filePath = normalizePath(rawPath);
  const normalized = path.posix.normalize(filePath);
  const rootName = normalized.split('/')[0];
  if (filePath !== normalized || path.posix.isAbsolute(filePath) || !ALLOWED_CONTRACT_ROOTS.has(rootName)) {
    throw new Error(`path must stay inside an approved repository directory: ${JSON.stringify(rawPath)}`);
  }
  const absolutePath = path.resolve(rootDir, ...normalized.split('/'));
  const rootPath = path.resolve(rootDir);
  if (!absolutePath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error(`path escapes repository root: ${JSON.stringify(rawPath)}`);
  }
  return { filePath: normalized, absolutePath };
}

function readBoundedText(filePath, absolutePath) {
  const size = fs.statSync(absolutePath).size;
  if (size > MAX_VALIDATED_FILE_BYTES) {
    throw new Error(`${filePath}: file exceeds ${MAX_VALIDATED_FILE_BYTES} bytes`);
  }
  return readText(absolutePath);
}

function coversAdversarialCase(body, caseId) {
  const evidencePattern = ADVERSARIAL_CASE_EVIDENCE[caseId];
  return Boolean(evidencePattern && body.includes(caseId) && evidencePattern.test(body));
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    failures.push(`tests/prompt-quality-contracts.json: cannot parse contract JSON: ${error.message}`);
    return null;
  }
}

function asForbiddenTerm(item) {
  if (typeof item === 'string') {
    return { term: item, reason: 'forbidden by prompt-quality contract' };
  }
  return { term: item.term, reason: item.reason || 'forbidden by prompt-quality contract' };
}

function compilePattern(filePath, spec) {
  const pattern = typeof spec === 'string' ? spec : spec.pattern;
  const flags = typeof spec === 'string' ? 'i' : spec.flags || 'i';
  if (typeof pattern !== 'string' || pattern.length > MAX_PATTERN_CHARS) {
    failures.push(`${filePath}: required pattern must be a string no longer than ${MAX_PATTERN_CHARS} characters`);
    return null;
  }
  if (!/^[imsu]*$/.test(flags) || new Set(flags).size !== flags.length) {
    failures.push(`${filePath}: required pattern uses unsupported flags ${JSON.stringify(flags)}`);
    return null;
  }
  if (/\\[1-9]|\\k<|\(\?<(?::?[=!])|(?:\([^)]*[+*][^)]*\)|\[[^\]]+\][+*]|\.[+*])[+*{]/.test(pattern)) {
    failures.push(`${filePath}: required pattern uses a disallowed high-cost construct`);
    return null;
  }
  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    failures.push(`${filePath}: invalid required pattern ${spec.id || pattern}: ${error.message}`);
    return null;
  }
}

function checkRequiredPattern(filePath, body, spec) {
  const id = spec.id || spec.pattern || spec;
  if (Array.isArray(spec.any)) {
    const matches = spec.any.some((candidate) => {
      const regex = compilePattern(filePath, { ...spec, pattern: candidate });
      return regex ? regex.test(body) : false;
    });
    if (!matches) {
      failures.push(`${filePath}: missing required concept ${id}; expected one of ${spec.any.join(' OR ')}`);
    }
    return;
  }
  if (Array.isArray(spec.all)) {
    for (const candidate of spec.all) {
      const regex = compilePattern(filePath, { ...spec, pattern: candidate });
      if (regex && !regex.test(body)) {
        failures.push(`${filePath}: missing required concept ${id}; pattern did not match: ${candidate}`);
      }
    }
    return;
  }
  const regex = compilePattern(filePath, spec);
  if (regex && !regex.test(body)) {
    failures.push(`${filePath}: missing required concept ${id}; pattern did not match: ${spec.pattern || spec}`);
  }
}

const contract = readJson(contractPath);
if (!contract) {
  process.exit(1);
}

if (contract.schema_version !== '1.0') {
  failures.push(`tests/prompt-quality-contracts.json: schema_version must be "1.0", got ${JSON.stringify(contract.schema_version)}`);
}

const minimumScore = Number(contract.minimum_catalog_score ?? 85);
const expectedCatalogCount = Number(contract.expected_catalog_count);
const requiredCaseIds = contract.required_adversarial_case_ids || [];
const globalForbiddenTerms = (contract.forbidden_terms || []).map(asForbiddenTerm);
const catalogRows = parsePromptCatalog(rootDir);
const catalogPaths = new Set(catalogRows.map((row) => normalizePath(row.markdownPath)));
const catalogBodies = new Map();

if (!Number.isInteger(expectedCatalogCount) || expectedCatalogCount < 1) {
  failures.push('tests/prompt-quality-contracts.json: expected_catalog_count must be a positive integer');
} else if (catalogRows.length !== expectedCatalogCount) {
  failures.push(`catalog suite: expected ${expectedCatalogCount} catalog prompts, found ${catalogRows.length}`);
}

for (const row of catalogRows) {
  let filePath;
  let absolutePath;
  try {
    ({ markdownPath: filePath, absolutePath } = resolvePromptSourcePath(rootDir, row.markdownPath));
  } catch (error) {
    failures.push(error.message);
    continue;
  }
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${filePath}: catalog prompt file is missing`);
    continue;
  }
  let body;
  try { body = readBoundedText(filePath, absolutePath); }
  catch (error) { failures.push(error.message); continue; }
  catalogBodies.set(filePath, body);
  const score = scorePrompt(body).total;
  if (score < minimumScore) {
    failures.push(`${filePath}: deterministic structure lint ${score}/100 is below required minimum ${minimumScore}/100`);
  }
}

const coveredCases = new Set();
for (const [filePath, body] of catalogBodies.entries()) {
  for (const caseId of requiredCaseIds) {
    if (coversAdversarialCase(body, caseId)) {
      coveredCases.add(caseId);
    }
  }
}
for (const caseId of requiredCaseIds) {
  if (!coveredCases.has(caseId)) {
    failures.push(`catalog suite: missing required adversarial case ${caseId}; add the exact case ID to at least one catalog prompt`);
  }
}

const negativeControlPath = contract.adversarial_case_name_only_negative_control;
if (negativeControlPath) {
  try {
    const resolved = resolveContractPath(negativeControlPath);
    const body = readBoundedText(resolved.filePath, resolved.absolutePath);
    const namedCases = requiredCaseIds.filter((caseId) => body.includes(caseId));
    const semanticCases = requiredCaseIds.filter((caseId) => coversAdversarialCase(body, caseId));
    if (scorePrompt(body).total < minimumScore || namedCases.length !== requiredCaseIds.length || semanticCases.length !== 0) {
      failures.push(`${resolved.filePath}: negative control must score >= ${minimumScore}, name every adversarial case, and satisfy zero semantic case checks`);
    }
  } catch (error) {
    failures.push(error.message);
  }
} else {
  failures.push('tests/prompt-quality-contracts.json: adversarial_case_name_only_negative_control is required');
}

for (const [rawFilePath, fileContract] of Object.entries(contract.files || {})) {
  let filePath;
  let absolutePath;
  try { ({ filePath, absolutePath } = resolveContractPath(rawFilePath)); }
  catch (error) { failures.push(error.message); continue; }
  const shouldBeCatalogPrompt = fileContract.catalog_prompt === true;
  const shouldNotBeCatalogPrompt = fileContract.catalog_prompt === false;

  if (!fs.existsSync(absolutePath)) {
    failures.push(`${filePath}: file is required by tests/prompt-quality-contracts.json but does not exist`);
    continue;
  }

  if (shouldBeCatalogPrompt && !catalogPaths.has(filePath)) {
    failures.push(`${filePath}: required catalog prompt is not listed in PROMPTS.md`);
  }
  if (shouldNotBeCatalogPrompt && catalogPaths.has(filePath)) {
    failures.push(`${filePath}: must not be listed as a catalog prompt in PROMPTS.md`);
  }

  let body;
  try { body = readBoundedText(filePath, absolutePath); }
  catch (error) { failures.push(error.message); continue; }
  const inputLabels = new Set(extractInputs(body).map((input) => input.label));
  for (const requiredInput of fileContract.required_inputs || []) {
    if (!inputLabels.has(requiredInput)) {
      failures.push(`${filePath}: missing required bracketed input [${requiredInput}]; found [${[...inputLabels].join('], [')}]`);
    }
  }

  for (const patternSpec of fileContract.required_patterns || []) {
    checkRequiredPattern(filePath, body, patternSpec);
  }

  for (const caseId of fileContract.required_adversarial_case_ids || []) {
    if (!body.includes(caseId)) {
      failures.push(`${filePath}: missing required adversarial case ID ${caseId}`);
    }
  }

  const forbiddenTerms = [
    ...globalForbiddenTerms,
    ...(fileContract.forbidden_terms || []).map(asForbiddenTerm),
  ];
  for (const { term, reason } of forbiddenTerms) {
    if (term && body.toLowerCase().includes(String(term).toLowerCase())) {
      failures.push(`${filePath}: forbidden term "${term}" found (${reason})`);
    }
  }
}

if (failures.length) {
  console.error('PromptOS prompt-quality validation failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`PromptOS prompt-contract validation passed: ${catalogRows.length} catalog prompts checked, minimum structure lint ${minimumScore}/100, ${requiredCaseIds.length} named adversarial contracts covered`);
