import { FLAG_LABELS } from './flags';
import { PERKS } from './perks';
import { BASELINE, DIFFICULTIES, PERK_RULES, START_RULES } from './rules';
import { SOURCES } from './sources';
import { SPECIALIZATIONS } from './specializations';
import type { GameDataRegistry, PerkDef, SpecializationDef } from './types';

/** Bump whenever game data changes, so saved builds can record which data they were made with. */
export const DATA_VERSION = '2026-11-05.3';

/** The single shared game-data registry. All screens and future calculators read from here. */
export const REGISTRY: GameDataRegistry = {
  dataVersion: DATA_VERSION,
  gameVersion: '1.0.x (user screenshots: 100-REV6)',
  sources: SOURCES,
  difficulties: DIFFICULTIES,
  specializations: SPECIALIZATIONS,
  perks: PERKS,
  rules: PERK_RULES,
  startRules: START_RULES,
  baseline: BASELINE,
  flagLabels: FLAG_LABELS,
};

export function getPerk(reg: GameDataRegistry, id: string): PerkDef | undefined {
  return reg.perks.find((p) => p.id === id);
}

export function getSpecialization(reg: GameDataRegistry, id: string): SpecializationDef | undefined {
  return reg.specializations.find((s) => s.id === id);
}

/** Integrity check used by tests and at startup in dev. Returns a list of problems. */
export function validateRegistry(reg: GameDataRegistry): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const p of reg.perks) {
    if (ids.has(p.id)) problems.push(`Duplicate perk id ${p.id}`);
    ids.add(p.id);
    for (const r of p.requires) if (!reg.perks.some((q) => q.id === r)) problems.push(`${p.id} requires unknown ${r}`);
    for (const s of p.sources) if (!reg.sources[s]) problems.push(`${p.id} cites unknown source ${s}`);
  }
  for (const e of reg.rules.exclusions) for (const id of e.perks) if (!ids.has(id)) problems.push(`Exclusion references unknown perk ${id}`);
  for (const s of reg.specializations) for (const src of s.sources) if (!reg.sources[src]) problems.push(`${s.id} cites unknown source ${src}`);
  return problems;
}
