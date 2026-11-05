import { useEffect, useMemo, useReducer, useRef } from 'react';
import { REGISTRY } from '../data/registry';
import { buildCharacter, createModifierQuery } from '../engine/character';
import { ProfileRepository } from '../persistence/store';
import type { StorageLike } from '../persistence/store';
import { initState, makeReducer } from './reducer';
import { filterStartupNotices, loadDismissals, recordDismissals } from '../persistence/noticeDismissals';

const reducer = makeReducer(REGISTRY);

function browserStorage(): StorageLike {
  try { return window.localStorage; } catch {
    return { getItem: () => null, setItem: () => { throw new Error('storage unavailable'); }, removeItem: () => undefined };
  }
}

export function useBuilder() {
  const repo = useRef<ProfileRepository>();
  const storage = useRef<StorageLike>();
  if (!storage.current) storage.current = browserStorage();
  if (!repo.current) repo.current = new ProfileRepository(storage.current, REGISTRY);
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const { store, notices } = repo.current!.load();
    const s = initState(store, notices);
    return { ...s, notices: filterStartupNotices(s.notices, s.store.activeProfileId, loadDismissals(storage.current!)) };
  });
  const dismissNotice = (index: number) => { const n = state.notices[index]; if (n) recordDismissals(storage.current!, [n]); dispatch({ type: 'dismissNotice', index }); };
  const dismissAllNotices = () => { recordDismissals(storage.current!, state.notices); dispatch({ type: 'dismissAllNotices' }); };
  useEffect(() => {
    const err = repo.current!.save(state.store);
    if (err) dispatch({ type: 'notify', notice: err });
  }, [state.store]);
  const character = useMemo(() => buildCharacter(REGISTRY, state.build), [state.build]);
  const modifiers = useMemo(() => createModifierQuery(character), [character]);
  return { state, dispatch, dismissNotice, dismissAllNotices, character, modifiers, registry: REGISTRY };
}
