import { DIFFICULTIES } from '../data/rules';
import type { ProfileV2, QuarantinedItem, SavedBuildV2 } from './schema';

type Json = unknown;

function isObj(v: Json): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Structural validation only. Game-rule validation happens in the engine (validate), and never removes perks. */
export function validateBuild(v: Json): { ok: true; value: SavedBuildV2 } | { ok: false; error: string } {
  if (!isObj(v)) return { ok: false, error: 'build is not an object' };
  const { specializationId, perkIds, playthrough, difficulty } = v;
  if (specializationId !== null && typeof specializationId !== 'string') return { ok: false, error: 'specializationId must be a string or null' };
  if (!Array.isArray(perkIds) || !perkIds.every((x) => typeof x === 'string')) return { ok: false, error: 'perkIds must be an array of strings' };
  if (perkIds.length > 100) return { ok: false, error: 'perkIds is unreasonably long' };
  if (playthrough !== 'first' && playthrough !== 'subsequent') return { ok: false, error: 'playthrough must be "first" or "subsequent"' };
  if (typeof difficulty !== 'string' || !DIFFICULTIES.some((d) => d.id === difficulty)) return { ok: false, error: 'unknown difficulty' };
  return { ok: true, value: { specializationId, perkIds: [...perkIds] as string[], playthrough, difficulty: difficulty as SavedBuildV2['difficulty'] } };
}

export function validateProfile(v: Json): { ok: true; value: ProfileV2 } | { ok: false; error: string } {
  if (!isObj(v)) return { ok: false, error: 'profile is not an object' };
  for (const k of ['id', 'name', 'createdAt', 'updatedAt', 'dataVersion'] as const) {
    if (typeof v[k] !== 'string') return { ok: false, error: `profile.${k} must be a string` };
  }
  if ((v.name as string).trim() === '' || (v.name as string).length > 120) return { ok: false, error: 'profile name must be 1-120 characters' };
  const b = validateBuild(v.build);
  if (!b.ok) return { ok: false, error: `profile.build: ${b.error}` };
  return { ok: true, value: { id: v.id as string, name: v.name as string, createdAt: v.createdAt as string, updatedAt: v.updatedAt as string, dataVersion: v.dataVersion as string, build: b.value } };
}

export function validateQuarantine(v: Json): v is QuarantinedItem {
  return isObj(v) && typeof v.id === 'string' && typeof v.at === 'string' && typeof v.reason === 'string' && typeof v.raw === 'string';
}

export { isObj };
