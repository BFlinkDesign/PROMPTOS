const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');
const { expected_catalog_count: expectedCatalogCount } = require('./prompt-quality-contracts.json');

const consoleUrl = pathToFileURL(path.join(process.cwd(), 'console', 'promptos-console.html')).href;

test('rejects catalog links that escape prompts/', async () => {
  const { loadPromptEntries } = await import('../tools/catalog.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'promptos-path-boundary-'));
  try {
    fs.mkdirSync(path.join(root, 'prompts'));
    fs.writeFileSync(path.join(root, 'outside.md'), '# Private\n\nDo not embed this file.');
    fs.writeFileSync(path.join(root, 'PROMPTS.md'), '| 1 | Hostile | [open](../outside.md) |\n');
    expect(() => loadPromptEntries(root)).toThrow(/must match prompts\/\*\.md|escapes prompts/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('rejects prompt sources larger than the catalog embedding limit', async () => {
  const { loadPromptEntries } = await import('../tools/catalog.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'promptos-size-boundary-'));
  try {
    fs.mkdirSync(path.join(root, 'prompts'));
    fs.writeFileSync(path.join(root, 'prompts', 'oversized.md'), `# Oversized\n\n${'x'.repeat((1024 * 1024) + 1)}`);
    fs.writeFileSync(path.join(root, 'PROMPTS.md'), '| 1 | Oversized | [open](prompts/oversized.md) |\n');
    expect(() => loadPromptEntries(root)).toThrow(/exceeds 1048576 bytes/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('normalizes prompt source newlines before embedding catalog data', async () => {
  const { buildConsoleData } = await import('../tools/catalog.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'promptos-newline-boundary-'));
  try {
    fs.mkdirSync(path.join(root, 'prompts'));
    fs.writeFileSync(path.join(root, 'prompts', 'windows.md'), '# Windows\r\n\r\nRun [TASK] and verify the source.\r\n');
    fs.writeFileSync(path.join(root, 'PROMPTS.md'), '| 1 | Windows | [open](prompts/windows.md) |\n');
    const data = buildConsoleData(root);
    expect(data.prompts[0].source_text).toBe('# Windows\n\nRun [TASK] and verify the source.\n');
    expect(data.prompts[0].source_text).not.toContain('\r');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fingerprints the exact embedded source set deterministically', async () => {
  const { buildConsoleData } = await import('../tools/catalog.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'promptos-fingerprint-'));
  try {
    fs.mkdirSync(path.join(root, 'prompts'));
    fs.writeFileSync(path.join(root, 'prompts', 'sample.md'), '# Sample\n\nRun [TASK] and verify the source.\n');
    fs.writeFileSync(path.join(root, 'PROMPTS.md'), '| 1 | Sample | [open](prompts/sample.md) |\n');
    const first = buildConsoleData(root);
    const second = buildConsoleData(root);
    expect(first.catalog_meta.source_fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.catalog_meta.source_fingerprint).toBe(first.catalog_meta.source_fingerprint);
    fs.appendFileSync(path.join(root, 'prompts', 'sample.md'), '\nProduce an auditable output.\n');
    expect(buildConsoleData(root).catalog_meta.source_fingerprint).not.toBe(first.catalog_meta.source_fingerprint);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('escapes prompt data before embedding it in the console script', async () => {
  const { extractConsoleData, replaceConsoleData } = await import('../tools/catalog.mjs');
  const shell = '<script>const DATA = {"count":0,"items":[],"prompts":[]};</script>';
  const hostile = '</script><script>globalThis.__promptOsInjected=true</script>\u2028&';
  const data = { count: 1, items: [], prompts: [{ id: 'hostile', source_text: hostile }] };

  const embedded = replaceConsoleData(shell, data);

  expect(embedded).not.toContain(hostile);
  expect(embedded).not.toContain('</script><script>globalThis.__promptOsInjected');
  expect(embedded).toContain('\\u003c/script\\u003e');
  expect(extractConsoleData(embedded)).toEqual(data);
});

test('renders the tracked PromptOS catalog', async ({ page }) => {
  await page.goto(consoleUrl);

  await expect(page).toHaveTitle('PromptOS Console');
  await expect(page.locator('.card')).toHaveCount(expectedCatalogCount);
  const minimumStartupOpacity = await page.locator('.card').evaluateAll((cards) =>
    Math.min(...cards.map((card) => Number(getComputedStyle(card).opacity))),
  );
  expect(minimumStartupOpacity).toBeGreaterThanOrEqual(0.7);
  await expect(page.locator('.skel')).toHaveCount(0);
  await expect(page.locator('#sourceBar')).toContainText(`${expectedCatalogCount} reviewed artifacts`);
  await expect(page.locator('#sourceBar')).toContainText(/source [a-f0-9]{12}/);
  await expect(page.getByText('Scope pipeline')).toBeVisible();
  await expect(page.getByText('Decision matrix')).toBeVisible();
});

test('shows canonical, pending, and retired ecosystem sources', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Sources' }).click();

  await expect(page.locator('#sourcesPanel')).toBeVisible();
  await expect(page.locator('#sourceGrid .source-row')).toHaveCount(12);
  await expect(page.locator('#sourceGrid')).toContainText('promptos');
  await expect(page.locator('#sourceGrid')).toContainText('operatoros-agentic-playbook-v1');
  await expect(page.locator('#sourceGrid')).toContainText('promptos-desktop-snapshot');
  await expect(page.locator('#sourceSummary')).toContainText('6 action required');
});

test('filters prompts and opens a drawer without network access', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto(consoleUrl);
  await page.locator('#q').fill('decision matrix');

  await expect(page.locator('.card')).toHaveCount(1);
  await page.locator('.card').first().click();

  await expect(page.locator('#drawer')).toHaveClass(/on/);
  await expect(page.locator('#drawer h2')).toContainText('Decision matrix');
  expect(requests.every((url) => url.startsWith('file:///'))).toBe(true);
});

test('evaluates pasted markdown with the shared scoring runtime', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();

  await expect(page.locator('#evalPanel')).toBeVisible();
  await page.locator('#evalText').fill(`# Evaluation sample

Run [TASK] against [SOURCE PATH].

Verify the evidence, cite the source, produce a short matrix, and never invent missing facts.`);
  await page.locator('#evalRun').click();

  await expect(page.locator('#evalResult')).toContainText('/100');
  await expect(page.locator('#evalResult')).toContainText('structure');
  await expect(page.locator('#evalResult')).toContainText('effectiveness not evaluated');
  await expect(page.locator('#evalResult')).not.toContainText(/\bready\b/i);
  await expect(page.locator('#evalResult')).toContainText('Fill-in inputs');
  await expect(page.locator('#evalResult')).toContainText('Verification terms');
  await expect(page.locator('#evalResult')).toContainText('Output contract');
});

test('evaluates edits reactively without moving focus from the input', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  const input = page.locator('#evalText');
  await input.fill(`# Live evaluation\n\nRun [TASK] against [SOURCE]. Verify evidence, produce an auditable report, and never invent missing facts.`);

  await expect(page.locator('#evalResult')).toContainText('/100');
  await expect(input).toBeFocused();
  await expect(page.getByRole('button', { name: 'Save receipt' })).toBeEnabled();
});

test('loads a prompt file into the evaluator', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();

  await page.locator('#evalFile').setInputFiles(path.join(process.cwd(), 'prompts', 'scope-pipeline.md'));

  await expect(page.locator('#evalText')).toHaveValue(/Scope pipeline/);
  await expect(page.locator('#evalResult')).toContainText('scope-pipeline.md');
  await expect(page.locator('#evalResult')).toContainText('/100');
});

test('reports complete item-schema gaps for a dropped items catalog', async ({ page }) => {
  const payload = {
    version: 2,
    count: 2,
    unexpected: true,
    items: [{
      id: 'BAD ID',
      type: 'prompt',
      source_path: '',
      title: 'Invalid catalog item',
      summary: '',
      input_requirements: [],
      expected_output_format: '',
      rules: 'Verify [INPUT] and produce output without assumptions.',
      domain: 'Tests',
      tags: ['duplicate', 'duplicate'],
      maturity: 'hardened',
      created_at: 'yesterday',
      updated_at: 'legacy-unknown',
      score: 101,
      related: [],
    }],
  };
  await page.goto(consoleUrl);
  await expect(page.locator('.card')).toHaveCount(expectedCatalogCount);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.locator('#evalText').fill(JSON.stringify(payload));
  await page.getByRole('button', { name: 'Evaluate' }).click();

  await expect(page.locator('#evalResult')).toContainText('version must be an integer >= 3');
  await expect(page.locator('#evalResult')).toContainText('count must equal items length (1)');
  await expect(page.locator('#evalResult')).toContainText('unexpected top-level property unexpected');
  await expect(page.locator('#evalResult')).toContainText('id, source_path, tags, created_at, score');
});

test('fails closed when Web Crypto SHA-256 is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: {} });
  });
  await page.goto(consoleUrl);
  await expect(page.locator('.card')).toHaveCount(expectedCatalogCount);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.locator('#evalText').fill('# Crypto gate\n\nRun [TASK], verify evidence, produce output, and never invent facts.');
  await page.getByRole('button', { name: 'Evaluate' }).click();

  await expect(page.locator('#evalResult')).toContainText('SHA-256 receipt generation is unavailable');
  await expect(page.getByRole('button', { name: 'Save receipt' })).toBeDisabled();
  expect(await page.evaluate(() => globalThis.__APP._receipt())).toBeNull();
});

test('evaluates a catalog prompt into an exact provenance receipt and returns to it', async ({ page }) => {
  const evaluatedAt = '2026-07-11T15:30:00.000Z';
  const sourcePath = 'prompts/decision-matrix.md';
  const source = fs.readFileSync(path.join(process.cwd(), sourcePath), 'utf8').replace(/\r\n/g, '\n');
  const sourceHash = `sha256:${crypto.createHash('sha256').update(source, 'utf8').digest('hex')}`;
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.addInitScript((now) => {
    const NativeDate = Date;
    class FixedDate extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [now]));
      }

      static now() {
        return new NativeDate(now).getTime();
      }
    }
    globalThis.Date = FixedDate;
  }, evaluatedAt);

  await page.goto(consoleUrl);
  await page.locator('#q').fill('decision matrix');
  await expect(page.locator('.card')).toHaveCount(1);
  await page.locator('.card').click();
  await page.getByRole('button', { name: 'Evaluate this prompt' }).click();

  await expect(page.locator('#evalPanel')).toBeVisible();
  await expect(page.locator('#evalText')).toHaveValue(source.replace(/\r\n/g, '\n'));
  await expect(page.locator('#evalContext')).toContainText('core.decision-matrix');
  await expect(page.locator('#evalContext')).toContainText(sourcePath);
  await expect(page.locator('#evalResult')).toBeFocused();

  const receipt = await page.evaluate(() => globalThis.__APP._receipt());
  expect(receipt).toEqual({
    schema_version: '1.0',
    artifact_type: 'prompt_evaluation_receipt',
    source_path: sourcePath,
    source_hash: sourceHash,
    evaluated_at: evaluatedAt,
    evaluation_scope: 'structural-lint',
    effectiveness: 'not-evaluated',
    release_authority: false,
    score: 100,
    verdict: 'structural-complete',
    factors: {
      title: 15,
      bodyLength: 15,
      inputs: 15,
      verification: 20,
      outputContract: 20,
      boundaries: 15,
    },
    action: 'Run this prompt against a versioned behavioral dataset before relying on it or releasing it.',
    evidence: [
      { factor: 'title', points: 15, maximum: 15, finding: 'H1 title present.' },
      { factor: 'bodyLength', points: 15, maximum: 15, finding: 'Prompt body has at least 250 characters after trimming outer whitespace.' },
      { factor: 'inputs', points: 15, maximum: 15, finding: 'At least one fill-in input is declared.' },
      { factor: 'verification', points: 20, maximum: 20, finding: 'Verification or evidence language is present.' },
      { factor: 'outputContract', points: 20, maximum: 20, finding: 'An output contract is present.' },
      { factor: 'boundaries', points: 15, maximum: 15, finding: 'Boundary or missing-input handling is present.' },
    ],
    authority: {
      runtime: 'tools/scoring-core.mjs',
      method: 'deterministic structural lint',
      limitation: 'Does not evaluate model output, correctness, safety, cost, latency, or real-world effectiveness.',
    },
    blockers: [],
    next_checkpoint: 'Run a versioned behavioral dataset with declared graders and compare the result with an accepted baseline.',
    fallback: 'If behavioral evaluation is unavailable, keep the artifact in draft and do not claim readiness.',
  });
  expect(JSON.stringify(receipt)).not.toMatch(/confidence|%/i);
  await expect(page.getByRole('button', { name: 'Save receipt' })).toBeEnabled();

  const editedSource = `${source.replace(/\r\n/g, '\n')}\n\nRe-evaluate this edited source.`;
  await page.locator('#evalText').fill(editedSource);
  const editedHash = `sha256:${crypto.createHash('sha256').update(editedSource, 'utf8').digest('hex')}`;
  await expect.poll(() => page.evaluate(() => globalThis.__APP._receipt()?.source_hash)).toBe(editedHash);
  await expect(page.getByRole('button', { name: 'Save receipt' })).toBeEnabled();

  await page.getByRole('button', { name: 'Back to prompt' }).click();
  await expect(page.locator('#drawer')).toHaveClass(/on/);
  await expect(page.locator('#drawer h2')).toContainText('Decision matrix');
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => url.startsWith('file:///'))).toBe(true);
});

test('discards an in-flight receipt when the evaluated source changes', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.evaluate(() => {
    const original = globalThis.PromptOSScoring;
    let release;
    globalThis.__staleEvaluationSettled = false;
    globalThis.__releaseEvaluation = () => release?.();
    globalThis.PromptOSScoring = Object.freeze({
      ...original,
      buildEvaluationReceipt: async (options) => {
        await new Promise((resolve) => {
          release = resolve;
        });
        const receipt = await original.buildEvaluationReceipt(options);
        globalThis.__staleEvaluationSettled = true;
        return receipt;
      },
    });
  });

  await page.locator('#evalText').fill('# First source\n\nRun [TASK], verify evidence, and produce a summary without inventing missing facts.');
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.getByRole('button', { name: 'Save receipt' })).toBeDisabled();
  await page.locator('#evalText').fill('# Replacement source\n\nRun [TASK], verify evidence, and produce a summary without inventing missing facts.');
  await page.evaluate(() => globalThis.__releaseEvaluation());

  await expect.poll(() => page.evaluate(() => globalThis.__staleEvaluationSettled)).toBe(true);
  expect(await page.evaluate(() => globalThis.__APP._receipt())).toBeNull();
  await expect(page.getByRole('button', { name: 'Save receipt' })).toBeDisabled();
});

test('opens a PromptOS directory and loads a chosen prompts markdown file', async ({ page }) => {
  const chosenSource = `# Folder prompt\n\nRun [TASK] against [SOURCE]. Verify evidence, produce a summary, and never invent missing facts.`;

  await page.addInitScript((source) => {
    const fileHandle = (name, text) => ({
      kind: 'file',
      name,
      getFile: async () => new File([text], name, { type: 'text/markdown' }),
    });
    const promptFiles = [
      ['alpha.md', fileHandle('alpha.md', '# Alpha\n\nShort draft.')],
      ['folder-prompt.md', fileHandle('folder-prompt.md', source)],
      ['notes.txt', fileHandle('notes.txt', 'not a prompt')],
    ];
    const promptsDirectory = {
      kind: 'directory',
      name: 'prompts',
      async *entries() {
        yield* promptFiles;
      },
    };
    globalThis.showDirectoryPicker = async () => ({
      kind: 'directory',
      name: 'PROMPTOS',
      getDirectoryHandle: async (name) => {
        if (name === 'prompts') return promptsDirectory;
        throw new DOMException('Not found', 'NotFoundError');
      },
    });
  }, chosenSource);

  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.getByRole('button', { name: 'Open PromptOS folder' }).click();

  const promptSelect = page.getByLabel('Prompt from connected folder');
  await expect(promptSelect).toBeVisible();
  await expect(promptSelect.locator('option')).toHaveCount(3);
  await expect(promptSelect).not.toContainText('notes.txt');
  await promptSelect.selectOption('prompts/folder-prompt.md');

  await expect(page.locator('#evalText')).toHaveValue(chosenSource);
  await expect(page.locator('#evalContext')).toContainText('prompts/folder-prompt.md');
  await expect(page.locator('#evalResult')).toContainText('/100');
});

test('writes a receipt to snapshots only after the explicit save click', async ({ page }) => {
  const source = `# Saved prompt\n\nRun [TASK] against [SOURCE]. Verify evidence, produce a summary, and never invent missing facts.`;

  await page.addInitScript((promptSource) => {
    globalThis.__fsWrites = [];
    globalThis.__pickerMode = null;
    globalThis.__permissions = [];
    const promptFile = {
      kind: 'file',
      name: 'saved-prompt.md',
      getFile: async () => new File([promptSource], 'saved-prompt.md', { type: 'text/markdown' }),
    };
    const promptsDirectory = {
      kind: 'directory',
      name: 'prompts',
      async *entries() {
        yield ['saved-prompt.md', promptFile];
      },
    };
    const snapshotsDirectory = {
      kind: 'directory',
      name: 'snapshots',
      getFileHandle: async (name, options) => {
        globalThis.__fsWrites.push({ operation: 'getFileHandle', path: `snapshots/${name}`, create: options?.create });
        return {
          kind: 'file',
          name,
          createWritable: async () => ({
            write: async (contents) => globalThis.__fsWrites.push({ operation: 'write', contents }),
            close: async () => globalThis.__fsWrites.push({ operation: 'close' }),
          }),
        };
      },
    };
    globalThis.showDirectoryPicker = async (options) => {
      globalThis.__pickerMode = options?.mode;
      return {
        kind: 'directory',
        name: 'PROMPTOS',
        queryPermission: async (descriptor) => {
          globalThis.__permissions.push({ operation: 'query', mode: descriptor?.mode });
          return 'prompt';
        },
        requestPermission: async (descriptor) => {
          globalThis.__permissions.push({ operation: 'request', mode: descriptor?.mode });
          return 'granted';
        },
        getDirectoryHandle: async (name, directoryOptions) => {
          if (name === 'prompts') return promptsDirectory;
          if (name === 'snapshots') {
            globalThis.__fsWrites.push({ operation: 'getDirectoryHandle', path: name, create: directoryOptions?.create });
            return snapshotsDirectory;
          }
          throw new DOMException('Not found', 'NotFoundError');
        },
      };
    };
  }, source);

  await page.goto(consoleUrl);
  await expect(page.locator('.card')).toHaveCount(expectedCatalogCount);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.getByRole('button', { name: 'Open PromptOS folder' }).click();
  await page.getByLabel('Prompt from connected folder').selectOption('prompts/saved-prompt.md');
  await expect(page.locator('#evalResult')).toContainText('/100');

  expect(await page.evaluate(() => globalThis.__fsWrites)).toEqual([]);
  expect(await page.evaluate(() => globalThis.__pickerMode)).toBe('read');
  expect(await page.evaluate(() => globalThis.__permissions)).toEqual([]);

  await page.getByRole('button', { name: 'Save receipt' }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__fsWrites.length)).toBe(4);
  expect(await page.evaluate(() => globalThis.__permissions)).toEqual([
    { operation: 'query', mode: 'readwrite' },
    { operation: 'request', mode: 'readwrite' },
  ]);

  const writes = await page.evaluate(() => globalThis.__fsWrites);
  expect(writes[0]).toEqual({ operation: 'getDirectoryHandle', path: 'snapshots', create: true });
  expect(writes[1]).toMatchObject({ operation: 'getFileHandle', create: true });
  expect(writes[1].path).toMatch(/^snapshots\/saved-prompt\.evaluation-[0-9TZ.-]+\.json$/);
  expect(writes[1].path).not.toMatch(/feedback|tests\/failures/);
  expect(JSON.parse(writes[2].contents)).toEqual(await page.evaluate(() => globalThis.__APP._receipt()));
  expect(writes[3]).toEqual({ operation: 'close' });
});

test('preserves the receipt and performs no write when directory permission is denied', async ({ page }) => {
  const source = `# Permission test\n\nRun [TASK] against [SOURCE]. Verify evidence, produce a summary, and never invent missing facts.`;

  await page.addInitScript((promptSource) => {
    globalThis.__snapshotAccessed = false;
    const promptFile = {
      kind: 'file',
      name: 'permission-test.md',
      getFile: async () => new File([promptSource], 'permission-test.md', { type: 'text/markdown' }),
    };
    const promptsDirectory = {
      kind: 'directory',
      name: 'prompts',
      async *entries() {
        yield ['permission-test.md', promptFile];
      },
    };
    globalThis.showDirectoryPicker = async () => ({
      kind: 'directory',
      name: 'PROMPTOS',
      queryPermission: async () => 'denied',
      requestPermission: async () => {
        throw new Error('requestPermission must not run after denial');
      },
      getDirectoryHandle: async (name) => {
        if (name === 'prompts') return promptsDirectory;
        globalThis.__snapshotAccessed = true;
        throw new Error('snapshot directory must not be accessed without permission');
      },
    });
  }, source);

  await page.goto(consoleUrl);
  await expect(page.locator('.card')).toHaveCount(expectedCatalogCount);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.getByRole('button', { name: 'Open PromptOS folder' }).click();
  await page.getByLabel('Prompt from connected folder').selectOption('prompts/permission-test.md');
  await expect(page.locator('#evalResult')).toContainText('/100');
  const receiptBeforeSave = await page.evaluate(() => globalThis.__APP._receipt());

  await page.getByRole('button', { name: 'Save receipt' }).click();

  await expect(page.locator('#toast')).toHaveText('Write permission is required to save into snapshots/');
  expect(await page.evaluate(() => globalThis.__snapshotAccessed)).toBe(false);
  expect(await page.evaluate(() => globalThis.__APP._receipt())).toEqual(receiptBeforeSave);
});

test('does not save a different receipt after an async permission prompt', async ({ page }) => {
  const source = '# Save race\n\nRun [TASK] against [SOURCE]. Verify evidence, produce output, and never invent facts.';
  await page.addInitScript((promptSource) => {
    globalThis.__snapshotAccessed = false;
    globalThis.__permissionPending = false;
    let resolvePermission;
    globalThis.__resolvePermission = (state) => resolvePermission?.(state);
    const promptFile = {
      kind: 'file',
      name: 'save-race.md',
      getFile: async () => new File([promptSource], 'save-race.md', { type: 'text/markdown' }),
    };
    const promptsDirectory = {
      kind: 'directory',
      name: 'prompts',
      async *entries() { yield ['save-race.md', promptFile]; },
    };
    globalThis.showDirectoryPicker = async () => ({
      kind: 'directory',
      name: 'PROMPTOS',
      queryPermission: async () => {
        globalThis.__permissionPending = true;
        return new Promise((resolve) => { resolvePermission = resolve; });
      },
      requestPermission: async () => 'granted',
      getDirectoryHandle: async (name) => {
        if (name === 'prompts') return promptsDirectory;
        globalThis.__snapshotAccessed = true;
        throw new Error('stale receipt must not reach snapshots/');
      },
    });
  }, source);

  await page.goto(consoleUrl);
  await expect(page.locator('.card')).toHaveCount(expectedCatalogCount);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.getByRole('button', { name: 'Open PromptOS folder' }).click();
  await page.getByLabel('Prompt from connected folder').selectOption('prompts/save-race.md');
  await expect(page.locator('#evalResult')).toContainText('/100');

  await page.getByRole('button', { name: 'Save receipt' }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__permissionPending)).toBe(true);
  await page.locator('#evalText').fill(`${source}\n\nChanged after Save.`);
  await page.evaluate(() => globalThis.__resolvePermission('granted'));

  await expect(page.locator('#toast')).toHaveText('Source changed before save; evaluate and save again');
  expect(await page.evaluate(() => globalThis.__snapshotAccessed)).toBe(false);
});

test('clears the previous directory after a newly selected folder fails validation', async ({ page }) => {
  const source = '# Folder A\n\nRun [TASK], verify evidence, produce output, and never invent facts.';
  await page.addInitScript((promptSource) => {
    globalThis.__pickerCalls = 0;
    globalThis.__oldFolderWrite = false;
    globalThis.__fallbackSave = false;
    const promptFile = {
      kind: 'file',
      name: 'folder-a.md',
      getFile: async () => new File([promptSource], 'folder-a.md', { type: 'text/markdown' }),
    };
    const promptsDirectory = {
      kind: 'directory',
      name: 'prompts',
      async *entries() { yield ['folder-a.md', promptFile]; },
    };
    const folderA = {
      kind: 'directory',
      name: 'A',
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
      getDirectoryHandle: async (name) => {
        if (name === 'prompts') return promptsDirectory;
        globalThis.__oldFolderWrite = true;
        throw new Error('old folder must not be reused');
      },
    };
    const folderB = {
      kind: 'directory',
      name: 'B',
      getDirectoryHandle: async () => { throw new DOMException('Not found', 'NotFoundError'); },
    };
    globalThis.showDirectoryPicker = async () => (++globalThis.__pickerCalls === 1 ? folderA : folderB);
    globalThis.showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async () => { globalThis.__fallbackSave = true; },
        close: async () => {},
      }),
    });
  }, source);

  await page.goto(consoleUrl);
  await expect(page.locator('.card')).toHaveCount(expectedCatalogCount);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.getByRole('button', { name: 'Open PromptOS folder' }).click();
  await page.getByLabel('Prompt from connected folder').selectOption('prompts/folder-a.md');
  await expect(page.locator('#evalResult')).toContainText('/100');
  await page.getByRole('button', { name: 'Open PromptOS folder' }).click();
  await expect(page.getByLabel('Prompt from connected folder')).toBeHidden();
  await page.getByRole('button', { name: 'Save receipt' }).click();

  expect(await page.evaluate(() => globalThis.__oldFolderWrite)).toBe(false);
  expect(await page.evaluate(() => globalThis.__fallbackSave)).toBe(true);
});

test('keeps the file input fallback when File System Access APIs are unsupported', async ({ page }) => {
  await page.addInitScript(() => {
    delete globalThis.showDirectoryPicker;
    delete globalThis.showOpenFilePicker;
    delete globalThis.showSaveFilePicker;
  });

  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await expect(page.getByRole('button', { name: 'Open PromptOS folder' })).toBeHidden();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Open prompt file' }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(path.join(process.cwd(), 'prompts', 'scope-pipeline.md'));

  await expect(page.locator('#evalText')).toHaveValue(/Scope pipeline/);
  await expect(page.locator('#evalContext')).toContainText('scope-pipeline.md');
  await expect(page.locator('#evalResult')).toContainText('/100');
});

test('uses showOpenFilePicker for the native open prompt action when supported', async ({ page }) => {
  const source = `# Picker prompt\n\nUse [INPUT], verify the source, produce a summary, and do not invent unknown facts.`;
  await page.addInitScript((promptSource) => {
    globalThis.__openPickerCalls = 0;
    globalThis.showOpenFilePicker = async () => {
      globalThis.__openPickerCalls += 1;
      return [{
        kind: 'file',
        name: 'picker-prompt.md',
        getFile: async () => new File([promptSource], 'picker-prompt.md', { type: 'text/markdown' }),
      }];
    };
  }, source);
  page.on('filechooser', (chooser) => chooser.setFiles([]));

  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.getByRole('button', { name: 'Open prompt file' }).click();

  await expect.poll(() => page.evaluate(() => globalThis.__openPickerCalls)).toBe(1);
  await expect(page.locator('#evalText')).toHaveValue(source);
  await expect(page.locator('#evalContext')).toContainText('picker-prompt.md');
  await expect(page.locator('#evalResult')).toContainText('/100');
});

test('uses showSaveFilePicker when saving without a connected directory', async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__savePickerLog = [];
    globalThis.showSaveFilePicker = async (options) => {
      globalThis.__savePickerLog.push({ operation: 'picker', suggestedName: options.suggestedName });
      return {
        createWritable: async () => ({
          write: async (contents) => globalThis.__savePickerLog.push({ operation: 'write', contents }),
          close: async () => globalThis.__savePickerLog.push({ operation: 'close' }),
        }),
      };
    };
  });

  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.locator('#evalText').fill(`# Save picker prompt\n\nRun [TASK], verify evidence, produce a summary, and never invent missing facts.`);
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.locator('#evalResult')).toContainText('/100');
  expect(await page.evaluate(() => globalThis.__savePickerLog)).toEqual([]);

  await page.getByRole('button', { name: 'Save receipt' }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__savePickerLog.length)).toBe(3);

  const log = await page.evaluate(() => globalThis.__savePickerLog);
  expect(log[0]).toMatchObject({ operation: 'picker' });
  expect(log[0].suggestedName).toMatch(/^pasted-prompt\.evaluation-[0-9TZ.-]+\.json$/);
  expect(JSON.parse(log[1].contents)).toEqual(await page.evaluate(() => globalThis.__APP._receipt()));
  expect(log[2]).toEqual({ operation: 'close' });
});

test('downloads the receipt when save APIs are unsupported', async ({ page }) => {
  await page.addInitScript(() => {
    delete globalThis.showDirectoryPicker;
    delete globalThis.showOpenFilePicker;
    delete globalThis.showSaveFilePicker;
  });

  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.locator('#evalText').fill(`# Download prompt\n\nRun [TASK], verify evidence, produce a summary, and never invent missing facts.`);
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.locator('#evalResult')).toContainText('/100');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save receipt' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^pasted-prompt\.evaluation-[0-9TZ.-]+\.json$/);

  const downloadPath = await download.path();
  expect(JSON.parse(fs.readFileSync(downloadPath, 'utf8'))).toEqual(await page.evaluate(() => globalThis.__APP._receipt()));
});

test('keeps the verification workbench usable without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.locator('#evalText').fill(`# Mobile prompt\n\nRun [TASK] against [SOURCE]. Verify the evidence, cite authority, produce a summary, and never invent missing facts.`);
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.locator('#evalResult')).toContainText('Action');

  const layout = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const scoreStyle = getComputedStyle(document.querySelector('.eval-score strong'));
    const textareaStyle = getComputedStyle(document.querySelector('#evalText'));
    const actions = [...document.querySelectorAll('#evalPanel .eval-actions button:not([hidden])')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { name: button.textContent.trim(), left: rect.left, right: rect.right, visible: rect.width > 0 && rect.height > 0 };
    });
    return {
      viewportWidth: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      backgroundColor: bodyStyle.backgroundColor,
      color: bodyStyle.color,
      bodyFont: bodyStyle.fontFamily,
      monoFont: textareaStyle.fontFamily,
      scoreColor: scoreStyle.color,
      toastOpacity: getComputedStyle(document.querySelector('#toast')).opacity,
      actions,
    };
  });

  expect(layout.backgroundColor).toBe('rgb(250, 249, 245)');
  expect(layout.color).toBe('rgb(20, 20, 19)');
  expect(layout.bodyFont).toContain('Anthropic Sans');
  expect(layout.monoFont).toContain('Anthropic Mono');
  expect(layout.scoreColor).toBe('rgb(184, 81, 47)');
  expect(layout.toastOpacity).toBe('0');
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.actions.map((action) => action.name)).toEqual([
    'Open PromptOS folder',
    'Open prompt file',
    'Evaluate',
    'Save receipt',
    'Clear',
  ]);
  for (const action of layout.actions) {
    expect(action.visible, action.name).toBe(true);
    expect(action.left, action.name).toBeGreaterThanOrEqual(0);
    expect(action.right, action.name).toBeLessThanOrEqual(layout.viewportWidth);
  }
});

test('filters first-class prompts, workflows, playbooks, runbooks, stages, and targets', async ({ page }) => {
  await page.goto(consoleUrl);
  await expect(page.locator('.card')).toHaveCount(19);

  await page.locator('#typeFilter').selectOption('workflow');
  await expect(page.locator('.card')).toHaveCount(1);
  await expect(page.getByText('Repository repair and release')).toBeVisible();

  await page.locator('#typeFilter').selectOption('ALL');
  await page.locator('#stageFilter').selectOption('operate');
  await expect(page.locator('.card')).toHaveCount(1);
  await expect(page.getByText('Rebuild and verify PromptOS')).toBeVisible();

  await page.locator('#stageFilter').selectOption('ALL');
  await page.locator('#compatFilter').selectOption('grok-build');
  await expect(page.locator('.card')).toHaveCount(2);
});

test('generates a structured draft and evaluates its exact output', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Generator' }).click();
  await page.getByRole('button', { name: 'Generate' }).click();

  const generated = await page.locator('#genPreview').inputValue();
  expect(generated).toContain('# Repository repair and release decision');
  expect(generated).toContain('[REPOSITORY PATH]');
  expect(generated).toContain('## Verification');

  await page.getByRole('button', { name: 'Evaluate draft' }).click();
  await expect(page.locator('#evalText')).toHaveValue(generated);
  await expect(page.locator('#evalResult')).toContainText('100/100 structure');
  await expect(page.locator('#evalResult')).toContainText('effectiveness not evaluated');
});

test('improver preserves the original until explicit acceptance and rejects stale proposals', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();
  await page.locator('#evalText').fill('Summarize the repository.');
  await page.getByRole('tab', { name: 'Improver' }).click();

  await expect(page.locator('#improveOriginal')).toHaveValue('Summarize the repository.');
  const candidate = await page.locator('#improveCandidate').inputValue();
  expect(candidate).toContain('## Verification');
  expect(await page.locator('#evalText').inputValue()).toBe('Summarize the repository.');

  await page.evaluate(() => {
    const input = document.querySelector('#evalText');
    input.value = 'Changed behind the proposal.';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.getByRole('button', { name: 'Apply to evaluator draft' }).click();
  await expect(page.locator('#improveStatus')).toContainText('0/100 structure');

  await page.getByRole('button', { name: 'Apply to evaluator draft' }).click();
  await expect(page.locator('#evalPanel')).toBeVisible();
  await expect(page.locator('#evalText')).not.toHaveValue('Changed behind the proposal.');
  await expect(page.locator('#evalResult')).toContainText('effectiveness not evaluated');
});

test('keeps Generator and Improver usable without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Generator' }).click();
  await page.getByRole('button', { name: 'Generate' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Open in Improver' }).click();
  await expect(page.locator('#improverPanel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
