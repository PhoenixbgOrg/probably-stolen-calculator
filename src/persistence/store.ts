import { REGISTRY } from '../data/registry';
import type { GameDataRegistry } from '../data/types';
import { normalizeSelection } from '../engine/perkEngine';
import type { BuildInput } from '../engine/types';
import { migrateToCurrent } from './migrations';
import { EXPORT_FORMAT, QUARANTINE_PREFIX, SCHEMA_VERSION, STORAGE_KEY } from './schema';
import type { ExportFileV2, ProfileV2, QuarantinedItem, StoreV2 } from './schema';
import { isObj, validateProfile, validateQuarantine } from './validate';

/** Minimal storage interface so persistence is testable without a browser. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  keys() { return [...this.m.keys()]; }
}

export interface Notice {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export const emptyStore = (): StoreV2 => ({ schemaVersion: 2, activeProfileId: null, profiles: [], quarantine: [] });

let idCounter = 0;
export function newId(prefix = 'p'): string {
  idCounter++;
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${rnd}`;
}

/** Re-applies game rules to a saved build and reports anything that was dropped. */
export function revalidateProfile(reg: GameDataRegistry, p: ProfileV2): { profile: ProfileV2; notices: Notice[] } {
  const notices: Notice[] = [];
  let specializationId = p.build.specializationId;
  if (specializationId !== null && !reg.specializations.some((s) => s.id === specializationId)) {
    notices.push({ level: 'warning', message: `Profile "${p.name}": unknown specialization "${specializationId}" was cleared.` });
    specializationId = null;
  }
  const norm = normalizeSelection(reg, p.build.perkIds, p.build.playthrough);
  for (const r of norm.removed) notices.push({ level: 'warning', message: `Profile "${p.name}": removed perk "${r.perkId}" - ${r.reason.message}` });
  return { profile: { ...p, build: { ...p.build, specializationId, perkIds: norm.perkIds } }, notices };
}

/**
 * Parses whatever is in storage into a valid current-schema store.
 * Unreadable data is quarantined (never silently dropped) and reported via notices.
 */
export function parseStore(raw: string | null, reg: GameDataRegistry = REGISTRY, now = new Date().toISOString()): { store: StoreV2; notices: Notice[]; quarantinedRaw: string | null } {
  if (raw === null) return { store: emptyStore(), notices: [], quarantinedRaw: null };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch {
    return { store: emptyStore(), notices: [{ level: 'error', message: 'Saved data could not be parsed. It was moved to quarantine and can be downloaded from the Profiles panel.' }], quarantinedRaw: raw };
  }
  const mig = migrateToCurrent(parsed);
  if (!mig.ok) {
    return { store: emptyStore(), notices: [{ level: 'error', message: `Saved data could not be loaded (${mig.error}). It was moved to quarantine.` }], quarantinedRaw: raw };
  }
  const notices: Notice[] = [];
  if (mig.fromVersion < SCHEMA_VERSION) notices.push({ level: 'info', message: `Saved data was upgraded from schema v${mig.fromVersion} to v${SCHEMA_VERSION}.` });
  const v = mig.value;
  const store = emptyStore();
  if (Array.isArray(v.quarantine)) for (const q of v.quarantine) if (validateQuarantine(q)) store.quarantine.push(q);
  const profiles = Array.isArray(v.profiles) ? v.profiles : [];
  const seen = new Set<string>();
  for (const p of profiles) {
    const res = validateProfile(p);
    if (!res.ok) {
      store.quarantine.push({ id: newId('q'), at: now, reason: res.error, raw: safeStringify(p) });
      notices.push({ level: 'warning', message: `A saved profile was unreadable (${res.error}) and was moved to quarantine.` });
      continue;
    }
    let prof = res.value;
    if (seen.has(prof.id)) prof = { ...prof, id: newId() };
    seen.add(prof.id);
    const rv = revalidateProfile(reg, prof);
    notices.push(...rv.notices);
    store.profiles.push(rv.profile);
  }
  const active = typeof v.activeProfileId === 'string' ? v.activeProfileId : null;
  store.activeProfileId = active && store.profiles.some((p) => p.id === active) ? active : store.profiles[0]?.id ?? null;
  return { store, notices, quarantinedRaw: null };
}

function safeStringify(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

export class ProfileRepository {
  constructor(private storage: StorageLike, private reg: GameDataRegistry = REGISTRY) {}

  load(): { store: StoreV2; notices: Notice[] } {
    let raw: string | null;
    try { raw = this.storage.getItem(STORAGE_KEY); } catch {
      return { store: emptyStore(), notices: [{ level: 'error', message: 'Browser storage is not available; profiles cannot be saved in this session.' }] };
    }
    const now = new Date().toISOString();
    const res = parseStore(raw, this.reg, now);
    if (res.quarantinedRaw !== null) {
      // Keep the unreadable blob under its own key AND inside the store so the user can download it.
      const key = `${QUARANTINE_PREFIX}${Date.now()}`;
      try { this.storage.setItem(key, res.quarantinedRaw); } catch { /* still kept in-store below */ }
      res.store.quarantine.push({ id: newId('q'), at: now, reason: `Unreadable store (backup key: ${key})`, raw: res.quarantinedRaw });
      this.save(res.store);
    } else if (raw !== null && res.notices.length > 0) {
      this.save(res.store);
    }
    return { store: res.store, notices: res.notices };
  }

  save(store: StoreV2): Notice | null {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(store)); return null; } catch (e) {
      return { level: 'error', message: `Could not save to browser storage: ${String(e)}` };
    }
  }
}

// ---------- Pure store operations (used by the UI state layer) ----------

export function createProfile(store: StoreV2, name: string, build: BuildInput, dataVersion: string, now = new Date().toISOString()): { store: StoreV2; profile: ProfileV2 } {
  const profile: ProfileV2 = { id: newId(), name: cleanName(name), createdAt: now, updatedAt: now, dataVersion, build: { ...build, perkIds: [...build.perkIds] } };
  return { store: { ...store, profiles: [...store.profiles, profile], activeProfileId: profile.id }, profile };
}

export function updateProfileBuild(store: StoreV2, id: string, build: BuildInput, dataVersion: string, now = new Date().toISOString()): StoreV2 {
  return { ...store, profiles: store.profiles.map((p) => (p.id === id ? { ...p, build: { ...build, perkIds: [...build.perkIds] }, dataVersion, updatedAt: now } : p)) };
}

export function renameProfile(store: StoreV2, id: string, name: string, now = new Date().toISOString()): StoreV2 {
  return { ...store, profiles: store.profiles.map((p) => (p.id === id ? { ...p, name: cleanName(name), updatedAt: now } : p)) };
}

export function duplicateProfile(store: StoreV2, id: string, now = new Date().toISOString()): StoreV2 {
  const src = store.profiles.find((p) => p.id === id);
  if (!src) return store;
  const copy: ProfileV2 = { ...src, id: newId(), name: cleanName(`${src.name} (copy)`), createdAt: now, updatedAt: now, build: { ...src.build, perkIds: [...src.build.perkIds] } };
  return { ...store, profiles: [...store.profiles, copy], activeProfileId: copy.id };
}

export function deleteProfile(store: StoreV2, id: string): StoreV2 {
  const profiles = store.profiles.filter((p) => p.id !== id);
  return { ...store, profiles, activeProfileId: store.activeProfileId === id ? profiles[0]?.id ?? null : store.activeProfileId };
}

export function removeQuarantined(store: StoreV2, id: string): StoreV2 {
  return { ...store, quarantine: store.quarantine.filter((q) => q.id !== id) };
}

export function cleanName(name: string): string {
  const n = name.trim().replace(/\s+/g, ' ').slice(0, 120);
  return n === '' ? 'Unnamed build' : n;
}

// ---------- Export / import ----------

export function exportProfiles(profiles: ProfileV2[], now = new Date().toISOString()): string {
  const file: ExportFileV2 = { format: EXPORT_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: now, profiles };
  return JSON.stringify(file, null, 2);
}

export interface ImportResult {
  ok: boolean;
  profiles: ProfileV2[];
  notices: Notice[];
}

const MAX_IMPORT_BYTES = 1_000_000;

/** Validates, migrates and rule-checks an imported file. Imported profiles always get fresh ids. */
export function importProfiles(text: string, reg: GameDataRegistry = REGISTRY, now = new Date().toISOString()): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, profiles: [], notices: [{ level: 'error', message: 'File is too large to be a build export (limit 1 MB).' }] };
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { ok: false, profiles: [], notices: [{ level: 'error', message: 'File is not valid JSON.' }] }; }
  if (!isObj(parsed)) return { ok: false, profiles: [], notices: [{ level: 'error', message: 'File does not contain a JSON object.' }] };
  if (parsed.format !== EXPORT_FORMAT) return { ok: false, profiles: [], notices: [{ level: 'error', message: 'File is not a Probably Stolen Calculator export (missing or wrong "format").' }] };
  // Export files share profile shape with the store, so reuse store migrations.
  const mig = migrateToCurrent({ ...parsed, activeProfileId: null, quarantine: [] });
  if (!mig.ok) return { ok: false, profiles: [], notices: [{ level: 'error', message: mig.error }] };
  const list = Array.isArray(mig.value.profiles) ? mig.value.profiles : [];
  if (list.length === 0) return { ok: false, profiles: [], notices: [{ level: 'error', message: 'File contains no profiles.' }] };
  const notices: Notice[] = [];
  const profiles: ProfileV2[] = [];
  list.forEach((p, i) => {
    const res = validateProfile(p);
    if (!res.ok) { notices.push({ level: 'warning', message: `Profile #${i + 1} skipped: ${res.error}` }); return; }
    const rv = revalidateProfile(reg, { ...res.value, id: newId(), updatedAt: now });
    notices.push(...rv.notices);
    profiles.push(rv.profile);
  });
  if (profiles.length === 0) return { ok: false, profiles, notices: [...notices, { level: 'error', message: 'No valid profiles found in file.' }] };
  notices.unshift({ level: 'info', message: `Imported ${profiles.length} profile(s).` });
  return { ok: true, profiles, notices };
}

export type { QuarantinedItem };
