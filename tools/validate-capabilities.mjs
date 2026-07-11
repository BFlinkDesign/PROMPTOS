#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const rootDir = process.cwd();
const schema = JSON.parse(fs.readFileSync(path.join(rootDir, 'schema', 'capabilities.schema.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(rootDir, 'governance', 'capabilities.json'), 'utf8'));
const legacy = JSON.parse(fs.readFileSync(path.join(rootDir, 'intake', 'legacy-console-v1', 'catalog.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const failures = [];

if (!validate(ledger)) {
  failures.push(...validate.errors.map((error) => `capability ledger ${error.instancePath || '/'} ${error.message}`));
}

const ids = ledger.capabilities.map((item) => item.id);
if (new Set(ids).size !== ids.length) {
  failures.push('capability ledger contains duplicate ids');
}

if (legacy.source_commit !== '787f021c3' || legacy.count !== 159 || legacy.prompts.length !== 159) {
  failures.push('legacy console intake must preserve commit 787f021c3 and all 159 records');
}

const domainCount = new Set(legacy.prompts.map((item) => item.domain)).size;
if (domainCount !== 31) {
  failures.push(`legacy console intake must preserve 31 domains, found ${domainCount}`);
}

for (const requiredId of ['catalog.active-16', 'catalog.legacy-159', 'evaluation.structure-lint', 'desktop.shared-shell', 'operations.ai-repair']) {
  if (!ids.includes(requiredId)) failures.push(`capability ledger is missing ${requiredId}`);
}

if (failures.length) {
  console.error('PromptOS capability validation failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const statuses = Object.fromEntries(
  [...new Set(ledger.capabilities.map((item) => item.status))]
    .sort()
    .map((status) => [status, ledger.capabilities.filter((item) => item.status === status).length]),
);
console.log(`PromptOS capability validation passed: ${ledger.capabilities.length} capabilities; legacy intake ${legacy.prompts.length} records across ${domainCount} domains`);
console.log(JSON.stringify(statuses));
