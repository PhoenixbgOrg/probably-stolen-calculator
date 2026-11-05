import { describe, expect, it } from 'vitest';
import { REGISTRY, validateRegistry } from '../src/data/registry';
import { addBlockers, evaluatePerks, isValid, offendingPerkIds, togglePerk, validate } from '../src/engine/perkEngine';
import { buildCharacter, createModifierQuery } from '../src/engine/character';
import { EMPTY_BUILD } from '../src/engine/types';
import type { BuildInput } from '../src/engine/types';
import { navigate } from '../src/state/navigation';

const R = REGISTRY;
const b = (perkIds: string[], extra: Partial<BuildInput> = {}): BuildInput => ({ ...EMPTY_BUILD, specializationId: 'fence', perkIds, ...extra });
const codes = (build: BuildInput, reg = R) => validate(reg, build).map((v) => v.code);

describe('registry', () => {
  it('is internally consistent', () => expect(validateRegistry(R)).toEqual([]));
  it('has 9 playable specializations, Junker as non-playable WIP, and 48 perks', () => {
    expect(R.specializations.filter((s) => s.playable)).toHaveLength(9);
    const j = R.specializations.find((s) => s.id === 'junker')!;
    expect(j.playable).toBe(false);
    expect(j.tag.value).toBe('Work in Progress');
    expect([j.startingCredits.value, j.startingRent.value, j.description.value]).toEqual([null, null, null]);
    expect(R.perks).toHaveLength(48);
  });
  it('every record carries provenance', () => {
    for (const p of [...R.perks, ...R.specializations, ...R.startRules, ...R.difficulties]) {
      expect(p.sources.length).toBeGreaterThan(0);
      expect(['verified', 'partially-verified', 'unverified', 'conflicting']).toContain(p.status);
      expect(p.gameVersion).not.toBeUndefined();
    }
  });
  it('core rules are 3 points / 4 slots, validated at Continue', () => {
    expect(R.rules.basePoints.value).toBe(3);
    expect(R.rules.baseSlots.value).toBe(4);
    expect(R.rules.validatedAtContinue.value).toBe(true);
  });
  it('Apprentice credits are 550 with the 400 alternative kept on record', () => {
    const a = R.specializations.find((s) => s.id === 'apprentice')!;
    expect(a.startingCredits.value).toBe(550);
    expect(a.startingCredits.status).toBe('partially-verified');
    expect(a.startingCredits.alternatives?.[0]?.value).toBe(400);
  });
  it('difficulty names', () => {
    expect(R.difficulties.map((d) => `${d.name} (${d.subtitle})`)).toEqual(['Price Gouge (Cozy Mode)', 'Mark Up (Normal Mode)', 'Thin Margins (Hard Mode)', 'Red Ink (Challenge Mode)']);
  });
});

describe('points', () => {
  it('empty build has 3 points', () => {
    expect(evaluatePerks(R, [])).toMatchObject({ totalPoints: 3, remainingPoints: 3, usedSlots: 0, maxSlots: 4, valid: true });
  });
  it('positive perks spend, negative perks grant', () => {
    const e = evaluatePerks(R, ['ascetic', 'diplomatic', 'vigilant']);
    expect(e).toMatchObject({ totalPoints: 7, pointsSpent: 4, remainingPoints: 3 });
  });
  it('over budget is reported, not removed, and shows negative points', () => {
    const build = b(['diplomatic', 'vigilant']);
    expect(evaluatePerks(R, build.perkIds).remainingPoints).toBe(-1);
    const v = validate(R, build).find((x) => x.code === 'not-enough-points')!;
    expect(v.perkIds).toEqual(['diplomatic', 'vigilant']);
    expect(v.fix).toMatch(/Free 1 point/);
  });
  it('free perks cost nothing', () => expect(evaluatePerks(R, ['hoarder']).remainingPoints).toBe(3));
  it('deselecting a point-granting perk only toggles that perk', () => {
    const ids = togglePerk(['ascetic', 'diplomatic', 'vigilant', 'savings'], 'ascetic');
    expect(ids).toEqual(['diplomatic', 'vigilant', 'savings']);
    expect(codes(b(ids))).toEqual(['not-enough-points']);
  });
});

describe('togglePerk', () => {
  it('is a pure toggle', () => {
    const a = ['lucky'];
    expect(togglePerk(a, 'unlucky')).toEqual(['lucky', 'unlucky']);
    expect(togglePerk(a, 'lucky')).toEqual([]);
    expect(a).toEqual(['lucky']);
  });
});

describe('invalid combinations', () => {
  it('reports mutually exclusive perks (either order) with both ids and a fix', () => {
    for (const ids of [['lucky', 'unlucky'], ['unlucky', 'lucky']]) {
      const v = validate(R, b(ids));
      expect(v).toHaveLength(1);
      expect(v[0]!.code).toBe('conflict');
      expect([...v[0]!.perkIds].sort()).toEqual(['lucky', 'unlucky']);
      expect(v[0]!.fix).toMatch(/Deselect/);
    }
    expect(codes(b(['ascetic', 'minimalist']))).toContain('conflict');
  });
  it('all 10 documented exclusion pairs are enforced', () => {
    expect(R.rules.exclusions).toHaveLength(10);
    for (const e of R.rules.exclusions) expect(codes(b([...e.perks]))).toContain('conflict');
  });
  it('duplicates and unknown ids', () => {
    expect(codes(b(['lucky', 'lucky']))).toContain('already-selected');
    expect(codes(b(['nope']))).toEqual(['unknown-perk']);
  });
  it('first playthrough: perks present are a violation; adding is blocked, removing is not', () => {
    expect(codes(b(['lucky'], { playthrough: 'first' }))).toEqual(['first-run-locked']);
    expect(addBlockers(R, [], 'lucky', 'first').map((r) => r.code)).toEqual(['first-run-locked']);
    expect(addBlockers(R, ['lucky'], 'lucky', 'first')).toEqual([]);
    expect(isValid(R, b([], { playthrough: 'first' }))).toBe(true);
  });
  it('supports prerequisites (synthetic data)', () => {
    const reg = { ...R, perks: R.perks.map((p) => (p.id === 'lucky' ? { ...p, requires: ['hoarder'] } : p)) };
    expect(codes(b(['lucky']), reg)).toContain('missing-prerequisite');
    expect(codes(b(['hoarder', 'lucky']), reg)).toEqual([]);
  });
  it('perks with an unknown cost cannot be added', () => {
    const reg = { ...R, perks: R.perks.map((p) => (p.id === 'lucky' ? { ...p, cost: { ...p.cost, value: null } } : p)) };
    expect(addBlockers(reg, [], 'lucky', 'subsequent').map((r) => r.code)).toContain('unknown-cost');
  });
  it('specialization checks: none, unknown, Junker', () => {
    expect(codes({ ...EMPTY_BUILD })).toEqual(['no-specialization']);
    expect(codes(b([], { specializationId: 'ghost' }))).toEqual(['unknown-specialization']);
    expect(codes(b([], { specializationId: 'junker' }))).toEqual(['specialization-unavailable']);
  });
  it('validate is pure and deterministic', () => {
    const build = b(['lucky', 'ghost', 'unlucky', 'lucky', 'diplomatic', 'vigilant']);
    const copy = structuredClone(build);
    expect(validate(R, build)).toEqual(validate(R, build));
    expect(build).toEqual(copy);
    expect(codes(build).sort()).toEqual(['already-selected', 'conflict', 'no-free-slot', 'not-enough-points', 'unknown-perk']);
    expect([...offendingPerkIds(validate(R, build))].sort()).toEqual(['diplomatic', 'ghost', 'lucky', 'unlucky', 'vigilant']);
  });
});

describe('slots', () => {
  it('4 perks fit; a 5th is over the limit but allowed temporarily', () => {
    const ids = ['hoarder', 'careful-scavenger', 'prime-real-estate', 'lucky'];
    expect(isValid(R, b(ids))).toBe(true);
    expect(addBlockers(R, ids, 'ascetic', 'subsequent')).toEqual([]);
    const v = validate(R, b([...ids, 'ascetic']));
    expect(v.map((x) => x.code)).toEqual(['no-free-slot']);
    expect(v[0]!.fix).toMatch(/Deselect 1 perk.*Colorful Character/);
  });
  it('negative perks also use a slot', () => {
    expect(codes(b(['ascetic', 'awful-negotiator', 'blabbermouth', 'convict', 'illiterate']))).toContain('no-free-slot');
  });
  it('Colorful Character adds 3 slots (7 total) and uses one', () => {
    expect(evaluatePerks(R, ['colorful-character']).maxSlots).toBe(7);
    const ids = ['colorful-character', 'ascetic', 'awful-negotiator', 'hoarder', 'careful-scavenger', 'prime-real-estate', 'convict'];
    expect(isValid(R, b(ids))).toBe(true);
    expect(codes(b([...ids, 'illiterate']))).toEqual(['no-free-slot']);
  });
  it('Colorful Character stays dynamic: removing it makes the build invalid, nothing is auto-removed', () => {
    const ids = ['colorful-character', 'ascetic', 'awful-negotiator', 'diplomatic', 'vigilant', 'hoarder', 'well-connected'];
    expect(isValid(R, b(ids))).toBe(true);
    const after = togglePerk(ids, 'colorful-character');
    expect(after).toHaveLength(6);
    const e = evaluatePerks(R, after);
    expect([e.usedSlots, e.maxSlots]).toEqual([6, 4]);
    expect(codes(b(after))).toEqual(['no-free-slot']);
    expect(isValid(R, b(togglePerk(togglePerk(after, 'hoarder'), 'well-connected')))).toBe(true);
  });
});

describe('character overview', () => {
  it('derives credits, rent and modifiers from one state', () => {
    const c = buildCharacter(R, { ...EMPTY_BUILD, specializationId: 'water-merchant', perkIds: ['savings', 'bad-lease'] });
    expect(c.startingCredits.value).toBe(550);
    expect(c.startingRent.value).toBe(240);
    expect(c.valid).toBe(true);
    expect(createModifierQuery(c).total('startingCredits').value).toBe(150);
  });
  it('Apprentice base 550 + Savings', () => {
    const c = buildCharacter(R, { ...EMPTY_BUILD, specializationId: 'apprentice', perkIds: ['savings'] });
    expect(c.startingCredits.value).toBe(700);
  });
  it('exposes violations for invalid builds', () => {
    const c = buildCharacter(R, b(['lucky', 'unlucky']));
    expect(c.valid).toBe(false);
    expect(c.violations[0]!.code).toBe('conflict');
  });
  it('set-modifiers override base (Ascetic inventory)', () => {
    expect(buildCharacter(R, { ...EMPTY_BUILD, perkIds: ['ascetic'] }).inventoryWidth.value).toBe(16);
  });
  it('exposes flags', () => {
    expect(createModifierQuery(buildCharacter(R, { ...EMPTY_BUILD, perkIds: ['maimed'] })).hasFlag('noScavenging')).toBe(true);
  });
});

describe('Continue gating follows validity', () => {
  // App.setScreen('overview') is allowed iff buildCharacter(...).valid; this mirrors that predicate.
  const canContinue = (build: BuildInput) => navigate('overview', buildCharacter(R, build).valid, build.specializationId !== null).screen === 'overview';
  it('valid build can continue', () => expect(canContinue(b(['ascetic', 'diplomatic', 'vigilant']))).toBe(true));
  it('blocked while over points, over slots, conflicting, first-run perks, or no/Junker specialization', () => {
    expect(canContinue(b(['diplomatic', 'vigilant']))).toBe(false);
    expect(canContinue(b(['hoarder', 'careful-scavenger', 'prime-real-estate', 'lucky', 'ascetic']))).toBe(false);
    expect(canContinue(b(['lucky', 'unlucky']))).toBe(false);
    expect(canContinue(b(['lucky'], { playthrough: 'first' }))).toBe(false);
    expect(canContinue({ ...EMPTY_BUILD })).toBe(false);
    expect(canContinue(b([], { specializationId: 'junker' }))).toBe(false);
  });
  it('becomes allowed again once fixed', () => {
    const bad = b(['lucky', 'unlucky']);
    expect(canContinue(bad)).toBe(false);
    expect(canContinue({ ...bad, perkIds: togglePerk(bad.perkIds, 'unlucky') })).toBe(true);
  });
});

describe('navigate', () => {
  it('redirects to the screen where the problem can be fixed', () => {
    expect(navigate('overview', false, true)).toEqual({ screen: 'perks', blocked: true });
    expect(navigate('overview', false, false)).toEqual({ screen: 'spec', blocked: true });
    expect(navigate('overview', true, true)).toEqual({ screen: 'overview', blocked: false });
    expect(navigate('perks', false, true)).toEqual({ screen: 'perks', blocked: false });
  });
});
