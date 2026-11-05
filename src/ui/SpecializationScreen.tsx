import type { Dispatch } from 'react';
import type { GameDataRegistry } from '../data/types';
import type { Action } from '../state/reducer';
import type { BuildInput } from '../engine/types';
import { fmt, ProvenanceTip, StatusBadge } from './common';

export function SpecializationScreen({ reg, build, dispatch, onNext }: { reg: GameDataRegistry; build: BuildInput; dispatch: Dispatch<Action>; onNext: () => void }) {
  const specs = reg.specializations.filter((s) => s.playable);
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
      </div>
      <div className="grid" role="radiogroup" aria-label="Specialization">
        {specs.map((s) => {
          const selected = build.specializationId === s.id;
          return (
            <div key={s.id} className={`card spec ${selected ? 'selected' : ''}`}>
              <button type="button" role="radio" aria-checked={selected} className="card-select"
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
      <div className="nav-row">
        <button type="button" className="primary" disabled={!build.specializationId} onClick={onNext}>Next: Starting Perks →</button>
        {!build.specializationId && <span className="muted"> Select a specialization to continue.</span>}
      </div>
    </section>
  );
}
