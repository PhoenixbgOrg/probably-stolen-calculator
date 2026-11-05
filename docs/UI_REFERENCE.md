# UI reference (Phase 1.5)

The look *references* the game's menus. It does not copy them. No game artwork, icons or fonts are included. The reference
images (official Steam store screenshots for appid 4348910, notably the Starting Perks screen from build 052A) were only
looked at and are **not** stored in this repository.

## Visual language taken from the game screenshots
| Element | Game (observed) | This tool |
|---|---|---|
| Panels | Dark purple panel (~#292234) | `--panel #292234`, page `--bg #1d1826` |
| Title bars / borders | Muted turquoise title bar (~#83a59b) | `.panel-title` background `#83a59b`; borders `#83a59b` / `#4f6660` |
| Corners | Square, pixel-stepped | `border-radius:0`, layered `box-shadow` steps |
| Perk categories | Green = positive, orange = neutral, red = negative | Colour bar plus a text marker (+ ◆ −), so colour is not the only cue |
| Perk grid | Icon grid in positive → neutral → negative order; selected icons dimmed; separate "SELECTED PERKS" row | Same structure; selected icons dimmed and ticked |
| Meters | "Available Perk Points" and "Perks x/7" boxes | Same labels, sticky at the top of the perks panel |
| Typography | Pixel headings, plain body text | *Pixelify Sans* (SIL OFL 1.1, `public/fonts/`) for headings and labels; system sans for body text |

## Ordering
`order` (1-based) lives on every `SpecializationDef` and `PerkDef`. Its provenance is recorded in `REGISTRY.ordering`:
- **Specializations:** partially verified. Walkthrough Forge's "start screen order" and the nicokobo occupations table agree:
  Apprentice, Water Merchant, Fence, Rock Bottom, Hydroponic Farmer, Gunsmith, Chemist, Rat Wrangler, Aquafarmer, Junker (WIP, disabled).
- **Perks:** unverified. The category grouping comes from the 052A screenshot. The order within each group follows the community tables.
  The UI shows this status under the grid.

## Interaction model (Starting Perks)
1. Tapping or clicking an icon only **views** the perk. The build does not change.
2. The description panel shows the name, category, cost, description, effects, requirements, conflicts, consequences and sources.
3. One explicit button changes the build:
   - **Add perk**
   - **Add perk anyway (build becomes invalid)**, with the reason
   - **Remove perk**
   - **Cannot add**, disabled, with the reason (first playthrough)
4. Perks are never auto-removed. Continue stays locked while `validate()` reports problems.
5. Keyboard: arrow keys, Home and End move through the grid and view the focused perk. Tab moves to the panel button.

Touch targets are at least 44 px. Layouts wrap at 375, 390 and 768 px with no horizontal scrolling.
