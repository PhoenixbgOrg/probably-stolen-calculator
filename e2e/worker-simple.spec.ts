import { test, expect } from '@playwright/test';

test.describe('Worker Test - Simple (Against Built Preview)', () => {
  test.use({ 
    baseURL: 'http://127.0.0.1:4173'
  });

  test('loads page and checks Worker availability', async ({ page }) => {
    // Skip networkidle, use load instead
    await page.goto('/#/calculators/chemist', { 
      waitUntil: 'load',
      timeout: 10000 
    });
    
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
    await page.goto('/#/calculators/chemist', { 
      waitUntil: 'load',
      timeout: 10000 
    });
    
    await page.waitForSelector('button:has-text("Calculate production plan")', { timeout: 5000 });
    
    // Set large input to slow down
    await page.fill('input#raw-grams', '200');
    await page.fill('input#planner-target-vials', '30');
    
    console.log('✓ Set large input (200g, 30 vials)');
    
    // Click Calculate
    await page.click('button:has-text("Calculate production plan")');
    console.log('✓ Clicked Calculate');
    
    // Immediately check for Cancel button
    const cancelVisible = await page.locator('button:has-text("Cancel")').isVisible({ timeout: 1000 }).catch(() => false);
    
    if (cancelVisible) {
      console.log('✓ Cancel button appeared');
      
      // Try to click it
      await page.click('button:has-text("Cancel")');
      console.log('✓ Clicked Cancel');
      
      await page.waitForTimeout(500);
      
      // Check for error or cancellation message
      const body = await page.textContent('body');
      if (body?.match(/cancel/i)) {
        console.log('✓ Cancellation message visible');
      }
    } else {
      console.log('✗ Cancel button did NOT appear (completes too fast or using sync fallback)');
    }
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
    
    await page.goto('/#/calculators/chemist', { 
      waitUntil: 'load',
      timeout: 10000 
    });
    
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
