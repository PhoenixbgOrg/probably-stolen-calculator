# Probably Stolen Calculator (unofficial) – Phase 1.5: Character Builder

Free, unofficial, English-only fan tool for the game *Probably Stolen*. Phase 1 covers only the Character Builder:
**Specialization → Starting Perks → Character Overview**. Not affiliated with the game's developers.

## Run
```bash
npm install
npm run dev        # http://localhost:5173/
```
Other scripts: `npm run typecheck`, `npm test`, `npm run build` (outputs `dist/`), `npm run export-data` (regenerates `data/game-data.json`).

## Architecture
| Layer | Path | Notes |
|---|---|---|
| Data registry | `src/data/` | Every record has `sources[]`, `gameVersion`, `status`. Unknown values are `null`. |
| Rules / engine | `src/engine/perkEngine.ts` | Points, slots, exclusions, prerequisites, first-run lock, cascade, normalization. Pure functions. |
| Calculation | `src/engine/character.ts` | `buildCharacter()` → `CharacterConfig`; `createModifierQuery()` for future calculators. |
| Extensions | `src/extensions/calculator.ts` | `CalculatorModule` contract (no calculators in Phase 1). |
| Persistence | `src/persistence/` | Versioned schema (v2), migrations (v1→v2), validation, quarantine, import/export. |
| State | `src/state/` | One reducer; all screens derive from `state.build`. |
| UI | `src/ui/` | React components only render and dispatch; no game formulas. |

### Selection rules (no auto-removal)
Like the game, perks are never removed automatically. Adding a perk that exceeds points/slots or conflicts with a
selected perk is allowed but makes the build invalid; `validate()` lists every problem with a fix, the offending perks
are highlighted, and Continue / the Overview stay locked until the build is valid. Only on a first playthrough is adding
blocked outright (`addBlockers`). Unknown perk ids from old saves are kept and shown with a "Remove unknown perk" button.

### UI (Phase 1.5)
Pixel-style original theme (bundled OFL font *Pixelify Sans* in `public/fonts/`, original pixel icons generated in
`src/ui/PixelIcon.tsx`, no game artwork). Screens:
- **Specialization** – horizontal icon selector in documented start-screen order (`order` field; Junker shown disabled),
  Prev/Next arrows, keyboard roving focus, details panel below, difficulty selector.
- **Starting Perks** – ordered icon grid (category = colour bar + marker +/◆/−). Tapping a perk only *shows* its
  description panel (cost, effects, requirements, conflicts, consequences); the explicit **Add perk / Remove perk**
  button changes the build. Separate "Selected Perks" list; points and x/limit meters are sticky.
- **Overview** – compact summary, validity banner, perks, resources; breakdown and sources collapsed in `<details>`.
Display order provenance is in `REGISTRY.ordering` (see `docs/UI_REFERENCE.md`).

### Storage
localStorage key `psc.profiles`. Unreadable data is moved to quarantine (in-store list + `psc.quarantine.<ts>` backup key), shown in the Profiles panel with Download/Discard; never silently dropped.

## Data accuracy
See `docs/RESEARCH.md`, `docs/UI_REFERENCE.md` and `docs/PHASE1_5_REPORT.md`. Badges in the UI show verified / partially verified / unverified / conflicting.

No ads, trackers, consent managers or donation integrations are included. One empty layout region (`data-reserved="future-ad-slot"`) is reserved.
