import { test, expect } from '@playwright/test';

test.describe('Chemist Dream Dust Calculator', () => {
  test('loads materials-first wizard without requiring target vials', async ({ page }) => {
    await page.goto('/#/calculators/chemist', { waitUntil: 'load' });
    await expect(page.locator('h2').first()).toContainText('Dream Dust Production Planner');
    await expect(page.locator('label:has-text("Ground mixture (mL)")')).toBeVisible();
    await expect(page.locator('button:has-text("Calculate from my materials")')).toBeVisible();
    await expect(page.locator('button:has-text("Ground Mixture")')).toBeVisible();
    await expect(page.locator('button:has-text("Extraction")')).toBeVisible();
  });

  test('750+476 example shows unused ground and no 38-vial guarantee', async ({ page }) => {
    await page.goto('/#/calculators/chemist', { waitUntil: 'load' });
    await page.locator('button:has-text("Example 750 + 476")').click();
    await page.locator('button:has-text("Calculate from my materials")').click();
    await expect(page.locator('text=/Available actual Dream Cap Mush/i')).toBeVisible();
    await expect(page.locator('text=/222\\.\\d+ mL/')).toBeVisible();
    await expect(page.locator('text=/not a guaranteed 38-vial yield/i')).toBeVisible();
  });

  test('optional Compare to target still contains reverse-search fields', async ({ page }) => {
    await page.goto('/#/calculators/chemist', { waitUntil: 'load' });
    await page.locator('summary:has-text("Compare to target")').click();
    await expect(page.locator('input#planner-target-purity')).toBeVisible();
    await expect(page.locator('input#planner-target-vials')).toBeVisible();
    await expect(page.locator('button:has-text("Calculate production plan")').first()).toBeVisible();
  });
});
