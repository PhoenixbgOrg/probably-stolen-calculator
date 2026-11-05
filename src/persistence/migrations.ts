import { DATA_VERSION } from '../data/registry';
import { SCHEMA_VERSION } from './schema';
import type { StoreV1, StoreV2 } from './schema';
import { isObj } from './validate';

/**
 * Ordered migrations. Each takes the raw object of version N and returns version N+1.
 * Never delete a migration; old exports must keep loading.
 */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  1: (raw) => {
    const v1 = raw as unknown as StoreV1;
    const profiles = Array.isArray(v1.profiles) ? v1.profiles : [];
    const v2: StoreV2 = {
      schemaVersion: 2,
      activeProfileId: typeof v1.active === 'string' ? v1.active : null,
      quarantine: [],
      profiles: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.savedAt,
        updatedAt: p.savedAt,
        dataVersion: 'legacy-v1',
        build: { specializationId: p.specialization ?? null, perkIds: Array.isArray(p.perks) ? p.perks : [], playthrough: 'subsequent', difficulty: 'mark-up' },
      })),
    };
    return v2 as unknown as Record<string, unknown>;
  },
};

export type MigrationResult = { ok: true; value: Record<string, unknown>; fromVersion: number } | { ok: false; error: string };

export function migrateToCurrent(raw: unknown): MigrationResult {
  if (!isObj(raw)) return { ok: false, error: 'Data is not a JSON object.' };
  const from = raw.schemaVersion;
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) return { ok: false, error: 'Missing or invalid schemaVersion.' };
  if (from > SCHEMA_VERSION) return { ok: false, error: `Data uses schema version ${from}, newer than this app supports (${SCHEMA_VERSION}). Update the app.` };
  let cur: Record<string, unknown> = raw;
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const m = MIGRATIONS[v];
    if (!m) return { ok: false, error: `No migration from schema version ${v}.` };
    try { cur = m(cur); } catch (e) { return { ok: false, error: `Migration from v${v} failed: ${String(e)}` }; }
  }
  return { ok: true, value: cur, fromVersion: from };
}

export { DATA_VERSION };
