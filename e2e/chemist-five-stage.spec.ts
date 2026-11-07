import { test, expect, type Page } from '@playwright/test';

async function fillId(page: Page, id: string, value: string) {
  await page.locator(`#${id}`).first().fill(value);
}

async function measuredTenAndFourHundred(page: Page) {
  await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
  await fillId(page, 'ground-total', '10');
  await fillId(page, 'ground-mush', '10');
  await fillId(page, 'solvent-liquid', '400');
}

test.describe('Chemist five-stage wizard on built Pages base path', () => {
  test('Calc/Continue gating, acid stock vs dose, nights, and dry final mix', async ({ page }) => {
    await measuredTenAndFourHundred(page);
    await expect(page.getByRole('button', { name: /^Final Dust/ })).toBeDisabled();
    await page.getByTestId('calculate-ground').click();
    await expect(page.getByText('Available Alcohol / all available Mush')).toBeVisible();
    await expect(page.getByText('Selected batch Alcohol / Mush ratio')).toBeVisible();
    await expect(page.getByTestId('alcohol-mush-ratio')).toHaveText('40.00');
    await expect(page.getByTestId('selected-batch-alcohol-mush-ratio')).toHaveText('40.00');
    await expect(page.getByTestId('unused-ground-ul')).toHaveText('0.000 mL');
    await expect(page.getByTestId('initial-vessel-ul')).toContainText('410.000 mL / 2000.000 mL');
    await page.getByTestId('continue-prediction-ground').click();
    await expect(page.getByTestId('stage-extraction')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Final Dust/ })).toBeDisabled();

    await page.getByTestId('calculate-extraction').click();
    await expect(page.getByTestId('predicted-extraction').getByTestId('snapshot-dreamCapExtract-ul')).toHaveText('5.000 mL');
    const leftoverMush = page.getByTestId('predicted-extraction').getByTestId('snapshot-dreamCapMush-ul');
    if (await leftoverMush.count()) {
      await expect(leftoverMush).toHaveText('0.000 mL');
    }
    await page.getByTestId('continue-prediction-extraction').click();
    await expect(page.getByTestId('stage-acidBase')).toBeVisible();

    await fillId(page, 'acid-reag-acid', '5');
    await fillId(page, 'acid-dose', '2');
    await page.getByTestId('add-acid-dose').click();
    await expect(page.getByTestId('acid-remaining-value')).toHaveText('3.000 mL');
    await fillId(page, 'base-reag-base', '4');
    await fillId(page, 'base-dose', '1');
    await page.getByTestId('add-base-dose').click();
    await expect(page.getByTestId('base-remaining-value')).toHaveText('3.000 mL');
    await page.getByTestId('calculate-acidBase').click();
    await page.getByTestId('continue-prediction-acidBase').click();
    await expect(page.getByTestId('stage-filterEvap')).toBeVisible();

    const kottonBefore = await page.locator('#kotton').inputValue();
    await page.getByTestId('calculate-filterEvap').click();
    await page.getByTestId('continue-prediction-filterEvap').click();
    await expect(page.getByRole('button', { name: /^Final Dust/ })).toBeDisabled();

    await page.getByTestId('calculate-next-night').click();
    await expect(page.getByTestId('pending-night')).toContainText('300.000 mL');
    await expect(page.getByTestId('pending-night')).toContainText('6 kJ');
    await expect(page.getByTestId('pending-night')).toContainText('remaining energy 6 kJ');
    await page.getByTestId('confirm-night').click();
    await expect(page.getByTestId('no-refilter')).toContainText('Filtration was not reapplied');
    await page.getByTestId('calculate-next-night').click();
    await expect(page.getByTestId('pending-night')).toContainText('Night 2');
    await expect(page.getByTestId('pending-night')).toContainText('remaining energy 0 kJ');
    await page.getByTestId('confirm-night').click();
    await expect(page.locator('#kotton')).toHaveValue(kottonBefore);
    await expect(page.getByTestId('no-refilter')).toContainText('Last confirmed night 2');
    await expect(page.getByTestId('continue-final')).toBeEnabled();
    await page.getByRole('button', { name: /^Acid \/ Base/ }).click();
    await expect(page.getByTestId('acid-remaining-value')).toHaveText('3.000 mL');
    await expect(page.getByTestId('base-remaining-value')).toHaveText('3.000 mL');
    await page.getByRole('button', { name: /^Filtration \/ Evaporation/ }).click();
    await page.getByTestId('continue-final').click();
    await expect(page.getByTestId('stage-final')).toBeVisible();
    await page.getByTestId('calculate-final').click();
    await expect(page.getByText(/Finisher dryness requires/)).toHaveCount(0);
    const vials = Number(await page.locator('.output-row', { hasText: 'Possible 2.000 mL vials' }).locator('strong').innerText());
    expect(vials).toBeGreaterThan(0);
    const purityText = await page.locator('.output-row', { hasText: 'Predicted mean purity' }).locator('strong').innerText();
    const purity = Number(purityText.replace('%', ''));
    expect(purity).toBeGreaterThan(0);
    expect(purity).not.toBe(97.95);
    expect(purity).not.toBe(97.1);
    await page.screenshot({ path: `test-results/chemist-five-stage-desktop.png`, fullPage: true });
  });

  test('mixed Alcohol 70% is a measured solvent, not inferred', async ({ page }) => {
    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await fillId(page, 'ground-total', '10');
    await fillId(page, 'ground-mush', '10');
    await fillId(page, 'solvent-liquid', '100');
    await page.getByLabel('Mixed / Measured').check();
    await fillId(page, 'solvent-alcohol', '70');
    await fillId(page, 'solvent-water', '30');
    await page.getByTestId('calculate-ground').click();
    await expect(page.locator('.output-row', { hasText: 'Alcohol component' })).toContainText('70.000 mL');
    await expect(page.getByTestId('alcohol-mush-ratio')).toHaveText('7.00');
    await expect(page.getByTestId('selected-batch-alcohol-mush-ratio')).toHaveText('7.00');
  });

  test('Back edit marks extraction stale; one field does not verify leftovers', async ({ page }) => {
    await measuredTenAndFourHundred(page);
    await page.getByTestId('calculate-ground').click();
    await page.getByTestId('continue-prediction-ground').click();
    await page.getByTestId('calculate-extraction').click();
    await page.getByText('Spectrometer draft (optional, field-by-field)').click();
    await page.locator('#extraction-read-dreamCapExtract').fill('4');
    await page.getByTestId('continue-readings-extraction').click();
    await expect(page.getByText(/Partial reading/i)).toBeVisible();
    await expect(page.getByText(/Verified by measurement/i)).toHaveCount(0);
    await page.getByRole('button', { name: /^Ground Mixture/ }).click();
    await fillId(page, 'ground-total', '12');
    await expect(page.getByText(/Stale:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Extraction \(stale\)/ })).toBeDisabled();
  });

  test('leftover unused ground stays leftover; receiver is spent once', async ({ page }) => {
    await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
    await fillId(page, 'ground-total', '10');
    await fillId(page, 'ground-mush', '10');
    await fillId(page, 'solvent-liquid', '10');
    await page.getByTestId('calculate-ground').click();
    await expect(page.getByTestId('unused-ground-ul')).toHaveText('8.000 mL');
    await fillId(page, 'solvent-liquid', '400');
    await page.getByTestId('calculate-ground').click();
    await expect(page.getByTestId('unused-ground-ul')).toHaveText('0.000 mL');
    await page.getByTestId('continue-prediction-ground').click();
    await page.getByTestId('calculate-extraction').click();
    await page.getByTestId('continue-prediction-extraction').click();
    await page.getByTestId('calculate-acidBase').click();
    await page.getByTestId('continue-prediction-acidBase').click();
    await fillId(page, 'receiver', '50');
    await fillId(page, 'evap-quality', '100');
    await page.getByTestId('stage-filterEvap').getByRole('checkbox', { name: /Solvent Recovery Module/ }).check();
    await page.getByTestId('calculate-filterEvap').click();
    await page.getByTestId('continue-prediction-filterEvap').click();
    await page.getByTestId('calculate-next-night').click();
    await expect(page.getByTestId('pending-night')).toContainText('remaining receiver 0.000 mL');
    const recoveredNight1 = await page.getByTestId('pending-night').innerText();
    expect(recoveredNight1).toMatch(/recovered 50\.000 mL/);
    await page.getByTestId('confirm-night').click();
    await page.getByTestId('calculate-next-night').click();
    await expect(page.getByTestId('pending-night')).toContainText('Night 2');
    await expect(page.getByTestId('pending-night')).toContainText('recovered 0.000 mL');
    await expect(page.getByTestId('pending-night')).toContainText('remaining receiver 0.000 mL');
  });

  test('chemist save leaves an old character profile in place', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'psc.profiles',
        JSON.stringify({
          schemaVersion: 2,
          activeProfileId: 'keep-me',
          profiles: [{ id: 'keep-me', name: 'Owner profile', createdAt: '2026-11-07', updatedAt: '2026-11-07', dataVersion: '2026-11-05.4', build: { specializationId: 'chemist', perkIds: [], playthrough: 'subsequent', difficulty: 'mark-up' } }],
          quarantine: [],
        }),
      );
    });
    await measuredTenAndFourHundred(page);
    await page.getByTestId('calculate-ground').click();
    await page.getByRole('button', { name: 'Save progress' }).click();
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#ground-mush')).toHaveValue('10');
    const profiles = await page.evaluate(() => localStorage.getItem('psc.profiles'));
    expect(profiles).toContain('keep-me');
  });
});

test.describe('viewport screenshots of built preview', () => {
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 },
  ] as const) {
    test(`chemist kit renders at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('./#/calculators/chemist', { waitUntil: 'load' });
      await expect(page.getByTestId('icon-evaporator')).toBeVisible();
      await expect(page.getByTestId('kit-name-evaporator')).toHaveText('Evaporator');
      await expect(page.getByTestId('kit-name-blender')).toHaveText('Blender');
      await expect(page.getByTestId('kit-name-heating-plate')).toHaveText('Heating Plate');
      await expect(page.getByTestId('kit-name-water-filter')).toHaveText('Water Filter');
      await expect(page.getByTestId('kit-name-chem-finisher')).toHaveText('Chem Finisher');
      await expect(page.getByTestId('icon-caption-evaporator')).toHaveText('Not a game sprite');
      await expect(page.locator('h1 .site-title')).toHaveText('Probably Stolen Calculator');
      const titleOverflow = await page.evaluate(() => {
        const heading = document.querySelector('h1');
        if (!(heading instanceof HTMLElement)) return { missing: true, right: 0, vw: 0 };
        const box = heading.getBoundingClientRect();
        return { missing: false, right: box.right, vw: window.innerWidth, text: heading.innerText };
      });
      expect(titleOverflow.missing).toBe(false);
      expect(titleOverflow.text).toContain('Probably Stolen Calculator');
      expect(titleOverflow.right).toBeLessThanOrEqual(titleOverflow.vw + 1);
      await page.screenshot({ path: `test-results/chemist-${viewport.name}.png`, fullPage: true });
    });
  }
});
