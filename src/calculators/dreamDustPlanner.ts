import { getFinisherContamination } from './dreamDust';
import {
  COMPONENT_KEYS,
  DREAM_DUST_SAMPLE_UL,
  VOLATILE_KEYS,
  type ComponentKey,
  type ComponentMixture,
  applyBlenderLoss,
  dreamCapRawComponents,
  emptyMixture,
  roundToEven,
  simulateExtractionFromMixture,
  totalUL,
  volatileUL,
} from './dreamDustVerified';

export const SUPPORTED_GAME_VERSION = '0.46D / Steam Build 26337366';
export const SAFE_EXTRACTION_TEMPERATURE_C = 44;
export const SEARCH_GRAM_STEP = 0.1;
export const SEARCH_GROUND_STEP_UL = 100;

const addMixture = (a: ComponentMixture, b: ComponentMixture): ComponentMixture =>
  Object.fromEntries(COMPONENT_KEYS.map((key) => [key, a[key] + b[key]])) as unknown as ComponentMixture;

const subtractMixture = (a: ComponentMixture, b: ComponentMixture): ComponentMixture =>
  Object.fromEntries(COMPONENT_KEYS.map((key) => [key, a[key] - b[key]])) as unknown as ComponentMixture;

type AllocationPart = { key: string; amount: number; registryOrder: number };

/** Largest-remainder allocation used by liquid transfers and the Chem Finisher. */
export function allocateWholeUL(parts: AllocationPart[], requested: number): Record<string, number> {
  const available = parts.reduce((sum, part) => sum + part.amount, 0);
  if (!Number.isInteger(requested) || requested < 0 || requested > available) {
    throw new Error('Requested allocation must be a whole µL volume within the available amount');
  }
  if (requested === 0 || available === 0) {
    return Object.fromEntries(parts.map((part) => [part.key, 0]));
  }
  const rows = parts.map((part) => {
    const exact = (part.amount * requested) / available;
    const base = Math.floor(exact);
    return { ...part, base, fraction: exact - base };
  });
  let remainder = requested - rows.reduce((sum, row) => sum + row.base, 0);
  rows.sort(
    (a, b) =>
      b.fraction - a.fraction ||
      b.amount - a.amount ||
      a.registryOrder - b.registryOrder,
  );
  for (let index = 0; remainder > 0; index = (index + 1) % rows.length, remainder -= 1) {
    rows[index]!.base += 1;
  }
  return Object.fromEntries(rows.map((row) => [row.key, row.base]));
}

export function takeProportionalMixture(
  available: ComponentMixture,
  requestedUL: number,
): ComponentMixture {
  const allocated = allocateWholeUL(
    COMPONENT_KEYS.map((key, registryOrder) => ({
      key,
      amount: available[key],
      registryOrder,
    })),
    requestedUL,
  );
  return Object.fromEntries(
    COMPONENT_KEYS.map((key) => [key, allocated[key] ?? 0]),
  ) as unknown as ComponentMixture;
}

const FILTER_RULES: Partial<
  Record<ComponentKey, { particleSize: number; stepUL: number; durability: number; floorRatio: number }>
> = {
  organicWaste: { particleSize: 40, stepUL: 1_000, durability: 1, floorRatio: 0.0016 },
  physicalContaminant: { particleSize: 100, stepUL: 1_500, durability: 2, floorRatio: 0.0016 },
  mineral: { particleSize: 30, stepUL: 2_000, durability: 1, floorRatio: 0.0016 },
  dreamCapMush: { particleSize: 200, stepUL: 1_000, durability: 2, floorRatio: 0 },
  plantMatter: { particleSize: 200, stepUL: 1_000, durability: 2, floorRatio: 0 },
  insolubleDebris: { particleSize: 200, stepUL: 1_000, durability: 2, floorRatio: 0 },
};

// Wiki water-filter liquid-table order for the components this mixture tracks.
const FILTER_COMPONENT_ORDER: ComponentKey[] = [
  'organicWaste',
  'physicalContaminant',
  'mineral',
  'dreamCapMush',
  'plantMatter',
  'insolubleDebris',
];

export interface FilterPass {
  name: 'Kotton Fabric' | 'Water Filter';
  poreSize: number;
  startingDurability: number;
  remainingDurability: number;
  removed: ComponentMixture;
  output: ComponentMixture;
  hitIterationGuard: boolean;
}

export function applyFilter(
  input: ComponentMixture,
  name: FilterPass['name'],
  poreSize: number,
  durability: number,
): FilterPass {
  let remainingDurability = Math.max(0, Math.trunc(durability));
  const output = { ...input };
  const removed = emptyMixture();
  let iterations = 0;
  let hitIterationGuard = false;

  for (const key of FILTER_COMPONENT_ORDER) {
    const rule = FILTER_RULES[key];
    if (!rule || rule.particleSize < poreSize) continue;
    const floor = Math.floor(input[key] * rule.floorRatio);
    while (remainingDurability > 0 && output[key] > floor) {
      if (iterations >= 10_000) {
        hitIterationGuard = true;
        break;
      }
      const before = output[key];
      output[key] = Math.max(floor, output[key] - rule.stepUL);
      removed[key] += before - output[key];
      remainingDurability = Math.max(0, remainingDurability - rule.durability);
      iterations += 1;
    }
    if (hitIterationGuard) break;
  }

  return {
    name,
    poreSize,
    startingDurability: Math.max(0, Math.trunc(durability)),
    remainingDurability,
    removed,
    output,
    hitIterationGuard,
  };
}

export interface FiltrationResult {
  output: ComponentMixture;
  passes: FilterPass[];
  removed: ComponentMixture;
}

export function filterDreamDustMixture(
  input: ComponentMixture,
  kottonDurability: number,
  waterFilterDurability: number,
): FiltrationResult {
  let state = { ...input };
  const passes: FilterPass[] = [];
  let removed = emptyMixture();
  if (kottonDurability > 0) {
    const pass = applyFilter(state, 'Kotton Fabric', 150, kottonDurability);
    state = pass.output;
    removed = addMixture(removed, pass.removed);
    passes.push(pass);
  }
  if (waterFilterDurability > 0) {
    const pass = applyFilter(state, 'Water Filter', 22, waterFilterDurability);
    state = pass.output;
    removed = addMixture(removed, pass.removed);
    passes.push(pass);
  }
  return { output: state, passes, removed };
}

export interface EvaporatorConfig {
  performancePercent: number;
  efficiencyPercent: number;
  qualityPercent: number;
  availableEnergy: number;
  distillateCapacityUL: number;
  solventRecoveryModule: boolean;
}

export interface EvaporationCycle {
  cycle: number;
  allowanceUL: number;
  removed: ComponentMixture;
  recovered: ComponentMixture;
  lost: ComponentMixture;
  output: ComponentMixture;
  energyUsed: number;
  remainingEnergy: number;
  remainingReceiverUL: number;
  remainingVolatilesUL: number;
}

export interface EvaporationResult {
  success: boolean;
  reason?: string;
  output: ComponentMixture;
  cycles: EvaporationCycle[];
  energyPerCycle: number;
  energyUsed: number;
  removed: ComponentMixture;
  recovered: ComponentMixture;
  lost: ComponentMixture;
  remainingDistillateCapacityUL: number;
  remainingEnergy: number;
}

export function evaporatorEnergyPerNight(efficiencyPercent: number): number {
  return Math.max(1, 6 - Math.trunc((6 * efficiencyPercent) / 100));
}

export function evaporatorAllowanceUL(performancePercent: number): number {
  return roundToEven(300_000 * Math.max(0, 1 + performancePercent / 100));
}

export function evaporateOneNight(
  input: ComponentMixture,
  config: EvaporatorConfig,
): EvaporationCycle & { success: boolean; reason?: string; energyPerCycle: number; alreadyDry: boolean } {
  const allowanceUL = evaporatorAllowanceUL(config.performancePercent);
  const energyPerCycle = evaporatorEnergyPerNight(config.efficiencyPercent);
  const remainingVolatiles = volatileUL(input);
  const remainingEnergy = Math.max(0, Math.trunc(config.availableEnergy));
  const remainingReceiverUL = Math.max(0, Math.trunc(config.distillateCapacityUL));
  const blank: EvaporationCycle & { success: boolean; reason?: string; energyPerCycle: number; alreadyDry: boolean } = {
    cycle: 1,
    allowanceUL,
    removed: emptyMixture(),
    recovered: emptyMixture(),
    lost: emptyMixture(),
    output: { ...input },
    energyUsed: 0,
    remainingEnergy,
    remainingReceiverUL,
    remainingVolatilesUL: remainingVolatiles,
    success: true,
    energyPerCycle,
    alreadyDry: remainingVolatiles <= 100,
  };
  if (remainingVolatiles <= 100) {
    return { ...blank, alreadyDry: true };
  }
  if (remainingEnergy < energyPerCycle) {
    return {
      ...blank,
      success: false,
      reason: `Insufficient energy: ${remainingVolatiles} µL evaporatives remain; ${energyPerCycle} kJ required`,
    };
  }
  if (allowanceUL <= 0) {
    return {
      ...blank,
      success: false,
      energyUsed: energyPerCycle,
      remainingEnergy: remainingEnergy - energyPerCycle,
      reason: 'Evaporator drew power, but performance at or below −100% gives zero removal allowance',
    };
  }

  const actualRemoval = Math.min(allowanceUL, remainingVolatiles);
  const allocated = allocateWholeUL(
    VOLATILE_KEYS.map((key, registryOrder) => ({
      key,
      amount: input[key],
      registryOrder,
    })),
    actualRemoval,
  );
  const removed = emptyMixture();
  for (const key of VOLATILE_KEYS) removed[key] = allocated[key] ?? 0;
  const recovered = emptyMixture();
  let receiverCapacity = remainingReceiverUL;
  const quality = Math.min(100, Math.max(0, config.qualityPercent));
  for (const key of VOLATILE_KEYS) {
    if (config.solventRecoveryModule && key !== 'alcohol') continue;
    const potential = roundToEven((removed[key] * quality) / 100);
    const amount = Math.min(potential, receiverCapacity);
    recovered[key] = amount;
    receiverCapacity -= amount;
  }
  const lost = subtractMixture(removed, recovered);
  const output = subtractMixture(input, removed);
  return {
    cycle: 1,
    allowanceUL,
    removed,
    recovered,
    lost,
    output,
    energyUsed: energyPerCycle,
    remainingEnergy: remainingEnergy - energyPerCycle,
    remainingReceiverUL: receiverCapacity,
    remainingVolatilesUL: volatileUL(output),
    success: true,
    energyPerCycle,
    alreadyDry: volatileUL(output) <= 100,
  };
}

export function evaporateToDryness(
  input: ComponentMixture,
  config: EvaporatorConfig,
): EvaporationResult {
  let state = { ...input };
  let availableEnergy = Math.max(0, Math.trunc(config.availableEnergy));
  let receiverCapacity = Math.max(0, Math.trunc(config.distillateCapacityUL));
  const energyPerCycle = evaporatorEnergyPerNight(config.efficiencyPercent);
  const cycles: EvaporationCycle[] = [];
  let allRemoved = emptyMixture();
  let allRecovered = emptyMixture();
  let allLost = emptyMixture();

  for (let cycle = 1; volatileUL(state) > 100; cycle += 1) {
    if (cycle > 10_000) {
      return {
        success: false,
        reason: 'Evaporation stopped at the 10,000-cycle convergence guard',
        output: state,
        cycles,
        energyPerCycle,
        energyUsed: cycles.reduce((sum, row) => sum + row.energyUsed, 0),
        removed: allRemoved,
        recovered: allRecovered,
        lost: allLost,
        remainingDistillateCapacityUL: receiverCapacity,
        remainingEnergy: availableEnergy,
      };
    }
    const night = evaporateOneNight(state, {
      ...config,
      availableEnergy,
      distillateCapacityUL: receiverCapacity,
    });
    if (!night.success) {
      return {
        success: false,
        reason: night.reason,
        output: state,
        cycles,
        energyPerCycle,
        energyUsed: cycles.reduce((sum, row) => sum + row.energyUsed, 0) + night.energyUsed,
        removed: allRemoved,
        recovered: allRecovered,
        lost: allLost,
        remainingDistillateCapacityUL: night.remainingReceiverUL,
        remainingEnergy: night.remainingEnergy,
      };
    }
    state = night.output;
    availableEnergy = night.remainingEnergy;
    receiverCapacity = night.remainingReceiverUL;
    allRemoved = addMixture(allRemoved, night.removed);
    allRecovered = addMixture(allRecovered, night.recovered);
    allLost = addMixture(allLost, night.lost);
    cycles.push({ ...night, cycle });
  }

  return {
    success: true,
    output: state,
    cycles,
    energyPerCycle,
    energyUsed: cycles.reduce((sum, row) => sum + row.energyUsed, 0),
    removed: allRemoved,
    recovered: allRecovered,
    lost: allLost,
    remainingDistillateCapacityUL: receiverCapacity,
    remainingEnergy: availableEnergy,
  };
}

export interface ComponentVial {
  sampled: ComponentMixture;
  replaced: ComponentMixture;
  final: ComponentMixture;
  purity: number;
}

export interface ComponentFinisherResult {
  success: boolean;
  reason?: string;
  vials: ComponentVial[];
  meanPurity: number;
  remaining: ComponentMixture;
  replaced: ComponentMixture;
}

export function finishComponentMixture(
  input: ComponentMixture,
  modules: number,
  requestedVials: number,
): ComponentFinisherResult {
  let remaining = { ...input };
  const vials: ComponentVial[] = [];
  let allReplaced = emptyMixture();
  if (volatileUL(input) > 100) {
    return {
      success: false,
      reason: `Finisher dryness requires ≤100 µL evaporatives; ${volatileUL(input)} µL remain`,
      vials,
      meanPurity: 0,
      remaining,
      replaced: allReplaced,
    };
  }
  const count = Math.min(
    Math.max(0, Math.trunc(requestedVials)),
    Math.floor(totalUL(input) / DREAM_DUST_SAMPLE_UL),
  );
  const contaminationUL = Math.trunc(
    DREAM_DUST_SAMPLE_UL * (getFinisherContamination(Math.max(0, Math.trunc(modules))) / 100),
  );
  for (let index = 0; index < count; index += 1) {
    const sampled = takeProportionalMixture(remaining, DREAM_DUST_SAMPLE_UL);
    remaining = subtractMixture(remaining, sampled);
    const replaced = takeProportionalMixture(sampled, contaminationUL);
    const final = subtractMixture(sampled, replaced);
    final.physicalContaminant += contaminationUL;
    allReplaced = addMixture(allReplaced, replaced);
    vials.push({
      sampled,
      replaced,
      final,
      purity: (final.dreamCapExtract / DREAM_DUST_SAMPLE_UL) * 100,
    });
  }
  return {
    success: true,
    vials,
    meanPurity: vials.length
      ? vials.reduce((sum, vial) => sum + vial.purity, 0) / vials.length
      : 0,
    remaining,
    replaced: allReplaced,
  };
}

export type MaterialInventory =
  | {
      state: 'raw';
      availableGrams: number;
      blenderOwned: boolean;
      blenderModules: number;
    }
  | {
      state: 'ground';
      available: ComponentMixture;
    };

export interface ProductionPlannerInput {
  targetPurity: number;
  targetVials: number;
  material: MaterialInventory;
  alcoholAvailableUL: number;
  heatingPlateOwned: boolean;
  heatingPlateModules: number;
  filterContainerOwned: boolean;
  kottonDurability: number;
  waterFilterDurability: number;
  evaporatorOwned: boolean;
  evaporatorPerformancePercent: number;
  evaporatorEfficiencyPercent: number;
  evaporatorQualityPercent: number;
  solventRecoveryModule: boolean;
  distillateCapacityUL: number;
  availableEnergy: number;
  processingContainerCapacityUL: number;
  finisherOwned: boolean;
  finisherModules: number;
  finisherCapacityVials: number;
  credits: number;
  allowPurchases: boolean;
  mushroomQuoteCreditsPerGram?: number;
  alcoholQuoteCreditsPerML?: number;
}

export interface ProductionCandidate {
  materialUsed: ComponentMixture;
  rawGramsUsed: number;
  groundULUsed: number;
  blenderLoss: ComponentMixture;
  alcoholUsedUL: number;
  purchaseCost: number;
  extraction: ReturnType<typeof simulateExtractionFromMixture>;
  extractionLoss: ComponentMixture;
  filtration: FiltrationResult;
  evaporation: EvaporationResult;
  finishing: ComponentFinisherResult;
  waste: ComponentMixture;
  finalMixtureBeforeFinishing: ComponentMixture;
}

export interface ProductionPlan {
  status: 'feasible' | 'no-solution-in-supported-search' | 'unsupported-input' | 'search-incomplete-limit-reached';
  reasons: string[];
  candidate: ProductionCandidate | null;
  bestPurityCandidate: ProductionCandidate | null;
  maxQuantityCandidate: ProductionCandidate | null;
  searchSummary: string;
  boundary: string;
}

function purchasedResourceLimit(
  owned: number,
  creditsAfterOtherPurchase: number,
  quotePerUnit: number | undefined,
  allowPurchases: boolean,
): number {
  if (!allowPurchases || quotePerUnit === undefined || quotePerUnit < 0) return owned;
  if (quotePerUnit === 0) return Number.POSITIVE_INFINITY;
  return owned + Math.max(0, creditsAfterOtherPurchase) / quotePerUnit;
}

function validatePlannerInput(input: ProductionPlannerInput): string[] {
  const reasons: string[] = [];
  if (!Number.isFinite(input.targetPurity) || input.targetPurity < 0 || input.targetPurity > 100) {
    reasons.push('Target purity must be from 0% to 100%');
  }
  if (!Number.isInteger(input.targetVials) || input.targetVials < 1) {
    reasons.push('Target vials must be a positive integer');
  }
  if (!input.heatingPlateOwned) reasons.push('Owned Heating Plate is required');
  if (input.heatingPlateModules < 2) {
    reasons.push('This supported plan requires at least 2 Heating Plate modules for a controlled 44°C setting');
  }
  if (!input.evaporatorOwned) reasons.push('Owned Evaporator is required for sourced dryness processing');
  if (!input.finisherOwned) reasons.push('Owned Chem Finisher is required');
  if (input.finisherCapacityVials < input.targetVials) {
    reasons.push(`Finisher/output capacity ${input.finisherCapacityVials} is below ${input.targetVials} requested vials`);
  }
  if (input.processingContainerCapacityUL <= 0) reasons.push('A positive processing-container capacity is required');
  if (input.availableEnergy < 0) reasons.push('Available energy cannot be negative');
  if (input.material.state === 'raw' && !input.material.blenderOwned) {
    reasons.push('Raw Dream Cap requires an owned Blender');
  }
  if (
    (input.kottonDurability > 0 || input.waterFilterDurability > 0) &&
    !input.filterContainerOwned
  ) {
    reasons.push('Owned compatible filter container/Water Pitcher is required to apply entered filters');
  }
  if (input.allowPurchases) {
    if (
      input.material.state === 'raw' &&
      input.mushroomQuoteCreditsPerGram !== undefined &&
      input.mushroomQuoteCreditsPerGram < 0
    ) reasons.push('Mushroom quote cannot be negative');
    if (
      input.alcoholQuoteCreditsPerML !== undefined &&
      input.alcoholQuoteCreditsPerML < 0
    ) reasons.push('Alcohol quote cannot be negative');
  }
  return reasons;
}

function candidateWaste(
  blenderLoss: ComponentMixture,
  extractionLoss: ComponentMixture,
  filtration: FiltrationResult,
  evaporation: EvaporationResult,
  finishing: ComponentFinisherResult,
): ComponentMixture {
  return addMixture(
    addMixture(addMixture(blenderLoss, extractionLoss), filtration.removed),
    addMixture(evaporation.lost, finishing.replaced),
  );
}

function totalExtractionLoss(
  extraction: ReturnType<typeof simulateExtractionFromMixture>,
): ComponentMixture {
  const loss = emptyMixture();
  for (const tick of extraction.ticks) {
    loss.microbes += tick.microbesRemovedUL;
    loss.dreamCapExtract += tick.degradedExtractUL;
    loss.alcohol += tick.evaporatedAlcoholUL;
    loss.water += tick.evaporatedWaterUL;
  }
  return loss;
}

function evaluateCandidate(
  input: ProductionPlannerInput,
  preparedMaterial: ComponentMixture,
  rawBeforeBlender: ComponentMixture,
  rawGramsUsed: number,
  groundULUsed: number,
  alcoholUL: number,
  purchaseCost: number,
): ProductionCandidate | null {
  const initial = { ...preparedMaterial, alcohol: preparedMaterial.alcohol + alcoholUL };
  if (totalUL(initial) > input.processingContainerCapacityUL) return null;
  const extraction = simulateExtractionFromMixture(
    initial,
    SAFE_EXTRACTION_TEMPERATURE_C,
    10_000,
  );
  const extractionLoss = totalExtractionLoss(extraction);
  const filtration = filterDreamDustMixture(
    extraction.final,
    input.filterContainerOwned ? input.kottonDurability : 0,
    input.filterContainerOwned ? input.waterFilterDurability : 0,
  );
  const evaporation = input.evaporatorOwned
    ? evaporateToDryness(filtration.output, {
        performancePercent: input.evaporatorPerformancePercent,
        efficiencyPercent: input.evaporatorEfficiencyPercent,
        qualityPercent: input.evaporatorQualityPercent,
        availableEnergy: input.availableEnergy,
        distillateCapacityUL: input.distillateCapacityUL,
        solventRecoveryModule: input.solventRecoveryModule,
      })
    : {
        success: false,
        reason: 'Evaporator is not owned',
        output: filtration.output,
        cycles: [],
        energyPerCycle: 6,
        energyUsed: 0,
        removed: emptyMixture(),
        recovered: emptyMixture(),
        lost: emptyMixture(),
        remainingDistillateCapacityUL: input.distillateCapacityUL,
        remainingEnergy: input.availableEnergy,
      };
  const finishing = finishComponentMixture(
    evaporation.output,
    input.finisherModules,
    Math.min(input.targetVials, input.finisherCapacityVials),
  );
  const blenderLoss = subtractMixture(rawBeforeBlender, preparedMaterial);
  return {
    materialUsed: rawBeforeBlender,
    rawGramsUsed,
    groundULUsed,
    blenderLoss,
    alcoholUsedUL: alcoholUL,
    purchaseCost,
    extraction,
    extractionLoss,
    filtration,
    evaporation,
    finishing,
    waste: candidateWaste(blenderLoss, extractionLoss, filtration, evaporation, finishing),
    finalMixtureBeforeFinishing: evaporation.output,
  };
}

const candidateMeets = (candidate: ProductionCandidate, input: ProductionPlannerInput): boolean =>
  candidate.evaporation.success &&
  candidate.finishing.success &&
  candidate.finishing.vials.length >= input.targetVials &&
  candidate.finishing.meanPurity + Number.EPSILON >= input.targetPurity;

const maxPossibleVials = (candidate: ProductionCandidate, input: ProductionPlannerInput): number =>
  candidate.evaporation.success
    ? Math.min(
        Math.floor(totalUL(candidate.finalMixtureBeforeFinishing) / DREAM_DUST_SAMPLE_UL),
        input.finisherCapacityVials,
      )
    : 0;

function evaluateWithMinimumAlcohol(
  input: ProductionPlannerInput,
  prepared: ComponentMixture,
  raw: ComponentMixture,
  rawGrams: number,
  groundUL: number,
  maxAlcoholUL: number,
  materialPurchaseCost: number,
): ProductionCandidate {
  const alcoholCostPerUL =
    input.allowPurchases && input.alcoholQuoteCreditsPerML !== undefined
      ? input.alcoholQuoteCreditsPerML / 1_000
      : undefined;
  const ownedAlcohol = Math.max(0, Math.trunc(input.alcoholAvailableUL));
  const costFor = (alcoholUL: number) =>
    materialPurchaseCost +
    Math.max(0, alcoholUL - ownedAlcohol) * (alcoholCostPerUL ?? 0);
  let best = evaluateCandidate(
    input,
    prepared,
    raw,
    rawGrams,
    groundUL,
    maxAlcoholUL,
    costFor(maxAlcoholUL),
  )!;
  if (!candidateMeets(best, input)) return best;

  // BOUNDED INCOMPLETE SEARCH - monotonicity NOT proven.
  // Strategy: Coarse 100µL scan up to 50,000µL, then 1µL refinement within first feasible.
  // LIMITATION: Can miss narrow feasible intervals between coarse samples.
  // "no-solution-within-search" ≠ proof of infeasibility; unsearched space remains.
  const coarseStepUL = 100;
  const coarseBoundUL = Math.min(maxAlcoholUL, 50_000);
  let firstFeasible: number | null = null;
  
  // Coarse pass: find first feasible region
  for (let alcoholUL = 0; alcoholUL <= coarseBoundUL; alcoholUL += coarseStepUL) {
    const candidate = evaluateCandidate(input, prepared, raw, rawGrams, groundUL, alcoholUL, costFor(alcoholUL));
    if (candidate && candidateMeets(candidate, input)) {
      firstFeasible = alcoholUL;
      break;
    }
  }
  
  if (firstFeasible === null) {
    return best; // No feasible candidate found in coarse search
  }
  
  // Fine pass: exhaustively search backward from first feasible to find true minimum
  const searchStart = Math.max(0, firstFeasible - coarseStepUL + 1);
  for (let alcoholUL = searchStart; alcoholUL <= firstFeasible; alcoholUL += 1) {
    const candidate = evaluateCandidate(input, prepared, raw, rawGrams, groundUL, alcoholUL, costFor(alcoholUL));
    if (candidate && candidateMeets(candidate, input)) {
      return candidate; // First feasible in ascending order is minimum
    }
  }
  
  // Shouldn't reach here if firstFeasible was valid, but return it as fallback
  return evaluateCandidate(input, prepared, raw, rawGrams, groundUL, firstFeasible, costFor(firstFeasible))!;
}

function betterFeasible(
  candidate: ProductionCandidate,
  current: ProductionCandidate | null,
): boolean {
  if (!current) return true;
  if (candidate.purchaseCost !== current.purchaseCost) return candidate.purchaseCost < current.purchaseCost;
  const candidateWasteUL = totalUL(candidate.waste);
  const currentWasteUL = totalUL(current.waste);
  if (candidateWasteUL !== currentWasteUL) return candidateWasteUL < currentWasteUL;
  if (candidate.alcoholUsedUL !== current.alcoholUsedUL) return candidate.alcoholUsedUL < current.alcoholUsedUL;
  return candidate.rawGramsUsed + candidate.groundULUsed / 1_000 <
    current.rawGramsUsed + current.groundULUsed / 1_000;
}

function betterPurity(
  candidate: ProductionCandidate,
  current: ProductionCandidate | null,
  input: ProductionPlannerInput,
): boolean {
  if (!current) return true;
  // Compare actual purity first
  if (candidate.finishing.meanPurity !== current.finishing.meanPurity) {
    return candidate.finishing.meanPurity > current.finishing.meanPurity;
  }
  // For equal purity, prefer candidate that can produce more vials from dry mixture
  const candidateMax = maxPossibleVials(candidate, input);
  const currentMax = maxPossibleVials(current, input);
  if (candidateMax !== currentMax) {
    return candidateMax > currentMax;
  }
  // Tie-break on actual vials produced (though should be equal if dry volume same)
  return candidate.finishing.vials.length > current.finishing.vials.length;
}

function betterQuantity(
  candidate: ProductionCandidate,
  current: ProductionCandidate | null,
  input: ProductionPlannerInput,
): boolean {
  if (!current) return true;
  const candidateCount = maxPossibleVials(candidate, input);
  const currentCount = maxPossibleVials(current, input);
  if (candidateCount !== currentCount) return candidateCount > currentCount;
  return candidate.finishing.meanPurity > current.finishing.meanPurity;
}

const MAX_CONFIGURATIONS = 50_000;
const MAX_RUNTIME_MS = 30_000; // 30 seconds

export type PlannerSearchOptions = {
  shouldAbort?: () => boolean;
  /** Cooperative pause every N configurations so a Worker can see a newer request. 0 = never. */
  yieldEvery?: number;
};

const yieldTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function solveProductionPlan(
  input: ProductionPlannerInput,
  options?: PlannerSearchOptions,
): ProductionPlan {
  return runPlannerSearch(input, options, false) as ProductionPlan;
}

export function solveProductionPlanAsync(
  input: ProductionPlannerInput,
  options?: PlannerSearchOptions,
): Promise<ProductionPlan> {
  return runPlannerSearch(input, { yieldEvery: 8, ...options }, true) as Promise<ProductionPlan>;
}

function runPlannerSearch(
  input: ProductionPlannerInput,
  options: PlannerSearchOptions | undefined,
  cooperative: boolean,
): ProductionPlan | Promise<ProductionPlan> {
  const validation = validatePlannerInput(input);
  const boundary =
    `Exact supported subset for ${SUPPORTED_GAME_VERSION}: raw composition, Blender, safe 44°C extraction, ` +
    'ordinary/Kotton filtering, Evaporator, and Chem Finisher. Search uses 0.1 g raw or 0.100 mL ground increments; ' +
    'a miss means no solution within those owned/purchasable resources and that resolution, not a global impossibility proof.';
  if (validation.length) {
    const invalid: ProductionPlan = {
      status: 'unsupported-input',
      reasons: validation,
      candidate: null,
      bestPurityCandidate: null,
      maxQuantityCandidate: null,
      searchSummary: 'Search did not run because required supported equipment or valid inputs are missing.',
      boundary,
    };
    return cooperative ? Promise.resolve(invalid) : invalid;
  }

  const startTime = Date.now();
  let feasible: ProductionCandidate | null = null;
  let bestPurity: ProductionCandidate | null = null;
  let maxQuantity: ProductionCandidate | null = null;
  let configurations = 0;
  let hitLimit = false;
  const credits = Math.max(0, input.credits);
  const containerCapacity = Math.max(0, Math.trunc(input.processingContainerCapacityUL));

  const consider = (
    prepared: ComponentMixture,
    raw: ComponentMixture,
    rawGrams: number,
    groundUL: number,
    materialPurchaseCost: number,
  ) => {
    const remainingCredits = credits - materialPurchaseCost;
    if (remainingCredits < -Number.EPSILON) return;
    
    // Check time and configuration limits to prevent UI freeze
    if (options?.shouldAbort?.() || configurations >= MAX_CONFIGURATIONS || (Date.now() - startTime) >= MAX_RUNTIME_MS) {
      hitLimit = true;
      return;
    }
    
    const alcoholLimitML = purchasedResourceLimit(
      Math.max(0, input.alcoholAvailableUL) / 1_000,
      remainingCredits,
      input.alcoholQuoteCreditsPerML,
      input.allowPurchases,
    );
    const idealAlcoholUL = prepared.dreamCapMush * 5;
    const capacityAlcoholUL = Math.max(0, containerCapacity - totalUL(prepared));
    const maxAlcoholUL = Math.max(
      0,
      Math.trunc(Math.min(idealAlcoholUL, alcoholLimitML * 1_000, capacityAlcoholUL)),
    );
    const candidate = evaluateWithMinimumAlcohol(
      input,
      prepared,
      raw,
      rawGrams,
      groundUL,
      maxAlcoholUL,
      materialPurchaseCost,
    );
    configurations += 1;
    if (candidateMeets(candidate, input) && betterFeasible(candidate, feasible)) feasible = candidate;
    if (betterPurity(candidate, bestPurity, input)) bestPurity = candidate;
    if (betterQuantity(candidate, maxQuantity, input)) maxQuantity = candidate;
  };

  function* stepJobs(): Generator<() => void> {
    if (input.material.state === 'raw') {
      const ownedGrams = Math.max(0, input.material.availableGrams);
      const quote = input.mushroomQuoteCreditsPerGram;
      const purchaseLimit = purchasedResourceLimit(
        ownedGrams,
        credits,
        quote,
        input.allowPurchases,
      );
      const capacityBoundGrams =
        containerCapacity / (totalUL(dreamCapRawComponents(1)) || 1);
      const maxGrams = Math.min(purchaseLimit, capacityBoundGrams);
      const steps = Math.floor((maxGrams + 1e-9) / SEARCH_GRAM_STEP);
      for (let step = 1; step <= steps; step += 1) {
        const grams = Number((step * SEARCH_GRAM_STEP).toFixed(1));
        const materialCost =
          Math.max(0, grams - ownedGrams) *
          (input.allowPurchases && quote !== undefined ? quote : 0);
        const blenderModules = input.material.blenderModules;
        yield () => {
          const raw = dreamCapRawComponents(grams);
          const prepared = applyBlenderLoss(raw, blenderModules);
          consider(prepared, raw, grams, 0, materialCost);
        };
      }
    } else {
      const available = input.material.available;
      const availableUL = totalUL(available);
      for (
        let requestedUL = SEARCH_GROUND_STEP_UL;
        requestedUL <= availableUL;
        requestedUL += SEARCH_GROUND_STEP_UL
      ) {
        const sliceUL = requestedUL;
        yield () => {
          const prepared = takeProportionalMixture(available, sliceUL);
          consider(prepared, prepared, 0, sliceUL, 0);
        };
      }
      if (availableUL > 0 && availableUL % SEARCH_GROUND_STEP_UL !== 0) {
        yield () => {
          const prepared = { ...available };
          consider(prepared, prepared, 0, availableUL, 0);
        };
      }
    }
  }

  const runJob = (job: () => void): boolean => {
    if (options?.shouldAbort?.()) {
      hitLimit = true;
      return false;
    }
    job();
    return !hitLimit;
  };

  const finalize = (): ProductionPlan => {
  // Assignments occur inside the local consider callback; preserve their runtime types for narrowing.
  const feasibleResult = feasible as ProductionCandidate | null;
  const bestPurityResult = bestPurity as ProductionCandidate | null;
  const maxQuantityResult = maxQuantity as ProductionCandidate | null;
  const reasons: string[] = [];
  if (!feasibleResult) {
    if (!configurations) reasons.push('No material configuration was available at the supported search increment');
    if (bestPurityResult) {
      reasons.push(
        `Highest supported searched result was ${bestPurityResult.finishing.meanPurity.toFixed(2)}% ` +
        `with ${bestPurityResult.finishing.vials.length} requested vial(s) produced`,
      );
      if (!bestPurityResult.evaporation.success && bestPurityResult.evaporation.reason) {
        reasons.push(bestPurityResult.evaporation.reason);
      }
    }
    if (maxQuantityResult) {
      reasons.push(
        `Maximum finishable quantity found was ${maxPossibleVials(maxQuantityResult, input)} vial(s) ` +
        `within entered capacity and inventory`,
      );
    }
    if (bestPurityResult && bestPurityResult.extraction.final.dreamCapMush > 0) {
      reasons.push('Alcohol availability limits complete Dream Cap extraction');
    }
    if (bestPurityResult && totalUL(bestPurityResult.filtration.removed) === 0) {
      reasons.push('No supported filtration was applied; large non-active components remain');
    }
    if (bestPurityResult) {
      const dryShortfall = Math.max(
        0,
        input.targetVials * DREAM_DUST_SAMPLE_UL -
          totalUL(bestPurityResult.finalMixtureBeforeFinishing),
      );
      if (dryShortfall > 0) {
        reasons.push(
          `At least ${dryShortfall} µL additional dry mixture volume is required; ` +
          'the exact raw-material addition depends on the entered Blender, Alcohol and filters',
        );
      }
      if (
        !bestPurityResult.evaporation.success &&
        bestPurityResult.evaporation.reason?.startsWith('Insufficient energy')
      ) {
        reasons.push(
          `At least ${bestPurityResult.evaporation.energyPerCycle} energy is required per supported overnight cycle`,
        );
      }
    }
  }

  const aborted = Boolean(options?.shouldAbort?.());
  const status = hitLimit 
    ? 'search-incomplete-limit-reached'
    : feasibleResult 
    ? 'feasible' 
    : 'no-solution-in-supported-search';
  
  const finalReasons = hitLimit 
    ? [
        aborted
          ? `Search cancelled after ${configurations.toLocaleString()} configurations because a newer request was started.`
          : `Search stopped at ${configurations.toLocaleString()} configurations or ${MAX_RUNTIME_MS / 1000}s time limit.`,
        'Solution may exist in unsearched space. Results shown are incomplete.',
        ...reasons,
      ]
    : reasons;

  return {
    status,
    reasons: finalReasons,
    candidate: feasibleResult,
    bestPurityCandidate: bestPurityResult,
    maxQuantityCandidate: maxQuantityResult,
    searchSummary:
      `Evaluated ${configurations.toLocaleString()} material configurations. Alcohol: bounded incomplete search ` +
      '(100µL coarse to 50mL, 1µL fine within first feasible). ' +
      'LIMITATION: Can skip narrow intervals; "no-solution" = not found in searched space, unsearched regions remain. ' +
      'Objective: lowest purchase cost, then least waste, then least alcohol.',
    boundary,
  };
  };

  if (!cooperative) {
    for (const job of stepJobs()) {
      if (!runJob(job)) break;
    }
    return finalize();
  }

  const yieldEvery = Math.max(1, options?.yieldEvery ?? 8);
  return (async () => {
    let n = 0;
    for (const job of stepJobs()) {
      if (!runJob(job)) break;
      n += 1;
      if (n % yieldEvery === 0) await yieldTick();
    }
    return finalize();
  })();
}
