# Final desktop preparation (2026-11-05)

The Phase 1.5 look is the baseline. Calculations, selection rules, profiles, localStorage keys and the JSON format are unchanged.

## Changes
- **Links bar (header, every screen):** Get the Game (Steam store page), Game Wiki and Technical Wiki (both community fan sites, open in a new tab with `rel="noopener noreferrer"`), Sources & Credits (`#/sources`), and "GitHub (coming soon)". The GitHub entry is disabled with a title until `GITHUB_REPO_URL` is set in `src/config.ts`. The footer disclaimer also links to Sources & Credits.
- **Sources & Credits (`src/ui/SourcesScreen.tsx`, data in `src/data/credits.ts`):**
  - Every registry source, with a link, publisher, kind (official store page / community / user report), game version, which data areas cite it (computed from the registry), notes, caveat and snapshot files.
  - The pages that were consulted but are not cited by any value.
  - The unofficial-project disclaimer, the target version 100-REV6, and the Pixelify Sans OFL credit with a link to the licence text.
  - `tests/credits.test.ts` checks this page data against the data registry, `docs/sources/` and `docs/RESEARCH.md`.
- **Hash routing** (`pageFromHash` in `src/state/navigation.ts`) works with the back button, refresh and deep links, without a router dependency or a 404.html.
- **GitHub Pages:**
  - `vite.config.ts` reads `base` from `VITE_BASE_PATH` (default `./`).
  - `index.html` uses `%BASE_URL%favicon.svg`.
  - The font moved to `src/ui/fonts/` and is bundled through a relative CSS `url()`.
  - The logo and OFL link use `publicUrl()`.
  - The workflow `.github/workflows/deploy-pages.yml` is prepared but inactive until a repository exists.
  - The README has deployment instructions.
- **Readability:** secondary text is at least 13px, badges and icon labels at least 12px, muted text is lighter (#bdb5c9), and small text has a larger line height. Pixel icon sizes are unchanged.

## Verification (no browser used)
- `npm run typecheck`, `npm test` (86 passing) and `npm run build` (relative `./` asset URLs) all pass.
- `VITE_BASE_PATH=/probably-stolen-calculator/ npx vite build --outDir /tmp/ghpages-sim/probably-stolen-calculator` was served with `python3 -m http.server 4173` from `/tmp/ghpages-sim`.
  - With curl, these return 200: index, the JS and CSS bundles, the font, the favicon and OFL.txt.
  - `/favicon.svg` at the server root returns 404, which shows that nothing is loaded from outside the sub-path.
  - The built HTML, CSS and JS only reference `/probably-stolen-calculator/…`.
