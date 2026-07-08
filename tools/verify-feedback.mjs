#!/usr/bin/env node
import { verifyFeedbackHarness } from './feedback-harness.mjs';

const result = verifyFeedbackHarness(process.cwd());

if (result.errors.length) {
  console.error('PromptOS feedback harness failed');
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`PromptOS feedback harness valid: ${result.failures} failures, ${result.tests} promptfoo regression tests`);
