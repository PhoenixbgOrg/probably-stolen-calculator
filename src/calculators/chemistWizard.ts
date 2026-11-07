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
import { addMeasuredReagent, simulateAcidBaseTreatment } from './dreamDustReactions';
import {
  SAFE_EXTRACTION_TEMPERATURE_C,
  evaporateToDryness,
  filterDreamDustMixture,
  finishComponentMixture,
  type EvaporatorConfig,
} from './dreamDustPlanner';

export const WIZARD_STAGES = ['ground', 'extraction', 'acidBase', 'filterEvap', 'final'] as const;
export type WizardStageId = (typeof WIZARD_STAGES)[number];
export const WIZARD_SCHEMA_VERSION = 2 as const;

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
}

export interface ChemistWizardState {
  schemaVersion: 2;
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
  baseReagent: ComponentMixture;
  kottonDurability: number;
  waterFilterDurability: number;
  filterContainerOwned: boolean;
  evaporator: EvaporatorConfig;
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
    schemaVersion: 2,
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
    baseReagent: emptyMixture(),
    kottonDurability: 1_000,
    waterFilterDurability: 400,
    filterContainerOwned: true,
    evaporator: {
      performancePercent: 0,
      efficiencyPercent: 0,
      qualityPercent: 0,
      availableEnergy: 12,
      distillateCapacityUL: 0,
      solventRecoveryModule: false,
    },
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
        acid: mixFingerprint(state.acidReagent),
        base: mixFingerprint(state.baseReagent),
      });
    case 'filterEvap':
      return JSON.stringify({
        input: mixFingerprint(state.stages.acidBase.accepted?.mixture),
        kottonDurability: state.kottonDurability,
        waterFilterDurability: state.waterFilterDurability,
        filterContainerOwned: state.filterContainerOwned,
        evaporator: state.evaporator,
      });
    case 'final':
      return JSON.stringify({
        input: mixFingerprint(state.stages.filterEvap.accepted?.mixture),
        finisherModules: state.finisherModules,
        finisherCapacityVials: state.finisherCapacityVials,
      });
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

export function applyStageInput(
  state: ChemistWizardState,
  stage: WizardStageId,
  patch: Partial<ChemistWizardState>,
): ChemistWizardState {
  return invalidateFrom({ ...state, ...patch }, stage);
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

export function canEnterStage(state: ChemistWizardState, stage: WizardStageId): boolean {
  if (stage === 'ground') return true;
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
  return record.calculated && !record.stale && record.prediction !== null;
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
    const combined = addMeasuredReagent(addMeasuredReagent(input.mixture, state.acidReagent), state.baseReagent);
    const treatment = simulateAcidBaseTreatment(combined, 10_000);
    return replaceStage(state, stage, {
      calculated: true,
      confirmed: false,
      stale: false,
      staleReason: null,
      reasons: [],
      warnings: treatment.unmodeledWarnings,
      prediction: predictedSnapshot(
        treatment.final,
        'Model Acid/Base ticks (wiki 16 then 18). Predicted, not a spectrometer reading. Inventory-vs-dose split is a later checkpoint.',
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
    const evaporation = evaporateToDryness(filtration.output, state.evaporator);
    const warnings = [
      evaporation.success ? '' : evaporation.reason,
      'Per-night rebase and Performance/Efficiency editors are a later checkpoint; this prediction is one overnight sequence from the confirmed Acid/Base output.',
    ].filter((row): row is string => Boolean(row));
    return replaceStage(state, stage, {
      calculated: true,
      confirmed: false,
      stale: false,
      staleReason: null,
      reasons: [],
      warnings,
      prediction: predictedSnapshot(
        evaporation.output,
        'Model Kotton → Water Filter → Evaporator sequence from the confirmed Acid/Base output.',
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
  const following = nextStage(stage);
  return following ? { ...withAccepted, currentStage: following } : withAccepted;
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
  const withReagents = addMeasuredReagent(
    addMeasuredReagent(current.mixture, state.acidReagent),
    state.baseReagent,
  );
  return {
    before: current,
    combined: withReagents,
    treatment: simulateAcidBaseTreatment(withReagents, 10_000),
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
