export function GameGuidePage() {
  return (
    <div className="panel">
      <h2 className="panel-title">Game Guide</h2>
      <p className="intro">
        Practical guides, tips, and verified game mechanics for Probably Stolen.
      </p>
      
      <div className="callout">
        <p><strong>Coming Soon</strong></p>
        <p>
          The Game Guide section is under construction. It will include practical advice for each profession,
          equipment explanations, buying locations, progression requirements, and gameplay tips.
        </p>
      </div>

      <h3 className="section-h">Planned Content</h3>
      <div className="detail-cols">
        <div>
          <h4>Equipment Guides</h4>
          <ul className="pix-list">
            <li>Where to buy each piece of equipment</li>
            <li>Equipment durability and maintenance</li>
            <li>Module placement and upgrades</li>
            <li>Cost-benefit analysis</li>
          </ul>
        </div>
        <div>
          <h4>Profession Progression</h4>
          <ul className="pix-list">
            <li>Early game setup strategies</li>
            <li>Mid-game scaling and optimization</li>
            <li>Advanced production techniques</li>
            <li>Common mistakes and troubleshooting</li>
          </ul>
        </div>
        <div>
          <h4>Game Mechanics</h4>
          <ul className="pix-list">
            <li>Reputation and faction systems</li>
            <li>Customer behavior and preferences</li>
            <li>Network upgrades and unlocks</li>
            <li>Difficulty modifiers explained</li>
          </ul>
        </div>
        <div>
          <h4>Resources</h4>
          <ul className="pix-list">
            <li>Material sources and availability</li>
            <li>Production efficiency tips</li>
            <li>Rent and cash flow management</li>
            <li>Risk vs. reward analysis</li>
          </ul>
        </div>
      </div>

      <p className="muted">
        All guides will be based on verified community research and game version {' '}
        <a href="#/sources">documented sources</a>. No speculation or unverified claims.
      </p>

      <div className="btn-row">
        <button type="button" onClick={() => window.location.hash = '#/'}>← Back to Home</button>
      </div>
    </div>
  );
}
