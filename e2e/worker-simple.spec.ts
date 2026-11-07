import { test, expect } from '@playwright/test';

test.describe('Worker Test - Simple (Against Built Preview)', () => {

  test('loads page and checks Worker availability', async ({ page }) => {
    // Skip networkidle, use load instead
    await page.goto('./#/calculators/chemist', { 
      waitUntil: 'load',
      timeout: 10000 
    });
    await page.locator('summary').filter({ hasText: 'Compare to target' }).click();
    
    // Wait for the calculate button to appear
    await page.waitForSelector('button:has-text("Calculate production plan")', { timeout: 5000 });
    
    console.log('✓ Page loaded');
    
    // Check Worker support
    const workerSupported = await page.evaluate(() => {
      return typeof Worker !== 'undefined';
    });
    
    console.log('Worker supported:', workerSupported);
    expect(workerSupported).toBe(true);
    
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Click Calculate
    await page.click('button:has-text("Calculate production plan")');
    console.log('✓ Clicked Calculate');
    
    // Wait a bit for async behavior
    await page.waitForTimeout(500);
    
    // Check if calculating indicator appeared
    const calculating = await page.locator('text=/Calculating/i').isVisible().catch(() => false);
    if (calculating) {
      console.log('✓ "Calculating..." visible (Worker async behavior)');
    } else {
      console.log('⚠ "Calculating..." not visible (may complete instantly or sync)');
    }
    
    // Wait for result
    await page.waitForSelector('text=/Production result:/i', { timeout: 30000 });
    console.log('✓ Result appeared');
    
    if (errors.length > 0) {
      console.log('❌ Console errors:', errors);
    } else {
      console.log('✓ No console errors');
    }
  });

  test('cancel button appears during calculation', async ({ page }) => {
    await page.goto('./#/calculators/chemist', { 
      waitUntil: 'load',
      timeout: 10000 
    });
    await page.locator('summary').filter({ hasText: 'Compare to target' }).click();
    
    await page.waitForSelector('button:has-text("Calculate production plan")', { timeout: 5000 });
    
    // Set large input to slow down
    await page.fill('input#container-capacity', '4000');
    await page.fill('input#raw-grams', '200');
    
    console.log('✓ Set large input (200g, 15 vials)');
    
    await page.click('button:has-text("Calculate production plan")');
    await expect(page.getByTestId('planner-calculating')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('planner-cancel').click();
    await expect(page.getByText(/Cancelled by user/i)).toBeVisible({ timeout: 3000 });
  });

  test('check Worker file loads from network', async ({ page }) => {
    const workerRequests: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('worker') || url.includes('Worker')) {
        workerRequests.push(url);
        console.log('Worker request:', url);
      }
    });
    
    await page.goto('./#/calculators/chemist', { 
      waitUntil: 'load',
      timeout: 10000 
    });
    await page.locator('summary').filter({ hasText: 'Compare to target' }).click();
    
    await page.waitForSelector('button:has-text("Calculate production plan")', { timeout: 5000 });
    
    // Click Calculate to trigger Worker
    await page.click('button:has-text("Calculate production plan")');
    
    await page.waitForTimeout(1000);
    
    if (workerRequests.length > 0) {
      console.log('✓ Worker file(s) requested:', workerRequests);
    } else {
      console.log('⚠ No Worker file requests detected (may be bundled or using sync fallback)');
    }
    
    // Check if Worker was actually created
    const workerCreated = await page.evaluate(() => {
      return (window as any).__workerCreated || false;
    });
    
    console.log('Worker created flag:', workerCreated);
  });
});
