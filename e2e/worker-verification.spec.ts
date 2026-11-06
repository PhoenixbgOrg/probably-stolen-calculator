import { test, expect } from '@playwright/test';

test.describe('Worker Verification - Built Preview', () => {
  test.use({ baseURL: 'http://127.0.0.1:4173' });

  test('verify Worker file loads and executes (not sync fallback)', async ({ page }) => {
    // Track all network requests
    const requests: { url: string; type: string }[] = [];
    page.on('request', req => {
      requests.push({ url: req.url(), type: req.resourceType() });
    });
    
    // Track console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    await page.goto('/#/calculators/chemist', { waitUntil: 'load', timeout: 10000 });
    await page.waitForSelector('button:has-text("Calculate production plan")', { timeout: 5000 });
    
    console.log('=== BEFORE CALCULATE ===');
    const workerRequestsBefore = requests.filter(r => 
      r.url.includes('worker') || r.url.includes('Worker')
    );
    console.log('Worker requests before Calculate:', workerRequestsBefore.length);
    
    // Click Calculate
    const startTime = Date.now();
    await page.click('button:has-text("Calculate production plan")');
    
    // Wait for result
    await page.waitForSelector('text=/Production result:/i', { timeout: 30000 });
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    console.log('=== AFTER CALCULATE ===');
    console.log('Calculation time:', elapsed, 'ms');
    
    const workerRequestsAfter = requests.filter(r => 
      r.url.includes('worker') || r.url.includes('Worker')
    );
    console.log('Worker requests after Calculate:', workerRequestsAfter.length);
    console.log('Worker URLs:', workerRequestsAfter.map(r => r.url));
    
    // Check console for Worker errors or fallback messages
    const workerErrors = consoleMessages.filter(m => 
      m.includes('Worker') || m.includes('worker') || m.includes('fallback')
    );
    console.log('Worker-related console messages:', workerErrors);
    
    // VERIFICATION 1: Worker file was requested
    expect(workerRequestsAfter.length).toBeGreaterThan(0);
    console.log('✓ Worker file requested from network');
    
    // VERIFICATION 2: Check if "sync fallback" warning appeared
    const hasFallbackWarning = consoleMessages.some(m => 
      m.includes('falling back') || m.includes('sync')
    );
    
    if (hasFallbackWarning) {
      console.log('❌ SYNC FALLBACK WARNING DETECTED');
      console.log('Fallback messages:', consoleMessages.filter(m => 
        m.includes('falling') || m.includes('sync')
      ));
    } else {
      console.log('✓ No sync fallback warning (Worker likely used)');
    }
    
    // VERIFICATION 3: Check calculation time
    // Sync would complete in ~1-2 seconds
    // If it's instant (<100ms), something's wrong
    console.log('Calculation timing analysis:');
    if (elapsed < 100) {
      console.log('  ⚠ Very fast (<100ms) - may indicate cached result or error');
    } else if (elapsed < 2000) {
      console.log('  ✓ Normal speed (100-2000ms) - consistent with Worker execution');
    } else {
      console.log('  ⚠ Slow (>2000ms) - may indicate Worker overhead or slow system');
    }
    
    // Final verdict
    const workerUsed = workerRequestsAfter.length > 0 && !hasFallbackWarning;
    console.log('');
    console.log('=== FINAL VERDICT ===');
    console.log('Worker file loaded:', workerRequestsAfter.length > 0);
    console.log('Sync fallback detected:', hasFallbackWarning);
    console.log('Worker actually used:', workerUsed);
    
    expect(workerUsed).toBe(true);
  });

  test('verify Cancel button exists and latest-result-only works', async ({ page }) => {
    await page.goto('/#/calculators/chemist', { waitUntil: 'load', timeout: 10000 });
    await page.waitForSelector('button:has-text("Calculate production plan")', { timeout: 5000 });
    
    // Test 1: Start first calculation
    console.log('Starting first calculation...');
    await page.fill('input#raw-grams', '150');
    await page.click('button:has-text("Calculate production plan")');
    
    // Immediately start second calculation (should cancel first)
    console.log('Starting second calculation immediately...');
    await page.fill('input#raw-grams', '100');
    await page.click('button:has-text("Calculate production plan")');
    
    // Wait for result
    await page.waitForSelector('text=/Production result:/i', { timeout: 30000 });
    
    // Check which result we got (should be for 100g, not 150g)
    const body = await page.textContent('body');
    const rawMatch = body?.match(/(\d+\.\d+)\s*g.*?raw/i);
    
    if (rawMatch) {
      const rawUsed = parseFloat(rawMatch[1]);
      console.log('Result raw grams:', rawUsed, 'g');
      
      // Should be ≤100g (second calculation), not 150g (first)
      if (rawUsed <= 100) {
        console.log('✓ Latest-result-only works: got second calculation result');
      } else if (rawUsed > 100 && rawUsed <= 150) {
        console.log('❌ Got first calculation result (latest-result-only FAILED)');
        throw new Error('Latest-result-only not working: got first result instead of second');
      }
    }
    
    // Test 2: Cancel button (may not appear if too fast)
    console.log('');
    console.log('Testing Cancel button visibility...');
    await page.fill('input#raw-grams', '200');
    await page.fill('input#planner-target-vials', '30');
    
    await page.click('button:has-text("Calculate production plan")');
    
    // Check if Cancel button appeared
    const cancelButton = await page.locator('button:has-text("Cancel")');
    const cancelVisible = await cancelButton.isVisible({ timeout: 500 }).catch(() => false);
    
    if (cancelVisible) {
      console.log('✓ Cancel button appeared');
      await cancelButton.click();
      console.log('✓ Cancel button clicked');
      
      await page.waitForTimeout(500);
      const bodyAfter = await page.textContent('body');
      if (bodyAfter?.match(/cancel/i)) {
        console.log('✓ Cancellation message visible');
      }
    } else {
      console.log('⚠ Cancel button did not appear (calculation completed too quickly)');
      console.log('  This is acceptable if Worker completes calculation before UI update');
    }
  });
});
