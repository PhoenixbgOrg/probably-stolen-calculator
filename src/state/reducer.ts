import { DATA_VERSION, REGISTRY } from '../data/registry';
import type { Difficulty, GameDataRegistry } from '../data/types';
import { addBlockers, togglePerk } from '../engine/perkEngine';
import { EMPTY_BUILD } from '../engine/types';
import type { BuildInput, Playthrough, Rejection } from '../engine/types';
import type { ProfileV2, StoreV2 } from '../persistence/schema';
import {
  createProfile, deleteProfile, duplicateProfile, removeQuarantined, renameProfile, updateProfileBuild,
} from '../persistence/store';
import type { Notice } from '../persistence/store';

/** Single source of truth for the UI. All screens derive from `build`. */
export interface AppState {
  store: StoreV2;
  build: BuildInput;
  notices: Notice[];
  /** Result of the last perk action, for inline feedback. */
  lastRejection: { perkId: string | null; reasons: Rejection[] } | null;
}

export type Action =
  | { type: 'selectSpecialization'; id: string | null }
  | { type: 'setDifficulty'; difficulty: Difficulty }
  | { type: 'setPlaythrough'; playthrough: Playthrough }
  | { type: 'togglePerk'; perkId: string }
  | { type: 'removePerk'; perkId: string }
  | { type: 'clearPerks' }
  | { type: 'resetBuild' }
  | { type: 'newProfile'; name: string }
  | { type: 'switchProfile'; id: string }
  | { type: 'renameProfile'; id: string; name: string }
  | { type: 'duplicateProfile'; id: string }
  | { type: 'deleteProfile'; id: string }
  | { type: 'importProfiles'; profiles: ProfileV2[]; notices: Notice[] }
  | { type: 'discardQuarantine'; id: string }
  | { type: 'notify'; notice: Notice }
  | { type: 'dismissNotice'; index: number };

export function initState(store: StoreV2, notices: Notice[]): AppState {
  let s = store;
  if (s.profiles.length === 0) s = createProfile(s, 'My build', EMPTY_BUILD, DATA_VERSION).store;
  const active = s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0]!;
  return { store: { ...s, activeProfileId: active.id }, build: active.build, notices, lastRejection: null };
}

function withBuild(state: AppState, build: BuildInput, extra: Partial<AppState> = {}): AppState {
  const id = state.store.activeProfileId;
  const store = id ? updateProfileBuild(state.store, id, build, DATA_VERSION) : state.store;
  return { ...state, lastRejection: null, ...extra, build, store };
}

function activate(state: AppState, store: StoreV2, extraNotices: Notice[] = []): AppState {
  let s = store;
  if (s.profiles.length === 0) s = createProfile(s, 'My build', EMPTY_BUILD, DATA_VERSION).store;
  const active = s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0]!;
  return { ...state, store: { ...s, activeProfileId: active.id }, build: active.build, lastRejection: null, notices: [...state.notices, ...extraNotices] };
}

export function makeReducer(reg: GameDataRegistry = REGISTRY) {
  return function reducer(state: AppState, action: Action): AppState {
    const b = state.build;
    switch (action.type) {
      case 'selectSpecialization': {
        if (action.id !== null) {
          const spec = reg.specializations.find((x) => x.id === action.id);
          if (!spec || !spec.playable) {
            return { ...state, lastRejection: { perkId: null, reasons: [{ code: spec ? 'specialization-unavailable' : 'unknown-specialization', message: spec ? `${spec.name} is "Work in Progress" in the game and cannot be selected.` : `Unknown specialization "${action.id}".` }] } };
          }
        }
        return withBuild(state, { ...b, specializationId: action.id });
      }
      case 'setDifficulty':
        return withBuild(state, { ...b, difficulty: action.difficulty });
      case 'setPlaythrough':
        // Perks are kept; if any remain on a first playthrough, `validate` reports it and Continue is blocked.
        return withBuild(state, { ...b, playthrough: action.playthrough });
      case 'togglePerk': {
        const blockers = addBlockers(reg, b.perkIds, action.perkId, b.playthrough);
        if (blockers.length > 0) return { ...state, lastRejection: { perkId: action.perkId, reasons: blockers } };
        return withBuild(state, { ...b, perkIds: togglePerk(b.perkIds, action.perkId) });
      }
      case 'removePerk':
        return withBuild(state, { ...b, perkIds: b.perkIds.filter((id) => id !== action.perkId) });
      case 'clearPerks':
        return withBuild(state, { ...b, perkIds: [] });
      case 'resetBuild':
        return withBuild(state, { ...EMPTY_BUILD });
      case 'newProfile':
        return activate(state, createProfile(state.store, action.name, EMPTY_BUILD, DATA_VERSION).store);
      case 'switchProfile':
        return state.store.profiles.some((p) => p.id === action.id) ? activate(state, { ...state.store, activeProfileId: action.id }) : state;
      case 'renameProfile':
        return { ...state, store: renameProfile(state.store, action.id, action.name) };
      case 'duplicateProfile':
        return activate(state, duplicateProfile(state.store, action.id));
      case 'deleteProfile':
        return activate(state, deleteProfile(state.store, action.id));
      case 'importProfiles': {
        if (action.profiles.length === 0) return { ...state, notices: [...state.notices, ...action.notices] };
        const store = { ...state.store, profiles: [...state.store.profiles, ...action.profiles], activeProfileId: action.profiles[0]!.id };
        return activate(state, store, action.notices);
      }
      case 'discardQuarantine':
        return { ...state, store: removeQuarantined(state.store, action.id) };
      case 'notify':
        return { ...state, notices: [...state.notices, action.notice] };
      case 'dismissNotice':
        return { ...state, notices: state.notices.filter((_, i) => i !== action.index) };
    }
  };
}
