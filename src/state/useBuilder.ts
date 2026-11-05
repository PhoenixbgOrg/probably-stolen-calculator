import { useEffect, useMemo, useReducer, useRef } from 'react';
import { REGISTRY } from '../data/registry';
import { buildCharacter, createModifierQuery } from '../engine/character';
import { ProfileRepository } from '../persistence/store';
import type { StorageLike } from '../persistence/store';
import { initState, makeReducer } from './reducer';

const reducer = makeReducer(REGISTRY);

function browserStorage(): StorageLike {
  try { return window.localStorage; } catch {
    return { getItem: () => null, setItem: () => { throw new Error('storage unavailable'); }, removeItem: () => undefined };
  }
}

export function useBuilder() {
  const repo = useRef<ProfileRepository>();
  if (!repo.current) repo.current = new ProfileRepository(browserStorage(), REGISTRY);
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const { store, notices } = repo.current!.load();
    return initState(store, notices);
  });
  useEffect(() => {
    const err = repo.current!.save(state.store);
    if (err) dispatch({ type: 'notify', notice: err });
  }, [state.store]);
  const character = useMemo(() => buildCharacter(REGISTRY, state.build), [state.build]);
  const modifiers = useMemo(() => createModifierQuery(character), [character]);
  return { state, dispatch, character, modifiers, registry: REGISTRY };
}
