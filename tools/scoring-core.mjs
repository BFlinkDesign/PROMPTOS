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
  if (score >= 85) return 'hardened';
  if (score >= 60) return 'usable';
  return 'draft';
}

export function verdictForScore(score) {
  if (score >= 85) return 'ready';
  if (score >= 60) return 'needs-review';
  return 'revise';
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
