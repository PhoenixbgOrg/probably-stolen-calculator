# Probably Stolen Calculator (unofficial)

Free, unofficial, English-only fan tool for the game *Probably Stolen*. Not affiliated with the game's developers.

The app includes:

- **Character Builder** (`#/character-builder`): Specialization → Starting Perks → Character Overview. Profiles use `SCHEMA_VERSION=2` in `psc.profiles`.
- **Nine profession calculators** (`#/calculators/<id>`), including the **Chemist Dream Dust** materials-first wizard (`#/calculators/chemist`). Chemist session storage is schema 3 and is separate from character profiles.
- **Sources & Credits** (`#/sources`).

## Publication state

- **Live GitHub Pages** is the last successful deploy of `main`: https://phoenixbgorg.github.io/probably-stolen-calculator/
- Chemist wizard + original purpose-icon work on this branch is a **publication candidate**. It is not live until a coordinator merges to `main` and Pages deploys. Public desktop/mobile acceptance remains a coordinator step after that deploy.
- Game data target: `100-REV6` (1.0.x) as shown in owner screenshots. Wiki extraction formulas cite nicokobo 0.46D / Steam build 26337366. Source-version gaps stay labeled unknown.

## Run
```bash
npm install
npm run dev        # http://localhost:5173/
```
Other scripts: `npm run typecheck`, `npm test`, `npm run build` (outputs `dist/`), `npm run export-data` (regenerates `data/game-data.json`).

## Deployment (GitHub Pages)

Repository: https://github.com/PhoenixbgOrg/probably-stolen-calculator

The app is deployed as a static site. All URLs are base-aware and navigation uses the URL hash
(`#/` home, `#/character-builder` builder, `#/calculators/chemist` Dream Dust planner, `#/sources` Sources & Credits), so refresh and deep links work under any sub-path and **no 404.html fallback is needed**.

- **Base path:** `VITE_BASE_PATH` (default `./`, i.e. relative, works from any folder). For a project site use
  `VITE_BASE_PATH=/<repo-name>/ npm run build` (or `npx vite build --base /<repo-name>/`). For a user site or custom domain use `/`.
- **Owner steps:** create the repository → push → Settings → Pages → Source: *GitHub Actions*. The prepared workflow
  `.github/workflows/deploy-pages.yml` (npm ci → typecheck → test → build with `/<repo-name>/` → upload-pages-artifact → deploy-pages) runs on push to `main`.
- **Test locally with a simulated sub-path:**
  ```bash
  VITE_BASE_PATH=/probably-stolen-calculator/ npx vite build --outDir /tmp/ghpages-sim/probably-stolen-calculator --emptyOutDir
  cd /tmp/ghpages-sim && python3 -m http.server 4173
  # open http://localhost:4173/probably-stolen-calculator/ and .../#/sources
  ```
- **Saved data:** localStorage keys (`psc.profiles`, `psc.chemist-session`, `psc.quarantine.*`, `psc.dismissedNotices.v1`) do not include the path; browsers
  scope localStorage per origin, so all projects on the same `<owner>.github.io` origin share storage (keys are prefixed `psc.` to avoid clashes).
  Moving to a different origin (e.g. a custom domain) starts empty: use **Export all (JSON)** / **Import JSON** to move profiles.

## Architecture
| Layer | Path | Notes |
|---|---|---|
| Data registry | `src/data/` | Every record has `sources[]`, `gameVersion`, `status`. Unknown values are `null`. |
| Rules / engine | `src/engine/perkEngine.ts` | Points, slots, exclusions, prerequisites, first-run lock, cascade, normalization. Pure functions. |
| Calculation | `src/engine/character.ts` | `buildCharacter()` → `CharacterConfig`; `createModifierQuery()` for profession calculators. |
| Profession calculators | `src/calculators/` | Water/farm/gun/fence/etc. plus Chemist Dream Dust (`dreamDust*.ts`, `chemistWizard.ts`). |
| Persistence | `src/persistence/` | Character profiles schema v2; chemist session schema 3; quarantine; import/export. |
| State | `src/state/` | One reducer; builder screens derive from `state.build`. |
| UI | `src/ui/` | React components only render and dispatch; formulas live in calculators/engine. |
| Icons | `public/icons/` | Original 32×32 purpose-based SVG tiles from `scripts/generate-purpose-icons.mjs`. Mapping in `src/data/iconManifest.ts`. **Not game sprites.** |

### Selection rules (no auto-removal)
Like the game, perks are never removed automatically. Adding a perk that exceeds points/slots or conflicts with a
selected perk is allowed but makes the build invalid; `validate()` lists every problem with a fix, the offending perks
are highlighted, and Continue / the Overview stay locked until the build is valid. Only on a first playthrough is adding
blocked outright (`addBlockers`). Unknown perk ids from old saves are kept and shown with a "Remove unknown perk" button.

### UI
Pixel-style original theme (bundled OFL font *Pixelify Sans* in `public/fonts/`, original purpose-based icons in `public/icons/`, no game artwork). Screens:

- **Specialization** – horizontal icon selector in documented start-screen order (`order` field; Junker shown disabled),
  Prev/Next arrows, keyboard roving focus, details panel below, difficulty selector. Profession names sit beside the tiles.
- **Starting Perks** – ordered icon grid (category = colour bar + marker +/◆/−). Tapping a perk only *shows* its
  description panel (cost, effects, requirements, conflicts, consequences); the explicit **Add perk / Remove perk**
  button changes the build. Separate "Selected Perks" list; points and x/limit meters are sticky.
- **Overview** – compact summary, validity banner, perks, resources; breakdown and sources collapsed in `<details>`.
- **Chemist wizard** – Ground → Extraction → Acid/Base → Filter/Evap nights → Final Dust. Calculate+Continue gating; measurements are not silently labeled verified.

The footer has two link sections, **Game & Resources** (Steam store page, community wikis, Sources & Credits at `#/sources`, the GitHub repo) and **More Projects by PhoenixbgOrg**. All URLs are in `src/config.ts`, together with the disabled `DONATIONS` flag (the slot renders nothing; there is no PayPal code). Display order provenance is in `REGISTRY.ordering` (see `docs/UI_REFERENCE.md`). Icon provenance is in `docs/ICON_PROVENANCE.md`.

### Storage
localStorage key `psc.profiles` (character builder). Chemist wizard uses a separate session key and does not rewrite old profiles. Unreadable data is moved to quarantine (in-store list + `psc.quarantine.<ts>` backup key), shown in the Profiles panel with Download/Discard; never silently dropped.

## Data accuracy
See `docs/RESEARCH.md`, `docs/UI_REFERENCE.md`, `docs/PHASE1_5_REPORT.md`, and `docs/ICON_PROVENANCE.md`. Badges in the UI show verified / partially verified / unverified / conflicting.

No ads, trackers, consent managers or donation integrations are included. One empty layout region (`data-reserved="future-ad-slot"`) is reserved.
