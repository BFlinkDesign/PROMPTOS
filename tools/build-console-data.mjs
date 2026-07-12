#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  buildConsoleData,
  buildScoringRuntime,
  readText,
  replaceConsoleData,
  replaceConsoleScoring,
} from './catalog.mjs';

const rootDir = process.cwd();
const write = process.argv.includes('--write');
const data = buildConsoleData(rootDir);

if (!write) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  process.exit(0);
}

const consolePath = path.join(rootDir, 'console', 'promptos-console.html');
const html = readText(consolePath);
const next = replaceConsoleScoring(
  replaceConsoleData(html, data),
  buildScoringRuntime(rootDir),
);
fs.writeFileSync(consolePath, next, 'utf8');
console.log(`updated ${path.relative(rootDir, consolePath)} with ${data.count} artifacts`);
