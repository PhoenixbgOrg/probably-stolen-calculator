import { ImprovedPixelIcon } from './ImprovedPixelIcon';

/**
 * Nine playable professions in game start-screen order.
 * Junker excluded (WIP in game, not selectable).
 */
const PROFESSIONS = [
  { id: 'chemist', name: 'Chemist', tag: 'Advanced Start' },
  { id: 'water-merchant', name: 'Water Merchant', tag: null },
  { id: 'hydroponic-farmer', name: 'Hydroponic Farmer', tag: 'Advanced Start' },
  { id: 'aquafarmer', name: 'Aquafarmer', tag: 'Advanced Start' },
  { id: 'rat-wrangler', name: 'Rat Wrangler', tag: 'Advanced Start' },
  { id: 'gunsmith', name: 'Gunsmith', tag: 'Advanced Start' },
  { id: 'fence', name: 'Fence', tag: null },
  { id: 'apprentice', name: 'Apprentice', tag: 'Recommended For New Players' },
  { id: 'rock-bottom', name: 'Rock Bottom', tag: 'Extreme Challenge Mode' },
] as const;

export function HomePage() {
  return (
    <div className="panel">
      <h2 className="panel-title">Probably Stolen Calculator</h2>
      <p className="intro">
        Unofficial fan tool for production economics, character builds and game mechanics.
        <br />
        Select a profession calculator to begin.
      </p>
      <div className="profession-grid">
        {PROFESSIONS.map((prof) => (
          <a
            key={prof.id}
            href={`#/calculators/${prof.id}`}
            className="profession-card"
            aria-label={`${prof.name} calculator${prof.tag ? ` (${prof.tag})` : ''}`}
          >
            <ImprovedPixelIcon id={prof.id} tone="spec" size={64} showTooltip={false} />
            <div className="profession-card-text">
              <div className="profession-name">{prof.name}</div>
              {prof.tag && <div className="profession-tag">{prof.tag}</div>}
            </div>
          </a>
        ))}
      </div>
      <div className="home-callout">
        <p>
          <strong>New to the game?</strong> Start with the <a href="#/character-builder">Character Builder</a> to plan your specialization and starting perks.
        </p>
        <p className="muted small">
          All calculators preserve existing game data accuracy standards. Values come from verified community sources; see <a href="#/sources">Sources &amp; Credits</a>.
        </p>
      </div>
    </div>
  );
}
