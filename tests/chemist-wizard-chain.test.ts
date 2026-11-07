import { describe, expect, test } from 'vitest';
import {
  addAcidDose,
  applyStageInput,
  calculateNextNight,
  calculateStage,
  canEnterStage,
  confirmPendingNight,
  confirmStage,
  defaultWizardState,
  filterEvapOutput,
  inputMixtureFor,
  resumeAtReachable,
  runChemistryUpdates,
  setAcidStock,
  setDraftField,
  snapshotEvidence,
  syncStale,
} from '../src/calculators/chemistWizard';
import { estimatedMushAndOther, PREVIOUS_BATCH_MUSH_FRACTION } from '../src/calculators/dreamDustEstimates';
import { mixtureFromPartial } from '../src/calculators/dreamDustVerified';
import { parseChemistSession } from '../src/persistence/chemistSession';

function materialsState() {
  let state = defaultWizardState();
  state = applyStageInput(state, 'ground', {
    compositionMode: 'estimated',
    compositionNote: 'Assumed 67.30% Mush',
    groundTotalUL: 476_000,
    ground: estimatedMushAndOther(476_000, PREVIOUS_BATCH_MUSH_FRACTION),
    solventMode: 'pure',
    solventLiquidUL: 750_000,
    solventAlcoholUL: 750_000,
    vesselCapacityUL: 2_000_000,
    heatingPlateModules: 2,
  });
  return state;
}

function confirmThrough(state: ReturnType<typeof defaultWizardState>, stage: 'ground' | 'extraction' | 'acidBase' | 'filterEvap') {
  let next = calculateStage(state, stage);
  next = confirmStage(next, stage, 'accept-prediction');
  return next;
}

describe('Chemist wizard stage chain and provenance', () => {
  test('later stages stay locked until previous Calculate+Continue', () => {
    const state = materialsState();
    expect(canEnterStage(state, 'extraction')).toBe(false);
    expect(canEnterStage(state, 'acidBase')).toBe(false);
    expect(canEnterStage(state, 'filterEvap')).toBe(false);
    expect(canEnterStage(state, 'final')).toBe(false);
    expect(inputMixtureFor(state, 'filterEvap').blocked).toBe(true);
    expect(inputMixtureFor(state, 'final').note).toMatch(/not confirmed/i);
  });

  test('predicted Acid/Base output feeds filter after Continue, not extraction fallback', () => {
    let state = defaultWizardState();
    state = applyStageInput(state, 'ground', {
      compositionMode: 'measured',
      groundTotalUL: 164_000,
      ground: mixtureFromPartial({
        dreamCapMush: 110_370,
        water: 21_070,
        protein: 10_540,
        microbes: 10_540,
        physicalContaminant: 9_170,
        mineral: 2_290,
      }),
      solventMode: 'pure',
      solventLiquidUL: 552_000,
      solventAlcoholUL: 552_000,
      heatingPlateModules: 2,
    });
    state = confirmThrough(state, 'ground');
    state = confirmThrough(state, 'extraction');
    const extractOut = state.stages.extraction.accepted!.mixture;
    expect(extractOut.protein).toBeGreaterThan(0);
    state = setAcidStock(state, mixtureFromPartial({ acid: 20_000, water: 5_000 }));
    state = applyStageInput(state, 'acidBase', { acidDoseUL: 25_000 });
    state = addAcidDose(state);
    state = runChemistryUpdates(state);
    state = calculateStage(state, 'acidBase');
    expect(state.stages.acidBase.prediction).not.toBeNull();
    expect(state.stages.acidBase.prediction!.mixture.protein).not.toBe(extractOut.protein);
    expect(inputMixtureFor(state, 'filterEvap').blocked).toBe(true);

    state = confirmStage(state, 'acidBase', 'accept-prediction');
    const filterInput = inputMixtureFor(state, 'filterEvap');
    expect(filterInput.blocked).toBe(false);
    expect(filterInput.mixture.protein).toBe(state.stages.acidBase.accepted!.mixture.protein);
    expect(filterInput.mixture.protein).not.toBe(extractOut.protein);
    expect(filterInput.mixture.insolubleDebris).toBe(state.stages.acidBase.accepted!.mixture.insolubleDebris);
  });

  test('predicted filter/evap output feeds final only after Continue', () => {
    let state = defaultWizardState();
    state = applyStageInput(state, 'ground', {
      compositionMode: 'measured',
      groundTotalUL: 10_000,
      ground: mixtureFromPartial({ dreamCapMush: 10_000 }),
      solventMode: 'pure',
      solventLiquidUL: 400_000,
      solventAlcoholUL: 400_000,
      heatingPlateModules: 2,
    });
    state = confirmThrough(state, 'ground');
    state = confirmThrough(state, 'extraction');
    state = confirmThrough(state, 'acidBase');
    expect(inputMixtureFor(state, 'final').blocked).toBe(true);
    state = applyStageInput(state, 'filterEvap', {
      evaporator: { ...state.evaporator, availableEnergy: 60 },
    });
    state = calculateStage(state, 'filterEvap');
    expect(inputMixtureFor(state, 'final').blocked).toBe(true);
    state = confirmStage(state, 'filterEvap', 'accept-prediction');
    expect(state.currentStage).toBe('filterEvap');
    expect(filterEvapOutput(state).blocked).toBe(true);
    let guard = 0;
    while (filterEvapOutput(state).blocked && guard < 20) {
      state = calculateNextNight(state);
      state = confirmPendingNight(state, 'accept-prediction');
      guard += 1;
    }
    const finalInput = inputMixtureFor(state, 'final');
    expect(finalInput.blocked).toBe(false);
    expect(finalInput.mixture).toEqual(filterEvapOutput(state).mixture);
  });

  test('one edited spectrometer field does not verify predicted leftovers', () => {
    let state = confirmThrough(materialsState(), 'ground');
    state = calculateStage(state, 'extraction');
    const predictedExtract = state.stages.extraction.prediction!.mixture.dreamCapExtract;
    state = setDraftField(state, 'extraction', 'dreamCapExtract', 40_000);
    state = confirmStage(state, 'extraction', 'confirm-readings');
    const accepted = state.stages.extraction.accepted!;
    expect(accepted.kind).toBe('partial-reading');
    expect(accepted.fieldProvenance.dreamCapExtract).toBe('measured');
    expect(accepted.mixture.dreamCapExtract).toBe(40_000);
    expect(accepted.fieldProvenance.protein).toBe('predicted');
    expect(accepted.mixture.protein).toBe(state.stages.extraction.prediction!.mixture.protein);
    expect(snapshotEvidence(accepted)).not.toBe('verified-measurement');
    expect(predictedExtract).not.toBe(40_000);
  });

  test('upstream edit marks descendants stale and keeps independent measurements', () => {
    let state = confirmThrough(materialsState(), 'ground');
    state = calculateStage(state, 'extraction');
    state = setDraftField(state, 'extraction', 'dreamCapExtract', 41_000);
    state = confirmStage(state, 'extraction', 'confirm-readings');
    expect(state.stages.extraction.draft.values.dreamCapExtract).toBe(41_000);

    state = applyStageInput(state, 'extraction', { observedTemperatureC: 46 });
    expect(state.stages.extraction.stale).toBe(true);
    expect(state.stages.extraction.confirmed).toBe(false);
    expect(state.stages.extraction.draft.values.dreamCapExtract).toBe(41_000);
    expect(state.stages.extraction.history.some((row) => row.mixture.dreamCapExtract === 41_000)).toBe(true);
    expect(canEnterStage(state, 'acidBase')).toBe(false);
  });

  test('changing heating modules invalidates extraction even if previously confirmed', () => {
    let state = confirmThrough(materialsState(), 'ground');
    state = confirmThrough(state, 'extraction');
    state = applyStageInput(state, 'extraction', { heatingPlateModules: 1 });
    const synced = syncStale(state);
    expect(synced.stages.extraction.stale).toBe(true);
    expect(synced.stages.extraction.confirmed).toBe(false);
  });

  test('observed temperature below 40 is not treated as 44°C decorative default', () => {
    let state = confirmThrough(materialsState(), 'ground');
    state = applyStageInput(state, 'extraction', { observedTemperatureC: 25, heatingPlateModules: 2 });
    state = calculateStage(state, 'extraction');
    expect(state.stages.extraction.calculated).toBe(true);
    expect(state.stages.extraction.prediction!.mixture.dreamCapExtract).toBe(
      state.stages.ground.accepted!.mixture.dreamCapExtract,
    );
    expect(state.stages.extraction.warnings.some((row) => /below the sourced extraction band/i.test(row))).toBe(true);
  });

  test('fewer than 2 modules without observed temperature blocks extraction prediction', () => {
    let state = confirmThrough(materialsState(), 'ground');
    state = applyStageInput(state, 'extraction', { heatingPlateModules: 1, observedTemperatureC: null });
    state = calculateStage(state, 'extraction');
    expect(state.stages.extraction.calculated).toBe(false);
    expect(state.stages.extraction.prediction).toBeNull();
    expect(state.stages.extraction.reasons.join(' ')).toMatch(/observed/i);
  });

  test('resume from an unreachable later stage does not pretend skipped work happened', () => {
    const state = resumeAtReachable({ ...materialsState(), currentStage: 'final' });
    expect(state.currentStage).toBe('ground');
    expect(canEnterStage(state, 'final')).toBe(false);
  });
});

describe('chemist session schema 1 drafts survive upgrade', () => {
  test('legacy afterExtraction is kept as draft/history, not auto-confirmed', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      currentStage: 'final',
      groundTotalUL: 164_000,
      ground: { dreamCapMush: 110_370 },
      solventLiquidUL: 552_000,
      solventAlcoholUL: 552_000,
      afterExtraction: {
        mixture: { dreamCapExtract: 55_180, protein: 10_540 },
        capturedAt: '2026-11-07T00:00:00.000Z',
        note: 'owner row',
      },
    });
    const loaded = parseChemistSession(raw);
    expect(loaded.notice).toMatch(/schema 1/i);
    expect(loaded.state.schemaVersion).toBe(3);
    expect(loaded.state.stages.extraction.confirmed).toBe(false);
    expect(loaded.state.stages.extraction.draft.values.dreamCapExtract).toBe(55_180);
    expect(loaded.state.stages.extraction.history[0]?.mixture.dreamCapExtract).toBe(55_180);
    expect(loaded.state.currentStage).toBe('ground');
    expect(loaded.state.ground.dreamCapMush).toBe(110_370);
  });
});
