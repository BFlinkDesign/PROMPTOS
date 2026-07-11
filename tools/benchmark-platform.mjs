#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const benchmarkPath = path.join(process.cwd(), 'benchmarks', 'premium-capability-baseline.json');
const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
const failures = [];
const allowedStatuses = new Set(['verified', 'partial', 'missing']);

if (benchmark.version !== 1) failures.push('benchmark version must be 1');
if (!Array.isArray(benchmark.criteria) || benchmark.criteria.length !== 20) {
  failures.push(`premium benchmark must contain 20 criteria, found ${benchmark.criteria?.length ?? 0}`);
}

const ids = new Set();
for (const criterion of benchmark.criteria || []) {
  if (!criterion.id || ids.has(criterion.id)) failures.push(`missing or duplicate criterion id ${criterion.id}`);
  ids.add(criterion.id);
  if (!allowedStatuses.has(criterion.status)) failures.push(`${criterion.id}: invalid status ${criterion.status}`);
  if (!/^https:\/\//.test(criterion.reference || '')) failures.push(`${criterion.id}: official reference URL is required`);
  for (const key of ['capability', 'evidence', 'gate']) {
    if (!String(criterion[key] || '').trim()) failures.push(`${criterion.id}: ${key} is required`);
  }
  if (criterion.status === 'verified' && /No .* gate exists|No passing gate exists/i.test(criterion.gate)) {
    failures.push(`${criterion.id}: verified capability cannot have a missing gate`);
  }
}

const counts = Object.fromEntries(
  [...allowedStatuses].map((status) => [status, (benchmark.criteria || []).filter((item) => item.status === status).length]),
);

console.log(JSON.stringify({
  benchmark: 'PromptOS premium capability baseline',
  method: benchmark.method,
  counts,
  release_claim: counts.missing === 0 && counts.partial === 0 ? 'parity-proven' : 'parity-not-proven',
}, null, 2));

if (failures.length) {
  console.error('\nPlatform benchmark failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
