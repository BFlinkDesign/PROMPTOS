import fs from 'node:fs';
import path from 'node:path';
import { buildConsoleData } from './catalog.mjs';

const GENERATED_TESTS_PATH = path.join('tests', 'promptfoo-regression.json');
const FAILURES_DIR = path.join('tests', 'failures');
const FEEDBACK_DIR = 'feedback';

export function promoteFeedback(rootDir = process.cwd(), options = {}) {
  const write = options.write !== false;
  const feedbackDir = path.join(rootDir, FEEDBACK_DIR);
  const failuresDir = path.join(rootDir, FAILURES_DIR);
  const errors = [];
  const promoted = [];

  if (write) {
    fs.mkdirSync(feedbackDir, { recursive: true });
    fs.mkdirSync(failuresDir, { recursive: true });
  }

  const files = fs.existsSync(feedbackDir)
    ? fs.readdirSync(feedbackDir)
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .sort()
    : [];

  for (const fileName of files) {
    const sourceRel = path.posix.join(FEEDBACK_DIR, fileName);
    try {
      const raw = readJson(path.join(feedbackDir, fileName));
      const failure = normalizeFeedback(raw, sourceRel, rootDir);
      const outPath = path.join(failuresDir, `${failure.id}.json`);
      if (write) {
        writeJson(outPath, failure);
      }
      promoted.push({
        id: failure.id,
        source: sourceRel,
        target: slash(path.relative(rootDir, outPath)),
      });
    } catch (error) {
      errors.push(`${sourceRel}: ${error.message}`);
    }
  }

  const refresh = refreshPromptfooRegression(rootDir, { write });
  errors.push(...refresh.errors);

  return { errors, promoted, generatedTests: refresh.count };
}

export function verifyFeedbackHarness(rootDir = process.cwd()) {
  const errors = [];
  const failures = loadFailures(rootDir, errors);
  const expectedTests = buildPromptfooTests(failures);
  const testsPath = path.join(rootDir, GENERATED_TESTS_PATH);

  if (!fs.existsSync(testsPath)) {
    errors.push(`${GENERATED_TESTS_PATH} is missing; run npm run feedback:promote`);
  } else {
    const actualText = fs.readFileSync(testsPath, 'utf8');
    if (actualText !== `${JSON.stringify(expectedTests, null, 2)}\n`) {
      errors.push(`${GENERATED_TESTS_PATH} is stale; run npm run feedback:promote`);
    }
  }

  return { errors, failures: failures.length, tests: expectedTests.length };
}

export function refreshPromptfooRegression(rootDir = process.cwd(), options = {}) {
  const write = options.write !== false;
  const errors = [];
  const failures = loadFailures(rootDir, errors);
  const tests = buildPromptfooTests(failures);
  if (write) {
    writeJson(path.join(rootDir, GENERATED_TESTS_PATH), tests);
  }
  return { errors, count: tests.length };
}

export function buildPromptfooTests(failures) {
  return failures.map((failure) => ({
    description: `feedback ${failure.id}: ${failure.prompt_id}`,
    vars: {
      prompt_path: failure.prompt_path,
      failure_input: failure.input,
      observed_output: failure.model_output,
      user_complaint: failure.user_complaint,
      expected_behavior: failure.expected_behavior,
    },
    assert: [
      ...failure.required_terms.map((value) => ({ type: 'contains', value })),
      ...failure.forbidden_terms.map((value) => ({ type: 'not-contains', value })),
    ],
  }));
}

function normalizeFeedback(raw, sourceFeedbackPath, rootDir) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('feedback must be a JSON object');
  }

  const catalog = buildConsoleData(rootDir);
  const items = catalog.items || [];
  const promptId = cleanString(raw.prompt_id);
  const promptPath = cleanPath(raw.prompt_path);
  const item = promptId
    ? items.find((candidate) => candidate.id === promptId)
    : items.find((candidate) => candidate.source_path === promptPath);

  if (!item) {
    throw new Error('prompt_id or prompt_path must match a catalog item');
  }

  const assertions = normalizeAssertions(raw);
  if (!assertions.required_terms.length && !assertions.forbidden_terms.length) {
    throw new Error('at least one contains/not-contains assertion is required');
  }

  const id = slug(raw.id || path.basename(sourceFeedbackPath, path.extname(sourceFeedbackPath)));
  const input = requireText(raw.input, 'input');
  const modelOutput = requireText(raw.model_output, 'model_output');
  const userComplaint = requireText(raw.user_complaint, 'user_complaint');

  return {
    schema_version: 1,
    id,
    prompt_id: item.id,
    prompt_path: item.source_path,
    source_feedback_path: sourceFeedbackPath,
    input,
    model_output: modelOutput,
    user_complaint: userComplaint,
    expected_behavior: cleanString(raw.expected_behavior),
    required_terms: assertions.required_terms,
    forbidden_terms: assertions.forbidden_terms,
    observed_at: cleanString(raw.observed_at) || 'legacy-unknown',
  };
}

function loadFailures(rootDir, errors) {
  const failuresDir = path.join(rootDir, FAILURES_DIR);
  if (!fs.existsSync(failuresDir)) return [];

  return fs.readdirSync(failuresDir)
    .filter((name) => name.toLowerCase().endsWith('.json'))
    .sort()
    .map((fileName) => {
      const rel = path.posix.join(FAILURES_DIR, fileName);
      try {
        return validateFailure(readJson(path.join(failuresDir, fileName)), rel, rootDir);
      } catch (error) {
        errors.push(`${rel}: ${error.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function validateFailure(raw, relPath, rootDir) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('failure must be a JSON object');
  }
  if (raw.schema_version !== 1) {
    throw new Error('schema_version must be 1');
  }
  const catalog = buildConsoleData(rootDir);
  const item = (catalog.items || []).find((candidate) => candidate.id === raw.prompt_id);
  if (!item) {
    throw new Error(`prompt_id is not in catalog: ${raw.prompt_id}`);
  }
  if (item.source_path !== raw.prompt_path) {
    throw new Error(`prompt_path does not match catalog for ${raw.prompt_id}`);
  }
  const required = ['id', 'input', 'model_output', 'user_complaint', 'expected_behavior'];
  for (const key of required) {
    requireText(raw[key], key);
  }
  const assertions = normalizeAssertions(raw);
  if (!assertions.required_terms.length && !assertions.forbidden_terms.length) {
    throw new Error('at least one contains/not-contains assertion is required');
  }
  return {
    schema_version: 1,
    id: slug(raw.id || path.basename(relPath, path.extname(relPath))),
    prompt_id: raw.prompt_id,
    prompt_path: raw.prompt_path,
    source_feedback_path: cleanString(raw.source_feedback_path),
    input: cleanString(raw.input),
    model_output: cleanString(raw.model_output),
    user_complaint: cleanString(raw.user_complaint),
    expected_behavior: cleanString(raw.expected_behavior),
    required_terms: assertions.required_terms,
    forbidden_terms: assertions.forbidden_terms,
    observed_at: cleanString(raw.observed_at) || 'legacy-unknown',
  };
}

function normalizeAssertions(raw) {
  const required = [
    ...stringArray(raw.required_terms),
    ...assertionsByType(raw.assertions, 'contains'),
  ];
  const forbidden = [
    ...stringArray(raw.forbidden_terms),
    ...assertionsByType(raw.assertions, 'not-contains'),
  ];
  return {
    required_terms: unique(required),
    forbidden_terms: unique(forbidden),
  };
}

function assertionsByType(value, type) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && entry.type === type)
    .map((entry) => cleanString(entry.value))
    .filter(Boolean);
}

function stringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function requireText(value, label) {
  const text = cleanString(value);
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function cleanString(value) {
  return String(value == null ? '' : value).replace(/\r\n/g, '\n').trim();
}

function cleanPath(value) {
  return slash(cleanString(value));
}

function slug(value) {
  const text = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!text) throw new Error('id could not be derived');
  return text.slice(0, 96);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function slash(value) {
  return String(value || '').replace(/\\/g, '/');
}
