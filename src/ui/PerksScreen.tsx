import type { Dispatch } from 'react';
import type { GameDataRegistry, PerkCategory } from '../data/types';
import { conflictsOf, evaluatePerks, previewRemoval, whyCannotAdd } from '../engine/perkEngine';
import type { BuildInput } from '../engine/types';
import type { AppState, Action } from '../state/reducer';
import { ProvenanceTip, StatusBadge } from './common';

const CATS: { id: PerkCategory; label: string }[] = [
  { id: 'positive', label: 'Positive perks (cost points)' },
  { id: 'neutral', label: 'Neutral perks' },
  { id: 'negative', label: 'Negative perks (grant points)' },
];

export function PerksScreen({ reg, state, dispatch, onBack, onNext }: { reg: GameDataRegistry; state: AppState; dispatch: Dispatch<Action>; onBack: () => void; onNext: () => void }) {
  const build: BuildInput = state.build;
  const ev = evaluatePerks(reg, build.perkIds);
  const name = (id: string) => reg.perks.find((p) => p.id === id)?.name ?? id;
  return (
    <section aria-labelledby="perks-h">
      <h2 id="perks-h">2. Starting Perks</h2>
      <div className="controls">
        <fieldset className="inline">
          <legend>Playthrough</legend>
          <label><input type="radio" name="pt" checked={build.playthrough === 'subsequent'} onChange={() => dispatch({ type: 'setPlaythrough', playthrough: 'subsequent' })} /> New Game+ / later run</label>
          <label><input type="radio" name="pt" checked={build.playthrough === 'first'} onChange={() => dispatch({ type: 'setPlaythrough', playthrough: 'first' })} /> First playthrough</label>
          <ProvenanceTip p={reg.rules.firstRunLocksPerks} />
        </fieldset>
        <button type="button" onClick={() => dispatch({ type: 'clearPerks' })} disabled={build.perkIds.length === 0}>Clear perks</button>
      </div>
      <div className="meters" aria-live="polite">
        <div className="meter"><span className="big">{ev.remainingPoints}</span> / {ev.totalPoints} points left
          <span className="muted small"> (base {ev.basePoints} + {ev.pointsGranted} from negative perks, {ev.pointsSpent} spent)</span> <ProvenanceTip p={reg.rules.basePoints} /></div>
        <div className="meter"><span className="big">{ev.usedSlots}</span> / {ev.maxSlots} slots used
          <span className="muted small"> (base {ev.baseSlots}{ev.maxSlots !== ev.baseSlots ? ` + ${ev.maxSlots - ev.baseSlots} from perks` : ''})</span> <ProvenanceTip p={reg.rules.baseSlots} /></div>
      </div>
      {build.playthrough === 'first' && <p className="callout">Perks are locked on a first playthrough (community-reported). Switch to "later run" to plan perks.</p>}
      {state.lastRejection && (
        <div className="callout error" role="alert">
          Could not add {name(state.lastRejection.perkId)}: {state.lastRejection.reasons.map((r) => r.message).join(' ')}
        </div>
      )}
      {state.lastRemovals.length > 0 && (
        <div className="callout warn" role="status">
          Automatically removed: {state.lastRemovals.map((r) => `${name(r.perkId)} (${r.reason.message})`).join('; ')}
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
                const reasons = selected ? [] : whyCannotAdd(reg, build.perkIds, p.id, build.playthrough);
                const blocked = !selected && reasons.length > 0;
                const cascade = selected ? previewRemoval(reg, build.perkIds, p.id, build.playthrough) : [];
                const excl = conflictsOf(reg, p.id);
                const cost = p.cost.value;
                const descId = `perk-desc-${p.id}`;
                return (
                  <li key={p.id} className={`perk ${selected ? 'selected' : ''} ${blocked ? 'blocked' : ''}`}>
                    <button type="button" aria-pressed={selected} aria-disabled={blocked} aria-describedby={descId}
                      className="perk-toggle" onClick={() => dispatch({ type: 'togglePerk', perkId: p.id })}>
                      <span className="perk-name">{p.name}</span>
                      <span className={`cost ${cost !== null && cost < 0 ? 'gain' : ''}`}>{cost === null ? '?' : cost < 0 ? `+${-cost}` : cost === 0 ? 'free' : `−${cost}`} pts</span>
                    </button>
                    <div id={descId} className="perk-body">
                      <p>{p.description.value ?? 'No verified description.'}</p>
                      <div className="small">
                        <StatusBadge status={p.status} /> <ProvenanceTip p={p} />
                        {p.cost.status === 'conflicting' && <span className="warn-text"> Cost disputed{p.cost.alternatives ? `: other source says ${p.cost.alternatives.map((a) => a.value).join(' / ')}` : ''}.</span>}
                        {excl.length > 0 && <span className="muted"> Excludes: {excl.map(name).join(', ')}.</span>}
                      </div>
                      {blocked && <p className="reason">Unavailable: {reasons.map((r) => r.message).join(' ')}</p>}
                      {cascade.length > 0 && <p className="reason">Removing this will also remove: {cascade.map((c) => name(c.perkId)).join(', ')}.</p>}
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
        <button type="button" className="primary" onClick={onNext}>Next: Overview →</button>
      </div>
    </section>
  );
}
