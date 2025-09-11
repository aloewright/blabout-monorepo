// @ts-check
const { test, expect } = require('@playwright/test');

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Check if the main heading is visible
  await expect(page.locator('h1')).toBeVisible();
  
  // Check if the page contains expected text
  await expect(page.locator('text=Welcome to blabout.com')).toBeVisible();
});
