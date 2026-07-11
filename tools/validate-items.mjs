#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { buildConsoleData, extractConsoleData, readText } from './catalog.mjs';

const rootDir = process.cwd();
const schemaPath = path.join(rootDir, 'schema', 'items.schema.json');
const taskReportSchemaPath = path.join(rootDir, 'schema', 'task-report.schema.json');
const ecosystemSchemaPath = path.join(rootDir, 'schema', 'ecosystem.schema.json');
const ecosystemRegistryPath = path.join(rootDir, 'ecosystem', 'registry.json');
const validTaskReportPath = path.join(rootDir, 'tests', 'fixtures', 'task-report.valid.json');
const invalidTaskReportPath = path.join(rootDir, 'tests', 'fixtures', 'task-report.invalid.json');
const consolePath = path.join(rootDir, 'console', 'promptos-console.html');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const taskReportSchema = JSON.parse(fs.readFileSync(taskReportSchemaPath, 'utf8'));
const ecosystemSchema = JSON.parse(fs.readFileSync(ecosystemSchemaPath, 'utf8'));
const ecosystemRegistry = JSON.parse(fs.readFileSync(ecosystemRegistryPath, 'utf8'));
const validTaskReport = JSON.parse(fs.readFileSync(validTaskReportPath, 'utf8'));
const invalidTaskReport = JSON.parse(fs.readFileSync(invalidTaskReportPath, 'utf8'));
const generated = buildConsoleData(rootDir);
const embedded = extractConsoleData(readText(consolePath));

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);
const validateTaskReport = ajv.compile(taskReportSchema);
const validateEcosystem = ajv.compile(ecosystemSchema);
const failures = [];

function validateEcosystemSemantics(registry) {
  const semanticFailures = [];
  const ecosystemIds = registry.assets.map((asset) => asset.id);
  const duplicateEcosystemIds = ecosystemIds.filter((id, index) => ecosystemIds.indexOf(id) !== index);
  if (duplicateEcosystemIds.length) {
    semanticFailures.push(`ecosystem registry contains duplicate ids: ${[...new Set(duplicateEcosystemIds)].join(', ')}`);
  }

  const canonicalAssets = registry.assets.filter((asset) => asset.status === 'canonical');
  if (canonicalAssets.length !== 1 || canonicalAssets[0]?.id !== registry.canonical_product_id) {
    semanticFailures.push('ecosystem registry must contain exactly one canonical asset matching canonical_product_id');
  }

  const nativeAssets = registry.assets.filter((asset) => asset.integration === 'native');
  if (nativeAssets.length !== 1 || nativeAssets[0]?.id !== registry.canonical_product_id) {
    semanticFailures.push('only the canonical PromptOS product may use native integration');
  }

  for (const asset of registry.assets) {
    if (['stale-duplicate', 'retirement-candidate'].includes(asset.status) && asset.disposition === 'keep') {
      semanticFailures.push(`${asset.id} cannot be both ${asset.status} and keep`);
    }
  }
  return semanticFailures;
}

for (const [label, payload] of [
  ['generated catalog', generated],
  ['embedded console catalog', embedded],
]) {
  if (!validate(payload)) {
    failures.push(`${label} failed schema validation`);
    for (const error of validate.errors || []) {
      failures.push(`- ${error.instancePath || '/'} ${error.message}`);
    }
  }
}

if (generated.count !== generated.items.length) {
  failures.push(`generated count ${generated.count} does not match items length ${generated.items.length}`);
}
if (embedded.count !== (embedded.items || []).length) {
  failures.push(`embedded count ${embedded.count} does not match items length ${(embedded.items || []).length}`);
}
if (!validateTaskReport(validTaskReport)) {
  failures.push('valid task-report fixture failed schema validation');
}
if (validateTaskReport(invalidTaskReport)) {
  failures.push('invalid task-report fixture unexpectedly passed schema validation');
}
if (!validateEcosystem(ecosystemRegistry)) {
  failures.push('ecosystem registry failed schema validation');
  for (const error of validateEcosystem.errors || []) {
    failures.push(`- ${error.instancePath || '/'} ${error.message}`);
  }
}
failures.push(...validateEcosystemSemantics(ecosystemRegistry));

const invalidEcosystemShape = structuredClone(ecosystemRegistry);
delete invalidEcosystemShape.version;
if (validateEcosystem(invalidEcosystemShape)) {
  failures.push('invalid ecosystem schema control unexpectedly passed validation');
}

const invalidEcosystemSemantics = structuredClone(ecosystemRegistry);
invalidEcosystemSemantics.assets.push({
  ...invalidEcosystemSemantics.assets[0],
  owner: 'invalid duplicate owner',
});
if (!validateEcosystem(invalidEcosystemSemantics)) {
  failures.push('ecosystem semantic negative control must remain schema-valid');
} else if (!validateEcosystemSemantics(invalidEcosystemSemantics).length) {
  failures.push('invalid ecosystem semantic control unexpectedly passed validation');
}

if (failures.length) {
  console.error('PromptOS item schema validation failed');
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

console.log(`PromptOS schemas valid: ${generated.items.length} generated items, ${embedded.items.length} embedded items, ${ecosystemRegistry.assets.length} ecosystem assets, task report and ecosystem positive and negative controls passed`);
