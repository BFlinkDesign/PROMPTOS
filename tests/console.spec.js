const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

const consoleUrl = pathToFileURL(path.join(process.cwd(), 'console', 'promptos-console.html')).href;

test('renders the tracked PromptOS catalog', async ({ page }) => {
  await page.goto(consoleUrl);

  await expect(page).toHaveTitle('PromptOS Console');
  await expect(page.locator('.card')).toHaveCount(7);
  await expect(page.getByText('Scope pipeline')).toBeVisible();
  await expect(page.getByText('Decision matrix')).toBeVisible();
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
