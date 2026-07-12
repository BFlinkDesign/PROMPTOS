#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { hashFile, hashJson, sha256 } from './engine-acceptance-core.mjs';

const require = createRequire(import.meta.url);
const Ajv2020 = require('ajv/dist/2020.js');

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const failures = [];
const ajv = new Ajv2020({ allErrors: true, strict: true });

const contracts = [
  ['schema/engine-acceptance-manifest.schema.json', 'tests/fixtures/engine/acceptance-manifest.v1.json'],
  ['schema/engine-public-dataset.schema.json', 'tests/fixtures/engine/public-development-dataset.v1.json'],
  ['schema/engine-replay-provider.schema.json', 'tests/fixtures/engine/offline-replay-provider.v1.json'],
  ['schema/engine-holdout-contract.schema.json', 'tests/fixtures/engine/holdout-contract.v1.json'],
];

for (const [schemaPath, dataPath] of contracts) {
  const validate = ajv.compile(readJson(schemaPath));
  if (!validate(readJson(dataPath))) {
    failures.push(...validate.errors.map(
      (error) => `${dataPath} ${error.instancePath || '/'} ${error.message}`,
    ));
  }
}

const manifest = readJson('tests/fixtures/engine/acceptance-manifest.v1.json');
for (const ref of [manifest.public_dataset, manifest.holdout_contract, manifest.offline_replay_provider]) {
  const actual = hashFile(path.join(root, ref.path));
  if (actual !== ref.sha256) failures.push(`${ref.path} hash mismatch: ${actual}`);
}
for (const baseline of manifest.baselines) {
  const actual = hashFile(path.join(root, baseline.prompt_path));
  if (actual !== baseline.prompt_sha256) {
    failures.push(`${baseline.prompt_path} baseline hash mismatch: ${actual}`);
  }
}

const dataset = readJson(manifest.public_dataset.path);
const replay = readJson(manifest.offline_replay_provider.path);
const holdout = readJson(manifest.holdout_contract.path);
const caseIds = dataset.cases.map((testCase) => testCase.id);
const responseIds = replay.responses.map((response) => response.case_id);
if (new Set(caseIds).size !== caseIds.length) failures.push('public dataset contains duplicate case ids');
if (new Set(responseIds).size !== responseIds.length) failures.push('replay provider contains duplicate case ids');
if (JSON.stringify([...caseIds].sort()) !== JSON.stringify([...responseIds].sort())) {
  failures.push('replay provider case ids must exactly match the public dataset');
}
for (const testCase of dataset.cases) {
  const response = replay.responses.find((item) => item.case_id === testCase.id);
  if (response && response.input_sha256 !== sha256(testCase.input)) {
    failures.push(`replay input hash mismatch for ${testCase.id}`);
  }
}
if (Object.hasOwn(holdout, 'cases') || holdout.cases_visible_to_generation !== false) {
  failures.push('tracked holdout contract must not contain hidden cases');
}

const validateReceipt = ajv.compile(readJson('schema/engine-evaluation-receipt.schema.json'));
const sampleReceipt = {
  version: 1,
  source_prompt_sha256: manifest.baselines[0].prompt_sha256,
  input_bundle_sha256: manifest.public_dataset.sha256,
  dataset_version: dataset.dataset_id,
  dataset_sha256: manifest.public_dataset.sha256,
  split_sha256: holdout.split_sha256,
  candidate_sha256: manifest.baselines[0].prompt_sha256,
  provider: replay.provider,
  model: replay.model,
  model_config_sha256: hashJson({ provider: replay.provider, model: replay.model }),
  seed: null,
  tool_version: 'acceptance-contract-v1',
  environment: 'offline-ci',
  git_commit: '4de058b9d3bb7e62b944b994c59f745b5937c32d',
  artifact_sha256: manifest.baselines[0].prompt_sha256,
  started_at: '2026-07-11T00:00:00Z',
  completed_at: '2026-07-11T00:00:01Z',
  attempts: 1,
  duration_ms: 1,
  usage: {
    source: 'reported',
    input_tokens: 36,
    output_tokens: 23,
    cost_usd: 0,
    pricing_version: null,
  },
  claim_state: 'PUBLIC-EVAL-PASSED',
  public_eval: {
    passed: dataset.cases.length,
    total: dataset.cases.length,
    dataset_sha256: manifest.public_dataset.sha256,
    split_sha256: holdout.split_sha256,
  },
  holdout_eval: null,
};
if (!validateReceipt(sampleReceipt)) {
  failures.push(...validateReceipt.errors.map(
    (error) => `sample receipt ${error.instancePath || '/'} ${error.message}`,
  ));
}
const invalidUnknownCost = structuredClone(sampleReceipt);
invalidUnknownCost.usage = {
  source: 'unknown',
  input_tokens: null,
  output_tokens: null,
  cost_usd: 0,
  pricing_version: null,
};
if (validateReceipt(invalidUnknownCost)) {
  failures.push('receipt schema accepted zero cost when cost provenance is unknown');
}
const invalidEstimatedPricing = structuredClone(sampleReceipt);
invalidEstimatedPricing.usage = {
  source: 'estimated',
  input_tokens: 1,
  output_tokens: 1,
  cost_usd: 0,
  pricing_version: null,
};
if (validateReceipt(invalidEstimatedPricing)) {
  failures.push('receipt schema accepted estimated cost without a pricing version');
}

if (failures.length) {
  console.error('Prompt Engine acceptance validation failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Prompt Engine acceptance validation passed: ${dataset.cases.length} public cases, `
  + `${manifest.baselines.length} immutable prompt baselines, concealed holdout contract only`,
);
