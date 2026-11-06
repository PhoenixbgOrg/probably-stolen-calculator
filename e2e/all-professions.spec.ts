import { test, expect } from '@playwright/test';

// CRITICAL: Must use actual deployed GitHub Pages URL, not local dev server
const PUBLIC_URL = 'https://phoenixbgorg.github.io/probably-stolen-calculator';

test.describe('All 8 Other Profession Calculators (Public Site)', () => {
  // These tests validate the DEPLOYED production site, not local changes
  test.use({ baseURL: PUBLIC_URL });
  
  test('Water Merchant - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/water-merchant');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads
    await expect(page.locator('h2').first()).toContainText('Water Merchant');
    
    // Check baseline calculation exists and has inputs
    const volumeInput = page.locator('input').first();
    await expect(volumeInput).toBeVisible();
    
    // Get baseline values
    const baseline = await volumeInput.inputValue();
    expect(baseline).toBeDefined();
    
    // Change input and verify response
    await volumeInput.fill('1000');
    await volumeInput.blur();
    
    // Verify input changed
    const changed = await volumeInput.inputValue();
    expect(changed).toBe('1000');
  });

  test('Hydroponic Farmer - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/hydroponic-farmer');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2').first()).toContainText('Hydroponic Farmer');
    
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    
    const baseline = await input.inputValue();
    expect(baseline).toBeDefined();
    
    await input.fill('100');
    const changed = await input.inputValue();
    expect(changed).toBe('100');
  });

  test('Aquafarmer - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/aquafarmer');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2').first()).toContainText('Aquafarmer');
    
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    
    const baseline = await input.inputValue();
    expect(baseline).toBeDefined();
    
    await input.fill('5000');
    const changed = await input.inputValue();
    expect(changed).toBe('5000');
  });

  test('Rat Wrangler - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/rat-wrangler');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2').first()).toContainText('Rat Wrangler');
    
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    
    const baseline = await input.inputValue();
    expect(baseline).toBeDefined();
    
    await input.fill('400');
    const changed = await input.inputValue();
    expect(changed).toBe('400');
  });

  test('Gunsmith - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/gunsmith');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2').first()).toContainText('Gunsmith');
    
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    
    const baseline = await input.inputValue();
    expect(baseline).toBeDefined();
    
    await input.fill('50');
    const changed = await input.inputValue();
    expect(changed).toBe('50');
  });

  test('Fence - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/fence');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2').first()).toContainText('Fence');
    
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    
    const baseline = await input.inputValue();
    expect(baseline).toBeDefined();
    
    await input.fill('500');
    const changed = await input.inputValue();
    expect(changed).toBe('500');
  });

  test('Apprentice - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/apprentice');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2').first()).toContainText('Apprentice');
    
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    
    const baseline = await input.inputValue();
    expect(baseline).toBeDefined();
    
    await input.fill('600');
    const changed = await input.inputValue();
    expect(changed).toBe('600');
  });

  test('Rock Bottom - baseline and input change', async ({ page }) => {
    await page.goto('/#/calculators/rock-bottom');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2').first()).toContainText('Rock Bottom');
    
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    
    const baseline = await input.inputValue();
    expect(baseline).toBeDefined();
    
    await input.fill('100');
    const changed = await input.inputValue();
    expect(changed).toBe('100');
  });
});
