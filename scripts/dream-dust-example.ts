import { solveProductionPlan } from '../src/calculators/dreamDustPlanner';
import { totalUL } from '../src/calculators/dreamDustVerified';

const targetPurity = Number(process.env.TARGET_PURITY ?? 45);
const targetVials = Number(process.env.TARGET_VIALS ?? 15);
const rawDreamCapAvailableG = Number(process.env.RAW_GRAMS ?? 65);
const alcoholAvailableML = Number(process.env.ALCOHOL_ML ?? 300);

const result = solveProductionPlan({
  targetPurity,
  targetVials,
  material: {
    state: 'raw',
    availableGrams: rawDreamCapAvailableG,
    blenderOwned: true,
    blenderModules: 4,
  },
  alcoholAvailableUL: Math.trunc(alcoholAvailableML * 1_000),
  heatingPlateOwned: true,
  heatingPlateModules: 2,
  filterContainerOwned: true,
  kottonDurability: 1_000,
  waterFilterDurability: 400,
  evaporatorOwned: true,
  evaporatorPerformancePercent: 0,
  evaporatorEfficiencyPercent: 0,
  evaporatorQualityPercent: 0,
  solventRecoveryModule: false,
  distillateCapacityUL: 0,
  availableEnergy: 12,
  processingContainerCapacityUL: 500_000,
  finisherOwned: true,
  finisherModules: 4,
  finisherCapacityVials: 24,
  credits: 0,
  allowPurchases: false,
});

const plan = result.candidate ?? result.bestPurityCandidate;
console.log(JSON.stringify({
  status: result.status,
  reasons: result.reasons,
  search: result.searchSummary,
  input: {
    targetPurity,
    targetVials,
    rawDreamCapAvailableG,
    alcoholAvailableML,
  },
  output: plan && {
    rawDreamCapUsedG: plan.rawGramsUsed,
    alcoholUsedML: plan.alcoholUsedUL / 1_000,
    extractionUpdates: plan.extraction.ticks.length,
    extractAfterHeatingML: plan.extraction.final.dreamCapExtract / 1_000,
    filteredVolumeML: totalUL(plan.filtration.output) / 1_000,
    filterRemovedML: totalUL(plan.filtration.removed) / 1_000,
    evaporationCycles: plan.evaporation.cycles.length,
    energyUsed: plan.evaporation.energyUsed,
    evaporativeRemovedML: totalUL(plan.evaporation.removed) / 1_000,
    driedVolumeML: totalUL(plan.finalMixtureBeforeFinishing) / 1_000,
    finishedVials: plan.finishing.vials.length,
    meanPurity: plan.finishing.meanPurity,
    driedRemainderML: totalUL(plan.finishing.remaining) / 1_000,
    totalDocumentedWasteML: totalUL(plan.waste) / 1_000,
  },
  boundary: result.boundary,
}, null, 2));
