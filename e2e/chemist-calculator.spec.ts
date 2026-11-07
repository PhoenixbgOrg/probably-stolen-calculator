import { test, expect } from '@playwright/test';

test.describe('Chemist Dream Dust Calculator', () => {
  test('loads materials-first wizard without requiring target vials', async ({ page }) => {
    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await expect(page.locator('h2').first()).toContainText('Dream Dust Production Planner');
    await expect(page.locator('label:has-text("Ground mixture (mL)")')).toBeVisible();
    await expect(page.locator('button:has-text("Calculate from my materials")')).toBeVisible();
    await expect(page.locator('button:has-text("Ground Mixture")')).toBeVisible();
    await expect(page.locator('button:has-text("Extraction")')).toBeVisible();
  });

  test('750+476 example shows unused ground and no 38-vial guarantee', async ({ page }) => {
    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await page.locator('button:has-text("Example 750 + 476")').click();
    await page.locator('button:has-text("Calculate from my materials")').click();
    expect(parseFloat(await page.getByTestId('available-mush-ul').innerText())).toBeCloseTo(320.348, 3);
    expect(parseFloat(await page.getByTestId('recommended-ground-ul').innerText())).toBeCloseTo(222.9, 0);
    expect(parseFloat(await page.getByTestId('unused-ground-ul').innerText())).toBeCloseTo(253.1, 0);
    await expect(page.locator('text=/not a guaranteed 38-vial yield/i')).toBeVisible();

    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await page.locator('button:has-text("Example 164 + 552")').click();
    await page.locator('button:has-text("Calculate from my materials")').click();
    await page.getByTestId('continue-prediction-ground').click();
    await page.getByTestId('calculate-extraction').click();
    expect(
      parseFloat(await page.getByTestId('predicted-extraction').getByTestId('snapshot-dreamCapExtract-ul').innerText()),
    ).toBeCloseTo(55.18, 1);
    const leftoverMush = page.getByTestId('predicted-extraction').getByTestId('snapshot-dreamCapMush-ul');
    if (await leftoverMush.count()) {
      await expect(leftoverMush).toHaveText('0.000 mL');
    }
  });

  test('Calculate+Continue is required; later stages stay locked', async ({ page }) => {
    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await expect(page.getByRole('button', { name: /^Final Dust/ })).toBeDisabled();
    await page.locator('button:has-text("Example 750 + 476")').click();
    await page.locator('button:has-text("Calculate from my materials")').click();
    await page.getByTestId('continue-prediction-ground').click();
    await expect(page.getByTestId('stage-extraction')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Final Dust/ })).toBeDisabled();
    await page.getByTestId('calculate-extraction').click();
    await page.getByTestId('continue-prediction-extraction').click();
    await expect(page.getByTestId('stage-acidBase')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Final Dust/ })).toBeDisabled();
  });

  test('optional Compare to target still contains reverse-search fields', async ({ page }) => {
    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await page.locator('summary:has-text("Compare to target")').click();
    await expect(page.locator('input#planner-target-purity')).toBeVisible();
    await expect(page.locator('input#planner-target-vials')).toBeVisible();
    await expect(page.locator('button:has-text("Calculate production plan")').first()).toBeVisible();
  });
});
