import { test, expect } from '@playwright/test';

test.describe('Chemist Dream Dust Calculator (Repaired Branch)', () => {
  test('loads calculator page and shows UI elements', async ({ page }) => {
    await page.goto('/#/calculator/chemist');
    
    // Check title
    await expect(page.locator('h2')).toContainText('Dream Dust Production Planner');
    
    // Check key inputs exist
    await expect(page.locator('label:has-text("Target finished purity")')).toBeVisible();
    await expect(page.locator('label:has-text("Required Dream Dust vials")')).toBeVisible();
    await expect(page.locator('button:has-text("Calculate production plan")')).toBeVisible();
  });

  test('baseline calculation (65g, 15 vials, 45%) produces feasible result', async ({ page }) => {
    await page.goto('/#/calculator/chemist');
    
    // Verify defaults (should be 65g, 15 vials, 45%)
    const purityInput = page.locator('input#planner-target-purity');
    await expect(purityInput).toHaveValue('45');
    
    const vialsInput = page.locator('input#planner-target-vials');
    await expect(vialsInput).toHaveValue('15');
    
    const rawInput = page.locator('input#raw-grams');
    await expect(rawInput).toHaveValue('65');
    
    // Click Calculate
    await page.locator('button:has-text("Calculate production plan")').click();
    
    // Wait for results (with timeout for slow calculation)
    await page.waitForSelector('text=/Production result:/i', { timeout: 15000 });
    
    // Should show feasible status
    await expect(page.locator('text=/feasible/i')).toBeVisible({ timeout: 5000 });
    
    // Should show 15/15 vials
    await expect(page.locator('text=/15 \/ 15 requested vials/i')).toBeVisible();
  });

  test('changing inputs shows stale indicator', async ({ page }) => {
    await page.goto('/#/calculator/chemist');
    
    // Calculate baseline
    await page.locator('button:has-text("Calculate production plan")').click();
    await page.waitForSelector('text=/feasible/i', { timeout: 15000 });
    
    // Change raw grams
    const rawInput = page.locator('input#raw-grams');
    await rawInput.fill('45');
    
    // Should show stale warning
    await expect(page.locator('text=/Inputs changed/i')).toBeVisible({ timeout: 2000 });
  });

  test('ground mode quick-fill populates fields', async ({ page }) => {
    await page.goto('/#/calculator/chemist');
    
    // Switch to ground mode
    await page.locator('select#material-state').selectOption('ground');
    
    // Find quick-fill button
    await expect(page.locator('button:has-text("Calculate ground from raw")')).toBeVisible();
    
    // Set quick-fill inputs (32.5g with 4 modules)
    const quickRawInputs = page.locator('input#quick-raw-grams');
    await quickRawInputs.fill('32.5');
    
    const quickBlenderInput = page.locator('input#quick-blender-modules');
    await quickBlenderInput.fill('4');
    
    // Click quick-fill
    await page.locator('button:has-text("Calculate ground from raw")').click();
    
    // Check that Dream Cap Mush is populated (~27.333mL)
    const mushInput = page.locator('input#ground-dreamCapMush');
    const mushValue = await mushInput.inputValue();
    expect(parseFloat(mushValue)).toBeCloseTo(27.333, 1);
  });
});
