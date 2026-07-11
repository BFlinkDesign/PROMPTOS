#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { buildConsoleData, extractConsoleData, readText } from './catalog.mjs';

const rootDir = process.cwd();
const schemaPath = path.join(rootDir, 'schema', 'items.schema.json');
const taskReportSchemaPath = path.join(rootDir, 'schema', 'task-report.schema.json');
const validTaskReportPath = path.join(rootDir, 'tests', 'fixtures', 'task-report.valid.json');
const invalidTaskReportPath = path.join(rootDir, 'tests', 'fixtures', 'task-report.invalid.json');
const consolePath = path.join(rootDir, 'console', 'promptos-console.html');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const taskReportSchema = JSON.parse(fs.readFileSync(taskReportSchemaPath, 'utf8'));
const validTaskReport = JSON.parse(fs.readFileSync(validTaskReportPath, 'utf8'));
const invalidTaskReport = JSON.parse(fs.readFileSync(invalidTaskReportPath, 'utf8'));
const generated = buildConsoleData(rootDir);
const embedded = extractConsoleData(readText(consolePath));

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);
const validateTaskReport = ajv.compile(taskReportSchema);
const failures = [];

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

if (failures.length) {
  console.error('PromptOS item schema validation failed');
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

console.log(`PromptOS schemas valid: ${generated.items.length} generated items, ${embedded.items.length} embedded items, task report positive and negative controls passed`);
