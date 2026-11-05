export interface WaterPurifierInput {
  volumeML: number;
  removableImpurityML: number;
  currentWaterML: number;
  dirtinessMultiplier: number;
  performancePercent: number;
  qualityPercent: number;
}

export interface WaterPurifierResult {
  budgetML: number;
  removedML: number;
  finalWaterML: number;
  finalImpurityML: number;
  finalPurity: number;
  purityCap: number;
  powerUsed: number;
}

export function waterPurityCap(qualityPercent: number): number {
  if (qualityPercent >= 200) return 1;
  if (qualityPercent >= 100) return 0.999;
  if (qualityPercent >= 75) return 0.998;
  if (qualityPercent >= 50) return 0.9965;
  if (qualityPercent >= 25) return 0.9935;
  if (qualityPercent >= 15) return 0.9915;
  return 0.99;
}

export function calculateWaterPurifierNight(input: WaterPurifierInput): WaterPurifierResult {
  const volume = Math.max(0, input.volumeML);
  const water = Math.min(volume, Math.max(0, input.currentWaterML));
  const impurity = Math.min(volume - water, Math.max(0, input.removableImpurityML));
  const cap = waterPurityCap(input.qualityPercent);
  const baseUL = Math.floor((25 + 0.003 * Math.min(volume, 10_000)) * 1_000);
  const budgetUL = Math.trunc(
    baseUL * Math.max(0, input.dirtinessMultiplier + input.performancePercent / 100) * 1.25,
  );
  const capRemovalML = Math.max(0, cap * volume - water);
  const removed = Math.min(impurity, budgetUL / 1_000, capRemovalML);
  const finalWater = water + removed;
  return {
    budgetML: budgetUL / 1_000,
    removedML: removed,
    finalWaterML: finalWater,
    finalImpurityML: volume - finalWater,
    finalPurity: volume > 0 ? (finalWater / volume) * 100 : 0,
    purityCap: cap * 100,
    powerUsed: removed > 0 ? 4 : 0,
  };
}

export const HYDROPONIC_CROPS = {
  nutrifruit: { name: 'Nutrifruit', progress: 23, yield: 5, waterML: 100, center: 150, tolerance: 100, mineralUL: 50 },
  kotton: { name: 'Kotton', progress: 32, yield: 9, waterML: 176, center: 350, tolerance: 150, mineralUL: 75 },
  dreamCap: { name: 'Dream Cap', progress: 28, yield: 8, waterML: 100, center: 250, tolerance: 75, mineralUL: 30 },
  coffee: { name: 'Coffee Beans', progress: 21, yield: 8, waterML: 100, center: 250, tolerance: 75, mineralUL: 30 },
  fillerweed: { name: 'Fillerweed', progress: 11, yield: 4, waterML: 287, center: 100, tolerance: 100, mineralUL: 75 },
  hydroreed: { name: 'Hydroreed', progress: 18, yield: 0, waterML: 20, center: 100, tolerance: 100, mineralUL: 25 },
  bloomberry: { name: 'BloomBerry', progress: 18, yield: 8, waterML: 100, center: 200, tolerance: 75, mineralUL: 50 },
} as const;

export type HydroponicCropId = keyof typeof HYDROPONIC_CROPS;

export interface HydroponicResult {
  nights: number;
  output: number;
  waterRequiredML: number;
  powerRequired: number;
  mineralConsumedUL: number;
  startingConcentration: number;
  nutrientStatus: 'low' | 'in-range' | 'high' | 'no-water';
  boundary: string;
}

export function calculateHydroponicCycle(
  cropId: HydroponicCropId,
  machineQualityPercent: number,
  measuredProgressPerNight: number,
  startingWaterML: number,
  startingMineralUL: number,
): HydroponicResult {
  const crop = HYDROPONIC_CROPS[cropId];
  const speed = Math.max(0.001, measuredProgressPerNight);
  const nights = Math.ceil(crop.progress / speed);
  const qualityMultiplier = 1 + Math.floor(machineQualityPercent / 2) / 100;
  const output = Math.round(crop.yield * qualityMultiplier);
  const concentration = startingWaterML > 0
    ? Math.trunc((startingMineralUL / (startingWaterML * 1_000)) * 10_000)
    : Number.POSITIVE_INFINITY;
  const low = crop.center - crop.tolerance;
  const high = crop.center + crop.tolerance;
  return {
    nights,
    output,
    waterRequiredML: nights * crop.waterML,
    powerRequired: nights * 8,
    mineralConsumedUL: crop.progress * crop.mineralUL,
    startingConcentration: concentration,
    nutrientStatus: startingWaterML <= 0 ? 'no-water' : concentration < low ? 'low' : concentration > high ? 'high' : 'in-range',
    boundary:
      'Progress-per-night is a measured input because traits/modules alter speed. Health and contamination damage require per-component water measurements.',
  };
}

export type FishSpecies = 'tilapia' | 'gutterTilapia' | 'graftTilapia' | 'eel' | 'electricEel' | 'sturgeon';

const FISH_CONVERSION: Record<FishSpecies, number> = {
  tilapia: 0.9,
  gutterTilapia: 0.85,
  graftTilapia: 0.7,
  eel: 0.9,
  electricEel: 0.25,
  sturgeon: 0.9,
};

export interface FishHarvestResult {
  potentialCalories: number;
  pieces: Record<'900' | '400' | '200' | '100' | 'scrap', number>;
  allocatedCalories: number;
}

export function calculateFishHarvest(
  species: FishSpecies,
  cumulativeAbsorbedCalories: number,
  currentEggGrams: number,
  eggCaloriesPerGram: number,
): FishHarvestResult {
  let remaining = Math.floor(
    Math.max(0, cumulativeAbsorbedCalories - currentEggGrams * eggCaloriesPerGram) *
      FISH_CONVERSION[species],
  );
  const potentialCalories = remaining;
  const pieces = { '900': 0, '400': 0, '200': 0, '100': 0, scrap: 0 };
  const sizes = species === 'eel' || species === 'electricEel'
    ? [400, 200, 100]
    : [900, 400, 200, 100];
  for (const size of sizes) {
    const count = Math.floor(remaining / size);
    pieces[String(size) as '900' | '400' | '200' | '100'] = count;
    remaining -= count * size;
  }
  if (remaining >= 25) pieces.scrap = 1;
  return {
    potentialCalories,
    pieces,
    allocatedCalories:
      pieces['900'] * 900 + pieces['400'] * 400 + pieces['200'] * 200 +
      pieces['100'] * 100 + (pieces.scrap ? remaining : 0),
  };
}

export interface RatButcherResult {
  effectiveWeightG: number;
  pieces: Record<'400' | '200' | '100' | '50', number>;
  totalBaseValue: number;
}

export function calculateRatButcher(weightG: number, diseased: boolean): RatButcherResult {
  let effective = Math.round(weightG);
  if (diseased) effective = Math.round(effective * 0.75);
  let remaining = Math.max(0, effective);
  const pieces = { '400': 0, '200': 0, '100': 0, '50': 0 };
  for (const size of [400, 200, 100, 50] as const) {
    pieces[String(size) as keyof typeof pieces] = Math.floor(remaining / size);
    remaining %= size;
  }
  if (remaining > 0) pieces['50'] += 1;
  return {
    effectiveWeightG: effective,
    pieces,
    totalBaseValue: pieces['400'] * 159 + pieces['200'] * 65 + pieces['100'] * 30 + pieces['50'] * 15,
  };
}

export type BasicGunOrderId = 'accurate' | 'firepower' | 'intimidating' | 'suppressed' | 'stylish';

export interface GunStats {
  firepower: number;
  accuracy: number;
  reliability: number;
  size: number;
  style: number;
  suppression: number;
}

const BASIC_ORDERS = {
  accurate: {
    name: 'Need something accurate.',
    base: [86, 96],
    passes: (s: GunStats) => s.firepower > 17,
    bonuses: (s: GunStats) => (s.accuracy > 20 ? 46 : 0) + (s.accuracy > 24 ? 46 : 0) + (s.accuracy > 30 ? 46 : 0) + (s.reliability > 24 ? 46 : 0),
  },
  firepower: {
    name: 'Need something with serious firepower.',
    base: [63, 73],
    passes: (s: GunStats) => s.firepower > 11,
    bonuses: (s: GunStats) => (s.firepower > 14 ? 34 : 0) + (s.firepower > 17 ? 40 : 0) + (s.firepower > 20 ? 40 : 0) + (s.firepower > 22 ? 40 : 0),
  },
  intimidating: {
    name: 'Need something big and intimidating.',
    base: [98, 108],
    passes: (s: GunStats) => s.firepower > 11,
    bonuses: (s: GunStats) => (s.size > 10 ? 12 : 0) + (s.size > 12 ? 17 : 0) + (s.size > 14 ? 23 : 0),
  },
  suppressed: {
    name: 'Got something accurate? Maybe a suppressed one?',
    base: [86, 96],
    passes: (s: GunStats) => s.firepower > 17,
    bonuses: (s: GunStats) =>
      (s.accuracy > 20 ? 46 : 0) + (s.accuracy > 24 ? 46 : 0) +
      (s.accuracy > 30 ? 46 : 0) + (s.reliability > 24 ? 46 : 0) +
      (s.suppression > 0 ? 22 : 0) + (s.suppression > 1 ? 53 : 0),
  },
  stylish: {
    name: 'I need something stylish.',
    base: [69, 79],
    passes: (s: GunStats) => s.style > 4,
    bonuses: (s: GunStats) => (s.style > 7 ? 34 : 0) + (s.style > 14 ? 63 : 0) + (s.style > 17 ? 57 : 0) + (s.style > 20 ? 52 : 0) + (s.style > 23 ? 46 : 0),
  },
} satisfies Record<BasicGunOrderId, {
  name: string;
  base: number[];
  passes: (stats: GunStats) => boolean;
  bonuses: (stats: GunStats) => number;
}>;

export function evaluateBasicGunOrder(orderId: BasicGunOrderId, stats: GunStats) {
  const order = BASIC_ORDERS[orderId];
  const bonus = order.bonuses(stats);
  return {
    name: order.name,
    passes: order.passes(stats),
    bonus,
    paymentMin: order.base[0]! + bonus,
    paymentMax: order.base[1]! + bonus,
  };
}

export interface CashFlowInput {
  cash: number;
  rent: number;
  otherBills: number;
  purchaseCost: number;
  saleRevenue: number;
  fees: number;
  cycles: number;
}

export function calculateCashFlow(input: CashFlowInput) {
  const cycleProfit = input.saleRevenue - input.purchaseCost - input.fees;
  const bills = input.rent + input.otherBills;
  const endingCash = input.cash + cycleProfit * input.cycles - bills;
  return {
    cycleProfit,
    bills,
    endingCash,
    affordable: endingCash >= 0,
    maximumAffordablePurchase: Math.max(0, input.cash + input.saleRevenue * input.cycles - input.fees * input.cycles - bills),
  };
}
