#!/usr/bin/env node
import { evaluateCatalog } from './catalog.mjs';

const json = process.argv.includes('--json');
const minAverageArg = process.argv.find((arg) => arg.startsWith('--min-average='));
const minAverage = minAverageArg ? Number(minAverageArg.split('=')[1]) : null;
const result = evaluateCatalog(process.cwd());

if (minAverage !== null && result.averageScore < minAverage) {
  result.errors.push(`average structure lint ${result.averageScore}/100 is below ${minAverage}`);
}

if (json) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`PromptOS catalog: ${result.entries.length} prompts, average structure lint ${result.averageScore}/100`);
  for (const entry of result.entries) {
    console.log(`- ${entry.filePath}: ${entry.score.total}/100, ${entry.inputs} inputs`);
  }
  if (result.warnings.length) {
    console.log('\nWarnings:');
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  }
  if (result.errors.length) {
    console.error('\nErrors:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
  }
}

process.exit(result.errors.length ? 1 : 0);
