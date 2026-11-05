import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../src/data/registry';
import { EMPTY_BUILD } from '../src/engine/types';
import type { BuildInput } from '../src/engine/types';
import { perkActionView, perksInOrder, shouldClearBlockedBanner } from '../src/engine/perkView';
import { pixelPattern } from '../src/ui/PixelIcon';
import { emptyStore } from '../src/persistence/store';
import { initState, makeReducer } from '../src/state/reducer';
import { validate } from '../src/engine/perkEngine';

const reg = REGISTRY;
const later: BuildInput = { ...EMPTY_BUILD, playthrough: 'subsequent' };

describe('display order', () => {
  it('every specialization and perk has a unique, contiguous order', () => {
    for (const list of [reg.specializations, reg.perks]) {
      const orders = list.map((x) => x.order).sort((a, b) => a - b);
      expect(orders).toEqual(list.map((_, i) => i + 1));
    }
  });
  it('specializations follow the documented start-screen order with Junker last', () => {
    const names = [...reg.specializations].sort((a, b) => a.order - b.order).map((s) => s.name);
    expect(names[0]).toBe('Apprentice');
    expect(names[names.length - 1]).toBe('Junker');
    expect(names).toHaveLength(10);
  });
  it('perks are grouped positive, neutral, negative', () => {
    const rank = { positive: 0, neutral: 1, negative: 2 } as const;
    const r = perksInOrder(reg).map((p) => rank[p.category.value ?? 'neutral']);
    expect(r).toEqual([...r].sort((a, b) => a - b));
    expect(perksInOrder(reg)).toHaveLength(reg.perks.length);
  });
  it('ordering provenance is documented with known sources', () => {
    const ids = new Set(Object.keys(reg.sources));
    for (const p of [reg.ordering.specializations, reg.ordering.perks]) {
      expect(p.sources.length).toBeGreaterThan(0);
      for (const s of p.sources) expect(ids.has(s)).toBe(true);
    }
    expect(reg.ordering.perks.status).toBe('unverified');
  });
});

describe('perk view: viewing is separate from add/remove', () => {
  const pos = reg.perks.find((p) => p.category.value === 'positive' && (p.cost.value ?? 99) <= reg.rules.basePoints.value!)!;
  it('describes an unselected affordable perk as "Add perk" without changing the build', () => {
    const v = perkActionView(reg, later, pos.id)!;
    expect(v.kind).toBe('add');
    expect(v.selected).toBe(false);
    expect(later.perkIds).toEqual([]);
  });
  it('shows "Remove perk" for a selected perk', () => {
    const v = perkActionView(reg, { ...later, perkIds: [pos.id] }, pos.id)!;
    expect(v.kind).toBe('remove');
    expect(v.label).toBe('Remove perk');
  });
  it('blocks adding on a first playthrough with a reason', () => {
    const v = perkActionView(reg, { ...later, playthrough: 'first' }, pos.id)!;
    expect(v.kind).toBe('blocked');
    expect(v.blockers.length).toBeGreaterThan(0);
  });
  it('warns that adding a mutually exclusive perk makes the build invalid', () => {
    const [a, b] = reg.rules.exclusions[0]!.perks;
    const v = perkActionView(reg, { ...later, perkIds: [a] }, b)!;
    expect(v.kind).toBe('add');
    expect(v.wouldBreak.length).toBeGreaterThan(0);
    expect(v.label).toMatch(/invalid/);
  });
  it('returns null for an unknown perk', () => {
    expect(perkActionView(reg, later, 'nope')).toBeNull();
  });
  it('reducer: togglePerk adds and removePerk removes; nothing is auto-removed', () => {
    const red = makeReducer(reg);
    let s = initState(emptyStore(), []);
    s = red(s, { type: 'setPlaythrough', playthrough: 'subsequent' });
    const [a, b] = reg.rules.exclusions[0]!.perks;
    s = red(s, { type: 'togglePerk', perkId: a });
    s = red(s, { type: 'togglePerk', perkId: b });
    expect(s.build.perkIds).toEqual([a, b]);
    expect(validate(reg, s.build).length).toBeGreaterThan(0);
    s = red(s, { type: 'removePerk', perkId: a });
    expect(s.build.perkIds).toEqual([b]);
  });
});

describe('Reset Build', () => {
  it('resets specialization, difficulty, playthrough and perks to the empty build', () => {
    const red = makeReducer(reg);
    let s = initState(emptyStore(), []);
    const spec = reg.specializations.find((x) => x.playable)!;
    s = red(s, { type: 'selectSpecialization', id: spec.id });
    s = red(s, { type: 'setPlaythrough', playthrough: 'subsequent' });
    s = red(s, { type: 'togglePerk', perkId: reg.perks[0]!.id });
    expect(s.build).not.toEqual(EMPTY_BUILD);
    s = red(s, { type: 'resetBuild' });
    expect(s.build).toEqual(EMPTY_BUILD);
    const active = s.store.profiles.find((p) => p.id === s.store.activeProfileId)!;
    expect(active.build).toEqual(EMPTY_BUILD);
  });
});

describe('stale blocked banner', () => {
  it('clears when the build becomes valid or the profile changes', () => {
    expect(shouldClearBlockedBanner('p1', 'p1', false)).toBe(false);
    expect(shouldClearBlockedBanner('p1', 'p1', true)).toBe(true);
    expect(shouldClearBlockedBanner('p1', 'p2', false)).toBe(true);
  });
});

describe('pixel icons', () => {
  it('are deterministic, symmetric and differ between perks', () => {
    const a = pixelPattern('alpha');
    expect(pixelPattern('alpha')).toEqual(a);
    for (const row of a) expect(row).toEqual([...row].reverse());
    expect(pixelPattern('beta')).not.toEqual(a);
  });
});
