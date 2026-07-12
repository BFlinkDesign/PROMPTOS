import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  extractInputs,
  extractRules,
  extractSummary,
  extractTitle,
  maturityForScore,
  scorePrompt,
} from './scoring-core.mjs';

const MAX_PROMPT_SOURCE_BYTES = 1024 * 1024;
const TYPED_ARTIFACT_FOLDERS = ['workflows', 'playbooks', 'runbooks'];

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
    const { absolutePath, markdownPath } = resolvePromptSourcePath(rootDir, row.markdownPath);
    const exists = fs.existsSync(absolutePath);
    if (exists && fs.statSync(absolutePath).size > MAX_PROMPT_SOURCE_BYTES) {
      throw new Error(`prompt source exceeds ${MAX_PROMPT_SOURCE_BYTES} bytes: ${markdownPath}`);
    }
    const body = exists ? normalizeNewlines(readText(absolutePath)) : '';
    const title = extractTitle(body) || row.catalogTitle;
    return {
      ...row,
      filePath: markdownPath.replaceAll('/', path.sep),
      markdownPath,
      absolutePath,
      exists,
      body,
      title,
      summary: extractSummary(body),
      inputs: extractInputs(body),
      rules: extractRules(body),
      score: scorePrompt(body),
      id: promptId(markdownPath),
      artifactType: 'prompt',
      expectedOutputFormat: row.catalogTitle,
      domain: 'Core Prompt Blocks',
      tags: tagsFor({ ...row, markdownPath }),
      maturity: maturityForScore(scorePrompt(body).total),
      createdAt: 'legacy-unknown',
      updatedAt: 'legacy-unknown',
      stage: stageForPrompt(row.number),
      compatibility: ['universal'],
      enforcement: 'guidance',
    };
  });
}

export function loadTypedArtifactEntries(rootDir = process.cwd()) {
  return TYPED_ARTIFACT_FOLDERS.flatMap((folder) => {
    const folderPath = path.join(rootDir, folder);
    if (!fs.existsSync(folderPath)) return [];
    return fs.readdirSync(folderPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => {
        const markdownPath = `${folder}/${entry.name}`;
        const absolutePath = path.join(folderPath, entry.name);
        if (fs.statSync(absolutePath).size > MAX_PROMPT_SOURCE_BYTES) {
          throw new Error(`artifact source exceeds ${MAX_PROMPT_SOURCE_BYTES} bytes: ${markdownPath}`);
        }
        const source = normalizeNewlines(readText(absolutePath));
        const { metadata, content } = parseArtifactFrontmatter(source, markdownPath);
        const artifactType = folder.slice(0, -1);
        if (metadata.type !== artifactType) {
          throw new Error(`${markdownPath}: front matter type must be ${artifactType}`);
        }
        const score = scorePrompt(content);
        return {
          number: null,
          catalogTitle: metadata.title,
          filePath: markdownPath.replaceAll('/', path.sep),
          markdownPath,
          absolutePath,
          exists: true,
          body: content,
          title: metadata.title,
          summary: metadata.summary,
          inputs: extractInputs(content),
          rules: extractRules(content),
          score,
          id: metadata.id,
          artifactType,
          expectedOutputFormat: metadata.expected_output_format || `Follow the ${artifactType} required-output section.`,
          domain: metadata.domain,
          tags: uniqueStrings(metadata.tags),
          maturity: metadata.maturity,
          createdAt: metadata.created_at,
          updatedAt: metadata.updated_at,
          stage: metadata.stage,
          compatibility: uniqueStrings(metadata.compatibility),
          enforcement: metadata.enforcement,
        };
      });
  });
}

export function loadArtifactEntries(rootDir = process.cwd()) {
  return [...loadPromptEntries(rootDir), ...loadTypedArtifactEntries(rootDir)];
}

export function resolvePromptSourcePath(rootDir, sourcePath) {
  const markdownPath = String(sourcePath || '').replaceAll('\\', '/');
  const normalized = path.posix.normalize(markdownPath);
  if (
    markdownPath !== normalized
    || !/^prompts\/[a-z0-9._-]+\.md$/i.test(markdownPath)
    || path.posix.isAbsolute(markdownPath)
  ) {
    throw new Error(`catalog prompt path must match prompts/*.md: ${JSON.stringify(sourcePath)}`);
  }

  const promptRoot = path.resolve(rootDir, 'prompts');
  const absolutePath = path.resolve(rootDir, ...markdownPath.split('/'));
  if (!absolutePath.startsWith(`${promptRoot}${path.sep}`)) {
    throw new Error(`catalog prompt path escapes prompts/: ${JSON.stringify(sourcePath)}`);
  }
  return { absolutePath, markdownPath };
}

export function buildConsoleData(rootDir = process.cwd()) {
  const entries = loadArtifactEntries(rootDir);
  const ecosystem = loadEcosystemRegistry(rootDir);
  const ids = entries.map((entry) => entry.id);
  const items = entries.map((entry, index) => ({
    id: ids[index],
    type: entry.artifactType,
    source_path: entry.markdownPath,
    title: entry.title,
    summary: entry.summary,
    input_requirements: entry.inputs,
    expected_output_format: entry.expectedOutputFormat,
    rules: entry.rules,
    domain: entry.domain,
    tags: entry.tags,
    maturity: entry.maturity,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    stage: entry.stage,
    compatibility: entry.compatibility,
    enforcement: entry.enforcement,
    score: entry.score.total,
    related: relatedIds(ids, index),
  }));
  const prompts = items.map((item, index) => ({
    id: item.id,
    volume: 'core',
    type: item.type,
    domain: item.domain,
    num: entries[index].number,
    title: item.title,
    summary: item.summary,
    replaces: '',
    when_to_use: item.expected_output_format,
    inputs: item.input_requirements,
    rules: item.rules,
    enforceable: item.maturity !== 'draft',
    maturity: item.maturity,
    stage: item.stage,
    compatibility: item.compatibility,
    enforcement: item.enforcement,
    tags: item.tags,
    related: relatedIds(ids, index),
    source_path: item.source_path,
    source_text: entries[index].body,
  }));
  const actionRequiredStatuses = new Set([
    'candidate-source',
    'adapter-prototype',
    'retirement-candidate',
    'duplicate-checkout',
  ]);
  const sourceMaterial = [
    ...['PROMPTS.md', 'WORKFLOWS.md', 'PLAYBOOKS.md', 'RUNBOOKS.md'].map((file) => readOptionalText(path.join(rootDir, file))),
    ...entries.map((entry) => `${entry.markdownPath}\n${entry.body}`),
    readOptionalText(path.join(rootDir, 'tools', 'scoring-core.mjs')),
    JSON.stringify(ecosystem),
  ].join('\n---promptos-source---\n');
  const sourceFingerprint = crypto.createHash('sha256').update(sourceMaterial, 'utf8').digest('hex');
  const assets = Array.isArray(ecosystem.assets) ? ecosystem.assets : [];
  const catalogMeta = {
    canonical_source: 'PROMPTS.md + prompts/*.md + typed artifact front matter',
    reviewed_artifact_count: items.length,
    source_registry_count: assets.length,
    action_required_count: assets.filter((asset) => actionRequiredStatuses.has(asset.status)).length,
    source_fingerprint: `sha256:${sourceFingerprint}`,
    verification_gate: 'npm run verify',
  };
  return {
    version: 3,
    count: items.length,
    catalog_meta: catalogMeta,
    ecosystem,
    items,
    prompts,
  };
}

function loadEcosystemRegistry(rootDir) {
  const registryPath = path.join(rootDir, 'ecosystem', 'registry.json');
  if (!fs.existsSync(registryPath)) {
    return { version: 1, canonical_product_id: 'promptos', assets: [] };
  }
  return JSON.parse(readText(registryPath));
}

function readOptionalText(filePath) {
  return fs.existsSync(filePath) ? normalizeNewlines(readText(filePath)) : '';
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
  const serialized = serializeForInlineScript(data);
  return `${html.slice(0, jsonStart)}${serialized}${html.slice(jsonEnd)}`;
}

export function buildScoringRuntime(rootDir = process.cwd()) {
  const source = readText(path.join(rootDir, 'tools', 'scoring-core.mjs'));
  const browserSource = source.replace(/^export\s+/gm, '');
  return `${browserSource.trim()}

globalThis.PromptOSScoring = Object.freeze({
  parsePromptStructure,
  extractTitle,
  extractSummary,
  extractInputs,
  extractRules,
  scorePrompt,
  maturityForScore,
  verdictForScore,
  generatePrompt,
  improvePrompt,
  buildEvaluationReceipt,
  normalizeText,
});`;
}

export function extractConsoleScoring(html) {
  const startMarker = '/* __PROMPTOS_SCORING_START__ */';
  const endMarker = '/* __PROMPTOS_SCORING_END__ */';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('console scoring markers not found');
  }
  return html.slice(start + startMarker.length, end).trim();
}

export function replaceConsoleScoring(html, runtime) {
  const startMarker = '/* __PROMPTOS_SCORING_START__ */';
  const endMarker = '/* __PROMPTOS_SCORING_END__ */';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('console scoring markers not found');
  }
  return `${html.slice(0, start + startMarker.length)}
${runtime}
${html.slice(end)}`;
}

export function evaluateCatalog(rootDir = process.cwd()) {
  const entries = loadArtifactEntries(rootDir);
  const generated = buildConsoleData(rootDir);
  const errors = [];
  const warnings = [];

  if (!entries.length) {
    errors.push('catalog has no artifact entries');
  }

  const seenPaths = new Set();
  const seenNumbers = new Set();
  const seenIds = new Set();
  for (const entry of entries) {
    if (entry.number !== null && seenNumbers.has(entry.number)) {
      errors.push(`duplicate catalog number ${entry.number}`);
    }
    if (entry.number !== null) seenNumbers.add(entry.number);
    if (seenIds.has(entry.id)) errors.push(`duplicate catalog id ${entry.id}`);
    seenIds.add(entry.id);
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
      warnings.push(`low structure lint ${entry.score.total}/100 for ${entry.markdownPath}`);
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
      try {
        const embeddedScoring = extractConsoleScoring(html);
        const generatedScoring = buildScoringRuntime(rootDir);
        if (normalizeNewlines(embeddedScoring) !== normalizeNewlines(generatedScoring)) {
          errors.push('console scoring runtime is stale; run npm run catalog:build');
        }
      } catch (error) {
        errors.push(`console scoring runtime parse failed: ${error.message}`);
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
      type: entry.artifactType,
      filePath: entry.markdownPath,
      title: entry.title,
      score: entry.score,
      inputs: entry.inputs.length,
    })),
  };
}

function parseArtifactFrontmatter(source, markdownPath) {
  const lines = String(source || '').split('\n');
  if (lines[0] !== '---') throw new Error(`${markdownPath}: YAML front matter is required`);
  const end = lines.indexOf('---', 1);
  if (end === -1) throw new Error(`${markdownPath}: YAML front matter is not terminated`);
  const metadata = parseYaml(lines.slice(1, end).join('\n')) || {};
  const required = ['id', 'type', 'title', 'summary', 'created_at', 'updated_at', 'maturity', 'domain', 'tags', 'stage', 'compatibility', 'enforcement'];
  for (const field of required) {
    if (metadata[field] === undefined || metadata[field] === null || metadata[field] === '') {
      throw new Error(`${markdownPath}: missing front matter field ${field}`);
    }
  }
  return { metadata, content: lines.slice(end + 1).join('\n').trim() };
}

function uniqueStrings(value) {
  if (!Array.isArray(value) || !value.length) throw new Error('metadata list must contain at least one value');
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function stageForPrompt(number) {
  if (number <= 2) return 'align';
  if (number <= 7) return 'plan';
  if (number <= 10) return 'build';
  if (number <= 14) return 'verify';
  return 'learn';
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

function normalizeNewlines(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function serializeForInlineScript(value) {
  return JSON.stringify(value, null, 2)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
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
