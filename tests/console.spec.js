const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

const consoleUrl = pathToFileURL(path.join(process.cwd(), 'console', 'promptos-console.html')).href;

test('renders the tracked PromptOS catalog', async ({ page }) => {
  await page.goto(consoleUrl);

  await expect(page).toHaveTitle('PromptOS Console');
  await expect(page.locator('.card')).toHaveCount(8);
  await expect(page.getByText('Scope pipeline')).toBeVisible();
  await expect(page.getByText('Decision matrix')).toBeVisible();
  await expect(page.getByText('Adaptive product design')).toBeVisible();
});

test('filters prompts and opens a drawer without network access', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto(consoleUrl);
  await page.locator('#q').fill('decision matrix');

  await expect(page.locator('.card')).toHaveCount(1);
  await page.locator('.card').first().click();

  await expect(page.locator('#drawer')).toHaveClass(/on/);
  await expect(page.locator('#drawer h2')).toContainText('Decision matrix');
  expect(requests.every((url) => url.startsWith('file:///'))).toBe(true);
});

test('evaluates pasted markdown with the shared scoring runtime', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();

  await expect(page.locator('#evalPanel')).toBeVisible();
  await page.locator('#evalText').fill(`# Evaluation sample

Run [TASK] against [SOURCE PATH].

Verify the evidence, cite the source, produce a short matrix, and never invent missing facts.`);
  await page.locator('#evalRun').click();

  await expect(page.locator('#evalResult')).toContainText('/100');
  await expect(page.locator('#evalResult')).toContainText('Fill-in inputs');
  await expect(page.locator('#evalResult')).toContainText('Verification terms');
  await expect(page.locator('#evalResult')).toContainText('Output contract');
});

test('loads a prompt file into the evaluator', async ({ page }) => {
  await page.goto(consoleUrl);
  await page.getByRole('tab', { name: 'Evaluator' }).click();

  await page.locator('#evalFile').setInputFiles(path.join(process.cwd(), 'prompts', 'scope-pipeline.md'));

  await expect(page.locator('#evalText')).toHaveValue(/Scope pipeline/);
  await expect(page.locator('#evalResult')).toContainText('scope-pipeline.md');
  await expect(page.locator('#evalResult')).toContainText('/100');
});
