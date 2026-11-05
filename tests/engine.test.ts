import { describe, expect, it } from 'vitest';
import { REGISTRY, validateRegistry } from '../src/data/registry';
import { addPerk, evaluatePerks, normalizeSelection, removePerk, whyCannotAdd } from '../src/engine/perkEngine';
import { buildCharacter, createModifierQuery } from '../src/engine/character';
import { EMPTY_BUILD } from '../src/engine/types';

const R = REGISTRY;
const S = 'subsequent' as const;
const codes = (ids: string[], p: string, pt: 'first' | 'subsequent' = S) => whyCannotAdd(R, ids, p, pt).map((r) => r.code);

describe('registry', () => {
  it('is internally consistent', () => expect(validateRegistry(R)).toEqual([]));
  it('has 9 playable specializations and 48 perks', () => {
    expect(R.specializations.filter((s) => s.playable)).toHaveLength(9);
    expect(R.perks).toHaveLength(48);
  });
  it('every record carries provenance', () => {
    for (const p of [...R.perks, ...R.specializations]) {
      expect(p.sources.length).toBeGreaterThan(0);
      expect(['verified', 'partially-verified', 'unverified', 'conflicting']).toContain(p.status);
      expect(p.gameVersion).not.toBeUndefined();
    }
  });
  it('core rules are 3 points / 4 slots', () => {
    expect(R.rules.basePoints.value).toBe(3);
    expect(R.rules.baseSlots.value).toBe(4);
  });
  it('conflicting apprentice credits are null, not invented', () => {
    const a = R.specializations.find((s) => s.id === 'apprentice')!;
    expect(a.startingCredits.value).toBeNull();
    expect(a.startingCredits.status).toBe('conflicting');
  });
});

describe('points', () => {
  it('empty build has 3 points', () => {
    const e = evaluatePerks(R, []);
    expect(e).toMatchObject({ totalPoints: 3, remainingPoints: 3, usedSlots: 0, maxSlots: 4, valid: true });
  });
  it('positive perks spend, negative perks grant', () => {
    const e = evaluatePerks(R, ['ascetic', 'diplomatic', 'vigilant']);
    expect(e.totalPoints).toBe(7);
    expect(e.pointsSpent).toBe(4);
    expect(e.remainingPoints).toBe(3);
  });
  it('rejects a perk that is too expensive with a reason', () => {
    const ids = ['diplomatic'];
    expect(codes(ids, 'vigilant')).toContain('not-enough-points');
    const r = addPerk(R, ids, 'vigilant', S);
    expect(r.ok).toBe(false);
  });
  it('free perks cost nothing', () => {
    expect(evaluatePerks(R, ['hoarder']).remainingPoints).toBe(3);
  });
  it('restores points on deselect', () => {
    const r = removePerk(R, ['diplomatic', 'savings'], 'diplomatic', S);
    expect(r.perkIds).toEqual(['savings']);
    expect(evaluatePerks(R, r.perkIds).remainingPoints).toBe(2);
  });
});

describe('invalid combinations', () => {
  it('blocks mutually exclusive perks both ways', () => {
    expect(codes(['lucky'], 'unlucky')).toContain('conflict');
    expect(codes(['unlucky'], 'lucky')).toContain('conflict');
    expect(codes(['ascetic'], 'minimalist')).toContain('conflict');
  });
  it('blocks duplicates and unknown ids', () => {
    expect(codes(['lucky'], 'lucky')).toContain('already-selected');
    expect(codes([], 'nope')).toEqual(['unknown-perk']);
  });
  it('first playthrough locks all perks', () => {
    expect(codes([], 'lucky', 'first')).toContain('first-run-locked');
    expect(normalizeSelection(R, ['lucky'], 'first').perkIds).toEqual([]);
  });
  it('supports prerequisites (synthetic data)', () => {
    const reg = { ...R, perks: R.perks.map((p) => (p.id === 'lucky' ? { ...p, requires: ['hoarder'] } : p)) };
    expect(whyCannotAdd(reg, [], 'lucky', S).map((r) => r.code)).toContain('missing-prerequisite');
    expect(whyCannotAdd(reg, ['hoarder'], 'lucky', S)).toEqual([]);
    const r = removePerk(reg, ['hoarder', 'lucky'], 'hoarder', S);
    expect(r.perkIds).toEqual([]);
    expect(r.removed[0]!.reason.code).toBe('missing-prerequisite');
  });
  it('perks with an unknown cost cannot be selected', () => {
    const reg = { ...R, perks: R.perks.map((p) => (p.id === 'lucky' ? { ...p, cost: { ...p.cost, value: null } } : p)) };
    expect(whyCannotAdd(reg, [], 'lucky', S).map((r) => r.code)).toContain('unknown-cost');
  });
});

describe('slots', () => {
  it('limits to 4 perks', () => {
    const ids = ['hoarder', 'careful-scavenger', 'prime-real-estate', 'lucky'];
    expect(evaluatePerks(R, ids).valid).toBe(true);
    expect(codes(ids, 'ascetic')).toContain('no-free-slot');
  });
  it('negative perks also use a slot', () => {
    const ids = ['ascetic', 'awful-negotiator', 'blabbermouth', 'convict'];
    expect(codes(ids, 'illiterate')).toContain('no-free-slot');
  });
  it('Colorful Character adds 3 slots', () => {
    const e = evaluatePerks(R, ['colorful-character']);
    expect(e.maxSlots).toBe(7);
    const ids = ['colorful-character', 'ascetic', 'awful-negotiator', 'hoarder', 'careful-scavenger', 'prime-real-estate'];
    expect(evaluatePerks(R, ids).valid).toBe(true);
    expect(whyCannotAdd(R, ids, 'convict', S)).toEqual([]);
  });
  it('removing Colorful Character cascades LIFO and restores consistency', () => {
    const ids = ['colorful-character', 'ascetic', 'awful-negotiator', 'diplomatic', 'vigilant', 'hoarder', 'well-connected'];
    expect(evaluatePerks(R, ids).valid).toBe(true);
    const r = removePerk(R, ids, 'colorful-character', S);
    expect(r.perkIds).toEqual(['ascetic', 'awful-negotiator', 'diplomatic', 'vigilant']);
    expect(r.removed.map((x) => x.perkId)).toEqual(['well-connected', 'hoarder']);
    expect(evaluatePerks(R, r.perkIds).valid).toBe(true);
  });
  it('removing a point-granting perk drops the latest paid perks', () => {
    const r = removePerk(R, ['ascetic', 'diplomatic', 'vigilant', 'savings'], 'ascetic', S);
    // LIFO: savings (most recent paid) goes first, then vigilant; diplomatic (2 pts) fits the 3 base points.
    expect(r.perkIds).toEqual(['diplomatic']);
    expect(r.removed.map((x) => [x.perkId, x.reason.code])).toEqual([['savings', 'not-enough-points'], ['vigilant', 'not-enough-points']]);
  });
});

describe('normalization (load/import)', () => {
  it('is deterministic and reports every drop', () => {
    const input = ['lucky', 'ghost', 'unlucky', 'lucky', 'diplomatic', 'vigilant'];
    const a = normalizeSelection(R, input, S);
    expect(a).toEqual(normalizeSelection(R, input, S));
    expect(a.perkIds).toEqual(['lucky', 'diplomatic']);
    expect(a.removed.map((r) => r.reason.code).sort()).toEqual(['conflict', 'not-enough-points', 'unknown-perk']);
  });
  it('keeps a valid set even if negatives come later', () => {
    expect(normalizeSelection(R, ['diplomatic', 'vigilant', 'ascetic'], S).perkIds).toEqual(['diplomatic', 'vigilant', 'ascetic']);
  });
});

describe('character overview', () => {
  it('derives credits, rent and modifiers from one state', () => {
    const c = buildCharacter(R, { ...EMPTY_BUILD, specializationId: 'water-merchant', perkIds: ['savings', 'bad-lease'] });
    expect(c.startingCredits.value).toBe(550);
    expect(c.startingRent.value).toBe(240);
    expect(c.points.remainingPoints).toBe(3);
    const q = createModifierQuery(c);
    expect(q.total('startingCredits').value).toBe(150);
  });
  it('unknown base stays unknown', () => {
    const c = buildCharacter(R, { ...EMPTY_BUILD, specializationId: 'apprentice', perkIds: ['savings'] });
    expect(c.startingCredits.value).toBeNull();
    expect(c.warnings.join(' ')).toMatch(/disputed/);
  });
  it('set-modifiers override base (Ascetic inventory)', () => {
    const c = buildCharacter(R, { ...EMPTY_BUILD, perkIds: ['ascetic'] });
    expect(c.inventoryWidth.value).toBe(16);
  });
  it('exposes flags', () => {
    const c = buildCharacter(R, { ...EMPTY_BUILD, perkIds: ['maimed'] });
    expect(createModifierQuery(c).hasFlag('noScavenging')).toBe(true);
  });
});
