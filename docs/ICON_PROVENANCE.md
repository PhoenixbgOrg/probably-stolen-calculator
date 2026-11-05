# Icon Provenance and Design Documentation

## Overview

All icons in the Probably Stolen Calculator are **original pixel art** created specifically for this project. No game assets were extracted, copied, traced, or reproduced. The visual design is inspired by general retro pixel art conventions, not by any specific game artwork.

## Design Methodology

### Visual References

**Available game references consulted**:
- Official Steam store screenshots for Probably Stolen (appid 4348910), notably the Starting Perks screen from build 052A, were reviewed to understand the pixel art style and visual language (as documented in `docs/UI_REFERENCE.md`)
- User-reported 100-REV6 menu screenshots (referenced in `docs/RESEARCH.md`) provided insight into specialization menu layout
- Community wiki screenshots were reviewed for general understanding of game UI themes
- Existing repository screenshots (`docs/screenshots/`) showing the calculator's own interface design

**How references were used**:
- High-level style inspiration: pixel art aesthetic, color tone, compact icon approach
- General visual language understanding: how the game presents information
- NO copying, tracing, or reproduction of specific game icons or artwork
- NO extraction or redistribution of proprietary game assets
- All icons independently drawn as original interpretations

**Result**: All icons are independently created, original pixel art inspired by general retro gaming visual conventions and informed by the observed aesthetic, but not copying any specific game artwork.

### Design Principles

1. **Recognizable Silhouettes**: Each icon is designed as a compact, recognizable silhouette representing its gameplay mechanic
2. **9x9 Pixel Grid**: All icons use a consistent 9x9 grid for uniform sizing and crisp rendering
3. **Mechanic-Based Design**: Each icon's visual concept directly reflects the verified gameplay effect documented in the game data
4. **Visual Consistency**: Restrained color palettes (applied via CSS classes), consistent line weights, crisp edges
5. **Accessibility**: Every icon includes descriptive tooltips and accessible labels; category is conveyed through both color and non-color markers (+, −, ◆)

## Icon Coverage

### Profession Icons (9 playable + 1 WIP)

All 10 specialization icons have been designed:

| ID | Name | Visual Concept | Mechanic Represented |
|----|------|----------------|----------------------|
| `chemist` | Chemist | Laboratory flask/beaker with liquid | Chemistry equipment and chemical production |
| `water-merchant` | Water Merchant | Water bottle or water drop | Water testing, purification and trading |
| `hydroponic-farmer` | Hydroponic Farmer | Plant/seedling in hydroponic setup | Hydroponic farming and crop production |
| `aquafarmer` | Aquafarmer | Fish silhouette | Aquaculture systems and fish farming |
| `rat-wrangler` | Rat Wrangler | Rat silhouette | Rat breeding and livestock management |
| `gunsmith` | Gunsmith | Firearm/pistol silhouette | Weapon permits, firearms and ammunition |
| `fence` | Fence | Hidden/smuggled goods box with contraband marker | Contraband trading and black market access |
| `apprentice` | Apprentice | Storage box/crate (general merchant) | General stock and storage, no specialization |
| `rock-bottom` | Rock Bottom | Empty/broken container showing hardship | No starting credits, stock or equipment |
| `junker` | Junker | Scrap/salvage pile (work in progress) | Not yet implemented in game |

### Perk Icons (48 total)

All 48 perk icons have been designed, covering:
- **20 Positive Perks**: diplomatic, intimidating, vending-machine, vigilant, well-connected, working-pipes, handy, lucky, model-citizen, proficient-scavenger, revolution-sympathizer, savings, sawyers-crew, secret-admirer, short-sleeper, sycophant, tapehead, tinkerer, welfare-program, wilds-favorite
- **3 Neutral Perks**: aug-menace, colorful-character, makeshift-reactor, careful-scavenger, hoarder, prime-real-estate
- **25 Negative Perks**: ascetic, awful-negotiator, sentinel-collapse-disorder, blabbermouth, blackmail, known-snitch, maimed, minimalist, public-enemy, agoraphobia, alcohol-addiction, bad-lease, banned-from-the-commissary, convict, degenerative-osteoarthritis, gambling-addiction, illiterate, narcotic-addiction, nicotine-addiction, on-wilds-bad-side, side-street, unlucky

Each icon is mapped to its verified gameplay effect from `src/data/perks.ts`. Full concept descriptions are in `src/ui/IconConcepts.tsx`.

## Technical Implementation

### Files

- `src/ui/ImprovedPixelIcon.tsx` - Main icon rendering component with hand-drawn pixel art for each ID
- `src/ui/IconConcepts.tsx` - Concept descriptions, accessible labels, tooltips, and mechanic mappings
- `src/ui/styles.css` - Color palettes and styling via `.picon-positive`, `.picon-negative`, `.picon-neutral`, `.picon-spec`, `.picon-disabled`

### Accessibility Features

1. **Tooltips**: Every icon has a descriptive tooltip via `title` attribute
2. **Aria Labels**: Semantic labels via `aria-label` for screen readers
3. **Category Markers**: Non-color visual markers (+, −, ◆) supplement color coding
4. **Keyboard Navigation**: All interactive icons support keyboard navigation

## Verification

Icon coverage has been verified against the complete game data registry:
- All 9 playable professions: ✓
- Junker (WIP): ✓
- All 48 perks: ✓

See `src/ui/IconConcepts.tsx` for the `validateIconCoverage()` function used to verify complete coverage.

## No External Assets

This project uses no external icon libraries, sprite sheets, or game assets. All icons are:
- Hand-drawn using code
- Original to this project
- Inspired by general pixel art conventions, not specific copyrighted artwork
- Independently created to represent documented gameplay mechanics

## License

All original icons in this project are part of the project's codebase and follow the project's license. The OFL-licensed Pixelify Sans font used for text is documented in `public/fonts/OFL.txt`.

## References

**Game visual references** (high-level style inspiration only, no artwork reproduction):
- Official Steam store screenshots for Probably Stolen (appid 4348910), specifically Starting Perks screen from build 052A (as noted in `docs/UI_REFERENCE.md`)
- User-reported 100-REV6 screenshots (referenced in `docs/RESEARCH.md`)
- Community wiki screenshots for general UI understanding
- Existing calculator screenshots in `docs/screenshots/`

**Gameplay mechanics** (all represented icons reflect verified data):
- All perk effects and specialization mechanics documented with sources in `src/data/perks.ts` and `src/data/specializations.ts`
- See `docs/RESEARCH.md` for complete source provenance

**Visual design approach**:
- Observed pixel art aesthetic from game references
- General retro pixel art design principles
- Independent interpretation and original artwork creation
- No copying, tracing, or extraction of game assets
