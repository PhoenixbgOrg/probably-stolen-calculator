import { getFinisherContamination } from './dreamDust';
import {
  COMPONENT_KEYS,
  DREAM_DUST_SAMPLE_UL,
  type ComponentKey,
  type ComponentMixture,
  applyBlenderLoss,
  dreamCapRawComponents,
  roundToEven,
  simulateExtractionFromMixture,
  totalUL,
} from './dreamDustVerified';

export const SUPPORTED_GAME_VERSION = '0.46D / Steam Build 26337366';
export const SAFE_EXTRACTION_TEMPERATURE_C = 44;
export const SEARCH_GRAM_STEP = 0.1;
export const SEARCH_GROUND_STEP_UL = 100;

const emptyMixture = (): ComponentMixture => ({
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
});

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
  physicalContaminant: { particleSize: 100, stepUL: 1_500, durability: 2, floorRatio: 0.0016 },
  mineral: { particleSize: 30, stepUL: 2_000, durability: 1, floorRatio: 0.0016 },
  dreamCapMush: { particleSize: 200, stepUL: 1_000, durability: 2, floorRatio: 0 },
  plantMatter: { particleSize: 200, stepUL: 1_000, durability: 2, floorRatio: 0 },
  insolubleDebris: { particleSize: 200, stepUL: 1_000, durability: 2, floorRatio: 0 },
};

// The source states components are processed in liquid-table order.
const FILTER_COMPONENT_ORDER: ComponentKey[] = [
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
}

const evaporativeUL = (mixture: ComponentMixture): number => mixture.water + mixture.alcohol;

export function evaporateToDryness(
  input: ComponentMixture,
  config: EvaporatorConfig,
): EvaporationResult {
  const allowanceUL = roundToEven(300_000 * Math.max(0, 1 + config.performancePercent / 100));
  const energyPerCycle = Math.max(
    1,
    6 - Math.trunc((6 * config.efficiencyPercent) / 100),
  );
  let state = { ...input };
  let availableEnergy = Math.max(0, Math.trunc(config.availableEnergy));
  let receiverCapacity = Math.max(0, Math.trunc(config.distillateCapacityUL));
  const cycles: EvaporationCycle[] = [];
  let allRemoved = emptyMixture();
  let allRecovered = emptyMixture();
  let allLost = emptyMixture();

  if (allowanceUL <= 0 && evaporativeUL(state) > 100) {
    const canDrawPower = availableEnergy >= energyPerCycle;
    return {
      success: false,
      reason: canDrawPower
        ? 'Evaporator drew power, but performance at or below −100% gives zero removal allowance'
        : `Insufficient energy for the zero-allowance Evaporator check; ${energyPerCycle} required`,
      output: state,
      cycles,
      energyPerCycle,
      energyUsed: canDrawPower ? energyPerCycle : 0,
      removed: allRemoved,
      recovered: allRecovered,
      lost: allLost,
      remainingDistillateCapacityUL: receiverCapacity,
    };
  }

  for (let cycle = 1; evaporativeUL(state) > 100; cycle += 1) {
    if (cycle > 10_000) {
      return {
        success: false,
        reason: 'Evaporation stopped at the 10,000-cycle convergence guard',
        output: state,
        cycles,
        energyPerCycle,
        energyUsed: cycles.length * energyPerCycle,
        removed: allRemoved,
        recovered: allRecovered,
        lost: allLost,
        remainingDistillateCapacityUL: receiverCapacity,
      };
    }
    if (availableEnergy < energyPerCycle) {
      return {
        success: false,
        reason: `Insufficient energy: ${evaporativeUL(state)} µL evaporatives remain`,
        output: state,
        cycles,
        energyPerCycle,
        energyUsed: cycles.length * energyPerCycle,
        removed: allRemoved,
        recovered: allRecovered,
        lost: allLost,
        remainingDistillateCapacityUL: receiverCapacity,
      };
    }
    const available = evaporativeUL(state);
    const actualRemoval = Math.min(allowanceUL, available);
    // Evaporative registry order in this supported mixture is Water, then Alcohol.
    const waterRemoval = Math.floor((actualRemoval * state.water) / available);
    const alcoholRemoval = actualRemoval - waterRemoval;
    const removed = { ...emptyMixture(), water: waterRemoval, alcohol: alcoholRemoval };
    const recovered = emptyMixture();
    const quality = Math.min(100, Math.max(0, config.qualityPercent));
    for (const key of ['water', 'alcohol'] as const) {
      if (config.solventRecoveryModule && key !== 'alcohol') continue;
      const potential = roundToEven((removed[key] * quality) / 100);
      const amount = Math.min(potential, receiverCapacity);
      recovered[key] = amount;
      receiverCapacity -= amount;
    }
    const lost = subtractMixture(removed, recovered);
    state = subtractMixture(state, removed);
    allRemoved = addMixture(allRemoved, removed);
    allRecovered = addMixture(allRecovered, recovered);
    allLost = addMixture(allLost, lost);
    availableEnergy -= energyPerCycle;
    cycles.push({
      cycle,
      allowanceUL,
      removed,
      recovered,
      lost,
      output: { ...state },
    });
  }

  return {
    success: true,
    output: state,
    cycles,
    energyPerCycle,
    energyUsed: cycles.length * energyPerCycle,
    removed: allRemoved,
    recovered: allRecovered,
    lost: allLost,
    remainingDistillateCapacityUL: receiverCapacity,
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
  if (evaporativeUL(input) > 100) {
    return {
      success: false,
      reason: `Finisher dryness requires ≤100 µL evaporatives; ${evaporativeUL(input)} µL remain`,
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
  filtration: FiltrationResult;
  evaporation: EvaporationResult;
  finishing: ComponentFinisherResult;
  waste: ComponentMixture;
  finalMixtureBeforeFinishing: ComponentMixture;
}

export interface ProductionPlan {
  status: 'feasible' | 'no-solution-in-supported-search' | 'unsupported-input';
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
  filtration: FiltrationResult,
  evaporation: EvaporationResult,
  finishing: ComponentFinisherResult,
): ComponentMixture {
  return addMixture(
    addMixture(blenderLoss, filtration.removed),
    addMixture(evaporation.lost, finishing.replaced),
  );
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
    filtration,
    evaporation,
    finishing,
    waste: candidateWaste(blenderLoss, filtration, evaporation, finishing),
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

  let low = 0;
  let high = maxAlcoholUL;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = evaluateCandidate(
      input,
      prepared,
      raw,
      rawGrams,
      groundUL,
      middle,
      costFor(middle),
    );
    if (candidate && candidateMeets(candidate, input)) {
      best = candidate;
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return best;
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
): boolean {
  if (!current) return true;
  if (candidate.finishing.meanPurity !== current.finishing.meanPurity) {
    return candidate.finishing.meanPurity > current.finishing.meanPurity;
  }
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

export function solveProductionPlan(input: ProductionPlannerInput): ProductionPlan {
  const validation = validatePlannerInput(input);
  const boundary =
    `Exact supported subset for ${SUPPORTED_GAME_VERSION}: raw composition, Blender, safe 44°C extraction, ` +
    'ordinary/Kotton filtering, Evaporator, and Chem Finisher. Search uses 0.1 g raw or 0.100 mL ground increments; ' +
    'a miss means no solution within those owned/purchasable resources and that resolution, not a global impossibility proof.';
  if (validation.length) {
    return {
      status: 'unsupported-input',
      reasons: validation,
      candidate: null,
      bestPurityCandidate: null,
      maxQuantityCandidate: null,
      searchSummary: 'Search did not run because required supported equipment or valid inputs are missing.',
      boundary,
    };
  }

  let feasible: ProductionCandidate | null = null;
  let bestPurity: ProductionCandidate | null = null;
  let maxQuantity: ProductionCandidate | null = null;
  let configurations = 0;
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
    if (betterPurity(candidate, bestPurity)) bestPurity = candidate;
    if (betterQuantity(candidate, maxQuantity, input)) maxQuantity = candidate;
  };

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
      const raw = dreamCapRawComponents(grams);
      const prepared = applyBlenderLoss(raw, input.material.blenderModules);
      consider(prepared, raw, grams, 0, materialCost);
    }
  } else {
    const availableUL = totalUL(input.material.available);
    for (
      let requestedUL = SEARCH_GROUND_STEP_UL;
      requestedUL <= availableUL;
      requestedUL += SEARCH_GROUND_STEP_UL
    ) {
      const prepared = takeProportionalMixture(input.material.available, requestedUL);
      consider(prepared, prepared, 0, requestedUL, 0);
    }
    if (availableUL > 0 && availableUL % SEARCH_GROUND_STEP_UL !== 0) {
      const prepared = { ...input.material.available };
      consider(prepared, prepared, 0, availableUL, 0);
    }
  }

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

  return {
    status: feasibleResult ? 'feasible' : 'no-solution-in-supported-search',
    reasons,
    candidate: feasibleResult,
    bestPurityCandidate: bestPurityResult,
    maxQuantityCandidate: maxQuantityResult,
    searchSummary:
      `Evaluated ${configurations.toLocaleString()} material configurations and used integer-µL ` +
      'binary search for the minimum feasible Alcohol per configuration. Objective: lowest user-quoted purchase cost, then least documented waste, then least Alcohol.',
    boundary,
  };
}
