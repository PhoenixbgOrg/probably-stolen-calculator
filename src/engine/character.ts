import { getPerk, getSpecialization } from '../data/registry';
import type {
  Difficulty, Fact, FactionId, FlagKey, GameDataRegistry, ModifierDef, PerkDef, SpecializationDef, StatKey, VerificationStatus,
} from '../data/types';
import { evaluatePerks } from './perkEngine';
import type { BuildInput, PerkEvaluation } from './types';

const STATUS_RANK: Record<VerificationStatus, number> = { verified: 0, 'partially-verified': 1, unverified: 2, conflicting: 3 };

export function worstStatus(statuses: VerificationStatus[]): VerificationStatus {
  return statuses.reduce<VerificationStatus>((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a), 'verified');
}

export interface AppliedModifier extends ModifierDef {
  perkId: string;
  perkName: string;
}

export interface Contribution {
  label: string;
  value: number | null;
  status: VerificationStatus;
}

/** A number derived from base data plus modifiers. `value` is null if any required input is unknown. */
export interface DerivedNumber {
  value: number | null;
  status: VerificationStatus;
  contributions: Contribution[];
  note?: string;
}

/** Reusable, read-only character configuration consumed by screens and future calculators. */
export interface CharacterConfig {
  dataVersion: string;
  input: BuildInput;
  specialization: SpecializationDef | null;
  difficulty: Difficulty;
  perks: PerkDef[];
  points: PerkEvaluation;
  startingCredits: DerivedNumber;
  startingRent: DerivedNumber;
  /** Specialization starting reputation for the chosen difficulty plus perk modifiers per faction. */
  reputation: Record<FactionId, DerivedNumber>;
  /** "+X with all factions" from perks, kept separate because the full faction list is not verified. */
  reputationAllFactions: DerivedNumber;
  inventoryWidth: DerivedNumber;
  inventoryHeight: number | null;
  dumpingGroundSearches: DerivedNumber;
  modifiers: AppliedModifier[];
  flags: FlagKey[];
  warnings: string[];
}

function fromFact(label: string, fact: Fact<number>): Contribution {
  return { label, value: fact.value, status: fact.status };
}

function derive(base: Contribution | null, mods: AppliedModifier[], note?: string): DerivedNumber {
  const contributions: Contribution[] = base ? [base] : [];
  let value: number | null = base ? base.value : 0;
  for (const m of mods) {
    contributions.push({ label: `${m.perkName}${m.op === 'set' ? ' (sets)' : ''}`, value: m.value, status: m.status });
    if (value === null || m.value === null) { value = null; continue; }
    value = m.op === 'set' ? m.value : value + m.value;
  }
  return { value, status: worstStatus(contributions.map((c) => c.status)), contributions, note };
}

export function collectModifiers(perks: PerkDef[]): AppliedModifier[] {
  return perks.flatMap((p) => p.modifiers.map((m) => ({ ...m, perkId: p.id, perkName: p.name })));
}

const FACTIONS: FactionId[] = ['security', 'black-market', 'revolution', 'upper-levels'];

export function buildCharacter(reg: GameDataRegistry, input: BuildInput): CharacterConfig {
  const spec = input.specializationId ? getSpecialization(reg, input.specializationId) ?? null : null;
  const perks = input.perkIds.map((id) => getPerk(reg, id)).filter((p): p is PerkDef => p !== undefined);
  const modifiers = collectModifiers(perks);
  const byStat = (s: StatKey) => modifiers.filter((m) => m.stat === s);
  const warnings: string[] = [];

  const startingCredits = spec
    ? derive(fromFact(`${spec.name} base`, spec.startingCredits), byStat('startingCredits'), spec.startingCredits.note)
    : { value: null, status: 'unverified' as const, contributions: [], note: 'No specialization selected.' };
  const startingRent = spec
    ? derive(fromFact(`${spec.name} base`, spec.startingRent), byStat('startingRent'), spec.startingRent.note)
    : { value: null, status: 'unverified' as const, contributions: [], note: 'No specialization selected.' };

  const reputation = {} as Record<FactionId, DerivedNumber>;
  for (const f of FACTIONS) {
    const specRep = spec?.startingReputation.value?.[f]?.[input.difficulty];
    const base: Contribution | null = specRep !== undefined && spec
      ? { label: `${spec.name} start`, value: specRep, status: spec.startingReputation.status }
      : null;
    reputation[f] = derive(base, byStat(`reputation.${f}`));
  }
  const reputationAllFactions = derive(null, byStat('reputation.all'));

  const grid = reg.baseline.inventoryGrid;
  const inventoryWidth = derive(
    { label: 'Default inventory width', value: grid.value?.width ?? null, status: grid.status },
    byStat('inventoryWidth'),
  );
  const searches = reg.baseline.dumpingGroundSearches;
  const dumpingGroundSearches = derive(fromFact('Default daily searches', searches), byStat('dumpingGroundSearches'));

  const flags = Array.from(new Set(perks.flatMap((p) => p.flags)));
  if (flags.includes('noScavenging')) dumpingGroundSearches.note = 'Scavenging is disabled entirely (Maimed).';

  if (!spec) warnings.push('No specialization selected yet.');
  if (spec && spec.startingCredits.status === 'conflicting') warnings.push(`Starting credits for ${spec.name} are disputed between sources; no value is shown as fact.`);
  for (const p of perks) {
    if (p.status === 'conflicting') warnings.push(`${p.name}: sources disagree. ${p.note ?? ''}`.trim());
    if (p.modifiers.some((m) => m.value === null)) warnings.push(`${p.name}: effect magnitude is unknown.`);
  }
  if (input.playthrough === 'first') warnings.push('First playthrough: starting perks are locked (partially verified).');
  const points = evaluatePerks(reg, input.perkIds);
  if (!points.valid) warnings.push('The perk selection is invalid. This should never happen; please report it.');

  return {
    dataVersion: reg.dataVersion, input, specialization: spec, difficulty: input.difficulty, perks, points,
    startingCredits, startingRent, reputation, reputationAllFactions, inventoryWidth,
    inventoryHeight: grid.value?.height ?? null, dumpingGroundSearches, modifiers, flags, warnings,
  };
}

/** Interface future calculators use to read character modifiers without re-implementing perk logic. */
export interface ModifierQuery {
  all(): readonly AppliedModifier[];
  forStat(stat: StatKey): readonly AppliedModifier[];
  /** Sum of additive modifiers for a stat; null if any contributing value is unknown. */
  total(stat: StatKey): { value: number | null; status: VerificationStatus };
  hasFlag(flag: FlagKey): boolean;
}

export function createModifierQuery(character: CharacterConfig): ModifierQuery {
  const forStat = (stat: StatKey) => character.modifiers.filter((m) => m.stat === stat);
  return {
    all: () => character.modifiers,
    forStat,
    total: (stat) => {
      const mods = forStat(stat);
      let value: number | null = 0;
      for (const m of mods) {
        if (m.op !== 'add') continue;
        value = value === null || m.value === null ? null : value + m.value;
      }
      return { value, status: worstStatus(mods.map((m) => m.status)) };
    },
    hasFlag: (flag) => character.flags.includes(flag),
  };
}
