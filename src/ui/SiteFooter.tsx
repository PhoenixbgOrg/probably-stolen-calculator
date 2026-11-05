import { DONATIONS, GAME_LINKS, OWNER_NAME, OWNER_PROJECTS } from '../config';
import type { SiteLink } from '../config';

function LinkItem({ l }: { l: SiteLink }) {
  return l.external
    ? <a href={l.url} target="_blank" rel="noopener noreferrer" title={l.title}>{l.label}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>
    : <a href={l.url} title={l.title}>{l.label}</a>;
}

/** Slot for a future optional donation button. Renders nothing while disabled (no links, scripts or requests). */
export function DonationSlot({ config = DONATIONS }: { config?: typeof DONATIONS }) {
  if (!config.enabled || !config.url || !/^https:\/\//.test(config.url)) return null;
  return <div className="donation-slot"><a href={config.url} target="_blank" rel="noopener noreferrer">{config.label}</a></div>;
}

export function SiteFooter() {
  return (
    <div className="site-footer">
      <nav className="site-links" aria-labelledby="ft-game">
        <h2 id="ft-game" className="ft-h">Game &amp; Resources</h2>
        <ul>{GAME_LINKS.map((l) => <li key={l.url}><LinkItem l={l} /></li>)}</ul>
      </nav>
      <nav className="site-links" aria-labelledby="ft-more">
        <h2 id="ft-more" className="ft-h">More Projects by {OWNER_NAME}</h2>
        <ul>{OWNER_PROJECTS.map((l) => <li key={l.url}><LinkItem l={l} /></li>)}</ul>
      </nav>
      <DonationSlot />
    </div>
  );
}
