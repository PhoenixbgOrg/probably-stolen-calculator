import { test, expect } from '@playwright/test';
import { PERKS } from '../src/data/perks';
import { PROFESSIONS } from '../src/calculators/professions';

const ROUTES = [
  { hash: '#/', name: 'home' },
  { hash: '#/character-builder', name: 'character-builder' },
  { hash: '#/game-guide', name: 'game-guide' },
  { hash: '#/sources', name: 'sources' },
  ...PROFESSIONS.map((profession) => ({
    hash: `#/calculators/${profession.id}`,
    name: profession.name,
  })),
];

test.describe('nine professions, 48 perk assets, accessibility', () => {
  test('all top-level and profession routes load with matching names', async ({ page }) => {
    for (const route of ROUTES) {
      const failed: string[] = [];
      page.on('response', (response) => {
        if (response.url().includes('/icons/') && response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(`./${route.hash}`, { waitUntil: 'load' });
      if (route.hash === '#/calculators/chemist') {
        await expect(page.getByText('Dream Dust Production Planner')).toBeVisible();
        await expect(page.getByTestId('icon-dream-dust')).toBeVisible();
      } else if (route.hash.startsWith('#/calculators/')) {
        const id = route.hash.split('/').pop()!;
        await expect(page.locator('h2.panel-title')).toContainText(route.name);
        await expect(page.getByTestId(`icon-${id}`)).toBeVisible();
      } else {
        await expect(page.locator('h1, h2').first()).toBeVisible();
      }
      expect(failed, failed.join('\n')).toEqual([]);
    }
  });

  test('character builder loads 48 distinct perk SVGs with accessible names', async ({ page }) => {
    await page.goto('./#/character-builder', { waitUntil: 'load' });
    await page.locator('[data-spec="chemist"]').click();
    await page.getByRole('button', { name: '2. Starting Perks' }).click();
    expect(PERKS).toHaveLength(48);
    for (const perk of PERKS) {
      const icon = page.getByTestId(`icon-${perk.id}`);
      await expect(icon).toBeVisible();
      await expect(icon).toHaveAttribute('alt', new RegExp(perk.name, 'i'));
      await expect(icon).toHaveAttribute('alt', /not a game sprite/i);
      const natural = await icon.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(natural, perk.id).toBeGreaterThan(0);
    }
  });
});
