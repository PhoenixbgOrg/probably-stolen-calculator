import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../src/data/registry';
import { EMPTY_BUILD } from '../src/engine/types';
import { migrateToCurrent } from '../src/persistence/migrations';
import { QUARANTINE_PREFIX, SCHEMA_VERSION, STORAGE_KEY } from '../src/persistence/schema';
import {
  createProfile, deleteProfile, duplicateProfile, emptyStore, exportProfiles, importProfiles, MemoryStorage, ProfileRepository, renameProfile,
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
  it('re-validates builds on load', () => {
    const st = new MemoryStorage();
    const s = createProfile(emptyStore(), 'X', { ...EMPTY_BUILD, specializationId: 'nope', perkIds: ['lucky', 'unlucky'] }, 'x').store;
    st.setItem(STORAGE_KEY, JSON.stringify(s));
    const r = new ProfileRepository(st).load();
    expect(r.store.profiles[0]!.build.perkIds).toEqual(['lucky']);
    expect(r.store.profiles[0]!.build.specializationId).toBeNull();
    expect(r.notices.length).toBe(2);
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
  it('v1 storage loads, is upgraded and re-validated', () => {
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, JSON.stringify(V1));
    const r = new ProfileRepository(st).load();
    const p = r.store.profiles[0]!;
    expect(p.build).toEqual({ specializationId: 'chemist', perkIds: ['lucky'], playthrough: 'subsequent', difficulty: 'mark-up' });
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
  it('skips structurally invalid profiles and rule-checks the rest', () => {
    const bad = { ...base, build: { ...base.build, difficulty: 'impossible' } };
    const cheat = { ...base, build: { ...base.build, perkIds: ['diplomatic', 'vigilant', 'well-connected'] } };
    const r = importProfiles(JSON.stringify({ format: 'probably-stolen-calculator/profiles', schemaVersion: 2, profiles: [bad, cheat] }));
    expect(r.ok).toBe(true);
    expect(r.profiles).toHaveLength(1);
    expect(r.profiles[0]!.build.perkIds).toEqual(['diplomatic']);
    expect(r.notices.some((n) => /skipped/.test(n.message))).toBe(true);
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
    expect(s.lastRejection?.reasons[0]!.code).toBe('not-enough-points');
    expect(s.store.profiles[0]!.build.perkIds).toEqual(['diplomatic']);
    s = reducer(s, { type: 'setPlaythrough', playthrough: 'first' });
    expect(s.build.perkIds).toEqual([]);
    expect(s.lastRemovals).toHaveLength(1);
    s = reducer(s, { type: 'resetBuild' });
    expect(s.build).toEqual(EMPTY_BUILD);
  });
});
