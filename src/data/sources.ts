import type { SourceRef } from './types';

const ACCESSED = '2026-11-05';

/** Every source consulted during Phase 1 research. Raw text snapshots live in docs/sources/. */
export const SOURCES: Record<string, SourceRef> = {
  'user-screenshots': {
    id: 'user-screenshots', title: 'User-supplied screenshots of the start screens (not available to the developer)',
    url: '', publisher: 'Project owner', gameVersion: '100-REV6', accessed: ACCESSED,
    notes: 'Reported to show: Specialization selection, Starting Perks with 3 points, 4-perk limit, negative perks granting points, mutually exclusive perks, Colorful Character. Content reported second-hand only.',
  },
  'wiki-home': {
    id: 'wiki-home', title: 'Probably Stolen Wiki (home)', url: 'https://www.probablystolen-wiki.wiki/',
    publisher: 'Probably Stolen Wiki Team (fan site)', gameVersion: null, accessed: ACCESSED,
    notes: 'Article-style fan site; no dedicated per-perk or per-specialization pages exist.',
  },
  'wiki-best-perks': {
    id: 'wiki-best-perks', title: 'Probably Stolen Best Perks: Starting Perk Tier List Rankings',
    url: 'https://www.probablystolen-wiki.wiki/guide/Probably-Stolen-best-perks',
    publisher: 'Probably Stolen Wiki Team', gameVersion: null, accessed: ACCESSED,
    notes: 'Lists only 12 perks. Some values match pre-1.0 patch notes (Intimidating 3 pts / 25%, Model Citizen +20%).',
  },
  'wiki-starting-scenarios': {
    id: 'wiki-starting-scenarios', title: 'Probably Stolen Starting Scenarios: Best Backgrounds & Perks Ranked',
    url: 'https://www.probablystolen-wiki.wiki/scenarios/Probably-Stolen-starting-scenarios',
    publisher: 'Probably Stolen Wiki Team', gameVersion: null, accessed: ACCESSED,
  },
  'wiki-gunsmith': {
    id: 'wiki-gunsmith', title: 'Gunsmith: Setup Guide, Perks & Custom Order Walkthrough',
    url: 'https://www.probablystolen-wiki.wiki/scenarios/Probably-Stolen-gunsmith',
    publisher: 'Probably Stolen Wiki Team', gameVersion: '1.0.0 (video basis)', accessed: ACCESSED,
  },
  'wiki-water-merchant': {
    id: 'wiki-water-merchant', title: 'Water Merchant guide',
    url: 'https://www.probablystolen-wiki.wiki/water/Probably-Stolen-water-merchant',
    publisher: 'Probably Stolen Wiki Team', gameVersion: null, accessed: ACCESSED,
  },
  'wiki-tips': {
    id: 'wiki-tips', title: 'Probably Stolen tips', url: 'https://www.probablystolen-wiki.wiki/guide/Probably-Stolen-tips',
    publisher: 'Probably Stolen Wiki Team', gameVersion: null, accessed: ACCESSED,
  },
  'wf-specializations': {
    id: 'wf-specializations', title: 'Probably Stolen Starting Specializations Guide',
    url: 'https://walkthroughforge.com/probably-stolen/starting-specializations/',
    publisher: 'Walkthrough Forge', gameVersion: '1.0 (published 2026-10-28)', accessed: ACCESSED,
  },
  'wf-perks': {
    id: 'wf-perks', title: 'Probably Stolen Starting Perks Guide (48 perks)',
    url: 'https://walkthroughforge.com/probably-stolen/starting-perks/',
    publisher: 'Walkthrough Forge', gameVersion: '1.0 (published 2026-10-28)', accessed: ACCESSED,
  },
  'psdb-perks': {
    id: 'psdb-perks', title: 'Probably Stolen Perks: Effects and Point-Cost Table',
    url: 'https://probablystolendb.wiki/reference/perks/',
    publisher: 'probablystolendb.wiki', gameVersion: '1.0.0.2 (updated 2026-10-29)', accessed: ACCESSED,
  },
  'viki-perks': {
    id: 'viki-perks', title: 'Probably Stolen starting perks (Vi.ki, citing AllThingsHow 2026-10-28)',
    url: 'https://probablystolen.vi.ki/starting-perks',
    publisher: 'Vi.ki', gameVersion: '1.0', accessed: ACCESSED,
  },
  'gamers-scenarios': {
    id: 'gamers-scenarios', title: 'Probably Stolen Starting Scenarios: 9 Launch Choices',
    url: 'https://gamers.wiki/en/games/probably-stolen/guides/probably-stolen-starting-scenarios-9-launch-choices',
    publisher: 'Gamers.Wiki', gameVersion: 'Steam build 26263409 (checked 2026-10-28)', accessed: ACCESSED,
  },
  'cozy-scenarios': {
    id: 'cozy-scenarios', title: 'Probably Stolen Starting Scenarios: All 9 in 1.0 & Perks',
    url: 'https://cozygameguides.com/probably-stolen/starting-scenarios/',
    publisher: 'Cozy Game Guides', gameVersion: 'pre-1.0 patches (Update 049)', accessed: ACCESSED,
    notes: 'Summarises official patch notes: Intimidating changed 3 -> 2 points and 25% -> 33%; Model Citizen 20% -> 50% (Update 049).',
  },
  'nicokobo-occupations': {
    id: 'nicokobo-occupations', title: 'Occupations and starting perks (collection)',
    url: 'https://probably-stolen.nicokobo.com/en/collections/occupations',
    publisher: 'Probably Stolen Wiki by nicokobo (fan site)', gameVersion: '0.46D / Steam Build 26337366 (static analysis, no in-game test)', accessed: ACCESSED,
    notes: 'Snapshot: docs/sources/nicokobo_en_collections_occupations.txt. Page footer: "Source: 0.46D, Build 26337366; static analysis, not an in-game test." Site banner also claims a full-release baseline update on 2026-10-29, so the version label is ambiguous; treated as possibly pre-1.0.',
  },
  'nicokobo-starting-perks': {
    id: 'nicokobo-starting-perks', title: 'Starting Perks (article)',
    url: 'https://probably-stolen.nicokobo.com/en/wiki/perks/starting-perks',
    publisher: 'Probably Stolen Wiki by nicokobo (fan site)', gameVersion: '0.46D / Steam Build 26337366 (static analysis, no in-game test)', accessed: ACCESSED,
    notes: 'Snapshot: docs/sources/nicokobo_en_wiki_perks_starting-perks.txt. States: 3-point budget, 4 slots, Colorful Character +3 slots, selections may temporarily exceed limits and Continue validates.',
  },
  'nicokobo-game-modes': {
    id: 'nicokobo-game-modes', title: 'Game modes and endings (article)',
    url: 'https://probably-stolen.nicokobo.com/en/wiki/terms/game-modes-and-endings',
    publisher: 'Probably Stolen Wiki by nicokobo (fan site)', gameVersion: '0.46D / Steam Build 26337366 (static analysis, no in-game test)', accessed: ACCESSED,
    notes: 'Snapshot: docs/sources/nicokobo_game-modes-and-endings.txt. Four difficulty titles; Skip Intro on first run prompts confirmation; Fence, Rock Bottom, Gunsmith and Chemist force Skip Intro on.',
  },
  'psdb-difficulty': {
    id: 'psdb-difficulty', title: 'Probably Stolen Difficulty Modes Guide',
    url: 'https://probablystolendb.wiki/guides/difficulty-modes/',
    publisher: 'probablystolendb.wiki', gameVersion: '1.0.0.2', accessed: ACCESSED,
    notes: 'Snapshot: docs/sources/probablystolendb_difficulty-modes.txt. Names the four modes with (Cozy)/(Normal)/(Hard)/(Challenge); says Mark Up is the default.',
  },
  'allthings-difficulty': {
    id: 'allthings-difficulty', title: 'Price Gouge vs Mark Up vs Thin Margins: Picking a Probably Stolen Difficulty',
    url: 'https://allthings.how/probably-stolen-difficulty-modes/',
    publisher: 'AllThingsHow', gameVersion: '1.0 (not stated precisely)', accessed: ACCESSED,
    notes: 'Snapshot: docs/sources/allthingshow_difficulty-modes.txt. Red Ink is on page 2 of the Difficulty screen; Skip Intro and Endless Mode checkboxes; first run shows "Starting Perks are not available on your first run", Available Perk Points: 3, Perks: 0/4; Apprentice on Mark Up opens with 550 credits.',
  },
  'steam-store': {
    id: 'steam-store', title: 'Probably Stolen on Steam', url: 'https://store.steampowered.com/app/4348910/',
    publisher: 'Valve / tinyBuild / Questing Goose Studio', gameVersion: null, accessed: ACCESSED,
    notes: 'Release date 28 Oct 2026. Contains no perk/specialization numbers.',
  },
};
