import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../src/data/registry';
import { EMPTY_BUILD } from '../src/engine/types';
import { migrateToCurrent } from '../src/persistence/migrations';
import { QUARANTINE_PREFIX, SCHEMA_VERSION, STORAGE_KEY } from '../src/persistence/schema';
import {
  createProfile, deleteProfile, duplicateProfile, emptyStore, exportProfiles, importProfiles, MemoryStorage, uniqueImportName, dedupeImportedNames, ProfileRepository, renameProfile,
} from '../src/persistence/store';
import { initState, makeReducer } from '../src/state/reducer';

const V1 = { schemaVersion: 1, active: 'a', profiles: [{ id: 'a', name: 'Old', specialization: 'chemist', perks: ['lucky', 'unlucky'], savedAt: '2026-01-01T00:00:00Z' }] };

describe('save / load', () => {
  it('round-trips profiles through storage', () => {
    const st = new MemoryStorage();
    const repo = new ProfileRepository(st);
    const { store } = createProfile(emptyStore(), 'Test', { ...EMPTY_BUILD, specializationId: 'fence', perkIds: ['lucky'] }, 'x');
    repo.save(store);
    const loaded = repo.load();
    expect(loaded.notices).toEqual([]);
    expect(loaded.store.profiles[0]!.build).toMatchObject({ specializationId: 'fence', perkIds: ['lucky'] });
    expect(loaded.store.activeProfileId).toBe(store.activeProfileId);
  });
  it('rename / duplicate / delete', () => {
    let s = createProfile(emptyStore(), 'A', EMPTY_BUILD, 'x').store;
    const id = s.profiles[0]!.id;
    s = renameProfile(s, id, '  B  ');
    expect(s.profiles[0]!.name).toBe('B');
    s = duplicateProfile(s, id);
    expect(s.profiles).toHaveLength(2);
    expect(s.profiles[1]!.name).toBe('B (copy)');
    expect(s.activeProfileId).toBe(s.profiles[1]!.id);
    s = deleteProfile(s, s.profiles[1]!.id);
    expect(s.profiles).toHaveLength(1);
    expect(s.activeProfileId).toBe(id);
  });
  it('quarantines unparseable storage instead of discarding it', () => {
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, '{broken');
    const r = new ProfileRepository(st).load();
    expect(r.notices[0]!.level).toBe('error');
    expect(r.store.quarantine).toHaveLength(1);
    expect(r.store.quarantine[0]!.raw).toBe('{broken');
    expect(st.keys().some((k) => k.startsWith(QUARANTINE_PREFIX))).toBe(true);
  });
  it('quarantines individual invalid profiles and keeps the valid ones', () => {
    const st = new MemoryStorage();
    const good = createProfile(emptyStore(), 'Good', EMPTY_BUILD, 'x').store;
    st.setItem(STORAGE_KEY, JSON.stringify({ ...good, profiles: [...good.profiles, { id: 'bad', name: 3 }] }));
    const r = new ProfileRepository(st).load();
    expect(r.store.profiles.map((p) => p.name)).toEqual(['Good']);
    expect(r.store.quarantine).toHaveLength(1);
    // quarantine persisted
    expect(JSON.parse(st.getItem(STORAGE_KEY)!).quarantine).toHaveLength(1);
  });
  it('re-validates builds on load but never removes perks', () => {
    const st = new MemoryStorage();
    const s = createProfile(emptyStore(), 'X', { ...EMPTY_BUILD, specializationId: 'nope', perkIds: ['lucky', 'unlucky'] }, 'x').store;
    st.setItem(STORAGE_KEY, JSON.stringify(s));
    const r = new ProfileRepository(st).load();
    expect(r.store.profiles[0]!.build.perkIds).toEqual(['lucky', 'unlucky']);
    expect(r.store.profiles[0]!.build.specializationId).toBeNull();
    expect(r.notices.map((n) => n.message).join(' ')).toMatch(/unknown specialization.*perks were kept/);
    expect(r.notices.map((n) => n.message).join(' ')).toMatch(/kept unchanged/);
  });
  it('invalid builds (points, slots, conflicts, first-run perks, unknown perk) survive save/load unchanged', () => {
    const st = new MemoryStorage();
    const repo = new ProfileRepository(st);
    const builds = [
      { ...EMPTY_BUILD, specializationId: 'fence', perkIds: ['diplomatic', 'vigilant', 'well-connected'] },
      { ...EMPTY_BUILD, specializationId: 'fence', perkIds: ['hoarder', 'careful-scavenger', 'prime-real-estate', 'lucky', 'ascetic'] },
      { ...EMPTY_BUILD, specializationId: 'fence', perkIds: ['lucky', 'unlucky'] },
      { ...EMPTY_BUILD, specializationId: 'fence', playthrough: 'first' as const, perkIds: ['savings'] },
      { ...EMPTY_BUILD, specializationId: 'fence', perkIds: ['lucky', 'removed-in-future-patch'] },
    ];
    let store = emptyStore();
    for (const b of builds) store = createProfile(store, 'inv', b, 'x').store;
    repo.save(store);
    const loaded = repo.load();
    expect(loaded.store.profiles.map((p) => p.build)).toEqual(builds);
    // saving again keeps them too
    repo.save(loaded.store);
    expect(repo.load().store.profiles.map((p) => p.build)).toEqual(builds);
  });
  it('a saved Junker build is cleared with a clear message and keeps its perks', () => {
    const st = new MemoryStorage();
    const s = createProfile(emptyStore(), 'J', { ...EMPTY_BUILD, specializationId: 'junker', perkIds: ['lucky'] }, 'x').store;
    st.setItem(STORAGE_KEY, JSON.stringify(s));
    const r = new ProfileRepository(st).load();
    expect(r.store.profiles[0]!.build).toMatchObject({ specializationId: null, perkIds: ['lucky'] });
    expect(r.notices[0]!.message).toMatch(/Junker is "Work in Progress".*cannot be started/);
  });
  it('rejects data from a newer schema without deleting it', () => {
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, profiles: [] }));
    const r = new ProfileRepository(st).load();
    expect(r.notices[0]!.message).toMatch(/newer/);
    expect(r.store.quarantine).toHaveLength(1);
  });
});

describe('migrations', () => {
  it('migrates v1 to current', () => {
    const m = migrateToCurrent(V1);
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.value.schemaVersion).toBe(SCHEMA_VERSION);
    expect(m.fromVersion).toBe(1);
  });
  it('v1 storage loads, is upgraded and re-validated (invalid pair kept and reported)', () => {
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, JSON.stringify(V1));
    const r = new ProfileRepository(st).load();
    const p = r.store.profiles[0]!;
    expect(p.build).toEqual({ specializationId: 'chemist', perkIds: ['lucky', 'unlucky'], playthrough: 'subsequent', difficulty: 'mark-up' });
    expect(r.notices.some((n) => /Lucky and Unlucky/.test(n.message))).toBe(true);
    expect(r.notices.some((n) => /upgraded/.test(n.message))).toBe(true);
    expect(JSON.parse(st.getItem(STORAGE_KEY)!).schemaVersion).toBe(2);
  });
  it('rejects missing schemaVersion', () => {
    expect(migrateToCurrent({ profiles: [] }).ok).toBe(false);
  });
});

describe('import / export', () => {
  const base = createProfile(emptyStore(), 'Exp', { ...EMPTY_BUILD, specializationId: 'gunsmith', perkIds: ['ascetic', 'diplomatic'] }, 'x').profile;
  it('round-trips with fresh ids', () => {
    const r = importProfiles(exportProfiles([base]), REGISTRY);
    expect(r.ok).toBe(true);
    expect(r.profiles[0]!.build).toEqual(base.build);
    expect(r.profiles[0]!.id).not.toBe(base.id);
  });
  it('rejects non-JSON, wrong format, empty, and oversize', () => {
    expect(importProfiles('nope').ok).toBe(false);
    expect(importProfiles(JSON.stringify({ format: 'other', schemaVersion: 2, profiles: [base] })).ok).toBe(false);
    expect(importProfiles(JSON.stringify({ format: 'probably-stolen-calculator/profiles', schemaVersion: 2, profiles: [] })).ok).toBe(false);
    expect(importProfiles('x'.repeat(1_000_001)).ok).toBe(false);
  });
  it('skips structurally invalid profiles; rule-breaking ones are imported unchanged with a warning', () => {
    const bad = { ...base, build: { ...base.build, difficulty: 'impossible' } };
    const cheat = { ...base, build: { ...base.build, perkIds: ['diplomatic', 'vigilant', 'well-connected'] } };
    const r = importProfiles(JSON.stringify({ format: 'probably-stolen-calculator/profiles', schemaVersion: 2, profiles: [bad, cheat] }));
    expect(r.ok).toBe(true);
    expect(r.profiles).toHaveLength(1);
    expect(r.profiles[0]!.build.perkIds).toEqual(['diplomatic', 'vigilant', 'well-connected']);
    expect(r.notices.some((n) => /kept unchanged/.test(n.message) && /cost 6 points/.test(n.message))).toBe(true);
    expect(r.notices.some((n) => /skipped/.test(n.message))).toBe(true);
  });
  it('importing a Junker build is handled safely with a clear message', () => {
    const j = { ...base, build: { ...base.build, specializationId: 'junker' } };
    const r = importProfiles(JSON.stringify({ format: 'probably-stolen-calculator/profiles', schemaVersion: 2, profiles: [j] }));
    expect(r.ok).toBe(true);
    expect(r.profiles[0]!.build.specializationId).toBeNull();
    expect(r.profiles[0]!.build.perkIds).toEqual(base.build.perkIds);
    expect(r.notices.some((n) => n.level === 'warning' && /Junker is "Work in Progress"/.test(n.message))).toBe(true);
  });
  it('imports v1-format exports via migration', () => {
    const r = importProfiles(JSON.stringify({ format: 'probably-stolen-calculator/profiles', ...V1 }));
    expect(r.ok).toBe(true);
    expect(r.profiles[0]!.build.specializationId).toBe('chemist');
  });
});

describe('state reducer', () => {
  const reducer = makeReducer(REGISTRY);
  it('creates a default profile and autosyncs builds', () => {
    let s = initState(emptyStore(), []);
    expect(s.store.profiles).toHaveLength(1);
    s = reducer(s, { type: 'selectSpecialization', id: 'fence' });
    s = reducer(s, { type: 'togglePerk', perkId: 'diplomatic' });
    s = reducer(s, { type: 'togglePerk', perkId: 'vigilant' });
    // over budget is allowed temporarily and autosaved as-is
    expect(s.lastRejection).toBeNull();
    expect(s.store.profiles[0]!.build.perkIds).toEqual(['diplomatic', 'vigilant']);
    s = reducer(s, { type: 'setPlaythrough', playthrough: 'first' });
    expect(s.build.perkIds).toEqual(['diplomatic', 'vigilant']);
    // first run: adding is blocked (game disables the panel), removing is allowed
    s = reducer(s, { type: 'togglePerk', perkId: 'savings' });
    expect(s.lastRejection?.reasons[0]!.code).toBe('first-run-locked');
    s = reducer(s, { type: 'togglePerk', perkId: 'vigilant' });
    expect(s.build.perkIds).toEqual(['diplomatic']);
    s = reducer(s, { type: 'resetBuild' });
    expect(s.build).toEqual(EMPTY_BUILD);
  });
  it('Junker cannot be selected', () => {
    let s = initState(emptyStore(), []);
    s = reducer(s, { type: 'selectSpecialization', id: 'junker' });
    expect(s.build.specializationId).toBeNull();
    expect(s.lastRejection?.reasons[0]!.code).toBe('specialization-unavailable');
  });
  it('toggling never removes other perks (no cascade)', () => {
    let s = initState(emptyStore(), []);
    for (const id of ['colorful-character', 'ascetic', 'awful-negotiator', 'diplomatic', 'vigilant', 'hoarder', 'well-connected']) s = reducer(s, { type: 'togglePerk', perkId: id });
    s = reducer(s, { type: 'togglePerk', perkId: 'colorful-character' });
    expect(s.build.perkIds).toEqual(['ascetic', 'awful-negotiator', 'diplomatic', 'vigilant', 'hoarder', 'well-connected']);
    s = reducer(s, { type: 'removePerk', perkId: 'hoarder' });
    expect(s.build.perkIds).toHaveLength(5);
  });
});

describe('import name handling', () => {
  const p = (name: string) => createProfile(emptyStore(), name, { ...EMPTY_BUILD, specializationId: 'gunsmith' }, 'x').profile;
  it('uniqueImportName suffixes " (imported)" then numbers', () => {
    expect(uniqueImportName('A', new Set())).toBe('A');
    expect(uniqueImportName('A', new Set(['A']))).toBe('A (imported)');
    expect(uniqueImportName('A', new Set(['A', 'A (imported)']))).toBe('A (imported 2)');
  });
  it('renames clashes (also within the file) and never drops a profile', () => {
    const r = dedupeImportedNames([p('A'), p('A'), p('B')], ['A']);
    expect(r.profiles.map((x) => x.name)).toEqual(['A (imported)', 'A (imported 2)', 'B']);
    expect(r.notices).toHaveLength(2);
  });
  it('reducer import keeps existing and imported profiles, renamed, and dismissAll clears notices', () => {
    const reducer = makeReducer(REGISTRY);
    let s = initState(emptyStore(), []);
    const existing = s.store.profiles.map((x) => x.name);
    const imp = importProfiles(exportProfiles([p(existing[0]!), p('New')]));
    const before = s.store.profiles.length;
    s = reducer(s, { type: 'importProfiles', profiles: imp.profiles, notices: imp.notices });
    expect(s.store.profiles).toHaveLength(before + 2);
    expect(s.store.profiles.map((x) => x.name)).toContain(`${existing[0]} (imported)`);
    expect(new Set(s.store.profiles.map((x) => x.name)).size).toBe(s.store.profiles.length);
    expect(s.notices.length).toBeGreaterThan(0);
    s = reducer(s, { type: 'dismissAllNotices' });
    expect(s.notices).toEqual([]);
  });
});
