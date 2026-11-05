# Phase 1 Report – Probably Stolen Calculator (Character Builder)

## 1. Functionality
- **Specialization screen**: 9 playable specializations, difficulty selector (4), credits/rent with status badges + source tooltips.
- **Starting Perks screen**: 48 perks grouped positive/neutral/negative; live points (3 base + granted) and slots (4 base + Colorful Character +3); every blocked perk shows its reason(s) (points, slots, exclusion, prerequisite, first-run lock, unknown cost); preview of cascade removals; first-playthrough mode (locks perks).
- **Overview**: derived from one state – credits, rent, inventory width, searches/day, reputation (only where sourced), modifiers, flags, warnings, starting kit. Reusable `CharacterConfig` + `ModifierQuery` + `CalculatorModule` contract for future calculators.
- **Profiles**: autosave, new, rename, duplicate, delete, reset build, JSON export (active/all), validated import; schema v2 with v1→v2 migration; re-validation on load/import; quarantine of unreadable data (download/discard, never silent).
- Dark responsive UI, keyboard-accessible buttons/tooltips, an empty reserved region for later. No ads, trackers or donation code.

## 2. Directory
`/workspace/probably-stolen-calculator` (local git only, 1 commit; no remote).

## 3. Start
```
npm install
npm run dev   # http://localhost:5173/
```

## 4. Verification
- `npm run typecheck` (tsc strict + noUncheckedIndexedAccess): 0 errors.
- `npm test` (Vitest): **41 tests, 3 files, all passing.** These cover the registry, points, invalid combinations, prerequisites, slots, Colorful Character, cascade, normalization, character derivation, save/load, quarantine, migrations, import/export validation, the reducer, and data-JSON sync.
- `npm run build`: success.
- Dev server: started in the background, and curl returned HTTP 200 for `/`, `/src/main.tsx` and `/src/ui/App.tsx`.
- **No browser/visual testing was done.** Verification was by type-check, unit tests, build and HTTP only.

## 5. Mechanics status
- Verified: 3 base points, 4 slots.
- Partially verified: most perk costs (2–3 sources), negative perks grant points, Colorful Character +3 slots, first-run lock, 4 difficulties, Rock Bottom 0 credits, usual rent 200, 3 exclusion pairs.
- Unverified: most specialization credits/rent, 7 exclusion pairs, perk effect magnitudes/descriptions, baseline inventory 24×10 and 5 searches.
- Conflicting: Intimidating, Model Citizen, Minimalist, Apprentice credits (null), Colorful Character wording/category.
- Details: `docs/RESEARCH.md`.

## 6. Sources
probablystolen-wiki.wiki (several pages), walkthroughforge.com (perks, specializations), probablystolendb.wiki, probablystolen.vi.ki, gamers.wiki, cozygameguides.com (pre-1.0), the Steam store page, and user-reported 100-REV6 screenshots (not seen). Snapshots are in `docs/sources/`.

## 7. Limitations
- Nothing was checked in-game.
- Screenshots were not available.
- Specialization numbers mostly come from a single source.
- Reputation is shown only where it was reported.
- Effect magnitudes are not used in any calculation beyond the Overview.
- No browser E2E tests.
- Phase 2+ calculators are not started (by design).

## Verification pass (2026-11-05)

Scope: data cross-check against nicokobo (0.46D) and difficulty guides, plus a perk-behaviour fix. Phase 2 was not started. There was no push or deploy, and no ads were added.

**Behaviour**

- The rules engine no longer auto-removes or cascades. `togglePerk` is a pure toggle. `validate(reg, build)` returns violations, each with a code, message, perkIds and fix.
- Builds may be temporarily invalid. Offending perks are highlighted in red. Negative or over-limit points and slots are shown in red.
- "Continue: Overview" and the step nav are gated by validity through `src/state/navigation.ts`. A blocked attempt shows an explanation.
- The Overview shows a validation status. An invalid build gets a prominent red banner.
- On a first playthrough, adding perks is blocked (the game disables the panel). Removing perks is always allowed. Switching playthrough no longer strips perks.
- Load and import keep perks exactly as saved, including unknown ids, and report every rule break.
- Junker is shown as a disabled "Work in Progress" card with no stats. It cannot be selected. A stored or imported Junker build has its specialization cleared, its perks kept, and a warning shown.
- Schema stays v2. v1 and v2 data load, and no migration change was needed.

**Data**

- See "Verification pass" in docs/RESEARCH.md for the comparison table and remaining conflicts.
- `DATA_VERSION` is now 2026-11-05.2, and data/game-data.json was regenerated.

**Checks**

- typecheck: OK.
- 53 tests pass. They cover points, conflicts, slots, Colorful Character, prerequisites, Junker, invalid builds surviving save/load/import, v1 migration and Continue gating.
- build: OK.
- Dev server: `npm run dev`, which runs `vite --host 0.0.0.0 --port 5173 --strictPort`.
