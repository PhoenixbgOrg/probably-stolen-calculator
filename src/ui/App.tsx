import { useState } from 'react';
import { navigate } from '../state/navigation';
import type { Screen } from '../state/navigation';
import { useBuilder } from '../state/useBuilder';
import { OverviewScreen } from './OverviewScreen';
import { PerksScreen } from './PerksScreen';
import { ProfilesPanel } from './ProfilesPanel';
import { SpecializationScreen } from './SpecializationScreen';

const STEPS: { id: Screen; label: string }[] = [
  { id: 'spec', label: '1. Specialization' },
  { id: 'perks', label: '2. Starting Perks' },
  { id: 'overview', label: '3. Overview' },
];

export function App() {
  const { state, dispatch, character, registry } = useBuilder();
  const [screen, setScreenRaw] = useState<Screen>('spec');
  const [continueBlocked, setContinueBlocked] = useState(false);
  // Continue gating: like the game, the Overview can only be reached with a valid build.
  const setScreen = (next: Screen) => {
    const r = navigate(next, character.valid, state.build.specializationId !== null);
    setContinueBlocked(r.blocked);
    setScreenRaw(r.screen);
  };
  return (
    <div className="app">
      <header className="top">
        <h1>Probably Stolen Calculator</h1>
        <p className="muted small">Unofficial fan tool · Character Builder · game data {registry.gameVersion} (data {registry.dataVersion})</p>
        <nav aria-label="Builder steps">
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.id}><button type="button" aria-current={screen === s.id ? 'step' : undefined} className={screen === s.id ? 'active' : ''} onClick={() => setScreen(s.id)}>{s.label}</button></li>
            ))}
          </ol>
        </nav>
      </header>
      {state.notices.length > 0 && (
        <div className="notices" role="status">
          {state.notices.map((n, i) => (
            <div key={i} className={`callout ${n.level === 'error' ? 'error' : n.level === 'warning' ? 'warn' : ''}`}>
              {n.message} <button type="button" className="link" onClick={() => dispatch({ type: 'dismissNotice', index: i })} aria-label="Dismiss notice">Dismiss</button>
            </div>
          ))}
        </div>
      )}
      <div className="layout">
        <main>
          {screen === 'spec' && continueBlocked && <div className="callout error" role="alert">Cannot open the Overview: {character.violations.map((v) => v.message).join(' ')}</div>}
          {screen === 'spec' && <SpecializationScreen reg={registry} build={state.build} dispatch={dispatch} onNext={() => setScreen('perks')} />}
          {screen === 'perks' && <PerksScreen reg={registry} state={state} dispatch={dispatch} onBack={() => setScreen('spec')} onNext={() => setScreen('overview')} continueBlocked={continueBlocked} />}
          {screen === 'overview' && <OverviewScreen reg={registry} c={character} onBack={() => setScreen('perks')} />}
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
