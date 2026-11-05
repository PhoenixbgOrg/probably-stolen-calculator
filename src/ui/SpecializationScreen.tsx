import { useRef } from 'react';
import type { Dispatch, KeyboardEvent } from 'react';
import type { GameDataRegistry, SpecializationDef } from '../data/types';
import type { Action } from '../state/reducer';
import type { BuildInput } from '../engine/types';
import { rovingIndex } from '../state/navigation';
import { fmt, ProvenanceTip, SourceList, StatusBadge } from './common';
import { PixelIcon } from './PixelIcon';

function List({ title, items }: { title: string; items: string[] | null | undefined }) {
  if (!items || items.length === 0) return null;
  return (<><h4>{title}</h4><ul className="pix-list">{items.map((i) => <li key={i}>{i}</li>)}</ul></>);
}

function SpecDetails({ s }: { s: SpecializationDef }) {
  if (!s.playable) {
    return (
      <div className="spec-detail" data-testid="spec-detail">
        <div className="title-row"><h3>{s.name}</h3><span className="tag wip">{s.tag.value ?? 'Work in Progress'}</span></div>
        <p>Shown as "Work in Progress" in the game menu and cannot be started. No stats are listed because none are documented.</p>
        <p className="small"><StatusBadge status={s.status} /> <ProvenanceTip p={s} /></p>
      </div>
    );
  }
  return (
    <div className="spec-detail" data-testid="spec-detail">
      <div className="title-row"><h3>{s.name}</h3>{s.tag.value && <span className="tag">{s.tag.value}</span>}</div>
      <p className="desc">{s.description.value ?? 'No verified description.'}</p>
      <div className="stat-boxes">
        <div className="stat-box"><span className="lbl">Credits</span><span className="val">{fmt(s.startingCredits.value)}</span><span><StatusBadge status={s.startingCredits.status} /> <ProvenanceTip p={s.startingCredits} /></span></div>
        <div className="stat-box"><span className="lbl">Rent</span><span className="val">{fmt(s.startingRent.value)}</span><span><StatusBadge status={s.startingRent.status} /> <ProvenanceTip p={s.startingRent} /></span></div>
      </div>
      <div className="detail-cols">
        <div><List title="Start screen" items={s.startScreenFeatures.value} /><List title="Advantages" items={s.advantages} /><List title="Disadvantages" items={s.disadvantages} /></div>
        <div><List title="Equipment / starting kit" items={s.startingInventory.value} />
          {(s.startingInventory.value ?? []).length === 0 && <><h4>Equipment / starting kit</h4><p className="small muted">No starting kit documented.</p></>}
          <List title="Unlocked at start" items={s.unlocks.value} /></div>
      </div>
      <details className="pix-details"><summary>Sources and verification</summary>
        <p className="small"><StatusBadge status={s.status} /> <SourceList p={s} /></p>
        {s.note && <p className="small muted">{s.note}</p>}
        <List title="Perk interactions" items={s.perkInteractions.value} />
      </details>
    </div>
  );
}

export function SpecializationScreen({ reg, build, dispatch, onNext }: { reg: GameDataRegistry; build: BuildInput; dispatch: Dispatch<Action>; onNext: () => void }) {
  const specs = [...reg.specializations].sort((a, b) => a.order - b.order);
  const unverifiedRules = reg.startRules.filter((r) => r.id === 'first-run-non-apprentice' || r.id === 'forced-skip-intro' || r.id === 'first-run-difficulty');
  const groupRef = useRef<HTMLDivElement>(null);
  const playableIds = specs.filter((s) => s.playable).map((s) => s.id);
  const sel = build.specializationId ? playableIds.indexOf(build.specializationId) : -1;
  const focusIdx = sel >= 0 ? sel : 0;
  const current = specs.find((s) => s.id === build.specializationId);
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
  const step = (d: number) => select(sel < 0 ? 0 : (sel + d + playableIds.length) % playableIds.length);
  return (
    <section className="panel" aria-labelledby="spec-h">
      <h2 id="spec-h" className="panel-title">Specialization</h2>
      <p className="intro">Choose your starting specialization. Values are community-reported for game {reg.gameVersion}; badges show how well each is verified.</p>
      <div className="spec-picker">
        <button type="button" className="pix-btn arrow" onClick={() => step(-1)} aria-label="Previous specialization">◀</button>
        <div className="spec-icons" role="radiogroup" aria-label="Specialization" ref={groupRef}>
          {specs.map((s) => {
            const selected = build.specializationId === s.id;
            const idx = playableIds.indexOf(s.id);
            if (!s.playable) {
              return (
                <button key={s.id} type="button" role="radio" aria-checked={false} aria-disabled="true" tabIndex={-1} disabled
                  className="icon-btn spec-icon disabled" data-testid={`spec-${s.id}`} title={`${s.name}: Work in Progress in the game, cannot be started`}>
                  <PixelIcon id={s.id} tone="disabled" /><span className="icon-label">{s.name}</span><span className="sr-only"> (Work in Progress, unavailable)</span>
                </button>
              );
            }
            return (
              <button key={s.id} type="button" role="radio" aria-checked={selected} className={`icon-btn spec-icon ${selected ? 'selected' : ''}`} data-spec={s.id}
                tabIndex={idx === focusIdx ? 0 : -1} onKeyDown={(e) => onKey(e, idx)} onClick={() => dispatch({ type: 'selectSpecialization', id: s.id })}>
                <PixelIcon id={s.id} tone="spec" /><span className="icon-label">{s.name}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="pix-btn arrow" onClick={() => step(1)} aria-label="Next specialization">▶</button>
      </div>
      <p className="small muted order-note">Menu order: <StatusBadge status={reg.ordering.specializations.status} /> <ProvenanceTip p={reg.ordering.specializations} /></p>
      {current ? <SpecDetails s={current} /> : <p className="spec-detail muted" data-testid="spec-detail">Select a specialization above to see its details.</p>}
      <div className="pix-field">
        <label htmlFor="difficulty">Difficulty</label>
        <select id="difficulty" value={build.difficulty} onChange={(e) => dispatch({ type: 'setDifficulty', difficulty: e.target.value as BuildInput['difficulty'] })}>
          {reg.difficulties.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.subtitle})</option>)}
        </select>
        <span className="small muted">Names match five community sources. Mark Up is the game default and Red Ink is on page 2 of the Difficulty screen (single sources) <StatusBadge status="unverified" />. No first-run difficulty restriction is documented.</span>
      </div>
      {build.playthrough === 'first' && (
        <ul className="callout small">
          {unverifiedRules.map((r) => <li key={r.id}>{r.text} <StatusBadge status={r.status} /> <ProvenanceTip p={r} /></li>)}
        </ul>
      )}
      <div className="nav-row">
        <button type="button" className="pix-btn primary" disabled={!build.specializationId} onClick={onNext}>Next: Starting Perks ▶</button>
        {!build.specializationId && <span className="muted small">Select a specialization to continue.</span>}
      </div>
    </section>
  );
}
