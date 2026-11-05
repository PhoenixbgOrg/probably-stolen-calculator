import type { Difficulty } from '../data/types';
import type { Playthrough } from '../engine/types';

/** Current persistence schema version. Bump and add a migration in migrations.ts when the shape changes. */
export const SCHEMA_VERSION = 2;

export const STORAGE_KEY = 'psc.profiles';
export const QUARANTINE_PREFIX = 'psc.quarantine.';
export const EXPORT_FORMAT = 'probably-stolen-calculator/profiles';

export interface SavedBuildV2 {
  specializationId: string | null;
  perkIds: string[];
  playthrough: Playthrough;
  difficulty: Difficulty;
}

export interface ProfileV2 {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Game-data version the build was last saved with. */
  dataVersion: string;
  build: SavedBuildV2;
}

/** A record that could not be read. Kept (never discarded silently) so the user can recover it. */
export interface QuarantinedItem {
  id: string;
  at: string;
  reason: string;
  /** Original data, serialised. */
  raw: string;
}

export interface StoreV2 {
  schemaVersion: 2;
  activeProfileId: string | null;
  profiles: ProfileV2[];
  quarantine: QuarantinedItem[];
}

/** Legacy v1 shape (initial draft schema). Kept so the migration path is exercised and tested. */
export interface ProfileV1 {
  id: string;
  name: string;
  specialization: string | null;
  perks: string[];
  savedAt: string;
}

export interface StoreV1 {
  schemaVersion: 1;
  profiles: ProfileV1[];
  active?: string | null;
}

export interface ExportFileV2 {
  format: typeof EXPORT_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  profiles: ProfileV2[];
}
