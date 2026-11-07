import {
  COMPONENT_KEYS,
  DREAM_DUST_SAMPLE_UL,
  type ComponentKey,
  type ComponentMixture,
  emptyMixture,
  mixtureFromPartial,
  simulateExtractionFromMixture,
  totalUL,
  volatileUL,
} from './dreamDustVerified';
import {
  type CompositionMode,
  type EvidenceStatus,
  type ForwardMaterialsResult,
  type SolventMode,
  recommendFromMaterials,
} from './dreamDustForward';
import {
  addMeasuredReagent,
  chemistryPredictionBlockers,
  simulateAcidBaseTreatment,
  takeReagentDose,
} from './dreamDustReactions';
import {
  SAFE_EXTRACTION_TEMPERATURE_C,
  evaporateOneNight,
  evaporateToDryness,
  filterDreamDustMixture,
  finishComponentMixture,
  type EvaporatorConfig,
} from './dreamDustPlanner';

export const WIZARD_STAGES = ['ground', 'extraction', 'acidBase', 'filterEvap', 'final'] as const;
export type WizardStageId = (typeof WIZARD_STAGES)[number];
export const WIZARD_SCHEMA_VERSION = 3 as const;

export const STAGE_LABELS: Record<WizardStageId, string> = {
  ground: 'Ground Mixture',
  extraction: 'Extraction',
  acidBase: 'Acid / Base',
  filterEvap: 'Filtration / Evaporation',
  final: 'Final Dust',
};

export type FieldProvenance = 'measured' | 'predicted' | 'unknown';
export type SnapshotKind = 'model-prediction' | 'partial-reading' | 'full-reading';

export interface MixtureSnapshot {
  mixture: ComponentMixture;
  fieldProvenance: Record<ComponentKey, FieldProvenance>;
  kind: SnapshotKind;
  capturedAt: string;
  note: string;
}

export interface DraftReading {
  values: Partial<Record<ComponentKey, number>>;
}

export interface StageRecord {
  calculated: boolean;
  confirmed: boolean;
  stale: boolean;
  staleReason: string | null;
  calculatedFingerprint: string | null;
  prediction: MixtureSnapshot | null;
  accepted: MixtureSnapshot | null;
  draft: DraftReading;
  history: MixtureSnapshot[];
  warnings: string[];
  reasons: string[];
  predictionBlocked: boolean;
}

export interface AcidBaseStep {
  kind: 'add-acid' | 'add-base' | 'run-updates';
  doseUL: number;
  updates: number;
  remainingAcidUL: number;
  remainingBaseUL: number;
  vesselUL: number;
  note: string;
}

export interface EvapNightRecord {
  night: number;
  confirmed: boolean;
  stale: boolean;
  energyUsed: number;
  allowanceUL: number;
  remainingEnergy: number;
  remainingReceiverUL: number;
  remainingVolatilesUL: number;
  removed: ComponentMixture;
  recovered: ComponentMixture;
  lost: ComponentMixture;
  output: ComponentMixture;
  snapshot: MixtureSnapshot;
  reasons: string[];
  warnings: string[];
}

export interface ChemistWizardState {
  schemaVersion: 3;
  currentStage: WizardStageId;
  savedAt: string | null;
  compositionMode: CompositionMode;
  compositionNote: string;
  groundTotalUL: number;
  ground: ComponentMixture;
  solventMode: SolventMode;
  solventLiquidUL: number;
  solventAlcoholUL: number;
  solventWaterUL: number;
  solventOtherUL: number;
  vesselCapacityUL: number;
  observedTemperatureC: number | null;
  heatingPlateModules: number;
  acidReagent: ComponentMixture;
  acidRemaining: ComponentMixture;
  acidDoseUL: number;
  baseReagent: ComponentMixture;
  baseRemaining: ComponentMixture;
  baseDoseUL: number;
  acidBaseBatch: ComponentMixture | null;
  acidBaseLog: AcidBaseStep[];
  chemistryUpdateBudget: number;
  kottonDurability: number;
  waterFilterDurability: number;
  filterContainerOwned: boolean;
  evaporatorOwned: boolean;
  evaporatorModules: number;
  evaporator: EvaporatorConfig;
  evapNights: EvapNightRecord[];
  pendingNight: EvapNightRecord | null;
  finisherModules: number;
  finisherCapacityVials: number;
  compareToTarget: { enabled: boolean; purity: number; vials: number };
  stages: Record<WizardStageId, StageRecord>;
}

export type ContinueMode = 'accept-prediction' | 'confirm-readings';

const STAGE_INDEX = Object.fromEntries(WIZARD_STAGES.map((id, index) => [id, index])) as Record<
  WizardStageId,
  number
>;

export function emptyDraft(): DraftReading {
  return { values: {} };
}

export function emptyProvenance(status: FieldProvenance): Record<ComponentKey, FieldProvenance> {
  return Object.fromEntries(COMPONENT_KEYS.map((key) => [key, status])) as Record<
    ComponentKey,
    FieldProvenance
  >;
}

export function emptyStageRecord(): StageRecord {
  return {
    calculated: false,
    confirmed: false,
    stale: false,
    staleReason: null,
    calculatedFingerprint: null,
    prediction: null,
    accepted: null,
    draft: emptyDraft(),
    history: [],
    warnings: [],
    reasons: [],
    predictionBlocked: false,
  };
}

export function defaultStages(): Record<WizardStageId, StageRecord> {
  return {
    ground: emptyStageRecord(),
    extraction: emptyStageRecord(),
    acidBase: emptyStageRecord(),
    filterEvap: emptyStageRecord(),
    final: emptyStageRecord(),
  };
}

export function defaultWizardState(): ChemistWizardState {
  return {
    schemaVersion: 3,
    currentStage: 'ground',
    savedAt: null,
    compositionMode: 'measured',
    compositionNote: '',
    groundTotalUL: 0,
    ground: emptyMixture(),
    solventMode: 'pure',
    solventLiquidUL: 0,
    solventAlcoholUL: 0,
    solventWaterUL: 0,
    solventOtherUL: 0,
    vesselCapacityUL: 2_000_000,
    observedTemperatureC: null,
    heatingPlateModules: 2,
    acidReagent: emptyMixture(),
    acidRemaining: emptyMixture(),
    acidDoseUL: 0,
    baseReagent: emptyMixture(),
    baseRemaining: emptyMixture(),
    baseDoseUL: 0,
    acidBaseBatch: null,
    acidBaseLog: [],
    chemistryUpdateBudget: 1_000,
    kottonDurability: 1_000,
    waterFilterDurability: 400,
    filterContainerOwned: true,
    evaporatorOwned: true,
    evaporatorModules: 0,
    evaporator: {
      performancePercent: 0,
      efficiencyPercent: 0,
      qualityPercent: 0,
      availableEnergy: 12,
      distillateCapacityUL: 0,
      solventRecoveryModule: false,
    },
    evapNights: [],
    pendingNight: null,
    finisherModules: 4,
    finisherCapacityVials: 24,
    compareToTarget: { enabled: false, purity: 65, vials: 35 },
    stages: defaultStages(),
  };
}

export function previousStage(stage: WizardStageId): WizardStageId | null {
  const index = STAGE_INDEX[stage];
  return index === 0 ? null : WIZARD_STAGES[index - 1]!;
}

export function nextStage(stage: WizardStageId): WizardStageId | null {
  const index = STAGE_INDEX[stage];
  return index >= WIZARD_STAGES.length - 1 ? null : WIZARD_STAGES[index + 1]!;
}

function nowIso(): string {
  return new Date().toISOString();
}

function predictedSnapshot(mixture: ComponentMixture, note: string): MixtureSnapshot {
  return {
    mixture: { ...mixture },
    fieldProvenance: emptyProvenance('predicted'),
    kind: 'model-prediction',
    capturedAt: nowIso(),
    note,
  };
}

function mixFingerprint(mixture: ComponentMixture | null | undefined): string {
  if (!mixture) return '';
  return COMPONENT_KEYS.map((key) => mixture[key]).join(',');
}

export function stageFingerprint(state: ChemistWizardState, stage: WizardStageId): string {
  switch (stage) {
    case 'ground':
      return JSON.stringify({
        compositionMode: state.compositionMode,
        groundTotalUL: state.groundTotalUL,
        ground: mixFingerprint(state.ground),
        solventMode: state.solventMode,
        solventLiquidUL: state.solventLiquidUL,
        solventAlcoholUL: state.solventAlcoholUL,
        solventWaterUL: state.solventWaterUL,
        solventOtherUL: state.solventOtherUL,
        vesselCapacityUL: state.vesselCapacityUL,
      });
    case 'extraction':
      return JSON.stringify({
        input: mixFingerprint(state.stages.ground.accepted?.mixture),
        observedTemperatureC: state.observedTemperatureC,
        heatingPlateModules: state.heatingPlateModules,
      });
    case 'acidBase':
      return JSON.stringify({
        input: mixFingerprint(state.stages.extraction.accepted?.mixture),
        acidStock: mixFingerprint(state.acidReagent),
        acidRemaining: mixFingerprint(state.acidRemaining),
        acidDoseUL: state.acidDoseUL,
        baseStock: mixFingerprint(state.baseReagent),
        baseRemaining: mixFingerprint(state.baseRemaining),
        baseDoseUL: state.baseDoseUL,
        batch: mixFingerprint(state.acidBaseBatch),
        log: state.acidBaseLog.length,
        chemistryUpdateBudget: state.chemistryUpdateBudget,
      });
    case 'filterEvap':
      return JSON.stringify({
        input: mixFingerprint(state.stages.acidBase.accepted?.mixture),
        kottonDurability: state.kottonDurability,
        waterFilterDurability: state.waterFilterDurability,
        filterContainerOwned: state.filterContainerOwned,
      });
    case 'final': {
      const output = filterEvapOutput(state);
      return JSON.stringify({
        input: mixFingerprint(output.blocked ? undefined : output.mixture),
        finisherModules: state.finisherModules,
        finisherCapacityVials: state.finisherCapacityVials,
      });
    }
  }
}

function replaceStage(
  state: ChemistWizardState,
  stage: WizardStageId,
  patch: Partial<StageRecord>,
): ChemistWizardState {
  return {
    ...state,
    stages: {
      ...state.stages,
      [stage]: { ...state.stages[stage], ...patch },
    },
  };
}

function archiveAccepted(record: StageRecord): MixtureSnapshot[] {
  if (!record.accepted) return record.history;
  const last = record.history[record.history.length - 1];
  if (last && last.capturedAt === record.accepted.capturedAt && mixFingerprint(last.mixture) === mixFingerprint(record.accepted.mixture)) {
    return record.history;
  }
  return [...record.history, record.accepted];
}

export function markStale(
  state: ChemistWizardState,
  stage: WizardStageId,
  reason: string,
): ChemistWizardState {
  const record = state.stages[stage];
  if (!record.calculated && !record.confirmed && !record.accepted && !record.prediction) {
    return replaceStage(state, stage, {
      stale: false,
      staleReason: null,
      calculated: false,
      confirmed: false,
    });
  }
  return replaceStage(state, stage, {
    stale: true,
    staleReason: reason,
    calculated: false,
    confirmed: false,
    history: archiveAccepted(record),
  });
}

/** Mark this stage and every later stage stale. Drafts and history are kept. */
export function invalidateFrom(state: ChemistWizardState, changed: WizardStageId): ChemistWizardState {
  let next = state;
  const index = STAGE_INDEX[changed];
  for (const stage of WIZARD_STAGES) {
    if (STAGE_INDEX[stage] >= index) {
      next = markStale(next, stage, `${STAGE_LABELS[changed]} inputs changed. Re-calculate this stage.`);
    }
  }
  if (index <= STAGE_INDEX.filterEvap) {
    next = {
      ...next,
      evapNights: next.evapNights.map((night) => ({ ...night, stale: true })),
      pendingNight: next.pendingNight ? { ...next.pendingNight, stale: true } : null,
    };
  }
  if (index < STAGE_INDEX.acidBase) {
    next = { ...next, acidBaseBatch: null };
  }
  return next;
}

export function syncStale(state: ChemistWizardState): ChemistWizardState {
  let next = state;
  for (const stage of WIZARD_STAGES) {
    const record = next.stages[stage];
    if (!record.calculated && !record.confirmed) continue;
    if (record.calculatedFingerprint !== stageFingerprint(next, stage)) {
      next = invalidateFrom(next, stage);
    }
  }
  return next;
}

const EVAP_ONLY_PATCH_KEYS = new Set(['evaporator', 'evaporatorOwned', 'evaporatorModules']);

function staleEvapNights(state: ChemistWizardState, reason: string): ChemistWizardState {
  return {
    ...state,
    evapNights: state.evapNights.map((night) => ({
      ...night,
      stale: true,
      warnings: night.warnings.includes(reason) ? night.warnings : [...night.warnings, reason],
    })),
    pendingNight: state.pendingNight
      ? {
          ...state.pendingNight,
          stale: true,
          warnings: state.pendingNight.warnings.includes(reason)
            ? state.pendingNight.warnings
            : [...state.pendingNight.warnings, reason],
        }
      : null,
  };
}

export function applyStageInput(
  state: ChemistWizardState,
  stage: WizardStageId,
  patch: Partial<ChemistWizardState>,
): ChemistWizardState {
  const next = { ...state, ...patch };
  if (stage === 'filterEvap') {
    const keys = Object.keys(patch);
    const evapOnly = keys.length > 0 && keys.every((key) => EVAP_ONLY_PATCH_KEYS.has(key));
    if (evapOnly) {
      return staleEvapNights(
        next,
        'Evaporator inputs changed. Re-calculate nights from remaining volatiles. Filtration is not reapplied.',
      );
    }
  }
  return invalidateFrom(next, stage);
}

export function applyGroundChange(
  state: ChemistWizardState,
  patch: Partial<ChemistWizardState>,
): ChemistWizardState {
  return applyStageInput(state, 'ground', patch);
}

export function setDraftField(
  state: ChemistWizardState,
  stage: WizardStageId,
  key: ComponentKey,
  ul: number,
): ChemistWizardState {
  const draft = {
    values: { ...state.stages[stage].draft.values, [key]: ul },
  };
  return replaceStage(state, stage, { draft });
}

export function clearDraft(state: ChemistWizardState, stage: WizardStageId): ChemistWizardState {
  return replaceStage(state, stage, { draft: emptyDraft() });
}

export function runForward(state: ChemistWizardState): ForwardMaterialsResult {
  return recommendFromMaterials({
    groundTotalUL: state.groundTotalUL,
    ground: state.ground,
    compositionMode: state.compositionMode,
    compositionNote: state.compositionNote,
    solvent: {
      liquidUL: state.solventLiquidUL,
      mode: state.solventMode,
      alcoholUL: state.solventAlcoholUL,
      waterUL: state.solventWaterUL,
      otherUL: state.solventOtherUL,
    },
    vesselCapacityUL: state.vesselCapacityUL,
  });
}

export function mixedVessel(state: ChemistWizardState, forward: ForwardMaterialsResult): ComponentMixture {
  return mixtureFromPartial({
    ...forward.recommendedGround,
    alcohol: forward.recommendedGround.alcohol + state.solventAlcoholUL,
    water: forward.recommendedGround.water + state.solventWaterUL,
    other: forward.recommendedGround.other + state.solventOtherUL,
  });
}

export function extractionTemperature(state: ChemistWizardState): {
  temperatureC: number | null;
  warnings: string[];
  reasons: string[];
} {
  const warnings: string[] = [];
  const reasons: string[] = [];
  if (state.observedTemperatureC !== null && Number.isFinite(state.observedTemperatureC)) {
    const temperatureC = state.observedTemperatureC;
    if (temperatureC < 40) {
      warnings.push(
        `Observed ${temperatureC}°C is below the sourced extraction band (T≥40). Branch 4 will not run.`,
      );
    } else if (temperatureC > 49) {
      warnings.push(
        `Observed ${temperatureC}°C is above the 40–49°C safe band. Degradation/boiling branches may consume extract.`,
      );
    }
    if (state.heatingPlateModules < 2) {
      warnings.push('Fewer than 2 Heating Plate modules. Observed temperature is used; heating rate remains unverified.');
    }
    return { temperatureC, warnings, reasons };
  }
  if (state.heatingPlateModules < 2) {
    reasons.push(
      'No observed liquid temperature, and fewer than 2 Heating Plate modules. The 44°C model setting is not assumed. Enter the observed temperature or use 2+ modules.',
    );
    return { temperatureC: null, warnings, reasons };
  }
  return {
    temperatureC: SAFE_EXTRACTION_TEMPERATURE_C,
    warnings: [
      `No observed liquid temperature. Using sourced safe setting ${SAFE_EXTRACTION_TEMPERATURE_C}°C with ${state.heatingPlateModules} modules.`,
    ],
    reasons,
  };
}

export function inputMixtureFor(
  state: ChemistWizardState,
  stage: WizardStageId,
): {
  blocked: boolean;
  mixture: ComponentMixture;
  evidence: EvidenceStatus;
  note: string;
  snapshot: MixtureSnapshot | null;
} {
  if (stage === 'ground') {
    return {
      blocked: false,
      mixture: emptyMixture(),
      evidence: 'unknown',
      note: 'Ground stage uses inventory, not a previous snapshot.',
      snapshot: null,
    };
  }
  if (stage === 'final') {
    const output = filterEvapOutput(state);
    if (output.blocked) {
      return {
        blocked: true,
        mixture: emptyMixture(),
        evidence: 'unknown',
        note: output.note,
        snapshot: null,
      };
    }
    return {
      blocked: false,
      mixture: output.mixture,
      evidence: snapshotEvidence(output.snapshot),
      note: output.note,
      snapshot: output.snapshot,
    };
  }
  const prev = previousStage(stage)!;
  const record = state.stages[prev];
  if (!record.confirmed || record.stale || !record.accepted) {
    return {
      blocked: true,
      mixture: emptyMixture(),
      evidence: 'unknown',
      note: `${STAGE_LABELS[prev]} is not confirmed. ${STAGE_LABELS[stage]} has no input — skipped operations are not assumed.`,
      snapshot: null,
    };
  }
  const evidence: EvidenceStatus =
    record.accepted.kind === 'full-reading'
      ? 'verified-measurement'
      : record.accepted.kind === 'partial-reading'
        ? 'unknown'
        : 'predicted-by-model';
  return {
    blocked: false,
    mixture: record.accepted.mixture,
    evidence,
    note: record.accepted.note,
    snapshot: record.accepted,
  };
}

export function lastConfirmedNight(state: ChemistWizardState): EvapNightRecord | null {
  const confirmed = state.evapNights.filter((night) => night.confirmed && !night.stale);
  return confirmed[confirmed.length - 1] ?? null;
}

export function filterEvapOutput(state: ChemistWizardState): {
  blocked: boolean;
  mixture: ComponentMixture;
  snapshot: MixtureSnapshot | null;
  note: string;
} {
  const night = lastConfirmedNight(state);
  if (night) {
    const remaining = volatileUL(night.output);
    if (remaining > 100) {
      return {
        blocked: true,
        mixture: emptyMixture(),
        snapshot: null,
        note: `Night ${night.night} left ${remaining} µL volatiles. Calculate and confirm the next night from that remaining mixture. Filtration is not reapplied.`,
      };
    }
    return {
      blocked: false,
      mixture: night.output,
      snapshot: night.snapshot,
      note: `Confirmed evaporation night ${night.night}.`,
    };
  }
  const filter = state.stages.filterEvap;
  if (filter.confirmed && !filter.stale && filter.accepted) {
    if (volatileUL(filter.accepted.mixture) <= 100) {
      return {
        blocked: false,
        mixture: filter.accepted.mixture,
        snapshot: filter.accepted,
        note: 'Confirmed filtration is already dry (≤100 µL volatiles). No evaporation night required.',
      };
    }
    return {
      blocked: true,
      mixture: emptyMixture(),
      snapshot: null,
      note: 'Filtration is confirmed but the mixture is not dry. Calculate and confirm evaporation nights from the filtered mixture. Filtration is not reapplied.',
    };
  }
  return {
    blocked: true,
    mixture: emptyMixture(),
    snapshot: null,
    note: 'Filtration is not confirmed. Evaporation does not run on a skipped filter.',
  };
}

export function canEnterStage(state: ChemistWizardState, stage: WizardStageId): boolean {
  if (stage === 'ground') return true;
  if (stage === 'final') return !filterEvapOutput(state).blocked;
  const prev = previousStage(stage)!;
  const record = state.stages[prev];
  return record.confirmed && !record.stale && record.accepted !== null;
}

export function canCalculateStage(state: ChemistWizardState, stage: WizardStageId): boolean {
  return canEnterStage(state, stage);
}

export function draftMeasuredKeys(draft: DraftReading): ComponentKey[] {
  return COMPONENT_KEYS.filter((key) => draft.values[key] !== undefined);
}

export function canConfirmReadings(state: ChemistWizardState, stage: WizardStageId): boolean {
  const record = state.stages[stage];
  return (
    record.calculated &&
    !record.stale &&
    record.prediction !== null &&
    draftMeasuredKeys(record.draft).length > 0
  );
}

export function canAcceptPrediction(state: ChemistWizardState, stage: WizardStageId): boolean {
  const record = state.stages[stage];
  return record.calculated && !record.stale && record.prediction !== null && !record.predictionBlocked;
}

function overlayReadings(prediction: MixtureSnapshot, draft: DraftReading): MixtureSnapshot {
  const measured = draftMeasuredKeys(draft);
  const mixture = { ...prediction.mixture };
  const fieldProvenance = { ...prediction.fieldProvenance };
  for (const key of measured) {
    mixture[key] = draft.values[key]!;
    fieldProvenance[key] = 'measured';
  }
  const allMeasured = measured.length === COMPONENT_KEYS.length;
  return {
    mixture,
    fieldProvenance,
    kind: allMeasured ? 'full-reading' : 'partial-reading',
    capturedAt: nowIso(),
    note: allMeasured
      ? 'Full spectrometer reading confirmed. Every component was entered.'
      : `Partial reading: ${measured.join(', ')} measured. Other fields remain model predictions, not verified.`,
  };
}

export function snapshotEvidence(snapshot: MixtureSnapshot | null): EvidenceStatus {
  if (!snapshot) return 'unknown';
  if (snapshot.kind === 'full-reading') return 'verified-measurement';
  if (snapshot.kind === 'partial-reading') return 'unknown';
  if (snapshot.kind === 'model-prediction') return 'predicted-by-model';
  return 'unknown';
}

export function calculateStage(state: ChemistWizardState, stage: WizardStageId): ChemistWizardState {
  if (!canCalculateStage(state, stage)) {
    return replaceStage(state, stage, {
      calculated: false,
      confirmed: false,
      reasons: [
        `${STAGE_LABELS[stage]} cannot be calculated until ${STAGE_LABELS[previousStage(stage) ?? 'ground']} is calculated and confirmed.`,
      ],
    });
  }

  if (stage === 'ground') {
    const forward = runForward(state);
    if (forward.status !== 'ok') {
      return replaceStage(state, stage, {
        calculated: false,
        confirmed: false,
        prediction: null,
        reasons: forward.reasons,
        warnings: forward.warnings,
        calculatedFingerprint: stageFingerprint(state, stage),
        stale: false,
        staleReason: null,
      });
    }
    const vessel = mixedVessel(state, forward);
    return replaceStage(state, stage, {
      calculated: true,
      confirmed: false,
      stale: false,
      staleReason: null,
      reasons: [],
      warnings: forward.warnings,
      prediction: predictedSnapshot(
        vessel,
        'Predicted vessel contents after pouring the recommended ground mix and solvent. Not an extraction result.',
      ),
      calculatedFingerprint: stageFingerprint(state, stage),
    });
  }

  if (stage === 'extraction') {
    const input = inputMixtureFor(state, 'extraction');
    const heat = extractionTemperature(state);
    if (heat.reasons.length || heat.temperatureC === null) {
      return replaceStage(state, stage, {
        calculated: false,
        confirmed: false,
        prediction: null,
        reasons: heat.reasons,
        warnings: heat.warnings,
        calculatedFingerprint: stageFingerprint(state, stage),
        stale: false,
        staleReason: null,
      });
    }
    const simulated = simulateExtractionFromMixture(input.mixture, heat.temperatureC, 10_000);
    return replaceStage(state, stage, {
      calculated: true,
      confirmed: false,
      stale: false,
      staleReason: null,
      reasons: [],
      warnings: heat.warnings,
      prediction: predictedSnapshot(
        simulated.final,
        `Model extraction at ${heat.temperatureC}°C until Mush=0 (${simulated.ticks.length} updates). Predicted, not a spectrometer reading.`,
      ),
      calculatedFingerprint: stageFingerprint(state, stage),
    });
  }

  if (stage === 'acidBase') {
    const input = inputMixtureFor(state, 'acidBase');
    const batch = state.acidBaseBatch ?? input.mixture;
    const blockers = chemistryPredictionBlockers(batch);
    const emptyBaseIsFine = totalUL(state.baseReagent) === 0 && totalUL(state.baseRemaining) === 0;
    const warnings = [
      emptyBaseIsFine ? 'Base inventory is empty. That does not block Acid-only treatment.' : '',
      state.acidBaseLog.length === 0
        ? 'No Acid or Base dose has been poured. Calculate snapshots the confirmed extraction output; it does not dump inventory.'
        : '',
    ].filter(Boolean);
    return replaceStage(state, stage, {
      calculated: true,
      confirmed: false,
      stale: false,
      staleReason: null,
      reasons: blockers,
      warnings,
      predictionBlocked: blockers.length > 0,
      prediction: predictedSnapshot(
        batch,
        blockers.length
          ? 'Working mixture is shown, but model confirmation is blocked until you enter a measured composition.'
          : 'Current vessel after sequential Acid/Base actions. Predicted only if you accept this snapshot.',
      ),
      calculatedFingerprint: stageFingerprint(state, stage),
    });
  }

  if (stage === 'filterEvap') {
    const input = inputMixtureFor(state, 'filterEvap');
    const filtration = filterDreamDustMixture(
      input.mixture,
      state.filterContainerOwned ? state.kottonDurability : 0,
      state.filterContainerOwned ? state.waterFilterDurability : 0,
    );
    return replaceStage(state, stage, {
      calculated: true,
      confirmed: false,
      stale: false,
      staleReason: null,
      reasons: [],
      warnings: [
        'This Calculate is filtration only. Evaporation nights are separate confirmed operations and do not re-run the filter.',
        'Wiki: sleep runs 360 chemical updates before the evaporator callback. This app does not silently run those ticks on each night.',
      ],
      predictionBlocked: false,
      prediction: predictedSnapshot(
        filtration.output,
        'Model Kotton → Water Filter from the confirmed Acid/Base output. Not an evaporation result.',
      ),
      calculatedFingerprint: stageFingerprint(state, stage),
    });
  }

  const input = inputMixtureFor(state, 'final');
  const remainingVolatilesUL = volatileUL(input.mixture);
  const dryEnough = remainingVolatilesUL <= 100;
  const finishing = dryEnough
    ? finishComponentMixture(input.mixture, state.finisherModules, state.finisherCapacityVials)
    : null;
  const warnings = dryEnough
    ? []
    : [`Finisher dryness requires ≤100 µL volatiles; ${remainingVolatilesUL} µL remain.`];
  const output = finishing?.vials[0]?.final ?? input.mixture;
  return replaceStage(state, stage, {
    calculated: true,
    confirmed: false,
    stale: false,
    staleReason: null,
    reasons: dryEnough ? [] : warnings,
    warnings,
    prediction: predictedSnapshot(
      output,
      dryEnough
        ? 'Model Chem Finisher sample of the confirmed dry mixture. Predicted, not a finished-vial scan.'
        : 'Finisher blocked until the confirmed Filter/Evap mixture is dry.',
    ),
    calculatedFingerprint: stageFingerprint(state, stage),
  });
}

export function confirmStage(
  state: ChemistWizardState,
  stage: WizardStageId,
  mode: ContinueMode,
): ChemistWizardState {
  const record = state.stages[stage];
  if (mode === 'accept-prediction' && !canAcceptPrediction(state, stage)) return state;
  if (mode === 'confirm-readings' && !canConfirmReadings(state, stage)) return state;
  if (!record.prediction) return state;

  const accepted =
    mode === 'accept-prediction'
      ? {
          ...record.prediction,
          capturedAt: nowIso(),
          note: `${record.prediction.note} Accepted as the confirmed stage output (model prediction).`,
        }
      : overlayReadings(record.prediction, record.draft);

  const withAccepted = replaceStage(state, stage, {
    confirmed: true,
    stale: false,
    staleReason: null,
    accepted,
    history: archiveAccepted({ ...record, accepted }),
  });
  if (stage === 'filterEvap') {
    return { ...withAccepted, pendingNight: null };
  }
  const following = nextStage(stage);
  return following ? { ...withAccepted, currentStage: following } : withAccepted;
}

function currentAcidBaseBatch(state: ChemistWizardState): ComponentMixture {
  return state.acidBaseBatch ?? inputMixtureFor(state, 'acidBase').mixture;
}

export function setAcidStock(state: ChemistWizardState, stock: ComponentMixture): ChemistWizardState {
  const resetRemaining = state.acidBaseLog.every((step) => step.kind !== 'add-acid');
  return applyStageInput(state, 'acidBase', {
    acidReagent: stock,
    acidRemaining: resetRemaining ? stock : state.acidRemaining,
  });
}

export function setBaseStock(state: ChemistWizardState, stock: ComponentMixture): ChemistWizardState {
  const resetRemaining = state.acidBaseLog.every((step) => step.kind !== 'add-base');
  return applyStageInput(state, 'acidBase', {
    baseReagent: stock,
    baseRemaining: resetRemaining ? stock : state.baseRemaining,
  });
}

export function addAcidDose(state: ChemistWizardState): ChemistWizardState {
  const input = inputMixtureFor(state, 'acidBase');
  if (input.blocked) return state;
  const poured = takeReagentDose(state.acidRemaining, state.acidDoseUL);
  if (!poured.ok) {
    return replaceStage(state, 'acidBase', { reasons: [poured.reason ?? 'Invalid acid dose'], calculated: false });
  }
  const batch = addMeasuredReagent(currentAcidBaseBatch(state), poured.dose);
  if (totalUL(batch) > state.vesselCapacityUL) {
    return replaceStage(state, 'acidBase', {
      reasons: [`Pouring ${state.acidDoseUL} µL Acid exceeds vessel capacity ${state.vesselCapacityUL} µL`],
      calculated: false,
    });
  }
  const next: ChemistWizardState = {
    ...state,
    acidRemaining: poured.remaining,
    acidBaseBatch: batch,
    acidBaseLog: [
      ...state.acidBaseLog,
      {
        kind: 'add-acid',
        doseUL: state.acidDoseUL,
        updates: 0,
        remainingAcidUL: totalUL(poured.remaining),
        remainingBaseUL: totalUL(state.baseRemaining),
        vesselUL: totalUL(batch),
        note: 'Added Acid dose only. Neutralization does not run until you explicitly run chemical updates with both Acid and Base present.',
      },
    ],
  };
  return invalidateFrom(next, 'acidBase');
}

export function addBaseDose(state: ChemistWizardState): ChemistWizardState {
  const input = inputMixtureFor(state, 'acidBase');
  if (input.blocked) return state;
  const poured = takeReagentDose(state.baseRemaining, state.baseDoseUL);
  if (!poured.ok) {
    return replaceStage(state, 'acidBase', { reasons: [poured.reason ?? 'Invalid base dose'], calculated: false });
  }
  const batch = addMeasuredReagent(currentAcidBaseBatch(state), poured.dose);
  if (totalUL(batch) > state.vesselCapacityUL) {
    return replaceStage(state, 'acidBase', {
      reasons: [`Pouring ${state.baseDoseUL} µL Base exceeds vessel capacity ${state.vesselCapacityUL} µL`],
      calculated: false,
    });
  }
  const next: ChemistWizardState = {
    ...state,
    baseRemaining: poured.remaining,
    acidBaseBatch: batch,
    acidBaseLog: [
      ...state.acidBaseLog,
      {
        kind: 'add-base',
        doseUL: state.baseDoseUL,
        updates: 0,
        remainingAcidUL: totalUL(state.acidRemaining),
        remainingBaseUL: totalUL(poured.remaining),
        vesselUL: totalUL(batch),
        note: 'Added Base dose only. Neutralization does not run until you explicitly run chemical updates with both Acid and Base present.',
      },
    ],
  };
  return invalidateFrom(next, 'acidBase');
}

export function runChemistryUpdates(state: ChemistWizardState): ChemistWizardState {
  const input = inputMixtureFor(state, 'acidBase');
  if (input.blocked) return state;
  const batch = currentAcidBaseBatch(state);
  const treatment = simulateAcidBaseTreatment(batch, state.chemistryUpdateBudget);
  const next: ChemistWizardState = {
    ...state,
    acidBaseBatch: treatment.final,
    acidBaseLog: [
      ...state.acidBaseLog,
      {
        kind: 'run-updates',
        doseUL: 0,
        updates: treatment.ticks.length,
        remainingAcidUL: totalUL(state.acidRemaining),
        remainingBaseUL: totalUL(state.baseRemaining),
        vesselUL: totalUL(treatment.final),
        note: treatment.sourceBoundary,
      },
    ],
  };
  const invalidated = invalidateFrom(next, 'acidBase');
  return replaceStage(invalidated, 'acidBase', {
    reasons: treatment.blockReasons,
    warnings: treatment.unmodeledWarnings,
    predictionBlocked: treatment.predictionBlocked,
  });
}

function spentEvapEnergy(state: ChemistWizardState): number {
  return state.evapNights.filter((night) => night.confirmed && !night.stale).reduce((sum, night) => sum + night.energyUsed, 0);
}

function currentEvapInput(state: ChemistWizardState): ComponentMixture | null {
  const night = lastConfirmedNight(state);
  if (night) return night.output;
  const filter = state.stages.filterEvap;
  if (filter.confirmed && !filter.stale && filter.accepted) return filter.accepted.mixture;
  return null;
}

function remainingReceiver(state: ChemistWizardState): number {
  const last = lastConfirmedNight(state);
  return last ? last.remainingReceiverUL : state.evaporator.distillateCapacityUL;
}

export function calculateNextNight(state: ChemistWizardState): ChemistWizardState {
  if (!state.stages.filterEvap.confirmed || state.stages.filterEvap.stale) {
    return { ...state, pendingNight: null };
  }
  const input = currentEvapInput(state);
  if (!input) return state;
  if (!state.evaporatorOwned) {
    const snapshot = predictedSnapshot(input, 'Evaporator is not owned. Model night is blocked; enter a measured dry composition to recover.');
    return {
      ...state,
      pendingNight: {
        night: (lastConfirmedNight(state)?.night ?? 0) + 1,
        confirmed: false,
        stale: false,
        energyUsed: 0,
        allowanceUL: 0,
        remainingEnergy: state.evaporator.availableEnergy - spentEvapEnergy(state),
        remainingReceiverUL: remainingReceiver(state),
        remainingVolatilesUL: volatileUL(input),
        removed: emptyMixture(),
        recovered: emptyMixture(),
        lost: emptyMixture(),
        output: input,
        snapshot,
        reasons: ['Evaporator is not owned. Predicted night confirmation is blocked.'],
        warnings: [],
      },
    };
  }
  const remainingEnergy = state.evaporator.availableEnergy - spentEvapEnergy(state);
  const night = evaporateOneNight(input, {
    ...state.evaporator,
    availableEnergy: remainingEnergy,
    distillateCapacityUL: remainingReceiver(state),
  });
  const number = (lastConfirmedNight(state)?.night ?? 0) + 1;
  const snapshot = predictedSnapshot(
    night.output,
    night.alreadyDry && night.energyUsed === 0
      ? `Mixture already dry before night ${number}. No energy spent.`
      : `Night ${number}: removed ${totalUL(night.removed)} µL volatiles, ${night.energyUsed} kJ, recovered ${totalUL(night.recovered)} µL. Filtration was not reapplied.`,
  );
  return {
    ...state,
    pendingNight: {
      night: number,
      confirmed: false,
      stale: false,
      energyUsed: night.energyUsed,
      allowanceUL: night.allowanceUL,
      remainingEnergy: night.remainingEnergy,
      remainingReceiverUL: night.remainingReceiverUL,
      remainingVolatilesUL: night.remainingVolatilesUL,
      removed: night.removed,
      recovered: night.recovered,
      lost: night.lost,
      output: night.output,
      snapshot,
      reasons: night.success ? [] : [night.reason ?? 'Night failed'],
      warnings: [
        `Modules recorded: ${state.evaporatorModules}. P/E/Q percents are the machine readout (wiki Performance Module = 16%, Efficiency = 16%, Quality = 8%; Solvent Recovery = 0/−25/+50). They are not auto-summed from the module count.`,
      ],
    },
  };
}

export function canConfirmPendingNight(state: ChemistWizardState, mode: ContinueMode): boolean {
  const pending = state.pendingNight;
  if (!pending || pending.stale) return false;
  if (mode === 'accept-prediction') return pending.reasons.length === 0;
  return draftMeasuredKeys(state.stages.filterEvap.draft).length > 0;
}

export function confirmPendingNight(state: ChemistWizardState, mode: ContinueMode): ChemistWizardState {
  const pending = state.pendingNight;
  if (!pending || pending.stale) return state;
  if (mode === 'accept-prediction') {
    if (!canConfirmPendingNight(state, mode)) return state;
    const confirmed: EvapNightRecord = { ...pending, confirmed: true, stale: false };
    return {
      ...state,
      evapNights: [...state.evapNights, confirmed],
      pendingNight: null,
    };
  }
  if (!canConfirmPendingNight(state, mode)) return state;
  const snapshot = overlayReadings(pending.snapshot, state.stages.filterEvap.draft);
  const confirmed: EvapNightRecord = {
    ...pending,
    confirmed: true,
    stale: false,
    snapshot,
    output: snapshot.mixture,
    remainingVolatilesUL: volatileUL(snapshot.mixture),
  };
  return {
    ...state,
    evapNights: [...state.evapNights, confirmed],
    pendingNight: null,
  };
}

export function continueToFinal(state: ChemistWizardState): ChemistWizardState {
  if (filterEvapOutput(state).blocked) return state;
  return { ...state, currentStage: 'final' };
}

export function resumeAtReachable(state: ChemistWizardState): ChemistWizardState {
  if (canEnterStage(state, state.currentStage) || state.currentStage === 'ground') return state;
  let last: WizardStageId = 'ground';
  for (const stage of WIZARD_STAGES) {
    if (canEnterStage(state, stage)) last = stage;
    else break;
  }
  return { ...state, currentStage: last };
}

export function goToStage(state: ChemistWizardState, stage: WizardStageId): ChemistWizardState {
  if (STAGE_INDEX[stage] <= STAGE_INDEX[state.currentStage] || canEnterStage(state, stage)) {
    return { ...state, currentStage: stage };
  }
  return state;
}

export function predictAcidBase(state: ChemistWizardState) {
  const current = inputMixtureFor(state, 'acidBase');
  if (current.blocked) {
    return {
      before: current,
      combined: emptyMixture(),
      treatment: simulateAcidBaseTreatment(emptyMixture(), 1),
      blocked: true as const,
    };
  }
  const batch = currentAcidBaseBatch(state);
  return {
    before: current,
    combined: batch,
    treatment: simulateAcidBaseTreatment(batch, state.chemistryUpdateBudget),
    blocked: false as const,
  };
}

export function predictFilterEvap(state: ChemistWizardState) {
  const current = inputMixtureFor(state, 'filterEvap');
  if (current.blocked) {
    return {
      before: current,
      filtration: filterDreamDustMixture(emptyMixture(), 0, 0),
      evaporation: evaporateToDryness(emptyMixture(), state.evaporator),
      dryEnough: false,
      remainingVolatilesUL: 0,
      blocked: true as const,
    };
  }
  const filtration = filterDreamDustMixture(
    current.mixture,
    state.filterContainerOwned ? state.kottonDurability : 0,
    state.filterContainerOwned ? state.waterFilterDurability : 0,
  );
  const evaporation = evaporateToDryness(filtration.output, state.evaporator);
  return {
    before: current,
    filtration,
    evaporation,
    dryEnough: volatileUL(evaporation.output) <= 100,
    remainingVolatilesUL: volatileUL(evaporation.output),
    blocked: false as const,
  };
}

export function predictFinish(state: ChemistWizardState) {
  const current = inputMixtureFor(state, 'final');
  const remainingVolatilesUL = volatileUL(current.mixture);
  const dryEnough = remainingVolatilesUL <= 100;
  const finishing =
    !current.blocked && dryEnough
      ? finishComponentMixture(current.mixture, state.finisherModules, state.finisherCapacityVials)
      : null;
  return {
    before: current,
    remainingVolatilesUL,
    dryEnough,
    finishing,
    sampleUL: DREAM_DUST_SAMPLE_UL,
    possibleVials: Math.floor(totalUL(current.mixture) / DREAM_DUST_SAMPLE_UL),
    blocked: current.blocked,
  };
}

export function lastConfirmedStage(state: ChemistWizardState): WizardStageId | null {
  let last: WizardStageId | null = null;
  for (const stage of WIZARD_STAGES) {
    const record = state.stages[stage];
    if (record.confirmed && !record.stale && record.accepted) last = stage;
    else if (stage !== 'ground') break;
  }
  return last;
}
