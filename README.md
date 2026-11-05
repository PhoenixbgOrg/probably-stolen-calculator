# Probably Stolen Calculator (unofficial) – Phase 1: Character Builder

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

### Cascade rule (deterministic)
After a deselect, playthrough change, load or import, `normalizeSelection` runs:
1. drop unknown/duplicate/no-cost ids; 2. first playthrough → drop all; 3. exclusive pairs keep the earlier pick;
4. drop perks with missing prerequisites; 5. while slots exceeded drop the most recent perk; 6. while points < 0 drop the most recent paid perk. Every removal is reported with a reason.

### Storage
localStorage key `psc.profiles`. Unreadable data is moved to quarantine (in-store list + `psc.quarantine.<ts>` backup key), shown in the Profiles panel with Download/Discard; never silently dropped.

## Data accuracy
See `docs/RESEARCH.md`. Badges in the UI show verified / partially verified / unverified / conflicting.

No ads, trackers, consent managers or donation integrations are included. One empty layout region (`data-reserved="future-ad-slot"`) is reserved.
