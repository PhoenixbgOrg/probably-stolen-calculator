import { describe, expect, test } from 'vitest';
import {
  addAcidDose,
  addBaseDose,
  applyStageInput,
  calculateNextNight,
  calculateStage,
  canAcceptPrediction,
  canConfirmReadings,
  confirmPendingNight,
  confirmStage,
  defaultWizardState,
  runChemistryUpdates,
  setAcidStock,
  setBaseStock,
  setDraftField,
  syncStale,
} from '../src/calculators/chemistWizard';
import {
  applyAcidBaseMicrobeRemoval,
  applyChlorineTreatment,
  applyOrganicWasteMineralization,
  applyStabilizerSedimentation,
  chemistryPredictionBlockers,
  takeReagentDose,
} from '../src/calculators/dreamDustReactions';
import { evaporateOneNight } from '../src/calculators/dreamDustPlanner';
import { mixtureFromPartial, totalUL, volatileUL } from '../src/calculators/dreamDustVerified';

describe('stock vs homogeneous dose', () => {
  test('50% pour of 10 mL 80/20 Acid/Water keeps leftovers', () => {
    const stock = mixtureFromPartial({ acid: 8_000, water: 2_000 });
    const poured = takeReagentDose(stock, 5_000);
    expect(poured.ok).toBe(true);
    expect(poured.dose.acid).toBe(4_000);
    expect(poured.dose.water).toBe(1_000);
    expect(poured.remaining.acid).toBe(4_000);
    expect(poured.remaining.water).toBe(1_000);
    expect(totalUL(poured.dose) + totalUL(poured.remaining)).toBe(10_000);
  });

  test('dose cannot exceed remaining stock', () => {
    const poured = takeReagentDose(mixtureFromPartial({ acid: 1_000 }), 2_000);
    expect(poured.ok).toBe(false);
    expect(poured.remaining.acid).toBe(1_000);
  });
});

describe('SOURCE STATIC branches 13/14/21', () => {
  test('branch 14: q=min(C,20(A+B)); consume ceil(q/100) Acid first', () => {
    const result = applyAcidBaseMicrobeRemoval(mixtureFromPartial({ acid: 100, microbes: 5_000 }));
    expect(result.microbesRemovedUL).toBe(2_000);
    expect(result.output.microbes).toBe(3_000);
    expect(result.output.acid).toBe(80);
    expect(result.output.base).toBe(0);
  });

  test('branch 13 mineralizes Organic Waste with Acid first, not a 1:1 dump', () => {
    const result = applyOrganicWasteMineralization(
      mixtureFromPartial({ acid: 10, organicWaste: 1_000, mineral: 0 }),
    );
    expect(result.processedUL).toBe(400);
    expect(result.output.organicWaste).toBe(600);
    expect(result.output.mineral).toBe(40);
    expect(result.output.acid).toBe(0);
  });

  test('branch 15 settles stabilizer before neutralization, not a hidden 1:1 dump', () => {
    const result = applyStabilizerSedimentation(
      mixtureFromPartial({ acid: 2_000, base: 0, stabilizingAgent: 5_000 }),
    );
    expect(result.settledUL).toBe(1_000);
    expect(result.output.stabilizingAgent).toBe(4_000);
    expect(result.output.insolubleDebris).toBe(1_000);
    expect(result.output.acid).toBe(1_900);
  });

  test('branch 21 uses trunc(total×0.007) contaminant floor', () => {
    const input = mixtureFromPartial({
      chlorine: 1_000,
      water: 10_000,
      chemicalContaminant: 200,
      microbes: 500,
    });
    const floor = Math.trunc(totalUL(input) * 0.007);
    const result = applyChlorineTreatment(input);
    expect(result.output.chemicalContaminant).toBeLessThanOrEqual(Math.max(floor, 0));
    expect(result.output.chlorine).toBeLessThan(input.chlorine);
  });
});

describe('sequential Acid OR Base, neutralization only after run-updates', () => {
  test('empty Base inventory does not block Acid-only confirmation', () => {
    let state = defaultWizardState();
    state = applyStageInput(state, 'ground', {
      groundTotalUL: 10_000,
      ground: mixtureFromPartial({ dreamCapMush: 10_000 }),
      solventLiquidUL: 50_000,
      solventAlcoholUL: 50_000,
      heatingPlateModules: 2,
    });
    state = confirmStage(calculateStage(state, 'ground'), 'ground', 'accept-prediction');
    state = confirmStage(calculateStage(state, 'extraction'), 'extraction', 'accept-prediction');
    state = setAcidStock(state, mixtureFromPartial({ acid: 5_000, water: 1_000 }));
    state = applyStageInput(state, 'acidBase', { acidDoseUL: 2_000 });
    state = addAcidDose(state);
    expect(state.acidBaseLog.some((step) => step.kind === 'add-acid')).toBe(true);
    expect(state.acidBaseLog.some((step) => step.kind === 'run-updates')).toBe(false);
    expect(state.acidBaseBatch?.base).toBe(0);
    state = calculateStage(state, 'acidBase');
    expect(state.stages.acidBase.predictionBlocked).toBe(false);
    expect(canAcceptPrediction(state, 'acidBase')).toBe(true);
  });

  test('Other > 0 blocks predicted confirmation but keeps measured recovery', () => {
    expect(chemistryPredictionBlockers(mixtureFromPartial({ other: 10 })).length).toBeGreaterThan(0);
    let state = defaultWizardState();
    state = applyStageInput(state, 'ground', {
      groundTotalUL: 10_000,
      ground: mixtureFromPartial({ dreamCapMush: 9_000, other: 1_000 }),
      solventLiquidUL: 50_000,
      solventAlcoholUL: 50_000,
      heatingPlateModules: 2,
    });
    state = confirmStage(calculateStage(state, 'ground'), 'ground', 'accept-prediction');
    state = confirmStage(calculateStage(state, 'extraction'), 'extraction', 'accept-prediction');
    state = calculateStage(state, 'acidBase');
    expect(state.stages.acidBase.predictionBlocked).toBe(true);
    expect(canAcceptPrediction(state, 'acidBase')).toBe(false);
    expect(state.stages.extraction.draft.values).toEqual({});
    state = setDraftField(state, 'acidBase', 'other', 0);
    expect(canConfirmReadings(state, 'acidBase')).toBe(true);
    state = confirmStage(state, 'acidBase', 'confirm-readings');
    expect(state.stages.acidBase.confirmed).toBe(true);
    expect(state.stages.acidBase.accepted!.kind).toBe('partial-reading');
    expect(state.stages.acidBase.accepted!.mixture.other).toBe(0);
    expect(state.stages.acidBase.accepted!.fieldProvenance.other).toBe('measured');
  });

  test('adding Base is a second action; neutralization is run-updates', () => {
    let state = defaultWizardState();
    state = applyStageInput(state, 'ground', {
      groundTotalUL: 10_000,
      ground: mixtureFromPartial({ dreamCapMush: 10_000, protein: 2_000 }),
      solventLiquidUL: 50_000,
      solventAlcoholUL: 50_000,
      heatingPlateModules: 2,
    });
    state = confirmStage(calculateStage(state, 'ground'), 'ground', 'accept-prediction');
    state = confirmStage(calculateStage(state, 'extraction'), 'extraction', 'accept-prediction');
    state = setAcidStock(state, mixtureFromPartial({ acid: 5_000 }));
    state = setBaseStock(state, mixtureFromPartial({ base: 5_000 }));
    state = applyStageInput(state, 'acidBase', { acidDoseUL: 5_000, baseDoseUL: 5_000 });
    state = addAcidDose(state);
    const afterAcid = state.acidBaseBatch!;
    expect(afterAcid.acid).toBeGreaterThan(0);
    expect(afterAcid.base).toBe(0);
    state = addBaseDose(state);
    expect(state.acidBaseBatch!.base).toBeGreaterThan(0);
    const beforeUpdates = { ...state.acidBaseBatch! };
    state = runChemistryUpdates(state);
    expect(state.acidBaseLog.some((step) => step.kind === 'run-updates')).toBe(true);
    expect(state.acidBaseBatch!.acid + state.acidBaseBatch!.base).toBeLessThan(beforeUpdates.acid + beforeUpdates.base);
  });
});

describe('one-night evaporator, energy spent once', () => {
  test('night 1 removes 300 mL at 0% P and leaves energy for night 2', () => {
    const night1 = evaporateOneNight(mixtureFromPartial({ water: 400_000, dreamCapExtract: 2_000 }), {
      performancePercent: 0,
      efficiencyPercent: 0,
      qualityPercent: 0,
      availableEnergy: 12,
      distillateCapacityUL: 0,
      solventRecoveryModule: false,
    });
    expect(night1.success).toBe(true);
    expect(night1.allowanceUL).toBe(300_000);
    expect(night1.removed.water).toBe(300_000);
    expect(night1.remainingEnergy).toBe(6);
    expect(night1.remainingVolatilesUL).toBe(100_000);
    const night2 = evaporateOneNight(night1.output, {
      performancePercent: 0,
      efficiencyPercent: 0,
      qualityPercent: 0,
      availableEnergy: night1.remainingEnergy,
      distillateCapacityUL: 0,
      solventRecoveryModule: false,
    });
    expect(night2.energyUsed).toBe(6);
    expect(night2.remainingEnergy).toBe(0);
    expect(night2.removed.water).toBe(100_000);
    expect(volatileUL(night2.output)).toBe(0);
  });

  test('Lipobond counts as a volatile and is removed overnight', () => {
    const night = evaporateOneNight(mixtureFromPartial({ lipobondAgent: 1_000, dreamCapExtract: 2_000 }), {
      performancePercent: 0,
      efficiencyPercent: 0,
      qualityPercent: 100,
      availableEnergy: 6,
      distillateCapacityUL: 5_000,
      solventRecoveryModule: true,
    });
    expect(night.removed.lipobondAgent).toBe(1_000);
    expect(night.recovered.lipobondAgent).toBe(0);
    expect(volatileUL(night.output)).toBe(0);
  });

  test('confirmed nights do not re-spend energy or re-filter', () => {
    let state = defaultWizardState();
    state = applyStageInput(state, 'ground', {
      groundTotalUL: 2_000,
      ground: mixtureFromPartial({ dreamCapMush: 2_000 }),
      solventLiquidUL: 400_000,
      solventAlcoholUL: 400_000,
      heatingPlateModules: 2,
    });
    state = confirmStage(calculateStage(state, 'ground'), 'ground', 'accept-prediction');
    state = confirmStage(calculateStage(state, 'extraction'), 'extraction', 'accept-prediction');
    state = confirmStage(calculateStage(state, 'acidBase'), 'acidBase', 'accept-prediction');
    state = applyStageInput(state, 'filterEvap', {
      kottonDurability: 4,
      evaporator: { ...state.evaporator, availableEnergy: 12, distillateCapacityUL: 0 },
    });
    const startingKotton = state.kottonDurability;
    state = confirmStage(calculateStage(state, 'filterEvap'), 'filterEvap', 'accept-prediction');
    state = calculateNextNight(state);
    state = confirmPendingNight(state, 'accept-prediction');
    const energyAfter1 = state.evapNights[0]!.remainingEnergy;
    expect(state.evapNights[0]!.energyUsed).toBe(6);
    state = calculateNextNight(state);
    expect(state.pendingNight!.remainingEnergy).toBe(energyAfter1 - state.pendingNight!.energyUsed);
    expect(state.kottonDurability).toBe(startingKotton);
    state = confirmPendingNight(state, 'accept-prediction');
    expect(state.evapNights.reduce((sum, night) => sum + night.energyUsed, 0)).toBe(12);
    const synced = syncStale(state);
    expect(synced.stages.filterEvap.confirmed).toBe(true);
    expect(synced.evapNights.every((night) => !night.stale)).toBe(true);
    const afterEnergy = applyStageInput(synced, 'filterEvap', {
      evaporator: { ...synced.evaporator, availableEnergy: 24 },
    });
    expect(afterEnergy.stages.filterEvap.confirmed).toBe(true);
    expect(afterEnergy.evapNights.every((night) => night.stale)).toBe(true);
  });

  test('dose cannot exceed vessel capacity', () => {
    let state = defaultWizardState();
    state = applyStageInput(state, 'ground', {
      groundTotalUL: 2_000,
      ground: mixtureFromPartial({ dreamCapMush: 2_000 }),
      solventLiquidUL: 1_000,
      solventAlcoholUL: 1_000,
      vesselCapacityUL: 4_000,
      heatingPlateModules: 2,
    });
    state = confirmStage(calculateStage(state, 'ground'), 'ground', 'accept-prediction');
    state = confirmStage(calculateStage(state, 'extraction'), 'extraction', 'accept-prediction');
    state = setAcidStock(state, mixtureFromPartial({ acid: 10_000 }));
    state = applyStageInput(state, 'acidBase', { acidDoseUL: 10_000 });
    state = addAcidDose(state);
    expect(state.acidBaseBatch).toBeNull();
    expect(state.stages.acidBase.reasons.join(' ')).toMatch(/capacity/i);
  });
});
