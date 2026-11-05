/**
 * Core game-data types. Every record carries provenance (sources, gameVersion, status)
 * so the UI and future calculators can tell confirmed facts from guesses.
 */

export type VerificationStatus = 'verified' | 'partially-verified' | 'unverified' | 'conflicting';

export interface SourceRef {
  id: string;
  title: string;
  url: string;
  /** Who published it. */
  publisher: string;
  /** Game version / build the source claims to describe, if stated. */
  gameVersion: string | null;
  accessed: string;
  notes?: string;
}

export interface Provenance {
  /** Ids into the SOURCES registry. */
  sources: string[];
  gameVersion: string | null;
  status: VerificationStatus;
  /** Free-form explanation, especially for disagreements. */
  note?: string;
}

/** A value that may be unknown. `value === null` means "not verifiable, not invented". */
export interface Fact<T> extends Provenance {
  value: T | null;
  /** Alternative values reported by other sources, for conflicting facts. */
  alternatives?: { value: T; sources: string[] }[];
}

export type Difficulty = 'price-gouge' | 'mark-up' | 'thin-margins' | 'red-ink';

export interface DifficultyDef extends Provenance {
  id: Difficulty;
  name: string;
  subtitle: string;
  /** Page of the in-game Difficulty screen the option appears on, if documented. */
  menuPage?: Fact<number>;
  /** Whether the game pre-selects this option, if documented. */
  isDefault?: Fact<boolean>;
}

/** A documented rule or prompt that applies to the first playthrough or to start-of-run options. */
export interface StartRule extends Provenance {
  id: string;
  text: string;
  note?: string;
}

export type FactionId = 'security' | 'black-market' | 'revolution' | 'upper-levels';

export interface SpecializationDef extends Provenance {
  id: string;
  name: string;
  /** Start-screen tag such as "Advanced Start". */
  tag: Fact<string>;
  description: Fact<string>;
  startingCredits: Fact<number>;
  startingRent: Fact<number>;
  /** Start-screen bullet points (what the game promises). */
  startScreenFeatures: Fact<string[]>;
  startingInventory: Fact<string[]>;
  /** Network upgrades / services unlocked at start. */
  unlocks: Fact<string[]>;
  /** Starting reputation per difficulty, where reported. */
  startingReputation: Fact<Partial<Record<FactionId, Partial<Record<Difficulty, number>>>>>;
  advantages: string[];
  disadvantages: string[];
  /** Notes on how perks interact with this start (all sourced, see provenance). */
  perkInteractions: Fact<string[]>;
  playable: boolean;
  /** 1-based position in the in-game Specialization menu (see GameDataRegistry.ordering). */
  order: number;
}

export type PerkCategory = 'positive' | 'negative' | 'neutral';

/** Statistic keys a modifier can target. Future calculators read these. */
export type StatKey =
  | 'perkSlots'
  | 'perkPoints'
  | 'startingCredits'
  | 'startingRent'
  | 'reputation.all'
  | `reputation.${FactionId}`
  | 'inventoryWidth'
  | 'dailyRandomCustomers'
  | 'dumpingGroundSearches'
  | 'tradeReputationGainPct'
  | 'crimeEvidencePct'
  | 'wantedReportRewardPct'
  | 'wildNetworkCostPct'
  | 'insuranceCostPct'
  | 'upperLevelsReputationGainPct'
  | 'upperLevelsBudgetPct'
  | 'upgradeMaterialSaveChancePct'
  | 'blackMarketRevolutionReputationGainPct'
  | 'augKillRewardPct'
  | 'tradePenaltyPct'
  | 'luck';

export type ModifierOp = 'add' | 'set';

export interface ModifierDef extends Provenance {
  stat: StatKey;
  op: ModifierOp;
  /** null = the effect exists but its magnitude is not verified. */
  value: number | null;
  /** Optional condition description, e.g. "while withdrawal is active". */
  condition?: string;
}

/** Boolean-style gameplay flags (feature unlocks / lockouts) future modules may query. */
export type FlagKey =
  | 'noNightRobbery'
  | 'vendingMachine'
  | 'waterLinesConnected'
  | 'shabbyToolbox'
  | 'undergroundExchangeAtStart'
  | 'freeJanitorialService'
  | 'commissaryAtStart'
  | 'commissaryBanned'
  | 'allCassettes'
  | 'offGridReactor'
  | 'augContentAtStart'
  | 'noScavenging'
  | 'noBargaining'
  | 'cannotReadGuides'
  | 'noWantedCustomers'
  | 'lotteryUnlocked'
  | 'weeklyImmunivaxRequired'
  | 'blackmailWeeklyFee'
  | 'noInjuryWhileScavenging'
  | 'retainCustomersAfterNightOut'
  | 'secretAdmirerGifts'
  | 'agoraphobiaRest'
  | 'addictionAlcohol'
  | 'addictionNarcotic'
  | 'addictionNicotine'
  | 'scavengingDeclinesWeekly'
  | 'inventoryDebris'
  | 'luckIncreased'
  | 'luckDecreased';

export interface PerkDef extends Provenance {
  id: string;
  name: string;
  category: Fact<PerkCategory>;
  /**
   * Point delta: positive = costs points, negative = grants points, 0 = free.
   * Must never be null for a selectable perk; perks with an unknown cost are not selectable.
   */
  cost: Fact<number>;
  description: Fact<string>;
  modifiers: ModifierDef[];
  flags: FlagKey[];
  /** Perk ids that must already be selected. No prerequisites are documented for 1.0; engine supports them. */
  requires: string[];
  /** 1-based display position in the Starting Perks grid (see GameDataRegistry.ordering). */
  order: number;
}

export interface ExclusionRule extends Provenance {
  perks: [string, string];
}

export interface PerkRules extends Provenance {
  basePoints: Fact<number>;
  baseSlots: Fact<number>;
  /** Perks are unavailable on the first playthrough. */
  firstRunLocksPerks: Fact<boolean>;
  /** Each perk (including negatives) occupies one slot. */
  everyPerkUsesSlot: Fact<boolean>;
  /** Selections may temporarily exceed limits; the game validates when Continue is pressed. */
  validatedAtContinue: Fact<boolean>;
  exclusions: ExclusionRule[];
}

export interface BaselineDef {
  inventoryGrid: Fact<{ width: number; height: number }>;
  dumpingGroundSearches: Fact<number>;
  usualRent: Fact<number>;
}

export interface GameDataRegistry {
  dataVersion: string;
  gameVersion: string;
  sources: Record<string, SourceRef>;
  /** Human-readable label for every gameplay flag (UI text; restates perk descriptions). */
  flagLabels: Record<FlagKey, string>;
  difficulties: DifficultyDef[];
  specializations: SpecializationDef[];
  perks: PerkDef[];
  rules: PerkRules;
  startRules: StartRule[];
  baseline: BaselineDef;
  /** Where the specialization / perk display order comes from, and how certain it is. */
  ordering: { specializations: Provenance; perks: Provenance };
}
