import { test, expect, type Page } from '@playwright/test';

async function openCalculator(page: Page, id: string, heading: string) {
  await page.goto(`./#/calculators/${id}`, { waitUntil: 'load' });
  await expect(page.locator('h2.panel-title')).toContainText(heading);
}

async function outputNumber(page: Page, label: string) {
  const text = await page.locator('.output-row', { hasText: label }).locator('strong').innerText();
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

test.describe('Profession calculators — numeric reactivity', () => {
  test('Water Merchant removal budget changes with dirtiness', async ({ page }) => {
    await openCalculator(page, 'water-merchant', 'Water Merchant');
    const before = await outputNumber(page, 'Removal budget');
    await page.locator('#water-dirtiness').fill('4');
    const after = await outputNumber(page, 'Removal budget');
    expect(before).toBeGreaterThan(0);
    expect(after).not.toBe(before);
  });

  test('Hydroponic Farmer harvest count rises with quality', async ({ page }) => {
    await openCalculator(page, 'hydroponic-farmer', 'Hydroponic Farmer');
    const before = await outputNumber(page, 'Expected harvest count');
    await page.locator('#hydro-quality').fill('100');
    const after = await outputNumber(page, 'Expected harvest count');
    expect(after).toBeGreaterThan(before);
  });

  test('Aquafarmer calories scale with absorbed calories', async ({ page }) => {
    await openCalculator(page, 'aquafarmer', 'Aquafarmer');
    const before = await outputNumber(page, 'Potential meat calories');
    await page.locator('#absorbed-calories').fill('10000');
    const after = await outputNumber(page, 'Potential meat calories');
    expect(after).toBeGreaterThan(before);
  });

  test('Rat Wrangler base value scales with weight', async ({ page }) => {
    await openCalculator(page, 'rat-wrangler', 'Rat Wrangler');
    const before = await outputNumber(page, 'Static base-value total');
    await page.locator('#rat-weight').fill('600');
    const after = await outputNumber(page, 'Static base-value total');
    expect(after).toBeGreaterThan(before);
  });

  test('Gunsmith additive bonus changes with firepower', async ({ page }) => {
    await openCalculator(page, 'gunsmith', 'Gunsmith');
    await page.locator('#gun-order').selectOption('firepower');
    const before = await outputNumber(page, 'Additive bonus');
    await page.locator('#gun-firepower').fill('25');
    const after = await outputNumber(page, 'Additive bonus');
    expect(before).toBeGreaterThan(0);
    expect(after).toBeGreaterThan(before);
  });

  test('Fence cash after cycles tracks starting cash', async ({ page }) => {
    await openCalculator(page, 'fence', 'Fence');
    const before = await outputNumber(page, 'Cash after cycles');
    await page.locator('#fence-cash').fill('500');
    const after = await outputNumber(page, 'Cash after cycles');
    expect(after).toBeGreaterThan(before);
  });

  test('Apprentice cash after cycles tracks starting cash', async ({ page }) => {
    await openCalculator(page, 'apprentice', 'Apprentice');
    const before = await outputNumber(page, 'Cash after cycles');
    await page.locator('#apprentice-cash').fill('600');
    const after = await outputNumber(page, 'Cash after cycles');
    expect(after).toBeGreaterThan(before);
  });

  test('Rock Bottom cash after cycles tracks starting cash', async ({ page }) => {
    await openCalculator(page, 'rock-bottom', 'Rock Bottom');
    const before = await outputNumber(page, 'Cash after cycles');
    await page.locator('#rock-bottom-cash').fill('100');
    const after = await outputNumber(page, 'Cash after cycles');
    expect(after).toBeGreaterThan(before);
  });
});
