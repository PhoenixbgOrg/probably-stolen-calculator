import {
  type ChemistWizardState,
  defaultWizardState,
} from '../calculators/chemistWizard';
import { emptyMixture, mixtureFromPartial } from '../calculators/dreamDustVerified';
import type { StorageLike } from './store';

export const CHEMIST_SESSION_KEY = 'psc.chemist-session';
export const CHEMIST_SESSION_SCHEMA = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mixtureOrEmpty(value: unknown) {
  return isRecord(value) ? mixtureFromPartial(value as never) : emptyMixture();
}

function readingOrNull(value: unknown) {
  if (!isRecord(value) || !isRecord(value.mixture)) return null;
  return {
    mixture: mixtureFromPartial(value.mixture as never),
    capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : '',
    note: typeof value.note === 'string' ? value.note : '',
  };
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
  if (version !== CHEMIST_SESSION_SCHEMA) {
    return {
      state: defaultWizardState(),
      notice: `Chemist session schema ${String(version)} is not supported. Started a new session; profiles were not changed.`,
    };
  }
  const base = defaultWizardState();
  const evaporator = isRecord(parsed.evaporator) ? parsed.evaporator : {};
  const compare = isRecord(parsed.compareToTarget) ? parsed.compareToTarget : {};
  const state: ChemistWizardState = {
    ...base,
    ...parsed,
    schemaVersion: 1,
    ground: mixtureOrEmpty(parsed.ground),
    acidReagent: mixtureOrEmpty(parsed.acidReagent),
    baseReagent: mixtureOrEmpty(parsed.baseReagent),
    afterExtraction: readingOrNull(parsed.afterExtraction),
    afterAcidBase: readingOrNull(parsed.afterAcidBase),
    afterFilterEvap: readingOrNull(parsed.afterFilterEvap),
    afterFinish: readingOrNull(parsed.afterFinish),
    evaporator: {
      ...base.evaporator,
      ...(evaporator as Partial<ChemistWizardState['evaporator']>),
    },
    compareToTarget: {
      enabled: Boolean(compare.enabled),
      purity: typeof compare.purity === 'number' ? compare.purity : 65,
      vials: typeof compare.vials === 'number' ? compare.vials : 35,
    },
  };
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
