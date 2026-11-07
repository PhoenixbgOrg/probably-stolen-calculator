import { describe, expect, test } from 'vitest';
import { ICON_MANIFEST, iconManifestSummary } from '../src/data/iconManifest';

describe('icon mapping 9 professions / 48 perks', () => {
  test('original silhouettes exist for playable professions and perks; machines/chemicals are missing', () => {
    const summary = iconManifestSummary();
    expect(summary.professionsOriginal).toBe(9);
    expect(summary.perksOriginal).toBe(48);
    expect(summary.machinesMissing).toBeGreaterThan(0);
    expect(summary.chemicalsMissing).toBeGreaterThan(0);
    expect(ICON_MANIFEST.every((entry) => entry.license !== undefined)).toBe(true);
    expect(ICON_MANIFEST.filter((entry) => entry.kind === 'machine').every((entry) => entry.asset === 'none')).toBe(true);
  });
});
