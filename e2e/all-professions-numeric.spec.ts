import { test, expect } from '@playwright/test';

// CRITICAL: Must use actual deployed GitHub Pages URL, not local dev server
const PUBLIC_URL = 'https://phoenixbgorg.github.io/probably-stolen-calculator';

test.describe('All 8 Other Professions - Public Site Numeric Validation', () => {
  // These tests validate the DEPLOYED production site, not local changes
  test.use({ baseURL: PUBLIC_URL });
  
  test('Water Merchant - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/water-merchant`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Water Merchant');
    
    // Record baseline visible outputs
    const pageContent = await page.textContent('body');
    console.log('=== Water Merchant baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    // Find first numeric input and record its value
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Water Merchant baseline first input:', baselineValue);
    
    // Change input
    await firstInput.fill('1000');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Water Merchant changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    // Verify content changed
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });

  test('Hydroponic Farmer - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/hydroponic-farmer`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Hydroponic Farmer');
    
    const pageContent = await page.textContent('body');
    console.log('=== Hydroponic Farmer baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Hydroponic Farmer baseline first input:', baselineValue);
    
    await firstInput.fill('100');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Hydroponic Farmer changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });

  test('Aquafarmer - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/aquafarmer`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Aquafarmer');
    
    const pageContent = await page.textContent('body');
    console.log('=== Aquafarmer baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Aquafarmer baseline first input:', baselineValue);
    
    await firstInput.fill('5000');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Aquafarmer changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });

  test('Rat Wrangler - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/rat-wrangler`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Rat Wrangler');
    
    const pageContent = await page.textContent('body');
    console.log('=== Rat Wrangler baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Rat Wrangler baseline first input:', baselineValue);
    
    await firstInput.fill('400');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Rat Wrangler changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });

  test('Gunsmith - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/gunsmith`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Gunsmith');
    
    const pageContent = await page.textContent('body');
    console.log('=== Gunsmith baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Gunsmith baseline first input:', baselineValue);
    
    await firstInput.fill('50');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Gunsmith changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });

  test('Fence - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/fence`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Fence');
    
    const pageContent = await page.textContent('body');
    console.log('=== Fence baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Fence baseline first input:', baselineValue);
    
    await firstInput.fill('500');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Fence changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });

  test('Apprentice - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/apprentice`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Apprentice');
    
    const pageContent = await page.textContent('body');
    console.log('=== Apprentice baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Apprentice baseline first input:', baselineValue);
    
    await firstInput.fill('600');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Apprentice changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });

  test('Rock Bottom - baseline and numeric output change', async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/#/calculators/rock-bottom`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Rock Bottom');
    
    const pageContent = await page.textContent('body');
    console.log('=== Rock Bottom baseline output ===');
    console.log(pageContent?.slice(0, 800));
    
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    const baselineValue = await firstInput.inputValue();
    console.log('Rock Bottom baseline first input:', baselineValue);
    
    await firstInput.fill('100');
    await page.waitForTimeout(800);
    
    const changedContent = await page.textContent('body');
    console.log('=== Rock Bottom changed output ===');
    console.log(changedContent?.slice(0, 800));
    
    expect(changedContent).toBeDefined();
    expect(changedContent).not.toBe(pageContent);
  });
});
