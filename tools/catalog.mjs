import fs from 'node:fs';
import path from 'node:path';

export function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function parsePromptCatalog(rootDir = process.cwd()) {
  const catalogPath = path.join(rootDir, 'PROMPTS.md');
  const markdown = readText(catalogPath);
  const rows = [];
  const rowPattern = /^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*\[[^\]]+\]\(([^)]+)\)\s*\|/gm;
  let match;
  while ((match = rowPattern.exec(markdown)) !== null) {
    const [, rawNumber, rawTitle, filePath] = match;
    rows.push({
      number: Number(rawNumber),
      catalogTitle: stripMarkdown(rawTitle),
      filePath: filePath.replaceAll('/', path.sep),
      markdownPath: filePath,
    });
  }
  return rows;
}

export function loadPromptEntries(rootDir = process.cwd()) {
  return parsePromptCatalog(rootDir).map((row) => {
    const absolutePath = path.join(rootDir, row.filePath);
    const exists = fs.existsSync(absolutePath);
    const body = exists ? readText(absolutePath) : '';
    const title = extractTitle(body) || row.catalogTitle;
    return {
      ...row,
      absolutePath,
      exists,
      body,
      title,
      summary: extractSummary(body),
      inputs: extractInputs(body),
      rules: extractRules(body),
      score: scorePrompt(body),
    };
  });
}

export function buildConsoleData(rootDir = process.cwd()) {
  const entries = loadPromptEntries(rootDir);
  const ids = entries.map((entry) => promptId(entry.markdownPath));
  const prompts = entries.map((entry, index) => ({
    id: ids[index],
    volume: 'core',
    domain: 'Core Prompt Blocks',
    num: entry.number,
    title: entry.title,
    summary: entry.summary,
    replaces: '',
    when_to_use: entry.catalogTitle,
    inputs: entry.inputs,
    rules: entry.rules,
    enforceable: entry.score.total >= 60,
    tags: tagsFor(entry),
    related: relatedIds(ids, index),
  }));
  return { version: 2, count: prompts.length, prompts };
}

export function extractConsoleData(html) {
  const marker = 'const DATA = ';
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error('console DATA marker not found');
  }
  const jsonStart = start + marker.length;
  const jsonEnd = findJsonEnd(html, jsonStart);
  return JSON.parse(html.slice(jsonStart, jsonEnd));
}

export function replaceConsoleData(html, data) {
  const marker = 'const DATA = ';
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error('console DATA marker not found');
  }
  const jsonStart = start + marker.length;
  const jsonEnd = findJsonEnd(html, jsonStart);
  const serialized = JSON.stringify(data, null, 2);
  return `${html.slice(0, jsonStart)}${serialized}${html.slice(jsonEnd)}`;
}

export function evaluateCatalog(rootDir = process.cwd()) {
  const entries = loadPromptEntries(rootDir);
  const generated = buildConsoleData(rootDir);
  const errors = [];
  const warnings = [];

  if (!entries.length) {
    errors.push('PROMPTS.md has no catalog rows');
  }

  const seenPaths = new Set();
  const seenNumbers = new Set();
  for (const entry of entries) {
    if (seenNumbers.has(entry.number)) {
      errors.push(`duplicate catalog number ${entry.number}`);
    }
    seenNumbers.add(entry.number);
    if (seenPaths.has(entry.markdownPath)) {
      errors.push(`duplicate catalog file ${entry.markdownPath}`);
    }
    seenPaths.add(entry.markdownPath);
    if (!entry.exists) {
      errors.push(`missing prompt file ${entry.markdownPath}`);
      continue;
    }
    if (!entry.title) {
      errors.push(`missing H1 title in ${entry.markdownPath}`);
    }
    if (entry.body.trim().length < 80) {
      errors.push(`prompt body is too short in ${entry.markdownPath}`);
    }
    if (entry.score.total < 50) {
      warnings.push(`low structure score ${entry.score.total}/100 for ${entry.markdownPath}`);
    }
  }

  const consolePath = path.join(rootDir, 'console', 'promptos-console.html');
  if (!fs.existsSync(consolePath)) {
    errors.push('missing console/promptos-console.html');
  } else {
    try {
      const html = readText(consolePath);
      const embedded = extractConsoleData(html);
      const embeddedIds = JSON.stringify((embedded.prompts || []).map((p) => p.id));
      const generatedIds = JSON.stringify(generated.prompts.map((p) => p.id));
      if (embedded.count !== generated.count) {
        errors.push(`console count is stale: embedded ${embedded.count}, generated ${generated.count}`);
      }
      if (embeddedIds !== generatedIds) {
        errors.push('console prompt ids do not match PROMPTS.md; run npm run catalog:build');
      }
      if (JSON.stringify(embedded) !== JSON.stringify(generated)) {
        errors.push('console DATA is not generated from PROMPTS.md; run npm run catalog:build');
      }
    } catch (error) {
      errors.push(`console DATA parse failed: ${error.message}`);
    }
  }

  const averageScore = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + entry.score.total, 0) / entries.length)
    : 0;

  return {
    errors,
    warnings,
    averageScore,
    entries: entries.map((entry) => ({
      number: entry.number,
      filePath: entry.markdownPath,
      title: entry.title,
      score: entry.score,
      inputs: entry.inputs.length,
    })),
  };
}

function findJsonEnd(source, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === '{' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) {
        return i + 1;
      }
    }
  }
  throw new Error('console DATA JSON did not terminate');
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

function extractTitle(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? stripMarkdown(match[1]) : '';
}

function extractSummary(body) {
  const withoutTitle = body.replace(/^#\s+.+$/m, '').trim();
  const quoteLines = withoutTitle
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('>'))
    .map((line) => line.replace(/^>\s?/, '').trim())
    .filter(Boolean);
  const source = quoteLines.length ? quoteLines.join(' ') : withoutTitle;
  return normalizeText(source).slice(0, 260);
}

function extractInputs(body) {
  const labels = new Set();
  const pattern = /\[([A-Z][A-Z0-9 /&._-]{1,80})\]/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
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

function extractRules(body) {
  const quoteLines = body
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('>'))
    .map((line) => line.replace(/^>\s?/, '').trim())
    .filter(Boolean);
  return quoteLines.length ? quoteLines.join('\n') : normalizeText(body.replace(/^#\s+.+$/m, ''));
}

function scorePrompt(body) {
  const text = body.toLowerCase();
  const inputs = extractInputs(body);
  const factors = {
    title: /^#\s+.+$/m.test(body) ? 15 : 0,
    bodyLength: body.trim().length >= 250 ? 15 : body.trim().length >= 120 ? 8 : 0,
    inputs: inputs.length ? 15 : 0,
    verification: /\b(verify|gate|evidence|cite|citation|hash|recompute|source)\b/.test(text) ? 20 : 0,
    outputContract: /\b(produce|emit|return|deliver|ending|output|matrix|summary|plan)\b/.test(text) ? 20 : 0,
    boundaries: /\b(never|do not|if .*missing|ambiguous|unknown|assumption|trust)\b/.test(text) ? 15 : 0,
  };
  const total = Object.values(factors).reduce((sum, value) => sum + value, 0);
  return { total, factors };
}

function promptId(markdownPath) {
  return `core.${path.basename(markdownPath, path.extname(markdownPath))}`;
}

function tagsFor(entry) {
  const words = `${entry.catalogTitle} ${entry.markdownPath}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  return [...new Set(words)].slice(0, 8);
}

function relatedIds(ids, index) {
  return ids.filter((_, i) => i !== index).slice(0, 4);
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
