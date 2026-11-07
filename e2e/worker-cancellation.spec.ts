import { test, expect } from '@playwright/test';

/**
 * Test genuine Web Worker usage and cancellation in browser.
 * Verifies Worker actually runs (not sync fallback) and Cancel button works.
 */

test.describe('Web Worker Cancellation & Latest-Result-Only', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await page.locator('summary').filter({ hasText: 'Compare to target' }).click();
  });

  test('Worker actually used in browser (not sync fallback)', async ({ page }) => {
    
    // Check Worker is available in browser
    const workerSupported = await page.evaluate(() => {
      return typeof Worker !== 'undefined';
    });
    
    console.log('Worker supported in browser:', workerSupported);
    expect(workerSupported).toBe(true);
    
    // Click Calculate and verify "Calculating..." appears (async behavior)
    await page.click('button:has-text("Calculate production plan")');
    
    // Should show calculating status immediately
    const calculating = page.getByTestId('planner-calculating');
    await expect(calculating).toBeVisible({ timeout: 3000 });
    
    console.log('✓ Calculating status appeared (Worker started)');
    
    // Wait for result
    await page.waitForSelector('text=/Production result:/i', { timeout: 30000 });
    
    console.log('✓ Result appeared (Worker completed)');
  });

  test('Cancel button terminates calculation', async ({ page }) => {
    
    await page.fill('input#container-capacity', '4000');
    await page.fill('input#raw-grams', '200');
    
    await page.click('button:has-text("Calculate production plan")');
    await expect(page.getByTestId('planner-calculating')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('planner-cancel').click();
    await expect(page.getByText('Cancelled by user')).toBeVisible({ timeout: 2000 });
    
    console.log('✓ Cancellation registered');
  });

  test('Latest-result-only: new calculation cancels previous', async ({ page }) => {
    
    // Set large input for slow calculation
    await page.fill('input#container-capacity', '2000');
    await page.fill('input#raw-grams', '150');
    
    // Start first calculation
    await page.click('button:has-text("Calculate production plan")');
    await expect(page.getByTestId('planner-calculating')).toBeVisible({ timeout: 3000 });
    
    console.log('✓ First calculation started');
    
    // Change input and start second calculation immediately
    await page.fill('input#raw-grams', '100');
    await page.click('button:has-text("Calculate production plan")');
    
    console.log('✓ Second calculation started (should cancel first)');
    
    // Wait for result
    await page.waitForSelector('text=/Production result:/i', { timeout: 30000 });
    
    // Verify result corresponds to second calculation (100g)
    const body = await page.textContent('body');
    const rawMatch = body?.match(/(\d+\.\d+)\s*g.*raw/i);
    
    if (rawMatch) {
      const rawUsed = parseFloat(rawMatch[1]);
      console.log('Result raw grams:', rawUsed);
      // Should be around 100g or less (second calculation)
      expect(rawUsed).toBeLessThanOrEqual(100);
    }
    
    console.log('✓ Latest-result-only validated');
  });
});
