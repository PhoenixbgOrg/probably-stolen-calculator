import {
  DREAM_DUST_SAMPLE_UL,
  type ComponentMixture,
  emptyMixture,
  mixtureFromPartial,
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
  evaporateToDryness,
  filterDreamDustMixture,
  finishComponentMixture,
  type EvaporatorConfig,
} from './dreamDustPlanner';
export const WIZARD_STAGES = ['ground', 'extraction', 'acidBase', 'filterEvap', 'final'] as const;
export type WizardStageId = (typeof WIZARD_STAGES)[number];

export const STAGE_LABELS: Record<WizardStageId, string> = {
  ground: 'Ground Mixture',
  extraction: 'Extraction',
  acidBase: 'Acid / Base',
  filterEvap: 'Filtration / Evaporation',
  final: 'Final Dust',
};

export interface SpectrometerReading {
  mixture: ComponentMixture;
  capturedAt: string;
  note: string;
}

export interface ChemistWizardState {
  schemaVersion: 1;
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
  afterExtraction: SpectrometerReading | null;
  acidReagent: ComponentMixture;
  baseReagent: ComponentMixture;
  afterAcidBase: SpectrometerReading | null;
  kottonDurability: number;
  waterFilterDurability: number;
  filterContainerOwned: boolean;
  evaporator: EvaporatorConfig;
  afterFilterEvap: SpectrometerReading | null;
  finisherModules: number;
  finisherCapacityVials: number;
  afterFinish: SpectrometerReading | null;
  compareToTarget: { enabled: boolean; purity: number; vials: number };
}

export function defaultWizardState(): ChemistWizardState {
  return {
    schemaVersion: 1,
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
    afterExtraction: null,
    acidReagent: emptyMixture(),
    baseReagent: emptyMixture(),
    afterAcidBase: null,
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
    afterFilterEvap: null,
    finisherModules: 4,
    finisherCapacityVials: 24,
    afterFinish: null,
    compareToTarget: { enabled: false, purity: 65, vials: 35 },
  };
}

const STAGE_INDEX = Object.fromEntries(WIZARD_STAGES.map((id, index) => [id, index])) as Record<
  WizardStageId,
  number
>;

/** Changing an earlier stage drops later spectrometer overrides. */
export function invalidateFrom(state: ChemistWizardState, changed: WizardStageId): ChemistWizardState {
  const next = { ...state };
  const index = STAGE_INDEX[changed];
  if (index <= STAGE_INDEX.extraction) next.afterExtraction = null;
  if (index <= STAGE_INDEX.acidBase) next.afterAcidBase = null;
  if (index <= STAGE_INDEX.filterEvap) next.afterFilterEvap = null;
  if (index <= STAGE_INDEX.final) next.afterFinish = null;
  return next;
}

export function applyGroundChange(
  state: ChemistWizardState,
  patch: Partial<ChemistWizardState>,
): ChemistWizardState {
  return invalidateFrom({ ...state, ...patch }, 'ground');
}

export function mixtureInUse(state: ChemistWizardState, stage: WizardStageId): {
  mixture: ComponentMixture;
  evidence: EvidenceStatus;
  note: string;
} {
  if (stage === 'final' && state.afterFilterEvap) {
    return {
      mixture: state.afterFilterEvap.mixture,
      evidence: 'verified-measurement',
      note: state.afterFilterEvap.note,
    };
  }
  if ((stage === 'filterEvap' || stage === 'final') && state.afterAcidBase) {
    return {
      mixture: state.afterAcidBase.mixture,
      evidence: 'verified-measurement',
      note: state.afterAcidBase.note,
    };
  }
  if ((stage === 'acidBase' || stage === 'filterEvap' || stage === 'final') && state.afterExtraction) {
    return {
      mixture: state.afterExtraction.mixture,
      evidence: 'verified-measurement',
      note: state.afterExtraction.note,
    };
  }
  const forward = recommendFromMaterials({
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
  if (forward.predictedExtraction) {
    return {
      mixture: forward.predictedExtraction.final,
      evidence: 'predicted-by-model',
      note: 'Predicted extraction result. Replace with a spectrometer reading.',
    };
  }
  return {
    mixture: forward.recommendedGround,
    evidence: state.compositionMode === 'measured' ? 'predicted-by-model' : 'unknown',
    note: 'No extraction prediction yet.',
  };
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

export function predictAcidBase(state: ChemistWizardState) {
  const current = mixtureInUse(state, 'acidBase');
  const withReagents = addMeasuredReagent(
    addMeasuredReagent(current.mixture, state.acidReagent),
    state.baseReagent,
  );
  return {
    before: current,
    combined: withReagents,
    treatment: simulateAcidBaseTreatment(withReagents, 10_000),
  };
}

export function predictFilterEvap(state: ChemistWizardState) {
  const current = mixtureInUse(state, 'filterEvap');
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
  };
}

export function predictFinish(state: ChemistWizardState) {
  const current = mixtureInUse(state, 'final');
  const remainingVolatilesUL = volatileUL(current.mixture);
  const dryEnough = remainingVolatilesUL <= 100;
  const finishing = dryEnough
    ? finishComponentMixture(
        current.mixture,
        state.finisherModules,
        state.finisherCapacityVials,
      )
    : null;
  return {
    before: current,
    remainingVolatilesUL,
    dryEnough,
    finishing,
    sampleUL: DREAM_DUST_SAMPLE_UL,
    possibleVials: Math.floor(totalUL(current.mixture) / DREAM_DUST_SAMPLE_UL),
  };
}

export function readingFromMixture(mixture: ComponentMixture, note: string): SpectrometerReading {
  return {
    mixture: mixtureFromPartial(mixture),
    capturedAt: new Date().toISOString(),
    note,
  };
}

export function canEnterStage(state: ChemistWizardState, stage: WizardStageId): boolean {
  if (stage === 'ground') return true;
  const forward = runForward(state);
  if (stage === 'extraction') return forward.status === 'ok';
  if (stage === 'acidBase') return forward.status === 'ok';
  if (stage === 'filterEvap') return forward.status === 'ok';
  return forward.status === 'ok';
}
