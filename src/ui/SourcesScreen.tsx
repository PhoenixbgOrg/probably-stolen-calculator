import type { GameDataRegistry } from '../data/types';
import { CONSULTED_ONLY, creditEntries, TARGET_GAME_VERSION } from '../data/credits';
import { OWNER_NAME, OWNER_PROJECTS, publicUrl } from '../config';

export function SourcesScreen({ reg }: { reg: GameDataRegistry }) {
  const entries = creditEntries(reg);
  return (
    <section className="panel sources-page" aria-labelledby="src-h">
      <h2 id="src-h" className="panel-title">Sources &amp; Credits</h2>
      <div className="callout disclaimer" role="note">
        <strong>Unofficial fan project.</strong> Probably Stolen Calculator is not affiliated with, endorsed by or connected to the
        developers or publisher of <em>Probably Stolen</em>. The game name and trademarks belong to their respective owners. No game
        assets (artwork, icons, fonts, audio) are used; all icons are original. Data comes from fan-made community sources and the
        game's store page; it may be outdated, incomplete or wrong.
        <p className="small">Made by {OWNER_NAME}. Other projects by the same owner (not research sources):{' '}
          {OWNER_PROJECTS.map((l, i) => <span key={l.url}>{i > 0 && ' · '}<a href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a></span>)}.</p>
      </div>
      <p className="small">Target game version: <strong>{TARGET_GAME_VERSION}</strong>. Data version {reg.dataVersion}. Each value in the
        builder keeps its own source references and a confidence badge (verified / partially verified / unverified / conflicting).
        Snapshot copies of the pages are kept in the project under <code>docs/sources/</code>; research notes are in <code>docs/RESEARCH.md</code>.</p>
      <h3 className="section-h">Research sources ({entries.length})</h3>
      <ul className="credit-list" data-testid="credit-list">
        {entries.map((e) => (
          <li key={e.source.id} id={`src-${e.source.id}`} className={`credit kind-${e.kind}`}>
            <div className="credit-head">
              {e.source.url ? <a href={e.source.url} target="_blank" rel="noopener noreferrer">{e.source.title}</a> : <strong>{e.source.title}</strong>}
              <span className={`tag kind-tag kind-${e.kind}`}>{e.kindLabel}</span>
            </div>
            <dl className="credit-kv">
              <dt>Publisher</dt><dd>{e.source.publisher}</dd>
              <dt>Game version</dt><dd>{e.source.gameVersion ?? 'Not stated'}</dd>
              <dt>Used for</dt><dd>{e.usedFor.join('; ')}</dd>
              <dt>Accessed</dt><dd>{e.source.accessed}</dd>
              {e.source.notes && (<><dt>Notes</dt><dd>{e.source.notes}</dd></>)}
              <dt>Caveat</dt><dd>{e.caveat}</dd>
              {e.snapshots.length > 0 && (<><dt>Snapshot</dt><dd><code>{e.snapshots.map((f) => `docs/sources/${f}`).join(', ')}</code></dd></>)}
              <dt>Source id</dt><dd><code>{e.source.id}</code></dd>
            </dl>
          </li>
        ))}
      </ul>
      <h3 className="section-h">Also consulted (not cited by current values)</h3>
      <ul className="pix-list">
        {CONSULTED_ONLY.map((c) => (
          <li key={c.file}><a href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a> · {c.publisher} · community / fan-made{c.gameVersion ? ` · ${c.gameVersion}` : ''} · <code>docs/sources/{c.file}</code></li>
        ))}
      </ul>
      <h3 className="section-h">Credits</h3>
      <ul className="pix-list">
        <li>Font: <strong>Pixelify Sans</strong> © 2021 The Pixelify Sans Project Authors (<a href="https://github.com/eifetx/Pixelify-Sans" target="_blank" rel="noopener noreferrer">github.com/eifetx/Pixelify-Sans</a>), licensed under the SIL Open Font License 1.1 (bundled; <a href={publicUrl('fonts/OFL.txt')} target="_blank" rel="noopener noreferrer">license text</a>).</li>
        <li>Pixel icons and favicon: original, generated for this project.</li>
        <li>Thanks to the community wiki and guide authors listed above.</li>
      </ul>
      <div className="nav-row"><a className="pix-btn link-btn" href="#/">◀ Back to the Character Builder</a></div>
    </section>
  );
}
