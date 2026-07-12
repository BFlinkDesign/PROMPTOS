export function parsePromptStructure(body) {
  const source = String(body || '').replace(/\r\n/g, '\n');
  const headings = [];
  const sections = new Map();
  let current = '';
  for (const line of source.split('\n')) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      current = normalizeHeading(heading[2]);
      headings.push({ depth: heading[1].length, title: stripMarkdown(heading[2]), key: current });
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  return {
    source,
    headings,
    sections: Object.fromEntries([...sections].map(([key, lines]) => [key, lines.join('\n').trim()])),
  };
}

export function extractTitle(body) {
  return parsePromptStructure(body).headings.find((heading) => heading.depth === 1)?.title || '';
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
  const structure = parsePromptStructure(source);
  const sectionKeys = new Set(Object.keys(structure.sections));
  const inputs = extractInputs(source);
  const factors = {
    title: structure.headings.some((heading) => heading.depth === 1) ? 15 : 0,
    bodyLength: source.trim().length >= 250 ? 15 : source.trim().length >= 120 ? 8 : 0,
    inputs: inputs.length ? 15 : 0,
    verification: hasSection(sectionKeys, ['verification', 'evidence', 'gates', 'acceptance gates'])
      || /\b(verify|gate|evidence|cite|citation|hash|recompute|source)\b/.test(text) ? 20 : 0,
    outputContract: hasSection(sectionKeys, ['required output', 'output', 'expected outputs', 'deliverables'])
      || /\b(produce|emit|return|deliver|ending|output|matrix|summary|plan)\b/.test(text) ? 20 : 0,
    boundaries: hasSection(sectionKeys, ['boundaries', 'failure handling', 'failure modes', 'rollback'])
      || /\b(never|do not|if .*missing|ambiguous|unknown|assumption|trust)\b/.test(text) ? 15 : 0,
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

export function generatePrompt({
  title = 'Generated prompt',
  objective = '',
  inputs = ['TASK'],
  constraints = '',
  verification = '',
  output = '',
} = {}) {
  const normalizedObjective = String(objective || '').trim();
  if (!normalizedObjective) {
    throw new Error('A prompt objective is required.');
  }

  const normalizedTitle = cleanHeading(title) || 'Generated prompt';
  const inputLabels = normalizeInputLabels(inputs);
  const constraintLines = toListItems(constraints);
  const verificationText = String(verification || '').trim()
    || 'Verify the result against the named source of truth, run every declared gate, and record the observed evidence.';
  const outputText = String(output || '').trim()
    || 'Return exactly: Action, Evidence, Authority, Blockers, Next checkpoint, and Fallback.';

  return [
    `# ${normalizedTitle}`,
    '',
    '## Objective',
    normalizedObjective,
    '',
    '## Inputs',
    ...inputLabels.map((label) => `- [${label}]: Supply this value before execution.`),
    '',
    '## Operating rules',
    ...(constraintLines.length ? constraintLines : ['- Follow the governing repository contract and current source-of-truth evidence.']),
    '- Do not invent missing evidence, credentials, runtime behavior, or completion claims.',
    '- If a required input is missing or ambiguous, identify the blocker and state how to obtain it.',
    '',
    '## Verification',
    verificationText,
    '',
    '## Required output',
    outputText,
    '',
    '## Failure handling',
    'If a gate fails, preserve the evidence, stop consequential action, and return the smallest recovery or rollback path.',
  ].join('\n');
}

export function improvePrompt(sourceText = '') {
  const source = String(sourceText ?? '').replace(/\r\n/g, '\n');
  const originalScore = scorePrompt(source);
  const additions = [];
  const changes = [];
  let prefix = '';

  if (originalScore.factors.title === 0) {
    prefix = `# ${deriveTitle(source)}\n\n`;
    changes.push({ factor: 'title', action: 'Added an H1 title derived from the source.' });
  }
  if (originalScore.factors.inputs === 0) {
    additions.push('## Inputs\n- [TASK]: Provide the task or requested outcome before execution.');
    changes.push({ factor: 'inputs', action: 'Added an explicit fill-in input contract.' });
  }
  if (originalScore.factors.verification === 0) {
    additions.push('## Verification\nVerify the result against the governing source of truth, run every declared gate, and record the observed evidence.');
    changes.push({ factor: 'verification', action: 'Added evidence and gate requirements.' });
  }
  if (originalScore.factors.outputContract === 0) {
    additions.push('## Required output\nReturn exactly: Action, Evidence, Authority, Blockers, Next checkpoint, and Fallback.');
    changes.push({ factor: 'outputContract', action: 'Added an explicit output contract.' });
  }
  if (originalScore.factors.boundaries === 0) {
    additions.push('## Boundaries\nDo not invent missing facts, credentials, test results, or runtime behavior. If required evidence is missing or ambiguous, identify the blocker and state how to obtain it.');
    changes.push({ factor: 'boundaries', action: 'Added missing-input and prohibited-behavior boundaries.' });
  }

  let candidateText = prefix + source;
  for (const addition of additions) {
    const separator = !candidateText ? '' : candidateText.endsWith('\n\n') ? '' : candidateText.endsWith('\n') ? '\n' : '\n\n';
    candidateText += `${separator}${addition}`;
  }
  const candidateScore = scorePrompt(candidateText);
  const unresolved = buildFactorEvidence(candidateScore.factors)
    .filter((item) => item.points < item.maximum)
    .map((item) => blockerForFactor(item.factor));

  return {
    sourceText: source,
    candidateText,
    originalScore,
    candidateScore,
    changes,
    unresolved,
    limitation: 'Structural repair does not establish correctness, safety, cost, latency, or real-world effectiveness.',
  };
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

function cleanHeading(value) {
  return stripMarkdown(String(value || '').replace(/^#+\s*/, '')).replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
}

function normalizeHeading(value) {
  return stripMarkdown(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasSection(sectionKeys, accepted) {
  return accepted.some((key) => sectionKeys.has(key));
}

function deriveTitle(source) {
  const firstLine = String(source || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '';
  return cleanHeading(firstLine).replace(/[.!?:;]+$/, '') || 'Improved prompt';
}

function normalizeInputLabels(inputs) {
  const values = Array.isArray(inputs) ? inputs : String(inputs || '').split(/[,\n]/);
  const labels = [...new Set(values
    .map((value) => String(value || '').replace(/^\[|\]$/g, '').trim().toUpperCase())
    .map((value) => value.replace(/[^A-Z0-9 /&._-]/g, '').slice(0, 80))
    .filter(Boolean))];
  return labels.length ? labels : ['TASK'];
}

function toListItems(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s+/, ''))
    .filter(Boolean)
    .map((line) => `- ${line}`);
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
