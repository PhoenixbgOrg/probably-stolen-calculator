import { useRef, useState } from 'react';
import type { Dispatch, KeyboardEvent } from 'react';
import type { GameDataRegistry, PerkDef } from '../data/types';
import { evaluatePerks, offendingPerkIds, validate } from '../engine/perkEngine';
import { perkActionView, perksInOrder } from '../engine/perkView';
import type { BuildInput } from '../engine/types';
import type { AppState, Action } from '../state/reducer';
import { rovingIndex } from '../state/navigation';
import { flagLabel } from '../data/flags';
import { fmt, ProvenanceTip, SourceList, StatusBadge, Tip } from './common';
import { firstRunExplanation, perkCostLabel } from '../engine/labels';
import { CategoryMarker, ImprovedPixelIcon } from './ImprovedPixelIcon';

const CAT_LABEL = { positive: 'Positive', negative: 'Negative', neutral: 'Neutral' } as const;

function PerkDetail({ reg, build, perkId, dispatch }: { reg: GameDataRegistry; build: BuildInput; perkId: string; dispatch: Dispatch<Action> }) {
  const v = perkActionView(reg, build, perkId);
  if (!v) return null;
  const p = v.perk;
  const cat = p.category.value ?? 'neutral';
  const name = (id: string) => reg.perks.find((q) => q.id === id)?.name ?? id;
  return (
    <div className="perk-detail" data-testid="perk-detail" aria-live="polite">
      <div className="title-row">
        <ImprovedPixelIcon id={p.id} tone={cat} size={32} showTooltip={false} />
        <h3>{p.name}</h3>
        <span className={`cat-chip cat-${cat}`}><CategoryMarker category={cat} /> {CAT_LABEL[cat]}</span>
        <span className="cost-chip">{perkCostLabel(p)}</span>
        {v.selected && <span className="sel-chip">✔ Selected</span>}
      </div>
      <p className="desc">{p.description.value ?? 'No verified description.'}</p>
      {p.cost.status === 'conflicting' && <p className="warn-text small">Cost disputed{p.cost.alternatives ? `: other source says ${p.cost.alternatives.map((a) => a.value).join(' / ')}` : ''}.</p>}
      {(p.modifiers.length > 0 || p.flags.length > 0) && (
        <ul className="pix-list small">
          {p.modifiers.map((m, i) => <li key={i}><code>{m.stat}</code> {m.op === 'set' ? '=' : m.value !== null && m.value >= 0 ? '+' : ''}{fmt(m.value)}{m.condition ? ` (${m.condition})` : ''} <StatusBadge status={m.status} /></li>)}
          {p.flags.map((f) => <li key={f}>{flagLabel(f)}</li>)}
        </ul>
      )}
      <p className="small">
        {p.requires.length > 0 && <>Requires: {p.requires.map(name).join(', ')}. </>}
        {v.exclusive.length > 0 ? <>Mutually exclusive with: {v.exclusive.map(name).join(', ')}.</> : 'No documented conflicts.'}
      </p>
      <div className="consequences">
        {v.kind === 'blocked' && <p className="reason bad" data-testid="perk-blocked">Cannot add: {v.blockers.map((r) => r.message).join(' ')}</p>}
        {v.kind === 'add' && v.wouldBreak.length > 0 && <p className="reason warn" data-testid="perk-would-break">Adding makes the build invalid (allowed, but you cannot continue until fixed): {v.wouldBreak.map((x) => x.message).join(' ')}</p>}
        {v.kind === 'add' && v.wouldBreak.length === 0 && <p className="reason ok">Adding keeps the build valid.</p>}
        {v.kind === 'remove' && v.currentProblems.length > 0 && <p className="reason bad">Currently breaks a rule: {v.currentProblems.map((x) => x.message).join(' ')}</p>}
        {v.kind === 'remove' && v.removalFixes.length > 0 && <p className="reason ok">Removing fixes: {v.removalFixes.map((x) => x.message).join(' ')}</p>}
        {v.kind === 'remove' && v.wouldBreak.length > 0 && <p className="reason warn">Removing would cause: {v.wouldBreak.map((x) => x.message).join(' ')}</p>}
      </div>
      <button type="button" data-testid="perk-action" className={`pix-btn action ${v.kind === 'remove' ? 'remove' : v.wouldBreak.length ? 'warnbtn' : 'primary'}`}
        disabled={v.kind === 'blocked'} aria-disabled={v.kind === 'blocked' || undefined}
        onClick={() => dispatch(v.kind === 'remove' ? { type: 'removePerk', perkId: p.id } : { type: 'togglePerk', perkId: p.id })}>
        {v.kind === 'remove' ? '− Remove perk' : v.kind === 'blocked' ? 'Cannot add' : `+ ${v.label}`}
      </button>
      <details className="pix-details"><summary>Sources and verification</summary>
        <p className="small"><StatusBadge status={p.status} /> <SourceList p={p} /></p>
        {p.note && <p className="small muted">{p.note}</p>}
      </details>
    </div>
  );
}

export function PerksScreen({ reg, state, dispatch, onBack, onNext, continueBlocked }: { reg: GameDataRegistry; state: AppState; dispatch: Dispatch<Action>; onBack: () => void; onNext: () => void; continueBlocked: boolean }) {
  const build: BuildInput = state.build;
  const ev = evaluatePerks(reg, build.perkIds);
  const violations = validate(reg, build);
  const offending = offendingPerkIds(violations);
  const ordered = perksInOrder(reg);
  const [viewId, setViewId] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const unknownSelected = build.perkIds.filter((id) => !reg.perks.some((p) => p.id === id));
  const selectedPerks = build.perkIds.map((id) => reg.perks.find((p) => p.id === id)).filter((p): p is PerkDef => !!p);
  const name = (id: string) => reg.perks.find((p) => p.id === id)?.name ?? id;
  const detailRef = useRef<HTMLDivElement>(null);
  const view = (id: string, reveal = false) => {
    setViewId(id);
    const i = ordered.findIndex((p) => p.id === id);
    if (i >= 0) setFocusIdx(i);
    // Narrow screens: bring the details/Add-Remove panel into view (minimal scroll; focus stays on the icon).
    if (reveal && typeof window !== 'undefined' && window.matchMedia?.('(max-width: 900px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }));
    }
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = rovingIndex(i, e.key, ordered.length);
    if (n === null) return;
    e.preventDefault();
    setFocusIdx(n);
    setViewId(ordered[n]!.id);
    gridRef.current?.querySelectorAll<HTMLButtonElement>('button.perk-icon')[n]?.focus();
  };
  const perkStatus = (p: PerkDef) => {
    const v = perkActionView(reg, build, p.id)!;
    if (v.selected) return offending.has(p.id) ? 'selected offending' : 'selected';
    if (v.kind === 'blocked') return 'blocked';
    if (v.exclusiveSelected.length > 0) return 'conflict';
    return '';
  };
  const ariaFor = (p: PerkDef, st: string) => `${p.name}, ${CAT_LABEL[p.category.value ?? 'neutral']}, ${perkCostLabel(p)}${st.includes('selected') ? ', selected' : ''}${st.includes('offending') ? ', breaks a rule' : ''}${st === 'blocked' ? ', unavailable' : ''}${st === 'conflict' ? ', conflicts with a selected perk' : ''}`;
  return (
    <section className="panel" aria-labelledby="perks-h">
      <h2 id="perks-h" className="panel-title">Starting Perks</h2>
      <p className="intro">Choose negative perks to gain points to spend on positive perks. Some perks are mutually exclusive. Tap a perk to see its details, then use the Add / Remove button.</p>
      <div className="perk-meters" aria-live="polite" data-testid="perk-meters">
        <div className="meter-box">Available Perk Points: <strong className={ev.remainingPoints < 0 ? 'over' : 'ok'}>{ev.remainingPoints}</strong> <span className="small muted">of {ev.totalPoints}</span> <ProvenanceTip p={reg.rules.basePoints} /></div>
        <div className="meter-box">Perks: <strong className={ev.usedSlots > ev.maxSlots ? 'over' : 'ok'}>{ev.usedSlots}/{ev.maxSlots}</strong> <ProvenanceTip p={reg.rules.baseSlots} /></div>
      </div>
      <div className="controls">
        <fieldset className="inline pix-fieldset">
          <legend>Playthrough</legend>
          <label><input type="radio" name="pt" checked={build.playthrough === 'subsequent'} onChange={() => dispatch({ type: 'setPlaythrough', playthrough: 'subsequent' })} /> New Game+ / later run</label>
          <label><input type="radio" name="pt" checked={build.playthrough === 'first'} onChange={() => dispatch({ type: 'setPlaythrough', playthrough: 'first' })} /> First playthrough</label>
          <Tip label="ⓘ"><span className="tip-note">{firstRunExplanation(reg)}</span><StatusBadge status={reg.rules.firstRunLocksPerks.status} /><SourceList p={reg.rules.firstRunLocksPerks} /></Tip>
        </fieldset>
        <button type="button" className="pix-btn" onClick={() => dispatch({ type: 'clearPerks' })} disabled={build.perkIds.length === 0}>Clear perks</button>
      </div>
      {build.playthrough === 'first' && <p className="callout">{firstRunExplanation(reg)}</p>}
      {state.lastRejection && (
        <div className="callout error" role="alert">Could not add {state.lastRejection.perkId ? name(state.lastRejection.perkId) : 'that'}: {state.lastRejection.reasons.map((r) => r.message).join(' ')}</div>
      )}
      {violations.length > 0 && (
        <div className={`callout ${continueBlocked ? 'error' : 'warn'}`} role={continueBlocked ? 'alert' : 'status'} data-testid="violations">
          <strong>{continueBlocked ? 'Cannot continue: ' : ''}This build is invalid ({violations.length} problem{violations.length === 1 ? '' : 's'}).</strong>
          <ul className="violations">{violations.map((v, i) => <li key={i}>{v.message} <em>Fix: {v.fix}</em></li>)}</ul>
          {unknownSelected.map((id) => <button key={id} type="button" className="pix-btn" onClick={() => dispatch({ type: 'removePerk', perkId: id })}>Remove unknown perk "{id}"</button>)}
        </div>
      )}
      <p className="muted small">Perk tiles are original calculator symbols, not game sprites. Appearance vs in-game art is unverified.</p>
      <h3 className="section-h">Available Perks</h3>
      <div className="legend small" aria-hidden="true">
        <span><CategoryMarker category="positive" /> positive</span><span><CategoryMarker category="neutral" /> neutral</span><span><CategoryMarker category="negative" /> negative</span>
        <span className="lg-sel">selected</span><span className="lg-conf">conflict</span><span className="lg-block">unavailable</span>
      </div>
      <div className="perk-grid" ref={gridRef} role="group" aria-label="Available perks (in display order)">
        {ordered.map((p, i) => {
          const st = perkStatus(p);
          const cat = p.category.value ?? 'neutral';
          return (
            <button key={p.id} type="button" className={`icon-btn perk-icon cat-${cat} ${st} ${viewId === p.id ? 'viewing' : ''}`}
              data-perk={p.id} aria-label={ariaFor(p, st)} aria-current={viewId === p.id ? 'true' : undefined} aria-controls="perk-detail-area"
              tabIndex={i === focusIdx ? 0 : -1} onKeyDown={(e) => onKey(e, i)} onClick={() => view(p.id, true)} title={p.name}>
              <ImprovedPixelIcon id={p.id} tone={cat} />
              <CategoryMarker category={cat} />
              {st.includes('selected') && <span className="sel-mark" aria-hidden="true">✔</span>}
              {(st === 'blocked' || st === 'conflict' || st.includes('offending')) && <span className="warn-mark" aria-hidden="true">{st === 'blocked' ? '⊘' : '!'}</span>}
            </button>
          );
        })}
      </div>
      <p className="small muted order-note">Perk order: <StatusBadge status={reg.ordering.perks.status} /> {reg.ordering.perks.note} <ProvenanceTip p={reg.ordering.perks} /></p>
      <div id="perk-detail-area" className="detail-area" ref={detailRef}>
        {viewId ? <PerkDetail reg={reg} build={build} perkId={viewId} dispatch={dispatch} /> : <p className="muted" data-testid="perk-detail-empty">Select a perk icon to see its description, cost, conflicts and the Add / Remove button.</p>}
      </div>
      <h3 className="section-h">Selected Perks</h3>
      {selectedPerks.length === 0 && unknownSelected.length === 0 ? <p className="muted small center">No perks selected.</p> : (
        <ul className="selected-perks" data-testid="selected-perks">
          {selectedPerks.map((p) => (
            <li key={p.id} className={offending.has(p.id) ? 'offending' : ''}>
              <button type="button" className={`sel-row cat-${p.category.value ?? 'neutral'}`} onClick={() => view(p.id, true)} aria-label={`View ${p.name}`}>
                <ImprovedPixelIcon id={p.id} tone={p.category.value ?? 'neutral'} size={28} />
                <span className="sel-name">{p.name}</span>
                <span className="sel-meta">
                  <span className="sel-cost">{perkCostLabel(p)}</span>
                  {offending.has(p.id) && <span className="warn-text">breaks a rule</span>}
                </span>
              </button>
              <button type="button" className="pix-btn small-btn" onClick={() => dispatch({ type: 'removePerk', perkId: p.id })} aria-label={`Remove ${p.name}`}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">Like the game, a selection may temporarily break the rules; nothing is removed automatically. You cannot continue until it is valid. <ProvenanceTip p={reg.rules.validatedAtContinue} /></p>
      <div className="nav-row">
        <button type="button" className="pix-btn" onClick={onBack}>◀ Specialization</button>
        <button type="button" className="pix-btn primary" aria-disabled={violations.length > 0} onClick={onNext}>Continue ▶</button>
        {violations.length > 0 && <span className="muted small">Fix the {violations.length} problem{violations.length === 1 ? '' : 's'} above to continue.</span>}
      </div>
    </section>
  );
}
