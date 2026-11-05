import type { Dispatch } from 'react';
import type { GameDataRegistry, PerkCategory } from '../data/types';
import { addBlockers, conflictsOf, evaluatePerks, offendingPerkIds, validate } from '../engine/perkEngine';
import type { BuildInput } from '../engine/types';
import type { AppState, Action } from '../state/reducer';
import { ProvenanceTip, SourceList, StatusBadge, Tip } from './common';
import { firstRunExplanation, perkCostLabel } from '../engine/labels';

const CATS: { id: PerkCategory; label: string }[] = [
  { id: 'positive', label: 'Positive perks (cost points)' },
  { id: 'neutral', label: 'Neutral perks' },
  { id: 'negative', label: 'Negative perks (grant points)' },
];

export function PerksScreen({ reg, state, dispatch, onBack, onNext, continueBlocked }: { reg: GameDataRegistry; state: AppState; dispatch: Dispatch<Action>; onBack: () => void; onNext: () => void; continueBlocked: boolean }) {
  const build: BuildInput = state.build;
  const ev = evaluatePerks(reg, build.perkIds);
  const violations = validate(reg, build);
  const offending = offendingPerkIds(violations);
  const unknownSelected = build.perkIds.filter((id) => !reg.perks.some((p) => p.id === id));
  const name = (id: string) => reg.perks.find((p) => p.id === id)?.name ?? id;
  return (
    <section aria-labelledby="perks-h">
      <h2 id="perks-h">2. Starting Perks</h2>
      <div className="controls">
        <fieldset className="inline">
          <legend>Playthrough</legend>
          <label><input type="radio" name="pt" checked={build.playthrough === 'subsequent'} onChange={() => dispatch({ type: 'setPlaythrough', playthrough: 'subsequent' })} /> New Game+ / later run</label>
          <label><input type="radio" name="pt" checked={build.playthrough === 'first'} onChange={() => dispatch({ type: 'setPlaythrough', playthrough: 'first' })} /> First playthrough</label>
          <Tip label="ⓘ"><span className="tip-note">{firstRunExplanation(reg)}</span><StatusBadge status={reg.rules.firstRunLocksPerks.status} /><SourceList p={reg.rules.firstRunLocksPerks} /></Tip>
        </fieldset>
        <button type="button" onClick={() => dispatch({ type: 'clearPerks' })} disabled={build.perkIds.length === 0}>Clear perks</button>
      </div>
      <div className="meters" aria-live="polite">
        <div className="meter"><span className={`big ${ev.remainingPoints < 0 ? 'over' : ''}`}>{ev.remainingPoints}</span> / {ev.totalPoints} points left
          <span className="muted small"> (base {ev.basePoints} + {ev.pointsGranted} from negative perks, {ev.pointsSpent} spent)</span> <ProvenanceTip p={reg.rules.basePoints} /></div>
        <div className="meter"><span className={`big ${ev.usedSlots > ev.maxSlots ? 'over' : ''}`}>{ev.usedSlots}</span> / {ev.maxSlots} slots used
          <span className="muted small"> (base {ev.baseSlots}{ev.maxSlots !== ev.baseSlots ? ` + ${ev.maxSlots - ev.baseSlots} from perks` : ''})</span>
          {ev.usedSlots > ev.maxSlots && <span className="over small"> {ev.usedSlots - ev.maxSlots} over the limit</span>} <ProvenanceTip p={reg.rules.baseSlots} /></div>
      </div>
      {build.playthrough === 'first' && <p className="callout">{firstRunExplanation(reg)}</p>}
      <p className="small muted">Like the game, a selection may temporarily break the rules; nothing is removed automatically. You cannot continue until it is valid. <ProvenanceTip p={reg.rules.validatedAtContinue} /></p>
      {state.lastRejection && (
        <div className="callout error" role="alert">
          Could not add {state.lastRejection.perkId ? name(state.lastRejection.perkId) : 'that'}: {state.lastRejection.reasons.map((r) => r.message).join(' ')}
        </div>
      )}
      {violations.length > 0 && (
        <div className={`callout ${continueBlocked ? 'error' : 'warn'}`} role={continueBlocked ? 'alert' : 'status'} data-testid="violations">
          <strong>{continueBlocked ? 'Cannot continue: ' : ''}This build is invalid ({violations.length} problem{violations.length === 1 ? '' : 's'}).</strong>
          <ul className="violations">{violations.map((v, i) => <li key={i}>{v.message} <em>Fix: {v.fix}</em></li>)}</ul>
          {unknownSelected.map((id) => <button key={id} type="button" onClick={() => dispatch({ type: 'removePerk', perkId: id })}>Remove unknown perk "{id}"</button>)}
        </div>
      )}
      {CATS.map((cat) => {
        const perks = reg.perks.filter((p) => p.category.value === cat.id).sort((a, b) => (b.cost.value ?? 0) - (a.cost.value ?? 0) || a.name.localeCompare(b.name));
        return (
          <div key={cat.id}>
            <h3>{cat.label}</h3>
            <ul className="perk-list">
              {perks.map((p) => {
                const selected = build.perkIds.includes(p.id);
                const reasons = addBlockers(reg, build.perkIds, p.id, build.playthrough);
                const blocked = !selected && reasons.length > 0;
                const bad = selected && offending.has(p.id);
                const clash = !selected ? conflictsOf(reg, p.id).filter((o) => build.perkIds.includes(o)) : [];
                const excl = conflictsOf(reg, p.id);
                const cost = p.cost.value;
                const descId = `perk-desc-${p.id}`;
                return (
                  <li key={p.id} className={`perk ${selected ? 'selected' : ''} ${blocked ? 'blocked' : ''} ${bad ? 'offending' : ''}`} data-offending={bad || undefined}>
                    <button type="button" aria-pressed={selected} aria-disabled={blocked} aria-describedby={descId}
                      className="perk-toggle" onClick={() => dispatch({ type: 'togglePerk', perkId: p.id })}>
                      <span className="perk-name">{p.name}</span>
                      <span className={`cost ${cost !== null && cost < 0 ? 'gain' : ''}`}>{perkCostLabel(p)}</span>
                    </button>
                    <div id={descId} className="perk-body">
                      <p>{p.description.value ?? 'No verified description.'}</p>
                      <div className="small">
                        <StatusBadge status={p.status} /> <ProvenanceTip p={p} />
                        {p.cost.status === 'conflicting' && <span className="warn-text"> Cost disputed{p.cost.alternatives ? `: other source says ${p.cost.alternatives.map((a) => a.value).join(' / ')}` : ''}.</span>}
                        {excl.length > 0 && <span className="muted"> Excludes: {excl.map(name).join(', ')}.</span>}
                      </div>
                      {blocked && <p className="reason">Unavailable: {reasons.map((r) => r.message).join(' ')}</p>}
                      {bad && <p className="reason over">Breaks a rule: {violations.filter((v) => v.perkIds.includes(p.id)).map((v) => v.message).join(' ')}</p>}
                      {clash.length > 0 && <p className="reason">Conflicts with selected {clash.map(name).join(', ')} (allowed temporarily; must be fixed to continue).</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <div className="nav-row">
        <button type="button" onClick={onBack}>← Specialization</button>
        <button type="button" className="primary" aria-disabled={violations.length > 0} onClick={onNext}>Continue: Overview →</button>
        {violations.length > 0 && <span className="muted"> Fix the {violations.length} problem{violations.length === 1 ? '' : 's'} above to continue.</span>}
      </div>
    </section>
  );
}
