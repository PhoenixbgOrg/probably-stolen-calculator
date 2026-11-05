import type { CharacterConfig, DerivedNumber } from '../engine/character';
import type { GameDataRegistry } from '../data/types';
import { fmt, StatusBadge } from './common';

function Stat({ label, d, suffix = '' }: { label: string; d: DerivedNumber; suffix?: string }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td className="num">{fmt(d.value, suffix)}</td>
      <td><StatusBadge status={d.status} /></td>
      <td className="small muted">{d.contributions.map((c) => `${c.label}: ${c.value === null ? '?' : c.value}`).join(' · ')}{d.note ? ` — ${d.note}` : ''}</td>
    </tr>
  );
}

const FACTION_NAMES = { security: 'Security', 'black-market': 'Black Market', revolution: 'Revolution', 'upper-levels': 'Upper Levels' } as const;

export function OverviewScreen({ reg, c, onBack }: { reg: GameDataRegistry; c: CharacterConfig; onBack: () => void }) {
  const diff = reg.difficulties.find((d) => d.id === c.difficulty);
  const otherMods = c.modifiers.filter((m) => !['startingCredits', 'startingRent', 'inventoryWidth', 'dumpingGroundSearches', 'perkSlots', 'perkPoints'].includes(m.stat) && !m.stat.startsWith('reputation.'));
  return (
    <section aria-labelledby="ov-h">
      <h2 id="ov-h">3. Character Overview</h2>
      <div className="summary">
        <div><span className="muted">Specialization</span><strong>{c.specialization?.name ?? 'None selected'}</strong></div>
        <div><span className="muted">Difficulty</span><strong>{diff ? `${diff.name} (${diff.subtitle})` : c.difficulty}</strong></div>
        <div><span className="muted">Playthrough</span><strong>{c.input.playthrough === 'first' ? 'First' : 'Later run'}</strong></div>
        <div><span className="muted">Perk points</span><strong>{c.points.remainingPoints} left of {c.points.totalPoints}</strong></div>
        <div><span className="muted">Slots</span><strong>{c.points.usedSlots} / {c.points.maxSlots}</strong></div>
      </div>
      {c.warnings.length > 0 && <ul className="callout warn">{c.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
      <h3>Derived starting values</h3>
      <table className="stats">
        <thead><tr><th>Value</th><th>Result</th><th>Status</th><th>Breakdown</th></tr></thead>
        <tbody>
          <Stat label="Starting credits" d={c.startingCredits} />
          <Stat label="Starting rent" d={c.startingRent} />
          <Stat label="Inventory width" d={c.inventoryWidth} />
          <Stat label="Dumping-ground searches / day" d={c.dumpingGroundSearches} />
          {(Object.keys(FACTION_NAMES) as (keyof typeof FACTION_NAMES)[]).map((f) => (
            c.reputation[f].contributions.length > 0 ? <Stat key={f} label={`Reputation: ${FACTION_NAMES[f]}`} d={c.reputation[f]} /> : null
          ))}
          {c.reputationAllFactions.contributions.length > 0 && <Stat label="Reputation with all factions (perks)" d={c.reputationAllFactions} />}
        </tbody>
      </table>
      <p className="small muted">Starting reputation is only listed where a source reported it for this specialization and difficulty.</p>
      <h3>Selected perks</h3>
      {c.perks.length === 0 ? <p className="muted">No perks selected.</p> : (
        <ul className="plain">{c.perks.map((p) => <li key={p.id}><strong>{p.name}</strong> ({p.cost.value === null ? '?' : p.cost.value < 0 ? `+${-p.cost.value}` : `−${p.cost.value}`} pts) — {p.description.value} <StatusBadge status={p.status} /></li>)}</ul>
      )}
      {otherMods.length > 0 && (<>
        <h3>Other modifiers</h3>
        <ul className="plain">{otherMods.map((m, i) => <li key={i}>{m.perkName}: <code>{m.stat}</code> {m.op === 'set' ? '=' : m.value !== null && m.value >= 0 ? '+' : ''}{fmt(m.value)}{m.condition ? ` (${m.condition})` : ''} <StatusBadge status={m.status} /></li>)}</ul>
      </>)}
      {c.flags.length > 0 && (<><h3>Gameplay flags</h3><p className="flags">{c.flags.map((f) => <code key={f}>{f}</code>)}</p></>)}
      {c.specialization && (<>
        <h3>Starting kit ({c.specialization.name})</h3>
        <ul className="plain small">{(c.specialization.startingInventory.value ?? []).map((i) => <li key={i}>{i}</li>)}</ul>
        {(c.specialization.unlocks.value ?? []).length > 0 && <p className="small">Unlocks: {(c.specialization.unlocks.value ?? []).join(', ')}</p>}
      </>)}
      <div className="nav-row"><button type="button" onClick={onBack}>← Starting Perks</button></div>
    </section>
  );
}
