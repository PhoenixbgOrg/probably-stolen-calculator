import {
  WIZARD_SCHEMA_VERSION,
  WIZARD_STAGES,
  type ChemistWizardState,
  type DraftReading,
  type MixtureSnapshot,
  type StageRecord,
  defaultWizardState,
  emptyDraft,
  emptyStageRecord,
  resumeAtReachable,
} from '../calculators/chemistWizard';
import { COMPONENT_KEYS, emptyMixture, mixtureFromPartial } from '../calculators/dreamDustVerified';
import type { StorageLike } from './store';

export const CHEMIST_SESSION_KEY = 'psc.chemist-session';
export const CHEMIST_SESSION_SCHEMA = WIZARD_SCHEMA_VERSION;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mixtureOrEmpty(value: unknown) {
  return isRecord(value) ? mixtureFromPartial(value as never) : emptyMixture();
}

function snapshotOrNull(value: unknown): MixtureSnapshot | null {
  if (!isRecord(value) || !isRecord(value.mixture)) return null;
  const fieldProvenance = isRecord(value.fieldProvenance) ? value.fieldProvenance : {};
  return {
    mixture: mixtureFromPartial(value.mixture as never),
    fieldProvenance: Object.fromEntries(
      COMPONENT_KEYS.map((key) => {
        const status = fieldProvenance[key];
        return [key, status === 'measured' || status === 'predicted' || status === 'unknown' ? status : 'unknown'];
      }),
    ) as MixtureSnapshot['fieldProvenance'],
    kind:
      value.kind === 'full-reading' || value.kind === 'partial-reading' || value.kind === 'model-prediction'
        ? value.kind
        : 'model-prediction',
    capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : '',
    note: typeof value.note === 'string' ? value.note : '',
  };
}

function draftOrEmpty(value: unknown): DraftReading {
  if (!isRecord(value) || !isRecord(value.values)) return emptyDraft();
  const values: DraftReading['values'] = {};
  for (const key of COMPONENT_KEYS) {
    const amount = value.values[key];
    if (typeof amount === 'number' && Number.isFinite(amount)) values[key] = amount;
  }
  return { values };
}

function stageOrEmpty(value: unknown): StageRecord {
  const base = emptyStageRecord();
  if (!isRecord(value)) return base;
  const history = Array.isArray(value.history)
    ? value.history.map(snapshotOrNull).filter((row): row is MixtureSnapshot => row !== null)
    : [];
  return {
    calculated: Boolean(value.calculated),
    confirmed: Boolean(value.confirmed),
    stale: Boolean(value.stale),
    staleReason: typeof value.staleReason === 'string' ? value.staleReason : null,
    calculatedFingerprint: typeof value.calculatedFingerprint === 'string' ? value.calculatedFingerprint : null,
    prediction: snapshotOrNull(value.prediction),
    accepted: snapshotOrNull(value.accepted),
    draft: draftOrEmpty(value.draft),
    history,
    warnings: Array.isArray(value.warnings) ? value.warnings.filter((row) => typeof row === 'string') : [],
    reasons: Array.isArray(value.reasons) ? value.reasons.filter((row) => typeof row === 'string') : [],
  };
}

function draftFromLegacyReading(value: unknown): { draft: DraftReading; history: MixtureSnapshot[] } {
  if (!isRecord(value) || !isRecord(value.mixture)) return { draft: emptyDraft(), history: [] };
  const mixture = mixtureFromPartial(value.mixture as never);
  const snapshot: MixtureSnapshot = {
    mixture,
    fieldProvenance: Object.fromEntries(COMPONENT_KEYS.map((key) => [key, 'measured'])) as MixtureSnapshot['fieldProvenance'],
    kind: 'full-reading',
    capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : '',
    note:
      (typeof value.note === 'string' ? value.note : 'Imported spectrometer row') +
      ' (kept as a draft from schema 1; re-calculate and confirm this stage — skipped operations are not assumed).',
  };
  return {
    draft: { values: { ...mixture } },
    history: [snapshot],
  };
}

function migrateV1(parsed: Record<string, unknown>, base: ChemistWizardState): ChemistWizardState {
  const evaporator = isRecord(parsed.evaporator) ? parsed.evaporator : {};
  const compare = isRecord(parsed.compareToTarget) ? parsed.compareToTarget : {};
  const extractionLegacy = draftFromLegacyReading(parsed.afterExtraction);
  const acidLegacy = draftFromLegacyReading(parsed.afterAcidBase);
  const filterLegacy = draftFromLegacyReading(parsed.afterFilterEvap);
  const finishLegacy = draftFromLegacyReading(parsed.afterFinish);
  const stages = defaultWizardState().stages;
  stages.extraction = { ...stages.extraction, draft: extractionLegacy.draft, history: extractionLegacy.history };
  stages.acidBase = { ...stages.acidBase, draft: acidLegacy.draft, history: acidLegacy.history };
  stages.filterEvap = { ...stages.filterEvap, draft: filterLegacy.draft, history: filterLegacy.history };
  stages.final = { ...stages.final, draft: finishLegacy.draft, history: finishLegacy.history };
  return resumeAtReachable({
    ...base,
    compositionMode: parsed.compositionMode === 'estimated' ? 'estimated' : 'measured',
    compositionNote: typeof parsed.compositionNote === 'string' ? parsed.compositionNote : '',
    groundTotalUL: typeof parsed.groundTotalUL === 'number' ? parsed.groundTotalUL : 0,
    ground: mixtureOrEmpty(parsed.ground),
    solventMode: parsed.solventMode === 'mixed' ? 'mixed' : 'pure',
    solventLiquidUL: typeof parsed.solventLiquidUL === 'number' ? parsed.solventLiquidUL : 0,
    solventAlcoholUL: typeof parsed.solventAlcoholUL === 'number' ? parsed.solventAlcoholUL : 0,
    solventWaterUL: typeof parsed.solventWaterUL === 'number' ? parsed.solventWaterUL : 0,
    solventOtherUL: typeof parsed.solventOtherUL === 'number' ? parsed.solventOtherUL : 0,
    vesselCapacityUL: typeof parsed.vesselCapacityUL === 'number' ? parsed.vesselCapacityUL : base.vesselCapacityUL,
    observedTemperatureC: typeof parsed.observedTemperatureC === 'number' ? parsed.observedTemperatureC : null,
    heatingPlateModules: typeof parsed.heatingPlateModules === 'number' ? parsed.heatingPlateModules : 2,
    acidReagent: mixtureOrEmpty(parsed.acidReagent),
    baseReagent: mixtureOrEmpty(parsed.baseReagent),
    kottonDurability: typeof parsed.kottonDurability === 'number' ? parsed.kottonDurability : 1_000,
    waterFilterDurability: typeof parsed.waterFilterDurability === 'number' ? parsed.waterFilterDurability : 400,
    filterContainerOwned: parsed.filterContainerOwned !== false,
    evaporator: {
      ...base.evaporator,
      ...(evaporator as Partial<ChemistWizardState['evaporator']>),
    },
    finisherModules: typeof parsed.finisherModules === 'number' ? parsed.finisherModules : 4,
    finisherCapacityVials: typeof parsed.finisherCapacityVials === 'number' ? parsed.finisherCapacityVials : 24,
    compareToTarget: {
      enabled: Boolean(compare.enabled),
      purity: typeof compare.purity === 'number' ? compare.purity : 65,
      vials: typeof compare.vials === 'number' ? compare.vials : 35,
    },
    currentStage: 'ground',
    stages,
    schemaVersion: 2,
  });
}

export function parseChemistSession(raw: string | null): {
  state: ChemistWizardState;
  notice: string | null;
} {
  if (raw === null) return { state: defaultWizardState(), notice: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      state: defaultWizardState(),
      notice: 'Chemist session could not be parsed. Started a new session; profiles were not changed.',
    };
  }
  if (!isRecord(parsed)) {
    return {
      state: defaultWizardState(),
      notice: 'Chemist session was not an object. Started a new session; profiles were not changed.',
    };
  }
  const version = parsed.schemaVersion;
  const base = defaultWizardState();
  if (version === 1) {
    return {
      state: migrateV1(parsed, base),
      notice:
        'Chemist session upgraded from schema 1. Spectrometer rows were kept as drafts/history. Re-calculate and confirm each stage; skipped operations are not assumed. Profiles were not changed.',
    };
  }
  if (version !== CHEMIST_SESSION_SCHEMA) {
    return {
      state: defaultWizardState(),
      notice: `Chemist session schema ${String(version)} is not supported. Started a new session; profiles were not changed.`,
    };
  }
  const evaporator = isRecord(parsed.evaporator) ? parsed.evaporator : {};
  const compare = isRecord(parsed.compareToTarget) ? parsed.compareToTarget : {};
  const parsedStages = isRecord(parsed.stages) ? parsed.stages : {};
  const stages = defaultWizardState().stages;
  for (const stage of WIZARD_STAGES) {
    stages[stage] = stageOrEmpty(parsedStages[stage]);
  }
  const state = resumeAtReachable({
    ...base,
    compositionMode: parsed.compositionMode === 'estimated' ? 'estimated' : 'measured',
    compositionNote: typeof parsed.compositionNote === 'string' ? parsed.compositionNote : '',
    groundTotalUL: typeof parsed.groundTotalUL === 'number' ? parsed.groundTotalUL : 0,
    ground: mixtureOrEmpty(parsed.ground),
    solventMode: parsed.solventMode === 'mixed' ? 'mixed' : 'pure',
    solventLiquidUL: typeof parsed.solventLiquidUL === 'number' ? parsed.solventLiquidUL : 0,
    solventAlcoholUL: typeof parsed.solventAlcoholUL === 'number' ? parsed.solventAlcoholUL : 0,
    solventWaterUL: typeof parsed.solventWaterUL === 'number' ? parsed.solventWaterUL : 0,
    solventOtherUL: typeof parsed.solventOtherUL === 'number' ? parsed.solventOtherUL : 0,
    vesselCapacityUL: typeof parsed.vesselCapacityUL === 'number' ? parsed.vesselCapacityUL : base.vesselCapacityUL,
    observedTemperatureC: typeof parsed.observedTemperatureC === 'number' ? parsed.observedTemperatureC : null,
    heatingPlateModules: typeof parsed.heatingPlateModules === 'number' ? parsed.heatingPlateModules : 2,
    acidReagent: mixtureOrEmpty(parsed.acidReagent),
    baseReagent: mixtureOrEmpty(parsed.baseReagent),
    kottonDurability: typeof parsed.kottonDurability === 'number' ? parsed.kottonDurability : 1_000,
    waterFilterDurability: typeof parsed.waterFilterDurability === 'number' ? parsed.waterFilterDurability : 400,
    filterContainerOwned: parsed.filterContainerOwned !== false,
    evaporator: {
      ...base.evaporator,
      ...(evaporator as Partial<ChemistWizardState['evaporator']>),
    },
    finisherModules: typeof parsed.finisherModules === 'number' ? parsed.finisherModules : 4,
    finisherCapacityVials: typeof parsed.finisherCapacityVials === 'number' ? parsed.finisherCapacityVials : 24,
    compareToTarget: {
      enabled: Boolean(compare.enabled),
      purity: typeof compare.purity === 'number' ? compare.purity : 65,
      vials: typeof compare.vials === 'number' ? compare.vials : 35,
    },
    currentStage:
      typeof parsed.currentStage === 'string' && WIZARD_STAGES.includes(parsed.currentStage as never)
        ? (parsed.currentStage as ChemistWizardState['currentStage'])
        : 'ground',
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
    stages,
    schemaVersion: 2,
  });
  return { state, notice: null };
}

export function loadChemistSession(storage: StorageLike): {
  state: ChemistWizardState;
  notice: string | null;
} {
  return parseChemistSession(storage.getItem(CHEMIST_SESSION_KEY));
}

export function saveChemistSession(storage: StorageLike, state: ChemistWizardState): ChemistWizardState {
  const next = { ...state, savedAt: new Date().toISOString() };
  storage.setItem(CHEMIST_SESSION_KEY, JSON.stringify(next));
  return next;
}

export function clearChemistSession(storage: StorageLike): ChemistWizardState {
  storage.removeItem(CHEMIST_SESSION_KEY);
  return defaultWizardState();
}
