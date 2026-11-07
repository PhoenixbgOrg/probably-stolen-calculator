import { getFinisherContamination } from './dreamDust';

export const DREAM_CAP_REFERENCE_WEIGHT_G = 32.5;
export const DREAM_DUST_SAMPLE_UL = 2_000;

export const COMPONENT_KEYS = [
  'dreamCapMush',
  'dreamCapExtract',
  'plantMatter',
  'water',
  'protein',
  'mineral',
  'microbes',
  'physicalContaminant',
  'alcohol',
  'insolubleDebris',
  'acid',
  'base',
  'chemicalContaminant',
  'heavyMetal',
  'other',
] as const;

/** Wiki boiling/evaporator volatiles for this supported subset. Acid/Base/Other are not treated as evaporative. */
export const VOLATILE_KEYS = ['water', 'alcohol'] as const;

export type ComponentKey = (typeof COMPONENT_KEYS)[number];
export type ComponentMixture = Record<ComponentKey, number>;

export interface ExtractionConfig {
  dreamCapGrams: number;
  alcoholML: number;
  blenderModules: number;
  temperatureC: number;
  updates: number;
}

export interface ExtractionTick {
  tick: number;
  microbesRemovedUL: number;
  processedMushUL: number;
  extractProducedUL: number;
  plantMatterProducedUL: number;
  degradedMushUL: number;
  degradedExtractUL: number;
  evaporatedAlcoholUL: number;
  evaporatedWaterUL: number;
  state: ComponentMixture;
}

export interface ExtractionResult {
  initialRaw: ComponentMixture;
  initialAfterBlender: ComponentMixture;
  initialMixture: ComponentMixture;
  final: ComponentMixture;
  ticks: ExtractionTick[];
  stoppedBecause: 'updates-complete' | 'no-mush' | 'no-progress';
  sourceBoundary: string;
}

export interface PreparedExtractionConfig {
  initialMixture: ComponentMixture;
  temperatureC: number;
  updates: number;
}

export interface MeasuredComposition {
  totalUL: number;
  activeUL: number;
  evaporativeUL: number;
}

export interface FinishedVial {
  sampleActiveUL: number;
  sampleOtherUL: number;
  replacedActiveUL: number;
  replacedOtherUL: number;
  physicalContaminantUL: number;
  finalActiveUL: number;
  finalTotalUL: number;
  purity: number;
}

export interface FinisherResult {
  success: boolean;
  reason?: string;
  vials: FinishedVial[];
  meanPurity: number;
  remaining: MeasuredComposition;
}

export interface MeasuredReverseInput extends MeasuredComposition {
  targetPurity: number;
  targetVials: number;
  currentModules: number;
  maxModulesOwned: number;
  finisherOwned: boolean;
  finisherCapacityVials: number;
  availableBudget?: number;
  quotedModuleCost?: number;
}

export interface ReverseOption {
  modules: number;
  upgradeModules: number;
  quotedUpgradeCost?: number;
  vialsAvailable: number;
  achievedMeanPurity: number;
  meetsTargetNow: boolean;
  minimumPureActiveAdditionUL: number | null;
  minimumSelectiveOtherRemovalUL: number | null;
  note: string;
}

export interface MeasuredReverseResult {
  status: 'feasible-now' | 'composition-change-required' | 'insufficient-resources' | 'unsupported';
  reasons: string[];
  options: ReverseOption[];
  boundary: string;
}

export const emptyMixture = (): ComponentMixture => ({
  dreamCapMush: 0,
  dreamCapExtract: 0,
  plantMatter: 0,
  water: 0,
  protein: 0,
  mineral: 0,
  microbes: 0,
  physicalContaminant: 0,
  alcohol: 0,
  insolubleDebris: 0,
  acid: 0,
  base: 0,
  chemicalContaminant: 0,
  heavyMetal: 0,
  other: 0,
});

export function mixtureFromPartial(partial: Partial<ComponentMixture>): ComponentMixture {
  return { ...emptyMixture(), ...partial };
}

export function volatileUL(mixture: ComponentMixture): number {
  return VOLATILE_KEYS.reduce((sum, key) => sum + mixture[key], 0);
}

export function totalUL(mixture: ComponentMixture): number {
  return COMPONENT_KEYS.reduce((sum, key) => sum + mixture[key], 0);
}

/** Warn when entered total and component sum disagree. Never silently redistribute. */
export function volumeSumDriftUL(declaredTotalUL: number, mixture: ComponentMixture): number {
  return declaredTotalUL - totalUL(mixture);
}

function assertWholeNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new Error(`${name} must be a non-negative integer microlitre value`);
  }
}

/** Game round: nearest integer, exact .5 to even. */
export function roundToEven(value: number): number {
  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction < 0.5) return floor;
  if (fraction > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

/** Blender uses midpoint rounding away from zero; all values here are non-negative. */
function roundBlender(value: number): number {
  return Math.floor(value + 0.5);
}

export function dreamCapRawComponents(grams: number): ComponentMixture {
  if (!Number.isFinite(grams) || grams < 0) throw new Error('Dream Cap grams must be non-negative');
  const ratio = grams / DREAM_CAP_REFERENCE_WEIGHT_G;
  return {
    ...emptyMixture(),
    dreamCapMush: Math.trunc(27_333 * ratio),
    water: Math.trunc(4_000 * ratio),
    protein: Math.trunc(2_000 * ratio),
    mineral: Math.trunc(500 * ratio),
    microbes: Math.trunc(2_000 * ratio),
    physicalContaminant: Math.trunc(2_000 * ratio),
  };
}

export function blenderLossFraction(modules: number): number {
  if (modules <= 0) return 0.35;
  if (modules === 1) return 0.2;
  if (modules === 2) return 0.1;
  if (modules === 3) return 0.05;
  return 0;
}

export function applyBlenderLoss(raw: ComponentMixture, modules: number): ComponentMixture {
  const keep = 1 - blenderLossFraction(Math.max(0, Math.trunc(modules)));
  return Object.fromEntries(
    COMPONENT_KEYS.map((key) => [key, roundBlender(raw[key] * keep)]),
  ) as unknown as ComponentMixture;
}

export function dreamCapMushDegradationFactor(temperatureC: number): number {
  if (temperatureC < 50) return 0;
  if (temperatureC < 70) return 0.1 * ((temperatureC - 50) / 10);
  if (temperatureC < 100) return 0.1 + 0.8 * ((temperatureC - 70) / 30);
  return 0.9 + 0.1 * Math.min((temperatureC - 100) / 20, 1);
}

export function dreamCapExtractDegradationFactor(temperatureC: number): number {
  if (temperatureC < 60) return 0;
  if (temperatureC < 70) return 0.1 * ((temperatureC - 60) / 10);
  if (temperatureC < 100) return 0.1 + 0.8 * ((temperatureC - 70) / 30);
  return 0.9 + 0.1 * Math.min((temperatureC - 100) / 20, 1);
}

function boilingLoss(componentUL: number, temperatureC: number, boilingPointC: number): number {
  if (temperatureC <= boilingPointC || componentUL <= 0) return 0;
  return Math.min(componentUL, Math.max(100, Math.trunc(componentUL * 0.02)));
}

function runTick(input: ComponentMixture, temperatureC: number, tick: number): ExtractionTick {
  const state = { ...input };
  const startingMicrobesUL = state.microbes;

  // Branch 1: microbes under heat.
  if (temperatureC >= 100) state.microbes = 0;
  else if (temperatureC >= 70) state.microbes = Math.trunc(state.microbes * 0.8);

  // Branch 2: alcohol removes microbes when it is at least 40% of total.
  const beforeAlcoholBranchTotal = totalUL(state);
  if (
    state.alcohol > 0 &&
    state.microbes > 0 &&
    beforeAlcoholBranchTotal > 0 &&
    state.alcohol >= beforeAlcoholBranchTotal * 0.4
  ) {
    state.microbes -= Math.min(state.microbes, state.alcohol);
  }

  // Branch 4: Dream Cap extraction.
  let processedMushUL = 0;
  let extractProducedUL = 0;
  let plantMatterProducedUL = 0;
  if (temperatureC >= 40 && state.dreamCapMush > 0 && state.alcohol > 0) {
    const mush = state.dreamCapMush;
    processedMushUL = Math.min(mush, Math.max(2_000, roundToEven(0.1 * mush)));
    extractProducedUL = roundToEven(
      processedMushUL * Math.min(0.5, (0.1 * state.alcohol) / mush),
    );
    plantMatterProducedUL = processedMushUL - extractProducedUL;
    state.dreamCapMush -= processedMushUL;
    state.dreamCapExtract += extractProducedUL;
    state.plantMatter += plantMatterProducedUL;
  }

  // Branches 9 and 10: thermal degradation after extraction.
  const degradedExtractUL = Math.trunc(
    state.dreamCapExtract * dreamCapExtractDegradationFactor(temperatureC),
  );
  state.dreamCapExtract -= degradedExtractUL;
  const degradedMushUL = Math.trunc(
    state.dreamCapMush * dreamCapMushDegradationFactor(temperatureC),
  );
  state.dreamCapMush -= degradedMushUL;
  state.plantMatter += degradedMushUL;

  // Branch 22: boiling, performed last. Vapor is not recovered.
  const evaporatedAlcoholUL = boilingLoss(state.alcohol, temperatureC, 78.37);
  const evaporatedWaterUL = boilingLoss(state.water, temperatureC, 100);
  state.alcohol -= evaporatedAlcoholUL;
  state.water -= evaporatedWaterUL;

  return {
    tick,
    microbesRemovedUL: startingMicrobesUL - state.microbes,
    processedMushUL,
    extractProducedUL,
    plantMatterProducedUL,
    degradedMushUL,
    degradedExtractUL,
    evaporatedAlcoholUL,
    evaporatedWaterUL,
    state,
  };
}

export function simulateExtraction(config: ExtractionConfig): ExtractionResult {
  if (!Number.isFinite(config.temperatureC)) throw new Error('Temperature must be finite');
  if (!Number.isInteger(config.updates) || config.updates < 0 || config.updates > 10_000) {
    throw new Error('Updates must be an integer from 0 to 10,000');
  }
  const initialRaw = dreamCapRawComponents(config.dreamCapGrams);
  const initialAfterBlender = applyBlenderLoss(initialRaw, config.blenderModules);
  const initialMixture = {
    ...initialAfterBlender,
    alcohol: Math.trunc(config.alcoholML * 1_000),
  };
  const prepared = simulateExtractionFromMixture(
    initialMixture,
    config.temperatureC,
    config.updates,
  );
  return {
    ...prepared,
    initialRaw,
    initialAfterBlender,
    initialMixture,
  };
}

export function simulateExtractionFromMixture(
  initialMixture: ComponentMixture,
  temperatureC: number,
  updates: number,
): ExtractionResult {
  if (!Number.isFinite(temperatureC)) throw new Error('Temperature must be finite');
  if (!Number.isInteger(updates) || updates < 0 || updates > 10_000) {
    throw new Error('Updates must be an integer from 0 to 10,000');
  }
  for (const key of COMPONENT_KEYS) {
    assertWholeNonNegative(initialMixture[key], key);
  }
  let state = { ...initialMixture };
  const ticks: ExtractionTick[] = [];
  let stoppedBecause: ExtractionResult['stoppedBecause'] = 'updates-complete';

  for (let tick = 1; tick <= updates; tick += 1) {
    const result = runTick(state, temperatureC, tick);
    ticks.push(result);
    state = result.state;
    if (state.dreamCapMush === 0) {
      stoppedBecause = 'no-mush';
      break;
    }
    const changed =
      result.processedMushUL +
      result.degradedMushUL +
      result.degradedExtractUL +
      result.evaporatedAlcoholUL +
      result.evaporatedWaterUL;
    if (changed === 0) {
      stoppedBecause = 'no-progress';
      break;
    }
  }

  return {
    initialRaw: { ...initialMixture },
    initialAfterBlender: { ...initialMixture },
    initialMixture: { ...initialMixture },
    final: state,
    ticks,
    stoppedBecause,
    sourceBoundary:
      'Implements applicable branches 1, 2, 4, 9, 10 and 22 in whole µL. Filtering, Evaporator and finishing are modeled separately from their versioned item rules.',
  };
}

type AllocationPart = { key: string; amount: number; registryOrder: number };

/** Proportional whole-µL allocation with largest-remainder tie breaking. */
function allocateProportionally(parts: AllocationPart[], requested: number): Record<string, number> {
  const total = parts.reduce((sum, part) => sum + part.amount, 0);
  if (requested > total) throw new Error('Requested sample exceeds available volume');
  if (requested === 0 || total === 0) {
    return Object.fromEntries(parts.map((part) => [part.key, 0]));
  }
  const rows = parts.map((part) => {
    const exact = (part.amount * requested) / total;
    const base = Math.floor(exact);
    return { ...part, exact, base, fraction: exact - base };
  });
  let remainder = requested - rows.reduce((sum, row) => sum + row.base, 0);
  rows.sort(
    (a, b) =>
      b.fraction - a.fraction ||
      b.amount - a.amount ||
      a.registryOrder - b.registryOrder,
  );
  for (let index = 0; index < rows.length && remainder > 0; index += 1, remainder -= 1) {
    const row = rows[index];
    if (!row) break;
    row.base += 1;
  }
  return Object.fromEntries(rows.map((row) => [row.key, row.base]));
}

export function finishMeasuredComposition(
  measured: MeasuredComposition,
  modules: number,
  requestedVials = Number.POSITIVE_INFINITY,
): FinisherResult {
  assertWholeNonNegative(measured.totalUL, 'Total volume');
  assertWholeNonNegative(measured.activeUL, 'Active volume');
  assertWholeNonNegative(measured.evaporativeUL, 'Evaporative volume');
  if (measured.activeUL > measured.totalUL) {
    return { success: false, reason: 'Active volume cannot exceed total volume', vials: [], meanPurity: 0, remaining: measured };
  }
  if (measured.evaporativeUL > measured.totalUL) {
    return { success: false, reason: 'Evaporative volume cannot exceed total volume', vials: [], meanPurity: 0, remaining: measured };
  }
  if (measured.activeUL + measured.evaporativeUL > measured.totalUL) {
    return {
      success: false,
      reason: 'Dream Cap Extract and evaporative components are disjoint; their measured sum cannot exceed total volume',
      vials: [],
      meanPurity: 0,
      remaining: measured,
    };
  }
  if (measured.evaporativeUL > 100) {
    return {
      success: false,
      reason: `Dry input requires total evaporatives ≤100 µL; measured ${measured.evaporativeUL} µL`,
      vials: [],
      meanPurity: 0,
      remaining: measured,
    };
  }
  const availableVials = Math.floor(measured.totalUL / DREAM_DUST_SAMPLE_UL);
  const vialLimit = Number.isFinite(requestedVials)
    ? Math.max(0, Math.trunc(requestedVials))
    : availableVials;
  const count = Math.min(availableVials, vialLimit);
  let remainingActive = measured.activeUL;
  let remainingTotal = measured.totalUL;
  let remainingEvaporative = measured.evaporativeUL;
  const vials: FinishedVial[] = [];
  const contaminationUL = Math.trunc(
    DREAM_DUST_SAMPLE_UL * (getFinisherContamination(Math.max(0, Math.trunc(modules))) / 100),
  );

  for (let index = 0; index < count; index += 1) {
    const sampled = allocateProportionally(
      [
        { key: 'active', amount: remainingActive, registryOrder: 0 },
        { key: 'other', amount: remainingTotal - remainingActive, registryOrder: 1 },
      ],
      DREAM_DUST_SAMPLE_UL,
    );
    const sampledEvaporative = allocateProportionally(
      [
        { key: 'evaporative', amount: remainingEvaporative, registryOrder: 0 },
        { key: 'nonEvaporative', amount: remainingTotal - remainingEvaporative, registryOrder: 1 },
      ],
      DREAM_DUST_SAMPLE_UL,
    ).evaporative ?? 0;
    const sampledActive = sampled.active ?? 0;
    const sampledOther = sampled.other ?? 0;
    remainingActive -= sampledActive;
    remainingTotal -= DREAM_DUST_SAMPLE_UL;
    remainingEvaporative -= sampledEvaporative;

    const replaced = allocateProportionally(
      [
        { key: 'active', amount: sampledActive, registryOrder: 0 },
        { key: 'other', amount: sampledOther, registryOrder: 1 },
      ],
      contaminationUL,
    );
    const replacedActive = replaced.active ?? 0;
    const replacedOther = replaced.other ?? 0;
    const finalActiveUL = sampledActive - replacedActive;
    vials.push({
      sampleActiveUL: sampledActive,
      sampleOtherUL: sampledOther,
      replacedActiveUL: replacedActive,
      replacedOtherUL: replacedOther,
      physicalContaminantUL: contaminationUL,
      finalActiveUL,
      finalTotalUL: DREAM_DUST_SAMPLE_UL,
      purity: (finalActiveUL / DREAM_DUST_SAMPLE_UL) * 100,
    });
  }

  return {
    success: true,
    vials,
    meanPurity: vials.length
      ? vials.reduce((sum, vial) => sum + vial.purity, 0) / vials.length
      : 0,
    remaining: {
      totalUL: remainingTotal,
      activeUL: remainingActive,
      evaporativeUL: remainingEvaporative,
    },
  };
}

function minimumAdditionForTarget(
  measured: MeasuredComposition,
  modules: number,
  targetPurity: number,
  targetVials: number,
): number | null {
  const maxSearch = Math.max(100_000, measured.totalUL * 4);
  for (let addition = 0; addition <= maxSearch; addition += 1) {
    const result = finishMeasuredComposition(
      { ...measured, totalUL: measured.totalUL + addition, activeUL: measured.activeUL + addition },
      modules,
      targetVials,
    );
    if (
      result.success &&
      result.vials.length >= targetVials &&
      result.meanPurity + Number.EPSILON >= targetPurity
    ) return addition;
  }
  return null;
}

function minimumOtherRemovalForTarget(
  measured: MeasuredComposition,
  modules: number,
  targetPurity: number,
  targetVials: number,
): number | null {
  const other = measured.totalUL - measured.activeUL;
  for (let removal = 0; removal <= other; removal += 1) {
    const total = measured.totalUL - removal;
    if (total < targetVials * DREAM_DUST_SAMPLE_UL) break;
    const result = finishMeasuredComposition(
      { ...measured, totalUL: total, evaporativeUL: Math.min(measured.evaporativeUL, total - measured.activeUL) },
      modules,
      targetVials,
    );
    if (
      result.success &&
      result.vials.length >= targetVials &&
      result.meanPurity + Number.EPSILON >= targetPurity
    ) return removal;
  }
  return null;
}

export function solveMeasuredTarget(input: MeasuredReverseInput): MeasuredReverseResult {
  const reasons: string[] = [];
  if (!input.finisherOwned) reasons.push('Chem Finisher is not owned');
  if (input.evaporativeUL > 100) reasons.push('Measured mixture is not dry (evaporatives exceed 100 µL)');
  if (input.targetPurity < 0 || input.targetPurity > 100) reasons.push('Target purity must be from 0% to 100%');
  if (!Number.isInteger(input.targetVials) || input.targetVials < 1) reasons.push('Target vials must be a positive integer');
  if (input.finisherCapacityVials < input.targetVials) {
    reasons.push(`Equipment/output capacity is ${input.finisherCapacityVials} vials, below target ${input.targetVials}`);
  }
  if (input.totalUL < input.targetVials * DREAM_DUST_SAMPLE_UL) {
    reasons.push(`Need at least ${input.targetVials * DREAM_DUST_SAMPLE_UL} µL measured mixture for ${input.targetVials} vials`);
  }
  if (reasons.length) {
    return {
      status: 'insufficient-resources',
      reasons,
      options: [],
      boundary: 'Uses measured post-processing composition only; does not infer filtering or overnight evaporation.',
    };
  }

  const minModules = Math.max(0, Math.trunc(input.currentModules));
  const maxModules = Math.min(4, Math.max(minModules, Math.trunc(input.maxModulesOwned)));
  const options: ReverseOption[] = [];
  for (let modules = minModules; modules <= maxModules; modules += 1) {
    const upgrades = modules - minModules;
    const cost = input.quotedModuleCost === undefined ? undefined : upgrades * input.quotedModuleCost;
    if (input.availableBudget !== undefined && cost !== undefined && cost > input.availableBudget) continue;
    const finished = finishMeasuredComposition(input, modules, input.targetVials);
    const meets =
      finished.success &&
      finished.vials.length >= input.targetVials &&
      finished.meanPurity + Number.EPSILON >= input.targetPurity;
    options.push({
      modules,
      upgradeModules: upgrades,
      quotedUpgradeCost: cost,
      vialsAvailable: finished.vials.length,
      achievedMeanPurity: finished.meanPurity,
      meetsTargetNow: meets,
      minimumPureActiveAdditionUL: meets
        ? 0
        : minimumAdditionForTarget(input, modules, input.targetPurity, input.targetVials),
      minimumSelectiveOtherRemovalUL: meets
        ? 0
        : minimumOtherRemovalForTarget(input, modules, input.targetPurity, input.targetVials),
      note:
        'Addition/removal figures are mathematical composition requirements, not a guaranteed in-game recipe. A real selective process and a new Spectrometer reading are required.',
    });
  }
  const anyMeets = options.some((option) => option.meetsTargetNow);
  return {
    status: anyMeets ? 'feasible-now' : 'composition-change-required',
    reasons: anyMeets ? [] : ['Installed/affordable modules cannot raise measured active concentration; finisher contamination only replaces sample volume.'],
    options,
    boundary:
      'Exact for measured active/total/evaporative volumes, proportional 2,000 µL sampling, and finisher replacement. It does not predict undocumented separation.',
  };
}
