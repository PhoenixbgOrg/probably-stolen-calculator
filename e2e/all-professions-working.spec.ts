import { test, expect } from '@playwright/test';

const PUBLIC_URL = 'https://phoenixbgorg.github.io/probably-stolen-calculator';

test.describe('All 8 Professions - Working Calculators Validated', () => {
  test.use({ baseURL: PUBLIC_URL });

  test('Water Merchant - reactive calculator with numeric changes', async ({ page }) => {
    await page.goto('/#/calculators/water-merchant');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2.panel-title')).toContainText('Water Merchant');
    
    // Get baseline output
    const getRemovalBudget = async () => {
      const text = await page.textContent('text=/Removal budget/');
      const match = text?.match(/([\d.]+)\s*mL/);
      return match ? parseFloat(match[1]) : 0;
    };
    
    const baseline = await getRemovalBudget();
    console.log('Water Merchant baseline removal budget:', baseline, 'mL');
    
    // Change dirtiness multiplier (default 2) to 4
    await page.fill('input#water-dirtiness', '4');
    await page.waitForTimeout(500);
    
    const changed = await getRemovalBudget();
    console.log('Water Merchant changed removal budget:', changed, 'mL');
    
    expect(changed).not.toBe(baseline);
    console.log('✓ Water Merchant calculator is reactive');
  });

  test('Hydroponic Farmer - reactive calculator', async ({ page }) => {
    await page.goto('/#/calculators/hydroponic-farmer');
    await page.waitForLoadState('networkidle');
    
    const getHarvest = async () => {
      const text = await page.textContent('text=/Expected harvest count/');
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const baseline = await getHarvest();
    console.log('Hydroponic baseline harvest:', baseline);
    
    // Change quality bonus
    await page.fill('input#hydro-quality', '100');
    await page.waitForTimeout(500);
    
    const changed = await getHarvest();
    console.log('Hydroponic changed harvest:', changed);
    
    expect(changed).toBeGreaterThan(baseline);
    console.log('✓ Hydroponic Farmer calculator is reactive');
  });

  test('Aquafarmer - reactive calculator with numeric changes', async ({ page }) => {
    await page.goto('/#/calculators/aquafarmer');
    await page.waitForLoadState('networkidle');
    
    const getPotentialCalories = async () => {
      const text = await page.textContent('text=/Potential meat calories/');
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const baseline = await getPotentialCalories();
    console.log('Aquafarmer baseline calories:', baseline);
    
    // Change absorbed calories (default 5000) to 10000
    await page.fill('input#absorbed-calories', '10000');
    await page.waitForTimeout(500);
    
    const changed = await getPotentialCalories();
    console.log('Aquafarmer changed calories:', changed);
    
    expect(changed).not.toBe(baseline);
    expect(changed).toBeGreaterThan(baseline);
    console.log('✓ Aquafarmer calculator is reactive');
  });

  test('Rat Wrangler - reactive calculator with numeric changes', async ({ page }) => {
    await page.goto('/#/calculators/rat-wrangler');
    await page.waitForLoadState('networkidle');
    
    const getBaseValue = async () => {
      const text = await page.textContent('text=/Static base-value total/');
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const baseline = await getBaseValue();
    console.log('Rat baseline value:', baseline, 'Credits');
    
    // Change weight (default 400) to 600
    await page.fill('input#rat-weight', '600');
    await page.waitForTimeout(500);
    
    const changed = await getBaseValue();
    console.log('Rat changed value:', changed, 'Credits');
    
    expect(changed).not.toBe(baseline);
    expect(changed).toBeGreaterThan(baseline);
    console.log('✓ Rat Wrangler calculator is reactive');
  });

  test('Gunsmith - reactive calculator with numeric changes', async ({ page }) => {
    await page.goto('/#/calculators/gunsmith');
    await page.waitForLoadState('networkidle');
    
    const getBonus = async () => {
      const text = await page.textContent('text=/Additive bonus/');
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const baseline = await getBonus();
    console.log('Gunsmith baseline bonus:', baseline, 'Credits');
    
    // Change firepower (default 18) to 30
    await page.fill('input#gun-firepower', '30');
    await page.waitForTimeout(500);
    
    const changed = await getBonus();
    console.log('Gunsmith changed bonus:', changed, 'Credits');
    
    expect(changed).not.toBe(baseline);
    console.log('✓ Gunsmith calculator is reactive');
  });

  test('Fence - reactive calculator', async ({ page }) => {
    await page.goto('/#/calculators/fence');
    await page.waitForLoadState('networkidle');
    
    const getCash = async () => {
      const text = await page.textContent('text=/Cash after cycles/');
      const match = text?.match(/(-?\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const baseline = await getCash();
    console.log('Fence baseline cash:', baseline);
    
    await page.fill('input#fence-cash', '500');
    await page.waitForTimeout(500);
    
    const changed = await getCash();
    console.log('Fence changed cash:', changed);
    
    expect(changed).toBeGreaterThan(baseline);
    console.log('✓ Fence calculator is reactive');
  });

  test('Apprentice - reactive calculator', async ({ page }) => {
    await page.goto('/#/calculators/apprentice');
    await page.waitForLoadState('networkidle');
    
    const getCash = async () => {
      const text = await page.textContent('text=/Cash after cycles/');
      const match = text?.match(/(-?\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const baseline = await getCash();
    console.log('Apprentice baseline cash:', baseline);
    
    await page.fill('input#apprentice-cash', '600');
    await page.waitForTimeout(500);
    
    const changed = await getCash();
    console.log('Apprentice changed cash:', changed);
    
    expect(changed).toBeGreaterThan(baseline);
    console.log('✓ Apprentice calculator is reactive');
  });

  test('Rock Bottom - reactive calculator', async ({ page }) => {
    await page.goto('/#/calculators/rock-bottom');
    await page.waitForLoadState('networkidle');
    
    const getCash = async () => {
      const text = await page.textContent('text=/Cash after cycles/');
      const match = text?.match(/(-?\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const baseline = await getCash();
    console.log('Rock Bottom baseline cash:', baseline);
    
    await page.fill('input#rock-bottom-cash', '100');
    await page.waitForTimeout(500);
    
    const changed = await getCash();
    console.log('Rock Bottom changed cash:', changed);
    
    expect(changed).toBeGreaterThan(baseline);
    console.log('✓ Rock Bottom calculator is reactive');
  });
});
