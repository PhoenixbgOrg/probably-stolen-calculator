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

## Verification pass (2026-11-05): nicokobo cross-check

New sources (snapshots in `docs/sources/`):

- **nicokobo-occupations**: https://probably-stolen.nicokobo.com/en/collections/occupations
- **nicokobo-starting-perks**: https://probably-stolen.nicokobo.com/en/wiki/perks/starting-perks
- **nicokobo-game-modes**: the game-modes and endings article on the same site

All three nicokobo pages state that they cover **0.46D / Steam Build 26337366** and that they come from static analysis, not an in-game test. A site banner mentions a full-release update on 2026-10-29, but the articles themselves still say 0.46D, so they may predate 1.0.

Other new sources:

- **psdb-difficulty**: probablystolendb, covers 1.0.0.2.
- **allthings-difficulty**: allthings.how, a 1.0 walkthrough that quotes on-screen text.

The user's 100-REV6 screenshots were **not** available to this pass. Their content (3 points, 4 slots, temporary invalid selection, validation at Continue) is used as an unverified user report only.

### Data comparison

| Item | Previous (wf etc.) | nicokobo (0.46D) | Result / status |
|---|---|---|---|
| Roster | 9 playable | 9 available; Junker, Organ Dealer, Street Food Vendor = WIP; Moonshiner, Pharmacist = hidden | 9 playable plus **Junker shown disabled "Work in Progress"** (user report + nicokobo). Organ Dealer and Street Food Vendor are documented here only, because the user's 100-REV6 report names only Junker. |
| Apprentice credits | conflicting: 550 (wf) vs 400 (wiki-best-perks); shown as null | 550 | **550**, partially-verified. Supported by wf, nicokobo and allthings ("balance of 550 credits"). 400 is kept as an alternative and treated as outdated. |
| Credits and first rent, the other 8 specs | wf only, unverified | identical for all 8 | partially-verified |
| Rat Wrangler unlock | Ranching network upgrade | Retired Rat Wrangler access | **conflicting** |
| Water Merchant unlock | Water Trading network upgrade | Water-trader access | partially-verified (same thing, different wording) |
| Fence, Gunsmith, Chemist reputation | wf per-difficulty table | career inputs +30/−30, +25, −15 (no per-difficulty figures) | The Mark Up column is corroborated. Other difficulties are wf-only, so they stay unverified. |
| Chemist "Sector 13 Cartel faction" | wf | not mentioned (nicokobo adds that Cartel protection is unlocked, not free) | wf-only claim, noted |
| Starting inventories | wf | same items | partially-verified. Detail: Water Testing Kit holds 10 strips; 9 purification tablets; filter durability 400; RAS energy cells 50 kJ; 6 rats aged 5, 3 and 1 days. |
| Perk costs (48) | wf + psdb (+ viki) | all 48 identical | partially-verified (sources added) |
| Perk categories | wf | 20 positive / 22 negative / 6 neutral; "category is not determined by cost sign" | Partially-verified. Augmented Menace, Colorful Character and Makeshift Reactor stay conflicting: viki-perks says positive. |
| Exclusions (10 pairs) | wf, mostly unverified | same 10 pairs; a declaration on either side blocks the pair | partially-verified |
| Intimidating | wf 2 pts / 33% less; wiki 3 pts / 25% | 2, ×0.67 | Stays conflicting: 2 sources vs 1. Value used: 2 / 33%. |
| Model Citizen | wf 50%; wiki 20% (pre-Update 049) | ×1.5 | Stays conflicting. Value used: 50%. |
| Minimalist | wf/psdb −2; wiki −3 | −2, 20×10 | Stays conflicting. Value used: −2. |
| Colorful Character | +1, +3 slots, uses a slot | neutral, cost 1, one slot, limit 4→7 | Agrees. Dynamic slot limit kept. |
| Lucky / Unlucky | magnitude unknown | luck ±5 | Added as a modifier (value 5), **unverified** (single source). |
| Blackmail | fee unknown | 40 + current day, on days ≡1 mod 7 | Noted, unverified |
| Welfare Program | "160 food stamps" | 160 / 120 / 80 / 40 / 0 by adjusted wealth | Noted. The flat 160 is only the lowest-wealth tier. |
| Vigilant | "never robbed" | skips ordinary overnight burglary once insurance is unlocked | Nuance noted |
| Tapehead | all cassettes | 7 Pristine tracks | Nuance noted |
| Sawyer's Crew | Underground Exchange from start | after day-1 intro | Nuance noted |
| Other magnitudes (Blabbermouth, Diplomatic, Sycophant, Awful Negotiator, addictions, Prime Real Estate, Bad Lease, scavenger perks, Wild's, Tinkerer, Ascetic) | wf | identical | partially-verified |

### Difficulty and first-run rules

| Rule | Sources | Status |
|---|---|---|
| Difficulty names: **Price Gouge (Cozy Mode), Mark Up (Normal Mode), Thin Margins (Hard Mode), Red Ink (Challenge Mode)** | gamers-scenarios, wf, nicokobo-game-modes, psdb-difficulty, allthings-difficulty | partially-verified |
| Mark Up is the default | psdb-difficulty | unverified |
| Red Ink is on page 2 of the Difficulty screen | allthings-difficulty | unverified |
| Options: Skip Intro, Endless Mode ("Certain scripted events and customers will not spawn") | allthings, nicokobo | partially-verified. Recorded in data, not in the UI (no calculator uses them yet). |
| Flow: specialization → Starting Perks → Difficulty/options | nicokobo-starting-perks, allthings | partially-verified |
| First run: Starting Perks unavailable ("Starting Perks are not available on your first run"; "Available Perk Points: 3", "Perks: 0/4") | wf, psdb, viki, gamers, nicokobo, allthings | partially-verified |
| Selection may temporarily exceed limits; Continue validates | user report, nicokobo-starting-perks | partially-verified |
| First run: a non-Apprentice choice shows a confirmation prompt, then you may proceed | nicokobo-starting-perks | unverified (shown as unverified in the UI) |
| First run: Skip Intro shows a confirmation prompt | nicokobo-game-modes | unverified |
| Fence, Rock Bottom, Gunsmith and Chemist force Skip Intro | nicokobo (2 pages) | unverified |
| First-run difficulty restriction | none found | Not documented. All four difficulties stay selectable; this is labelled in the UI. |
