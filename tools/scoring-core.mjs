export function extractTitle(body) {
  const match = String(body || '').match(/^#\s+(.+)$/m);
  return match ? stripMarkdown(match[1]) : '';
}

export function extractSummary(body) {
  const text = String(body || '');
  const withoutTitle = text.replace(/^#\s+.+$/m, '').trim();
  const quoteLines = withoutTitle
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('>'))
    .map((line) => line.replace(/^>\s?/, '').trim())
    .filter(Boolean);
  const source = quoteLines.length ? quoteLines.join(' ') : withoutTitle;
  return normalizeText(source).slice(0, 260);
}

export function extractInputs(body) {
  const labels = new Set();
  const pattern = /\[([A-Z][A-Z0-9 /&._-]{1,80})\]/g;
  let match;
  while ((match = pattern.exec(String(body || ''))) !== null) {
    const label = match[1].trim();
    if (!label.includes('http')) {
      labels.add(label);
    }
  }
  return [...labels].map((label) => ({
    label,
    hint: 'Fill this placeholder before running the prompt.',
  }));
}

export function extractRules(body) {
  const text = String(body || '');
  const quoteLines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('>'))
    .map((line) => line.replace(/^>\s?/, '').trim())
    .filter(Boolean);
  return quoteLines.length ? quoteLines.join('\n') : normalizeText(text.replace(/^#\s+.+$/m, ''));
}

export function scorePrompt(body) {
  const source = String(body || '');
  const text = source.toLowerCase();
  const inputs = extractInputs(source);
  const factors = {
    title: /^#\s+.+$/m.test(source) ? 15 : 0,
    bodyLength: source.trim().length >= 250 ? 15 : source.trim().length >= 120 ? 8 : 0,
    inputs: inputs.length ? 15 : 0,
    verification: /\b(verify|gate|evidence|cite|citation|hash|recompute|source)\b/.test(text) ? 20 : 0,
    outputContract: /\b(produce|emit|return|deliver|ending|output|matrix|summary|plan)\b/.test(text) ? 20 : 0,
    boundaries: /\b(never|do not|if .*missing|ambiguous|unknown|assumption|trust)\b/.test(text) ? 15 : 0,
  };
  const total = Object.values(factors).reduce((sum, value) => sum + value, 0);
  return { total, factors };
}

export function maturityForScore(score) {
  // Structural lint cannot establish behavioral maturity. Keep the score
  // parameter for compatibility with generated browser consumers.
  void score;
  return 'draft';
}

export function verdictForScore(score) {
  if (score >= 85) return 'structural-complete';
  if (score >= 60) return 'structural-partial';
  return 'structural-incomplete';
}

export async function buildEvaluationReceipt({
  sourceText = '',
  sourcePath = 'local/pasted-prompt.md',
  evaluatedAt,
} = {}) {
  const source = String(sourceText ?? '');
  const result = scorePrompt(source);
  const evidence = buildFactorEvidence(result.factors);
  const blockers = evidence
    .filter((item) => item.points < item.maximum)
    .map((item) => blockerForFactor(item.factor));

  return {
    schema_version: '1.0',
    artifact_type: 'prompt_evaluation_receipt',
    source_path: sourcePath || 'local/pasted-prompt.md',
    source_hash: `sha256:${await sha256Hex(source)}`,
    evaluated_at: evaluatedAt || new Date().toISOString(),
    evaluation_scope: 'structural-lint',
    effectiveness: 'not-evaluated',
    release_authority: false,
    score: result.total,
    verdict: verdictForScore(result.total),
    factors: { ...result.factors },
    action: blockers.length
      ? `Resolve ${blockers.length} structural ${blockers.length === 1 ? 'gap' : 'gaps'}, then run behavioral evaluation before relying on this prompt.`
      : 'Run this prompt against a versioned behavioral dataset before relying on it or releasing it.',
    evidence,
    authority: {
      runtime: 'tools/scoring-core.mjs',
      method: 'deterministic structural lint',
      limitation: 'Does not evaluate model output, correctness, safety, cost, latency, or real-world effectiveness.',
    },
    blockers,
    next_checkpoint: blockers.length
      ? 'Address the listed blockers, then re-run the PromptOS Evaluator.'
      : 'Run a versioned behavioral dataset with declared graders and compare the result with an accepted baseline.',
    fallback: 'If behavioral evaluation is unavailable, keep the artifact in draft and do not claim readiness.',
  };
}

export function normalizeText(value) {
  return String(value || '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle?.digest) {
    throw new Error('Web Crypto SHA-256 is unavailable');
  }
  const bytes = new TextEncoder().encode(String(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildFactorEvidence(factors) {
  const definitions = {
    title: { maximum: 15, pass: 'H1 title present.', fail: 'H1 title is missing.' },
    bodyLength: {
      maximum: 15,
      pass: 'Prompt body has at least 250 characters after trimming outer whitespace.',
      fail: 'Prompt body is shorter than 250 characters after trimming outer whitespace.',
    },
    inputs: { maximum: 15, pass: 'At least one fill-in input is declared.', fail: 'No fill-in input is declared.' },
    verification: {
      maximum: 20,
      pass: 'Verification or evidence language is present.',
      fail: 'Verification or evidence language is missing.',
    },
    outputContract: { maximum: 20, pass: 'An output contract is present.', fail: 'An output contract is missing.' },
    boundaries: {
      maximum: 15,
      pass: 'Boundary or missing-input handling is present.',
      fail: 'Boundary or missing-input handling is missing.',
    },
  };

  return Object.entries(factors).map(([factor, points]) => {
    const definition = definitions[factor];
    return {
      factor,
      points,
      maximum: definition.maximum,
      finding: points === definition.maximum ? definition.pass : definition.fail,
    };
  });
}

function blockerForFactor(factor) {
  return {
    title: 'Add one H1 title.',
    bodyLength: 'Expand the prompt body to at least 250 characters after trimming outer whitespace.',
    inputs: 'Add at least one [PLACEHOLDER] input.',
    verification: 'Add an explicit verification, evidence, citation, source, hash, gate, or recomputation requirement.',
    outputContract: 'Define what the prompt must produce, emit, return, deliver, or output.',
    boundaries: 'Add explicit boundaries for missing, ambiguous, unknown, or prohibited behavior.',
  }[factor];
}
