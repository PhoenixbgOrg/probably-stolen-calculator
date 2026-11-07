import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ICON_MANIFEST, getIconEntry, iconManifestSummary } from '../src/data/iconManifest';
import { PERKS } from '../src/data/perks';
import { SPECIALIZATIONS } from '../src/data/specializations';

const iconDir = join(process.cwd(), 'public/icons');

describe('icon mapping 9 professions / 48 perks / chemist kit', () => {
  test('manifest covers playable professions, 48 perks, and chemist kit', () => {
    const summary = iconManifestSummary();
    expect(summary.professionsOriginal).toBe(9);
    expect(summary.perksOriginal).toBe(48);
    expect(summary.machinesOriginal).toBeGreaterThanOrEqual(7);
    expect(summary.chemicalsOriginal).toBeGreaterThanOrEqual(7);
    expect(summary.appearanceUnverified).toBe(ICON_MANIFEST.length);
    expect(PERKS).toHaveLength(48);
    for (const perk of PERKS) {
      expect(getIconEntry(perk.id), perk.id).toBeDefined();
    }
    for (const spec of SPECIALIZATIONS.filter((row) => row.playable)) {
      expect(getIconEntry(spec.id), spec.id).toBeDefined();
    }
  });

  test('every manifest row has an on-disk SVG, a name URL, and honest unlicensed artwork status', () => {
    const hashes = new Set<string>();
    for (const entry of ICON_MANIFEST) {
      const path = join(process.cwd(), 'public', entry.assetPath);
      expect(existsSync(path), entry.assetPath).toBe(true);
      const svg = readFileSync(path, 'utf8');
      expect(svg).toContain('not a game sprite');
      expect(svg).toContain('shape-rendering="crispEdges"');
      expect(hashes.has(svg), `${entry.id} duplicated another tile`).toBe(false);
      hashes.add(svg);
      expect(entry.nameReferenceUrl.startsWith('https://')).toBe(true);
      expect(entry.individualArtworkUrl).toBeNull();
      expect(entry.artworkPermission).toBe('none-found');
      expect(entry.appearanceVerifiedVsGameSprite).toBe(false);
      expect(entry.caption).toMatch(/not a game sprite/i);
    }
    expect(readdirSync(iconDir).filter((name) => name.endsWith('.svg')).length).toBe(ICON_MANIFEST.length);
  });
});
