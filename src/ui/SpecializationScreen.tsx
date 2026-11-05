import { useRef } from 'react';
import type { Dispatch, KeyboardEvent } from 'react';
import { rovingIndex } from '../state/navigation';
import type { GameDataRegistry } from '../data/types';
import type { Action } from '../state/reducer';
import type { BuildInput } from '../engine/types';
import { fmt, ProvenanceTip, StatusBadge } from './common';

export function SpecializationScreen({ reg, build, dispatch, onNext }: { reg: GameDataRegistry; build: BuildInput; dispatch: Dispatch<Action>; onNext: () => void }) {
  // Non-playable entries (Junker, "Work in Progress" in the game menu) are shown disabled, never selectable.
  const specs = reg.specializations;
  const unverifiedRules = reg.startRules.filter((r) => r.id === 'first-run-non-apprentice' || r.id === 'forced-skip-intro' || r.id === 'first-run-difficulty');
  const groupRef = useRef<HTMLDivElement>(null);
  const playableIds = specs.filter((s) => s.playable).map((s) => s.id);
  const sel = build.specializationId ? playableIds.indexOf(build.specializationId) : -1;
  const focusIdx = sel >= 0 ? sel : 0;
  const select = (i: number) => {
    const id = playableIds[i];
    if (!id) return;
    dispatch({ type: 'selectSpecialization', id });
    groupRef.current?.querySelector<HTMLButtonElement>(`[data-spec="${id}"]`)?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); return; }
    const next = rovingIndex(i, e.key, playableIds.length);
    if (next !== null) { e.preventDefault(); select(next); }
  };
  return (
    <section aria-labelledby="spec-h">
      <h2 id="spec-h">1. Specialization</h2>
      <p className="muted">Choose your starting specialization. Values are community-reported for game {reg.gameVersion}; check badges before relying on them.</p>
      <div className="controls">
        <label>Difficulty{' '}
          <select value={build.difficulty} onChange={(e) => dispatch({ type: 'setDifficulty', difficulty: e.target.value as BuildInput['difficulty'] })}>
            {reg.difficulties.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.subtitle})</option>)}
          </select>
        </label>
        <span className="small muted"> Names match five community sources. Mark Up is the game default and Red Ink is on page 2 of the Difficulty screen (single sources) <StatusBadge status="unverified" />. No first-run difficulty restriction is documented.</span>
      </div>
      <div className="grid" role="radiogroup" aria-label="Specialization" ref={groupRef}>
        {specs.map((s) => {
          const selected = build.specializationId === s.id;
          const idx = playableIds.indexOf(s.id);
          if (!s.playable) {
            return (
              <div key={s.id} className="card spec wip" data-testid={`spec-${s.id}`}>
                <button type="button" role="radio" aria-checked={false} disabled aria-disabled="true" className="card-select"
                  title="Work in Progress in the game: cannot be started">
                  <span className="card-title">{s.name}</span>
                  <span className="tag wip">{s.tag.value ?? 'Work in Progress'}</span>
                </button>
                <p className="muted">Shown as "Work in Progress" in the game menu and cannot be started. No stats are listed because none are documented. <StatusBadge status={s.status} /> <ProvenanceTip p={s} /></p>
              </div>
            );
          }
          return (
            <div key={s.id} className={`card spec ${selected ? 'selected' : ''}`}>
              <button type="button" role="radio" aria-checked={selected} className="card-select" data-spec={s.id}
                tabIndex={idx === focusIdx ? 0 : -1}
                onKeyDown={(e) => onKey(e, idx)}
                onClick={() => dispatch({ type: 'selectSpecialization', id: s.id })}>
                <span className="card-title">{s.name}</span>
                {s.tag.value && <span className="tag">{s.tag.value}</span>}
              </button>
              <p>{s.description.value ?? 'No verified description.'}</p>
              <dl className="kv">
                <dt>Starting credits</dt><dd>{fmt(s.startingCredits.value)} <StatusBadge status={s.startingCredits.status} /> <ProvenanceTip p={s.startingCredits} /></dd>
                <dt>Starting rent</dt><dd>{fmt(s.startingRent.value)} <StatusBadge status={s.startingRent.status} /> <ProvenanceTip p={s.startingRent} /></dd>
              </dl>
              {s.startScreenFeatures.value && s.startScreenFeatures.value.length > 0 && (
                <ul className="small">{s.startScreenFeatures.value.map((f) => <li key={f}>{f}</li>)}</ul>
              )}
            </div>
          );
        })}
      </div>
      {build.playthrough === 'first' && (
        <ul className="callout small">
          {unverifiedRules.map((r) => <li key={r.id}>{r.text} <StatusBadge status={r.status} /> <ProvenanceTip p={r} /></li>)}
        </ul>
      )}
      <div className="nav-row">
        <button type="button" className="primary" disabled={!build.specializationId} onClick={onNext}>Next: Starting Perks →</button>
        {!build.specializationId && <span className="muted"> Select a specialization to continue.</span>}
      </div>
    </section>
  );
}
