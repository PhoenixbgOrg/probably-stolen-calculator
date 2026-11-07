import { test, expect, type Page } from '@playwright/test';
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

/** Finite budget after the Starting Perks grid is shown — not a sleep, not a retry loop. */
const PERK_DECODE_BUDGET_MS = 10_000;

type IconSnap = {
  id: string;
  missing: boolean;
  complete: boolean;
  naturalWidth: number;
  currentSrc: string;
  src: string;
  decodeOk: boolean;
  decodeError: string | null;
  errorFired: boolean;
};

async function snapshotPerkIcons(page: Page, ids: string[]): Promise<IconSnap[]> {
  return page.evaluate(async (perkIds) => {
    const snaps: IconSnap[] = [];
    for (const id of perkIds) {
      const img = document.querySelector(`[data-testid="icon-${id}"]`);
      if (!(img instanceof HTMLImageElement)) {
        snaps.push({
          id,
          missing: true,
          complete: false,
          naturalWidth: 0,
          currentSrc: '',
          src: '',
          decodeOk: false,
          decodeError: 'element missing',
          errorFired: false,
        });
        continue;
      }
      let errorFired = false;
      const onErr = () => {
        errorFired = true;
      };
      img.addEventListener('error', onErr);
      let decodeOk = false;
      let decodeError: string | null = null;
      try {
        await img.decode();
        decodeOk = true;
      } catch (error) {
        decodeError = error instanceof Error ? error.message : String(error);
      }
      img.removeEventListener('error', onErr);
      snaps.push({
        id,
        missing: false,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        currentSrc: img.currentSrc,
        src: img.src,
        decodeOk,
        decodeError,
        errorFired,
      });
    }
    return snaps;
  }, ids);
}

function diagnoseUndecoded(
  snaps: IconSnap[],
  iconResponses: Map<string, { status: number; contentType: string | null }>,
  imgErrors: unknown[],
): string {
  const failed = snaps.filter((snap) => snap.naturalWidth <= 0 || !snap.decodeOk || snap.errorFired || snap.missing);
  const rows = failed.map((snap) => {
    const net = [...iconResponses.entries()].find(([url]) => url.includes(`/icons/${snap.id}.svg`));
    return {
      id: snap.id,
      src: snap.currentSrc || snap.src,
      complete: snap.complete,
      naturalWidth: snap.naturalWidth,
      decodeOk: snap.decodeOk,
      decodeError: snap.decodeError,
      errorFired: snap.errorFired,
      network: net ? { url: net[0], ...net[1] } : 'no matching /icons/ response recorded',
    };
  });
  return JSON.stringify({ failedCount: rows.length, failed: rows, imgErrorEvents: imgErrors }, null, 2);
}

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
    const iconResponses = new Map<string, { status: number; contentType: string | null }>();
    page.on('response', (response) => {
      if (!response.url().includes('/icons/')) return;
      iconResponses.set(response.url(), {
        status: response.status(),
        contentType: response.headers()['content-type'] ?? null,
      });
    });

    await page.goto('./#/character-builder', { waitUntil: 'load' });
    await page.locator('[data-spec="chemist"]').click();
    await page.getByRole('button', { name: '2. Starting Perks' }).click();
    await expect(page.locator('.perk-grid')).toBeVisible();
    await page.evaluate(() => {
      const w = window as unknown as { __perkImgErrors: Array<Record<string, unknown>> };
      w.__perkImgErrors = [];
      document.querySelectorAll('img[data-testid^="icon-"]').forEach((node) => {
        node.addEventListener('error', () => {
          const img = node as HTMLImageElement;
          w.__perkImgErrors.push({
            testId: img.getAttribute('data-testid'),
            src: img.currentSrc || img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
          });
        });
      });
    });

    expect(PERKS).toHaveLength(48);
    const perkIds = PERKS.map((perk) => perk.id);
    const srcs = new Set<string>();

    for (const perk of PERKS) {
      const icon = page.getByTestId(`icon-${perk.id}`);
      await expect(icon).toBeVisible();
      await expect(icon).toHaveAttribute('alt', new RegExp(perk.name, 'i'));
      await expect(icon).toHaveAttribute('alt', /not a game sprite/i);
      await icon.scrollIntoViewIfNeeded();
      const src = await icon.getAttribute('src');
      expect(src, perk.id).toBeTruthy();
      expect(src, perk.id).toMatch(new RegExp(`/icons/${perk.id}\\.svg(?:$|\\?)`));
      srcs.add(src!);
    }
    expect(srcs.size, '48 distinct perk icon URLs').toBe(48);

    try {
      await expect
        .poll(
          async () => {
            const widths = await page.evaluate((ids) => {
              return ids.map((id) => {
                const img = document.querySelector(`[data-testid="icon-${id}"]`);
                return img instanceof HTMLImageElement ? img.naturalWidth : 0;
              });
            }, perkIds);
            return widths.filter((width) => width > 0).length;
          },
          {
            timeout: PERK_DECODE_BUDGET_MS,
            intervals: [50, 100, 250, 500],
            message: 'all 48 perk images decoded (naturalWidth > 0) within 10s after Starting Perks load',
          },
        )
        .toBe(48);
    } catch (pollError) {
      const snaps = await snapshotPerkIcons(page, perkIds);
      const imgErrors = await page.evaluate(() => (window as unknown as { __perkImgErrors: unknown[] }).__perkImgErrors ?? []);
      throw new Error(
        `Perk images not all decoded within ${PERK_DECODE_BUDGET_MS}ms after Starting Perks load.\n${diagnoseUndecoded(snaps, iconResponses, imgErrors)}\n${String(pollError)}`,
      );
    }

    const snaps = await snapshotPerkIcons(page, perkIds);
    const imgErrors = await page.evaluate(() => (window as unknown as { __perkImgErrors: unknown[] }).__perkImgErrors ?? []);
    const failed = snaps.filter((snap) => snap.naturalWidth <= 0 || !snap.decodeOk || snap.errorFired || snap.missing);
    expect(failed, diagnoseUndecoded(snaps, iconResponses, imgErrors)).toHaveLength(0);
    expect(snaps).toHaveLength(48);
    for (const snap of snaps) {
      expect(snap.naturalWidth, snap.id).toBeGreaterThan(0);
    }
  });
});
