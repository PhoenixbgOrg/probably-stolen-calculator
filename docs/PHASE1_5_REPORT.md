# Phase 1.5 report: final Character Builder UI

Scope: a UI pass only. Game rules, data values, the localStorage schema (v2) and the JSON profile format are unchanged.
`DATA_VERSION` was bumped to `2026-11-05.4` only because the `order` and `ordering` metadata were added. Nothing was rebuilt and no new npm dependencies were added.

## Changes per screen
- **Global:** original pixel theme, bundled OFL font, original SVG favicon (`public/favicon.svg`), step navigation,
  and click-to-open info tips (they work on touch too).
- **Specialization:** an ordered horizontal icon selector with Prev/Next arrows. Junker is shown but disabled. Roving keyboard focus.
  Details appear below: stat boxes, columns, and sources collapsed. The difficulty selector is kept.
- **Starting Perks:**
  - Ordered icon grid with colour plus marker.
  - Selected, conflict, unavailable and rule-breaking states.
  - A description panel with an explicit Add/Remove button and consequences.
  - A Selected Perks list with per-row Remove.
  - Sticky meters.
- **Overview:** compact summary, validity banner, perks, resource boxes and bonuses/penalties. The breakdown table and sources are in `<details>`.

## Bug fixes
- (a) The "Cannot open the Overview" banner no longer goes stale. It stores the profile id and clears when the profile changes
  or the build becomes valid (`shouldClearBlockedBanner`, in a `useEffect` in `App.tsx`).
- (b) Perk name and cost are now separate flex items with a gap and `white-space:nowrap` on the cost.
- (c) The Apprentice heading and badge sit in a wrapping `.title-row`.
- (d) A favicon was added.
- (e) Overflow: `min-width:0` on grid children, wrapping rows, `overflow-wrap:anywhere`, a mobile stacked table and an auto-fill perk grid.
- Reset Build is verified by a reducer test.
- The README no longer describes the old auto-removal cascade.

## Tests
There were 61 tests before this phase and 74 now, all passing. The new tests are in `tests/phase15.test.ts`:
- order completeness and uniqueness
- specialization order
- perk grouping
- ordering provenance
- the view/add/remove/blocked/invalid-add kinds
- reducer add/remove with no auto-removal
- Reset Build
- stale-banner clearing
- pixel-icon determinism

`npm run typecheck`, `npm test` and `npm run build` all pass.

Not done: no browser verification was performed in this phase. Use the tester checklist in the final report.

## Browser-test follow-up fixes
- **B1** Selected Perks chips: name has `min-width:8rem`; cost / "breaks a rule" wrap onto a line below; Remove wraps; chips use `minmax(min(100%,300px),1fr)`.
- **B2** Sticky meters: `html, body` used `overflow-x:hidden` (breaks `position:sticky`); now `overflow-x:clip` (hidden kept only as fallback). Meters are opaque full-width bar with `top:0` (there is no sticky header); details panel has `scroll-margin-top` so it is not covered.
- **B4** ⓘ buttons get a 44×44 hit area under `(pointer:coarse), (max-width:900px)`. The ~20×20 interactive element was the playthrough radio input (inside a 44px-tall label); radios are now 24px with padded labels.
- Specialization icons: one row (10 icons) at ≥1200px; wrap below.
- Tapping a perk icon (or a Selected Perks row) on ≤900px scrolls the details panel into view with `block:'nearest'` (instant when `prefers-reduced-motion`); focus stays on the icon.
- Startup "Profile … breaks N rule(s)" notices: shown only for the active profile; dismissal persisted in `psc.dismissedNotices.v1` (`{v:1, ids:["<profileId>|<signature>"]}`, max 200) — signature = violation codes + perk ids, so a changed problem shows again. Profile schema unchanged. `Notice` gained optional `profileId`/`signature`. Tests: `tests/notices.test.ts` (78 total).
