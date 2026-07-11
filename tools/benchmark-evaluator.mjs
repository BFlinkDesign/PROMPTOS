#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { scorePrompt, verdictForScore, maturityForScore } from './scoring-core.mjs';

const rootDir = process.cwd();
const fixturePath = path.join(rootDir, 'benchmarks', 'evaluator-structural-adversarial.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const failures = [];
const rows = fixture.cases.map((testCase) => {
  const score = scorePrompt(testCase.source).total;
  const verdict = verdictForScore(score);
  const maturity = maturityForScore(score);
  if (score < testCase.expected_min_score || score > testCase.expected_max_score) {
    failures.push(`${testCase.id}: score ${score} outside expected range ${testCase.expected_min_score}-${testCase.expected_max_score}`);
  }
  if (verdict === 'ready' || maturity === 'hardened' || maturity === 'usable') {
    failures.push(`${testCase.id}: structural lint must not claim readiness or maturity (${verdict}, ${maturity})`);
  }
  return {
    id: testCase.id,
    class: testCase.class,
    score,
    verdict,
    maturity,
    effectiveness_known: testCase.effectiveness_known,
  };
});

const falsePositives = rows.filter((row) => row.class === 'adversarial-false-positive' && row.score >= 85);

console.log(JSON.stringify({
  benchmark: 'PromptOS deterministic structural lint',
  conclusion: 'The score measures structure only; behavioral effectiveness remains unknown.',
  high_scoring_false_positives: falsePositives.length,
  rows,
}, null, 2));

if (failures.length) {
  console.error('\nEvaluator benchmark failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
