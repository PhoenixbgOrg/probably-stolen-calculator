import { useEffect, useState } from 'react';
import type { AppState } from '../state/reducer';
import { navigate } from '../state/navigation';
import type { Screen } from '../state/navigation';
import { useBuilder } from '../state/useBuilder';
import { OverviewScreen } from './OverviewScreen';
import { PerksScreen } from './PerksScreen';
import { ProfilesPanel } from './ProfilesPanel';
import { SpecializationScreen } from './SpecializationScreen';
import { shouldClearBlockedBanner } from '../engine/perkView';

const STEPS: { id: Screen; label: string }[] = [
  { id: 'spec', label: '1. Specialization' },
  { id: 'perks', label: '2. Starting Perks' },
  { id: 'overview', label: '3. Overview' },
];

export function App() {
  const { state, dispatch, dismissNotice, dismissAllNotices, character, registry } = useBuilder();
  const [screen, setScreenRaw] = useState<Screen>('spec');
  const [blocked, setBlocked] = useState<{ msg: string; profileId: string | null } | null>(null);
  const blockedMsg = blocked?.msg ?? null;
  const setBlockedMsg = (msg: string | null) => setBlocked(msg ? { msg, profileId: state.store.activeProfileId } : null);
  const activeId = state.store.activeProfileId;
  // Stale-banner fix: the "cannot open Overview" message is cleared when the active profile
  // changes or the build becomes valid, so it never describes a different build.
  useEffect(() => {
    if (blocked && shouldClearBlockedBanner(blocked.profileId, activeId, character.valid)) setBlocked(null);
  }, [blocked, activeId, character.valid]);
  const continueBlocked = blockedMsg !== null;
  // Continue gating: like the game, the Overview can only be reached with a valid build.
  const setScreen = (next: Screen) => {
    const r = navigate(next, character.violations);
    setBlockedMsg(r.message);
    setScreenRaw(r.screen);
  };
  return (
    <div className="app">
      <header className="top">
        <h1><img src="/favicon.svg" alt="" width="24" height="24" className="logo" /> Probably Stolen Calculator</h1>
        <p className="muted small">Unofficial fan tool · Character Builder · game data {registry.gameVersion} (data {registry.dataVersion})</p>
        <nav aria-label="Builder steps">
          <ol className="steps">
            {STEPS.map((s) => {
              const locked = s.id === 'overview' && !character.valid;
              return (
                <li key={s.id}><button type="button" aria-current={screen === s.id ? 'step' : undefined} aria-disabled={locked || undefined}
                  title={locked ? 'Locked: the build is invalid. Click to see why.' : undefined}
                  className={`${screen === s.id ? 'active' : ''} ${locked ? 'step-locked' : ''}`} onClick={() => setScreen(s.id)}>{s.label}{locked ? ' 🔒' : ''}</button></li>
              );
            })}
          </ol>
        </nav>
      </header>
      <div aria-live="assertive" role="alert" className="live-region">
        {blockedMsg && !character.valid && (
          <div className="callout error" data-testid="blocked-msg">{blockedMsg} <button type="button" className="link" onClick={() => setBlocked(null)}>Dismiss</button></div>
        )}
      </div>
      {state.notices.length > 0 && <Notices notices={state.notices} onDismiss={dismissNotice} onDismissAll={dismissAllNotices} />}
      <div className="layout">
        <main>
          {screen === 'spec' && <SpecializationScreen reg={registry} build={state.build} dispatch={dispatch} onNext={() => setScreen('perks')} />}
          {screen === 'perks' && <PerksScreen reg={registry} state={state} dispatch={dispatch} onBack={() => setScreen('spec')} onNext={() => setScreen('overview')} continueBlocked={continueBlocked} />}
          {screen === 'overview' && <OverviewScreen reg={registry} c={character} onBack={() => setScreen('perks')} onFix={(sc) => setScreen(sc)} />}
        </main>
        <div className="side">
          <ProfilesPanel state={state} dispatch={dispatch} />
          {/* Reserved layout region for a possible future ad slot. Intentionally empty: no scripts, no trackers. */}
          <div className="reserved-slot" aria-hidden="true" data-reserved="future-ad-slot" />
        </div>
      </div>
      <footer className="small muted">
        Not affiliated with the developers of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See docs/RESEARCH.md.
      </footer>
    </div>
  );
}

function Notices({ notices, onDismiss, onDismissAll }: { notices: AppState['notices']; onDismiss: (i: number) => void; onDismissAll: () => void }) {
  const [open, setOpen] = useState(notices.length <= 2);
  const errors = notices.filter((n) => n.level === 'error').length;
  const warnings = notices.filter((n) => n.level === 'warning').length;
  const summary = `${notices.length} notice${notices.length === 1 ? '' : 's'}${errors ? ` · ${errors} error${errors === 1 ? '' : 's'}` : ''}${warnings ? ` · ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}`;
  return (
    <div className={`notices callout ${errors ? 'error' : warnings ? 'warn' : ''}`} role="status">
      <div className="notice-summary">
        <button type="button" className="link" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '▾' : '▸'} {summary}</button>
        <button type="button" className="link" onClick={onDismissAll}>Dismiss all</button>
      </div>
      {open && (
        <ul className="plain notice-list">
          {notices.map((n, i) => (
            <li key={i} className={`notice ${n.level}`}>{n.message} <button type="button" className="link" onClick={() => onDismiss(i)} aria-label="Dismiss notice">Dismiss</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
