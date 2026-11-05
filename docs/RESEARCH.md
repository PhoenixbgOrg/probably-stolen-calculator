# Research notes – Probably Stolen Character Builder (Phase 1)

Research date: 2026-11-05. Target: game 1.0.x (Steam release 2026-10-28; user build label 100-REV6).
Machine-readable data: `data/game-data.json` (generated from `src/data/*` via `npm run export-data`; a test checks it is in sync).
Raw source snapshots: `docs/sources/*.txt`.

## Status policy
| Status | Meaning |
|---|---|
| verified | User-reported 100-REV6 screenshot content **and** ≥2 independent sources agree. Only core rules qualify. |
| partially-verified | ≥2 independent 1.0 community sources agree; not checked in-game by this project. |
| unverified | Single source only. |
| conflicting | Sources disagree. The 1.0-backed value is used (or `null` if no side is clearly current) and alternatives are recorded. |

Screenshots were **not** available to this project; their content (3 points, 4-perk limit, negatives grant points, exclusive perks, Colorful Character) is user-reported only.

## Sources
| id | Publisher | Version claimed | Notes |
|---|---|---|---|
| user-screenshots | Project owner (reported) | 100-REV6 | Not seen directly. |
| wiki-* | probablystolen-wiki.wiki (fan site) | mixed, partly pre-1.0 | Article-style; no per-perk pages; partly outdated. |
| wf-specializations / wf-perks | walkthroughforge.com | 1.0 (2026-10-28) | Most complete list: 48 perks, costs, effects, exclusions; specialization credits/rent. |
| psdb-perks | probablystolendb.wiki | 1.0.0.2 (2026-10-29) | Perk costs. |
| viki-perks | probablystolen.vi.ki | 1.0 | Positive-perk costs/categories. |
| gamers-scenarios | gamers.wiki | Steam build 26263409 | Specializations, difficulties, descriptions. |
| cozy-scenarios | cozygameguides.com | pre-1.0 (Update 049) | Older data; used only to document conflicts. |
| steam-store | Steam | – | Release date; no perk data. |

## Core rules
- 3 base perk points, 4 perk slots – **verified** (user report + WF + psdb).
- Negative perks grant points; every perk uses a slot – partially verified.
- Colorful Character: +3 slots, cost 1 – partially verified.
- Perks locked on first playthrough – partially verified (4 sources).
- 10 exclusion pairs (WF). Three are also supported by the wiki Gunsmith page (Maimed with Careful Scavenger, Degenerative Osteoarthritis and Proficient Scavenger) and count as partially verified. The others are unverified.
- No perk prerequisites documented for 1.0 (engine supports them anyway).

## Conflicts
| Item | Values | Used |
|---|---|---|
| Intimidating | 3 pts / 25% (wiki, pre-Update 049) vs 2 pts / 33% (1.0 sources) | 2, conflicting |
| Model Citizen | 20% vs 50% | 1.0 value, conflicting |
| Minimalist | −3 (wiki) vs −2 (WF/psdb) | −2, conflicting |
| Apprentice credits | 550 vs 400 | **null** + alternatives |
| Colorful Character | "extra perk points" (wiki scenarios) vs +3 slots (others); neutral (WF) vs positive (vi.ki) | +3 slots, neutral |
| Convict | wiki calls it a "background" | treated as negative perk |
| Gunsmith | wiki "gambling perk blocks guides" – matches Illiterate, not Gambling Addiction | note only |
| Gunsmith rent 250 | no "increased rent" bullet on start screen | unverified, noted |
| Purifier name | HydroTech vs HydraTech | noted |

## Specializations (9 playable)
Apprentice, Water Merchant, Fence, Rock Bottom, Hydroponic Farmer, Gunsmith, Chemist, Rat Wrangler, Aquafarmer. Starting credits/rent come mostly from a single source (WF) → unverified; Rock Bottom 0 credits partially verified. Not playable: Junker, Organ Dealer/Trader, Street Food Vendor (WIP); Moonshiner, Pharmacist (hidden).

## Baseline values (unverified)
Inventory 24×10 (inferred from Minimalist/Ascetic texts), 5 dumping-ground searches/day; usual rent 200 (partially verified).

## Not assumed
Old wiki data was **not** assumed to match 1.0; whenever it disagreed with 1.0-dated sources the disagreement is recorded above.
