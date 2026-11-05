import type { BaselineDef, DifficultyDef, ExclusionRule, PerkRules, VerificationStatus } from './types';

const V = '1.0.x';

function ex(a: string, b: string, status: VerificationStatus = 'unverified', sources: string[] = ['wf-perks'], note?: string): ExclusionRule {
  return { perks: [a, b], sources, gameVersion: V, status, note };
}

export const PERK_RULES: PerkRules = {
  sources: ['user-screenshots', 'wf-perks', 'psdb-perks', 'viki-perks', 'gamers-scenarios'],
  gameVersion: V,
  status: 'verified',
  basePoints: { value: 3, sources: ['user-screenshots', 'wf-perks', 'psdb-perks', 'viki-perks'], gameVersion: '100-REV6 / 1.0.x', status: 'verified',
    note: 'User-reported from 100-REV6 screenshots and stated by three independent 1.0 sources.' },
  baseSlots: { value: 4, sources: ['user-screenshots', 'wf-perks', 'psdb-perks', 'viki-perks'], gameVersion: '100-REV6 / 1.0.x', status: 'verified' },
  firstRunLocksPerks: { value: true, sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'gamers-scenarios'], gameVersion: V, status: 'partially-verified',
    note: 'Four community sources say the Starting Perks panel is unavailable on the first run. No source lists perks that are only locked for first runs.' },
  everyPerkUsesSlot: { value: true, sources: ['wf-perks', 'psdb-perks', 'wiki-best-perks'], gameVersion: V, status: 'partially-verified',
    note: 'Negative perks also occupy a slot; Colorful Character occupies one of its own slots ("net 2").' },
  exclusions: [
    ex('ascetic', 'minimalist'),
    ex('banned-from-the-commissary', 'welfare-program'),
    ex('careful-scavenger', 'maimed', 'partially-verified', ['wf-perks', 'wiki-gunsmith'], 'wiki-gunsmith confirms the full scavenge block and alternative scavenge perks are exclusive (no names given).'),
    ex('convict', 'model-citizen'),
    ex('degenerative-osteoarthritis', 'maimed', 'partially-verified', ['wf-perks', 'wiki-gunsmith']),
    ex('lucky', 'unlucky'),
    ex('maimed', 'proficient-scavenger', 'partially-verified', ['wf-perks', 'wiki-gunsmith']),
    ex('on-wilds-bad-side', 'wilds-favorite'),
    ex('prime-real-estate', 'side-street'),
    ex('public-enemy', 'well-connected'),
  ],
};

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'price-gouge', name: 'Price Gouge', subtitle: 'Cozy Mode', sources: ['gamers-scenarios', 'wf-specializations'], gameVersion: V, status: 'partially-verified' },
  { id: 'mark-up', name: 'Mark Up', subtitle: 'Normal Mode', sources: ['gamers-scenarios', 'wf-specializations'], gameVersion: V, status: 'partially-verified' },
  { id: 'thin-margins', name: 'Thin Margins', subtitle: 'Hard Mode', sources: ['gamers-scenarios', 'wf-specializations'], gameVersion: V, status: 'partially-verified' },
  { id: 'red-ink', name: 'Red Ink', subtitle: 'Challenge Mode', sources: ['gamers-scenarios', 'wf-specializations'], gameVersion: V, status: 'partially-verified' },
];

export const BASELINE: BaselineDef = {
  inventoryGrid: { value: { width: 24, height: 10 }, sources: ['wf-perks'], gameVersion: V, status: 'unverified', note: 'Inferred from Minimalist/Ascetic texts ("instead of 24x10").' },
  dumpingGroundSearches: { value: 5, sources: ['wf-perks'], gameVersion: V, status: 'unverified', note: 'From the Degenerative Osteoarthritis text ("Normal shopkeepers start with 5 daily max attempts").' },
  usualRent: { value: 200, sources: ['wf-specializations', 'wiki-tips'], gameVersion: V, status: 'partially-verified', note: 'wiki-tips: "starts around 200 credits".' },
};
