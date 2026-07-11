import { clamp, mean } from './util.mjs';

export function structuralScore(prompt, spec, constraints) {
  const text = String(prompt ?? '');
  const lower = text.toLowerCase();
  const checks = [];

  for (const variable of constraints.requiredVariables) {
    const forms = [`{{${variable}}}`, `[${variable.toUpperCase()}]`, `<${variable}>`];
    checks.push({ id: `variable:${variable}`, weight: 14, pass: forms.some((form) => text.includes(form)) });
  }

  checks.push(
    { id: 'objective', weight: 12, pass: includesAny(lower, keywords(spec.task)) },
    { id: 'output-contract', weight: 14, pass: /output|return|respond|schema|json|format/.test(lower) },
    { id: 'verification', weight: 12, pass: /verify|check|validate|recompute|evidence/.test(lower) },
    { id: 'failure-behavior', weight: 10, pass: /unknown|insufficient|missing|cannot|error|escalat/.test(lower) },
    { id: 'instruction-boundary', weight: 12, pass: /untrusted|treat .* as data|instruction priority|ignore instructions inside|xml|<input>/.test(lower) },
    { id: 'explicit-rules', weight: 10, pass: /rules|must|never|do not|required/.test(lower) },
    { id: 'success-criteria', weight: 8, pass: /success|criteria|acceptance|correct/.test(lower) },
    { id: 'examples-or-labels', weight: 8, pass: /example|label|allowed values|few-shot|classification/.test(lower) },
  );

  for (const phrase of constraints.requiredPhrases) {
    checks.push({ id: `required:${phrase}`, weight: 10, pass: lower.includes(phrase.toLowerCase()) });
  }
  for (const phrase of constraints.forbiddenPhrases) {
    checks.push({ id: `forbidden:${phrase}`, weight: 20, pass: !lower.includes(phrase.toLowerCase()) });
  }

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  let score = checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0) / totalWeight;
  const overLength = Math.max(0, text.length - constraints.maxPromptChars);
  if (overLength > 0) score *= Math.max(0, 1 - overLength / constraints.maxPromptChars);
  const severeFailures = checks.filter((check) => !check.pass && (check.id.startsWith('variable:') || check.id.startsWith('forbidden:')));
  return {
    score: clamp(score),
    passed: checks.filter((check) => check.pass).map((check) => check.id),
    failed: checks.filter((check) => !check.pass).map((check) => check.id),
    severeFailures: severeFailures.map((check) => check.id),
    promptChars: text.length,
  };
}

export async function scoreCase({ caseItem, response, judgeProvider, ledger }) {
  const metric = caseItem.metric;
  let score;
  let detail;
  switch (metric.type) {
    case 'exact': {
      score = normalize(response) === normalize(caseItem.expected) ? 1 : 0;
      detail = 'normalized exact match';
      break;
    }
    case 'contains-all': {
      const actual = normalize(response);
      const values = metric.values.map(normalize);
      score = mean(values.map((value) => (actual.includes(value) ? 1 : 0)));
      detail = `contains ${Math.round(score * values.length)}/${values.length} required values`;
      break;
    }
    case 'regex': {
      const regex = new RegExp(metric.pattern, metric.flags ?? '');
      score = regex.test(String(response)) ? 1 : 0;
      detail = `regex ${metric.pattern}`;
      break;
    }
    case 'json-valid': {
      score = tryJson(response).ok ? 1 : 0;
      detail = 'valid JSON';
      break;
    }
    case 'json-equals': {
      const actual = tryJson(response);
      const expected = typeof caseItem.expected === 'string' ? tryJson(caseItem.expected) : { ok: true, value: caseItem.expected };
      score = actual.ok && expected.ok && deepEqual(actual.value, expected.value) ? 1 : 0;
      detail = 'deep JSON equality';
      break;
    }
    case 'llm-judge': {
      if (!judgeProvider) throw new Error(`case ${caseItem.id} requires an llm-judge provider`);
      ledger?.reserve(`judge:${caseItem.id}`);
      const result = await judgeProvider.invokeRole({
        role: 'judge',
        instructions: '',
        input: {
          input: caseItem.input,
          response,
          expected: caseItem.expected,
          rubric: caseItem.rubric,
        },
        seed: 0,
        maxTokens: 512,
      });
      ledger?.record(result);
      score = clamp(Number(result.output?.score));
      detail = result.output?.rationale ?? 'llm judge';
      break;
    }
    default:
      throw new Error(`unsupported metric ${metric.type}`);
  }
  return { score: clamp(score), detail };
}

export function aggregateCaseScores(results) {
  const scores = results.map((item) => item.score);
  const critical = results.filter((item) => item.critical);
  const criticalFailures = critical.filter((item) => item.score < 1).length;
  return {
    quality: mean(scores),
    criticalFailures,
    caseCount: results.length,
  };
}

function normalize(value) {
  if (typeof value === 'object' && value !== null) return JSON.stringify(value, Object.keys(value).sort()).toLowerCase().replace(/\s+/g, '');
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function tryJson(value) {
  try {
    return { ok: true, value: typeof value === 'string' ? JSON.parse(value) : value };
  } catch {
    return { ok: false, value: null };
  }
}

function deepEqual(left, right) {
  return JSON.stringify(sort(left)) === JSON.stringify(sort(right));
}

function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])]));
  return value;
}

function includesAny(text, words) {
  return words.length ? words.some((word) => text.includes(word)) : true;
}

function keywords(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 5)
    .slice(0, 12);
}
