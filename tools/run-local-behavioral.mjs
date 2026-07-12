import fs from 'node:fs';
import path from 'node:path';
import { loadBehavioralSuite, writePromptfooBehavioralConfig } from './behavioral-suite.mjs';
import { hashJson } from './engine-acceptance-core.mjs';
import { runPromptfoo } from './run-promptfoo.mjs';

const root = process.cwd();
const suite = loadBehavioralSuite(root);
const outputDir = path.join(root, 'test-results');
const configPath = path.join(outputDir, 'promptfoo-local-behavioral.yaml');
const receiptPath = path.join(outputDir, 'promptfoo-local-behavioral-receipt.json');

const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000) });
if (!response.ok) throw new Error(`Ollama model inventory failed with HTTP ${response.status}`);
const inventory = await response.json();
const installed = new Set((inventory.models || []).map((model) => model.name));
const required = suite.manifest.providers.map((provider) => provider.id.replace(/^ollama:(chat|completion):/, ''));
const missing = required.filter((model) => !installed.has(model));
if (missing.length) throw new Error(`required Ollama models are not installed: ${missing.join(', ')}`);

writePromptfooBehavioralConfig(configPath, suite);
const startedAt = new Date().toISOString();
const providerRuns = [];
for (const provider of suite.manifest.providers) {
  const slug = provider.id.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const resultPath = path.join(outputDir, `promptfoo-local-behavioral-${slug}.json`);
  const pattern = `^${provider.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;
  const exitCode = runPromptfoo(['eval', '-c', configPath, '-o', resultPath, '--no-cache', '-j', '1', '--filter-providers', pattern], {
    cwd: root,
    env: { OLLAMA_BASE_URL: 'http://127.0.0.1:11434', REQUEST_TIMEOUT_MS: '300000' },
  });
  const results = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : null;
  const rows = Array.isArray(results?.results?.results) ? results.results.results : Array.isArray(results?.results) ? results.results : [];
  providerRuns.push({ provider: provider.id, exitCode, resultPath, results, rows });
}
const completedAt = new Date().toISOString();
const rows = providerRuns.flatMap((run) => run.rows);
const passed = rows.filter((row) => row.success === true).length;
const failed = rows.filter((row) => row.success === false).length;
const baselineRows = rows.filter((row) => String(row.prompt?.label || '').startsWith('baseline@'));
const candidateRows = rows.filter((row) => String(row.prompt?.label || '').startsWith('candidate@'));
const baselinePassed = baselineRows.filter((row) => row.success === true).length;
const candidatePassed = candidateRows.filter((row) => row.success === true).length;
const promotionPassed = candidateRows.length > 0 && candidatePassed === candidateRows.length && candidatePassed > baselinePassed;
const receipt = {
  schema_version: '1.0',
  suite_id: suite.manifest.suite_id,
  claim_state: suite.manifest.claim_limit,
  concealed_holdout_evaluated: false,
  baseline_prompt_sha256: suite.baselinePromptHash,
  candidate_prompt_sha256: suite.candidatePromptHash,
  manifest_sha256: suite.manifestSha256,
  providers: suite.manifest.providers.map((provider) => provider.id),
  provider_runs: providerRuns.map((run) => ({
    provider: run.provider,
    exit_code: run.exitCode,
    rows: run.rows.length,
    passed: run.rows.filter((row) => row.success === true).length,
    failed: run.rows.filter((row) => row.success === false).length,
    result_sha256: run.results ? hashJson(run.results) : null,
  })),
  started_at: startedAt,
  completed_at: completedAt,
  rows: rows.length,
  passed,
  failed,
  baseline: { rows: baselineRows.length, passed: baselinePassed, failed: baselineRows.length - baselinePassed },
  candidate: { rows: candidateRows.length, passed: candidatePassed, failed: candidateRows.length - candidatePassed },
  promotion_passed: promotionPassed,
  aggregate_result_sha256: hashJson(providerRuns.map((run) => run.results)),
};
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(receipt, null, 2));
if (rows.length === 0 || candidateRows.length === 0 || !promotionPassed) process.exitCode = 1;
