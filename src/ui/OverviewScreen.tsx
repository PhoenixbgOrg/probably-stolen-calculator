import type { CharacterConfig, DerivedNumber } from '../engine/character';
import type { GameDataRegistry } from '../data/types';
import { fmt, SourceList, StatusBadge } from './common';
import { CategoryMarker, PixelIcon } from './PixelIcon';
import { flagLabel } from '../data/flags';
import { perkCostLabel } from '../engine/labels';
import { fixScreenFor } from '../state/navigation';
import type { Screen } from '../state/navigation';

function Stat({ label, d, suffix = '' }: { label: string; d: DerivedNumber; suffix?: string }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td className="num" data-label="Result">{fmt(d.value, suffix)}</td>
      <td data-label="Status"><StatusBadge status={d.status} /></td>
      <td className="small muted" data-label="Breakdown">{d.contributions.map((c) => `${c.label}: ${c.value === null ? '?' : c.value}`).join(' · ')}{d.note ? ` — ${d.note}` : ''}</td>
    </tr>
  );
}

const FACTION_NAMES = { security: 'Security', 'black-market': 'Black Market', revolution: 'Revolution', 'upper-levels': 'Upper Levels' } as const;

export function OverviewScreen({ reg, c, onBack, onFix }: { reg: GameDataRegistry; c: CharacterConfig; onBack: () => void; onFix: (s: Screen) => void }) {
  const fixAt = fixScreenFor(c.violations);
  const warnings = c.valid ? c.warnings : c.warnings.filter((w) => w !== 'No specialization selected yet.');
  const kit = c.specialization?.startingInventory.value ?? [];
  const diff = reg.difficulties.find((d) => d.id === c.difficulty);
  const otherMods = c.modifiers.filter((m) => !['startingCredits', 'startingRent', 'inventoryWidth', 'dumpingGroundSearches', 'perkSlots', 'perkPoints'].includes(m.stat) && !m.stat.startsWith('reputation.'));
  const resources: [string, DerivedNumber][] = [
    ['Starting credits', c.startingCredits], ['Starting rent', c.startingRent], ['Inventory width', c.inventoryWidth], ['Searches / day', c.dumpingGroundSearches],
  ];
  const bonuses = c.perks.filter((p) => p.category.value === 'positive');
  const penalties = c.perks.filter((p) => p.category.value === 'negative');
  return (
    <section className="panel" aria-labelledby="ov-h">
      <h2 id="ov-h" className="panel-title">Character Overview</h2>
      <div className="summary">
        <div><span className="lbl">Specialization</span><strong>{c.specialization?.name ?? 'None selected'}</strong></div>
        <div><span className="lbl">Difficulty</span><strong>{diff ? `${diff.name}` : c.difficulty}</strong><span className="small muted">{diff?.subtitle}</span></div>
        <div><span className="lbl">Playthrough</span><strong>{c.input.playthrough === 'first' ? 'First' : 'Later run'}</strong></div>
        <div><span className="lbl">Perk points left</span><strong className={c.points.remainingPoints < 0 ? 'over' : 'ok'}>{c.points.remainingPoints} / {c.points.totalPoints}</strong></div>
        <div><span className="lbl">Perks</span><strong className={c.points.usedSlots > c.points.maxSlots ? 'over' : 'ok'}>{c.points.usedSlots}/{c.points.maxSlots}</strong></div>
      </div>
      {c.valid ? (
        <div className="banner-valid" role="status" data-testid="validation-status"><span className="dot ok" aria-hidden="true" /> Valid build: points, slots, conflicts and first-run rules all pass.</div>
      ) : (
        <div className="banner-invalid" role="alert" data-testid="validation-status">
          <strong><span className="dot bad" aria-hidden="true" /> INVALID BUILD - the game would not let you continue with this.</strong>
          <ul className="violations">{c.violations.map((v, i) => <li key={i}>{v.message} <em>Fix: {v.fix}</em></li>)}</ul>
          <button type="button" className="pix-btn" onClick={() => onFix(fixAt)}>◀ Fix on the {fixAt === 'spec' ? 'Specialization' : 'Perks'} screen</button>
        </div>
      )}
      {warnings.length > 0 && <ul className="callout warn warn-list">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
      <div className="ov-cols">
        <div>
          <h3 className="section-h">Selected perks</h3>
          {c.perks.length === 0 ? <p className="muted small">No perks selected.</p> : (
            <ul className="ov-perks">{c.perks.map((p) => (
              <li key={p.id} className={`cat-${p.category.value ?? 'neutral'}`}><PixelIcon id={p.id} tone={p.category.value ?? 'neutral'} size={24} /><CategoryMarker category={p.category.value ?? 'neutral'} /><span className="sel-name">{p.name}</span><span className="sel-cost">{perkCostLabel(p)}</span></li>
            ))}</ul>
          )}
        </div>
        <div>
          <h3 className="section-h">Starting resources</h3>
          <div className="stat-boxes">
            {resources.map(([l, d]) => <div key={l} className="stat-box"><span className="lbl">{l}</span><span className="val">{fmt(d.value)}</span><StatusBadge status={d.status} /></div>)}
          </div>
        </div>
      </div>
      {(bonuses.length > 0 || penalties.length > 0 || c.flags.length > 0 || otherMods.length > 0) && (<>
        <h3 className="section-h">Active bonuses and penalties</h3>
        <ul className="pix-list">
          {bonuses.map((p) => <li key={p.id} className="bonus"><CategoryMarker category="positive" /> <strong>{p.name}:</strong> {p.description.value}</li>)}
          {penalties.map((p) => <li key={p.id} className="penalty"><CategoryMarker category="negative" /> <strong>{p.name}:</strong> {p.description.value}</li>)}
          {c.perks.filter((p) => p.category.value === 'neutral').map((p) => <li key={p.id}><CategoryMarker category="neutral" /> <strong>{p.name}:</strong> {p.description.value}</li>)}
        </ul>
        {c.flags.length > 0 && <p className="small"><span className="lbl">Gameplay flags:</span> {c.flags.map(flagLabel).join(' · ')}</p>}
      </>)}
      {c.specialization && (<>
        <h3 className="section-h">Starting kit ({c.specialization.name})</h3>
        {kit.length > 0 ? <ul className="pix-list small">{kit.map((i) => <li key={i}>{i}</li>)}</ul> : <p className="small muted">No starting kit documented for {c.specialization.name}.</p>}
        {(c.specialization.unlocks.value ?? []).length > 0 && <p className="small">Unlocks: {(c.specialization.unlocks.value ?? []).join(', ')}</p>}
      </>)}
      <details className="pix-details"><summary>Value breakdown, reputation and sources</summary>
      <div className="table-scroll"><table className="stats">
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
      </table></div>
      <p className="small muted">Starting reputation is only listed where a source reported it for this specialization and difficulty.</p>
      {otherMods.length > 0 && (<>
        <h4>Other modifiers</h4>
        <ul className="pix-list small">{otherMods.map((m, i) => <li key={i}>{m.perkName}: <code>{m.stat}</code> {m.op === 'set' ? '=' : m.value !== null && m.value >= 0 ? '+' : ''}{fmt(m.value)}{m.condition ? ` (${m.condition})` : ''} <StatusBadge status={m.status} /></li>)}</ul>
      </>)}
      {c.specialization && <p className="small"><StatusBadge status={c.specialization.status} /> <SourceList p={c.specialization} /></p>}
      {c.perks.map((p) => <p key={p.id} className="small">{p.name}: <StatusBadge status={p.status} /> <SourceList p={p} /></p>)}
      </details>
      <div className="nav-row"><button type="button" className="pix-btn" onClick={onBack}>◀ Starting Perks</button></div>
    </section>
  );
}
