#!/usr/bin/env node

(async () => {
  const { promoteFeedback } = await import('./feedback-harness.mjs');
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--check');
  const result = promoteFeedback(process.cwd(), { write: !dryRun });

  if (result.errors.length) {
    console.error('Feedback promotion failed');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const action = dryRun ? 'would promote' : 'promoted';
  console.log(`Feedback promotion ${action}: ${result.promoted.length} feedback files, ${result.generatedTests} promptfoo regression tests`);
  for (const item of result.promoted) {
    console.log(`- ${item.source} -> ${item.target}`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
