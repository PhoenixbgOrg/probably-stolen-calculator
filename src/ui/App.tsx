import { useEffect, useState } from 'react';
import type { AppState } from '../state/reducer';
import { navigate, pageFromHash } from '../state/navigation';
import type { Page } from '../state/navigation';
import type { Screen } from '../state/navigation';
import { useBuilder } from '../state/useBuilder';
import { OverviewScreen } from './OverviewScreen';
import { PerksScreen } from './PerksScreen';
import { ProfilesPanel } from './ProfilesPanel';
import { SpecializationScreen } from './SpecializationScreen';
import { shouldClearBlockedBanner } from '../engine/perkView';
import { SourcesScreen } from './SourcesScreen';
import { HomePage } from './HomePage';
import { GameGuidePage } from './GameGuidePage';
import { ChemistProductionPlanner } from './ChemistProductionPlanner';
import { ProfessionCalculatorPage } from './ProfessionCalculatorPage';
import { getProfession } from '../calculators/professions';
import { publicUrl, SOURCES_ROUTE } from '../config';
import { SiteFooter } from './SiteFooter';

/** Hash routing (no router dependency). Works under any sub-path and on refresh. */
function useHashRoute(): { page: Page; param?: string } {
  const [route, setRoute] = useState<{ page: Page; param?: string }>(() => 
    typeof window === 'undefined' ? { page: 'home' } : pageFromHash(window.location.hash)
  );
  useEffect(() => {
    const on = () => { setRoute(pageFromHash(window.location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}


const STEPS: { id: Screen; label: string }[] = [
  { id: 'spec', label: '1. Specialization' },
  { id: 'perks', label: '2. Starting Perks' },
  { id: 'overview', label: '3. Overview' },
];

export function App() {
  const route = useHashRoute();
  const { state, dispatch, dismissNotice, dismissAllNotices, character, registry } = useBuilder();
  const [screen, setScreenRaw] = useState<Screen>('spec');
  const [blocked, setBlocked] = useState<{ msg: string; profileId: string | null } | null>(null);
  const blockedMsg = blocked?.msg ?? null;
  const setBlockedMsg = (msg: string | null) => setBlocked(msg ? { msg, profileId: state.store.activeProfileId } : null);
  const activeId = state.store.activeProfileId;
  
  useEffect(() => {
    if (blocked && shouldClearBlockedBanner(blocked.profileId, activeId, character.valid)) setBlocked(null);
  }, [blocked, activeId, character.valid]);
  
  const continueBlocked = blockedMsg !== null;
  const setScreen = (next: Screen) => {
    const r = navigate(next, character.violations);
    setBlockedMsg(r.message);
    setScreenRaw(r.screen);
  };
  
  const isBuilder = route.page === 'character-builder';
  const showBuilderNav = isBuilder;
  const showProfilePanel = isBuilder;
  
  return (
    <div className="app">
      <header className="top">
        <h1>
          <a href="#/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={publicUrl('favicon.svg')} alt="" width="24" height="24" className="logo" />
            Probably Stolen Calculator
          </a>
        </h1>
        <p className="muted small">Unofficial fan tool · game data {registry.gameVersion} (data {registry.dataVersion})</p>
        
        <nav aria-label="Main navigation" className="main-nav">
          <a href="#/" className={route.page === 'home' ? 'active' : ''}>Calculators</a>
          <a href="#/character-builder" className={route.page === 'character-builder' ? 'active' : ''}>Character Builder</a>
          <a href="#/game-guide" className={route.page === 'game-guide' ? 'active' : ''}>Game Guide</a>
          <a href={SOURCES_ROUTE} className={route.page === 'sources' ? 'active' : ''}>Sources & Credits</a>
        </nav>
        
        {showBuilderNav && (
          <nav aria-label="Builder steps">
            <ol className="steps">
              {STEPS.map((s) => {
                const locked = s.id === 'overview' && !character.valid;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-current={screen === s.id ? 'step' : undefined}
                      aria-disabled={locked || undefined}
                      title={locked ? 'Locked: the build is invalid. Click to see why.' : undefined}
                      className={`${screen === s.id ? 'active' : ''} ${locked ? 'step-locked' : ''}`}
                      onClick={() => setScreen(s.id)}
                    >
                      {s.label}{locked ? ' 🔒' : ''}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </header>
      
      <div aria-live="assertive" role="alert" className="live-region">
        {blockedMsg && !character.valid && (
          <div className="callout error" data-testid="blocked-msg">
            {blockedMsg} <button type="button" className="link" onClick={() => setBlocked(null)}>Dismiss</button>
          </div>
        )}
      </div>
      
      {state.notices.length > 0 && <Notices notices={state.notices} onDismiss={dismissNotice} onDismissAll={dismissAllNotices} />}
      
      <div className={showProfilePanel ? 'layout' : 'layout-single'}>
        <main>
          {route.page === 'home' && <HomePage />}
          {route.page === 'sources' && <SourcesScreen reg={registry} />}
          {route.page === 'game-guide' && <GameGuidePage />}
          {route.page === 'calculator' && route.param && (() => {
            const prof = getProfession(route.param);
            if (!prof) {
              return <div className="panel"><h2 className="panel-title">Unknown Calculator</h2><p>Calculator not found. <a href="#/">Return home</a></p></div>;
            }
            
            // Chemist now has functional Dream Dust calculator
            if (prof.id === 'chemist') {
              return <ChemistProductionPlanner />;
            }
            
            return <ProfessionCalculatorPage profession={prof} />;
          })()}
          {isBuilder && screen === 'spec' && <SpecializationScreen reg={registry} build={state.build} dispatch={dispatch} onNext={() => setScreen('perks')} />}
          {isBuilder && screen === 'perks' && <PerksScreen reg={registry} state={state} dispatch={dispatch} onBack={() => setScreen('spec')} onNext={() => setScreen('overview')} continueBlocked={continueBlocked} />}
          {isBuilder && screen === 'overview' && <OverviewScreen reg={registry} c={character} onBack={() => setScreen('perks')} onFix={(sc) => setScreen(sc)} />}
        </main>
        
        {showProfilePanel && (
          <div className="side">
            <ProfilesPanel state={state} dispatch={dispatch} />
            <div className="reserved-slot" aria-hidden="true" data-reserved="future-ad-slot" />
          </div>
        )}
      </div>
      
      <footer className="small muted">
        <SiteFooter />
        <p>Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See <a href={SOURCES_ROUTE}>Sources &amp; Credits</a>.</p>
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
