/**
 * Sources & Credits data, derived from the registry so it cannot drift from the per-value references.
 */
import type { GameDataRegistry, SourceRef } from './types';

export type SourceKind = 'store' | 'community' | 'user-report';

/** Raw text/HTML snapshots in docs/sources/ (a test checks this list against the folder). */
/** null = consulted page that is not cited by any data value (see CONSULTED_ONLY). */
export const SNAPSHOTS: Record<string, string | null> = {
  'allthingshow_difficulty-modes.txt': 'allthings-difficulty',
  'cozy.txt': 'cozy-scenarios',
  'gamers.wiki_en_games_probably-stolen_guides_probably-stolen-starting-scenarios-9-launch-choices.txt': 'gamers-scenarios',
  'guide_Probably-Stolen-best-perks.txt': 'wiki-best-perks',
  'guide_Probably-Stolen-guide.txt': null,
  'guide_Probably-Stolen-tips.txt': 'wiki-tips',
  'nicokobo_en_collections_occupations.html': 'nicokobo-occupations',
  'nicokobo_en_collections_occupations.txt': 'nicokobo-occupations',
  'nicokobo_en_wiki_perks_starting-perks.html': 'nicokobo-starting-perks',
  'nicokobo_en_wiki_perks_starting-perks.txt': 'nicokobo-starting-perks',
  'nicokobo_game-modes-and-endings.txt': 'nicokobo-game-modes',
  'nicokobo_survival-and-run-goals.txt': null,
  'probablystolen.vi.ki_starting-perks.txt': 'viki-perks',
  'probablystolencodex_difficulty.txt': null,
  'probablystolendb.wiki_reference_perks_.txt': 'psdb-perks',
  'probablystolendb_difficulty-modes.txt': 'psdb-difficulty',
  'scenarios_Probably-Stolen-gunsmith.txt': 'wiki-gunsmith',
  'scenarios_Probably-Stolen-rat-wrangler.txt': null,
  'scenarios_Probably-Stolen-starting-scenarios.txt': 'wiki-starting-scenarios',
  'store.steampowered.com_app_4348910_.txt': 'steam-store',
  'walkthroughforge.com_probably-stolen_starting-perks_.txt': 'wf-perks',
  'walkthroughforge.com_probably-stolen_starting-specializations_.txt': 'wf-specializations',
  'water_Probably-Stolen-water-merchant.txt': 'wiki-water-merchant',
  'water_Probably-Stolen-water.txt': null,
};

const AREA_LABEL: Record<string, string> = {
  specializations: 'Specializations', perks: 'Starting perks', difficulties: 'Difficulties', rules: 'Perk rules (points, slots, exclusions, first run)',
  startRules: 'Start-screen rules', baseline: 'Baseline values', ordering: 'Display order',
};

export const kindOf = (s: SourceRef): SourceKind => (s.id === 'steam-store' ? 'store' : s.id === 'user-screenshots' ? 'user-report' : 'community');
export const KIND_LABEL: Record<SourceKind, string> = {
  store: 'Official store page of the game',
  community: 'Community / fan-made',
  'user-report': 'User report (not publicly available)',
};
const KIND_CAVEAT: Record<SourceKind, string> = {
  store: 'Store text and screenshots, not a game-data source; screenshots may show an older build.',
  community: 'Fan-made; may be outdated, incomplete or wrong, and may describe a different game version.',
  'user-report': 'Second-hand report; not independently verified.',
};

/** Every source id referenced anywhere in the data, with the data areas that reference it and how often. */
export function sourceUsage(reg: GameDataRegistry): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  const walk = (v: unknown, area: string) => {
    if (Array.isArray(v)) { v.forEach((x) => walk(x, area)); return; }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.sources)) for (const id of o.sources) if (typeof id === 'string') {
      const m = out.get(id) ?? new Map<string, number>();
      m.set(area, (m.get(area) ?? 0) + 1);
      out.set(id, m);
    }
    for (const [k, x] of Object.entries(o)) if (k !== 'sources') walk(x, area);
  };
  for (const [k, v] of Object.entries(reg)) if (k !== 'sources' && k !== 'flagLabels') walk(v, k);
  return out;
}

export interface CreditEntry {
  source: SourceRef; kind: SourceKind; kindLabel: string; caveat: string; usedFor: string[]; snapshots: string[];
}

export function creditEntries(reg: GameDataRegistry): CreditEntry[] {
  const usage = sourceUsage(reg);
  const order: SourceKind[] = ['store', 'community', 'user-report'];
  return Object.values(reg.sources)
    .map((source) => {
      const kind = kindOf(source);
      const u = usage.get(source.id);
      return {
        source, kind, kindLabel: KIND_LABEL[kind], caveat: KIND_CAVEAT[kind],
        usedFor: u ? [...u.entries()].map(([a, n]) => `${AREA_LABEL[a] ?? a} (${n} reference${n === 1 ? '' : 's'})`) : ['Consulted during research; not cited by a current value'],
        snapshots: Object.entries(SNAPSHOTS).filter(([, id]) => id === source.id).map(([f]) => f),
      };
    })
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

/** Pages consulted during research (snapshot kept) but not cited by any current data value. */
export const CONSULTED_ONLY: { file: string; title: string; url: string; publisher: string; gameVersion: string | null }[] = [
  { file: 'guide_Probably-Stolen-guide.txt', title: 'Probably Stolen Guide: Water Purification Walkthrough & Tips', url: 'https://www.probablystolen-wiki.wiki/guide/Probably-Stolen-guide', publisher: 'Probably Stolen Wiki Team (fan site)', gameVersion: null },
  { file: 'water_Probably-Stolen-water.txt', title: 'Probably Stolen Water: Water Merchant Setup Guide', url: 'https://www.probablystolen-wiki.wiki/water/Probably-Stolen-water', publisher: 'Probably Stolen Wiki Team (fan site)', gameVersion: null },
  { file: 'scenarios_Probably-Stolen-rat-wrangler.txt', title: 'Rat Wrangler: Setup Guide, Breeding & Meat Farming Tips', url: 'https://www.probablystolen-wiki.wiki/scenarios/Probably-Stolen-rat-wrangler', publisher: 'Probably Stolen Wiki Team (fan site)', gameVersion: null },
  { file: 'nicokobo_survival-and-run-goals.txt', title: 'Survival and runs', url: 'https://probably-stolen.nicokobo.com/en/collections/survival-and-run-goals', publisher: 'Probably Stolen Wiki by nicokobo (fan site)', gameVersion: '0.46D / Steam Build 26337366' },
  { file: 'probablystolencodex_difficulty.txt', title: 'Probably Stolen Difficulty Guide: All 4 Modes Compared', url: 'https://probablystolencodex.com/difficulty', publisher: 'Probably Stolen Codex (fan site)', gameVersion: null },
];

export const TARGET_GAME_VERSION = '100-REV6 (version shown in the project owner\'s screenshots; 1.0.x)';
