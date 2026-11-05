import type { BaselineDef, DifficultyDef, ExclusionRule, PerkRules, StartRule, VerificationStatus } from './types';

const V = '1.0.x';

// All 10 pairs below are listed identically by wf-perks (1.0) and nicokobo (0.46D, both occupations and starting-perks
// pages; "a declaration on either side is enough"). Two community sources, none in-game, so partially-verified.
const NK_EX = ['nicokobo-occupations', 'nicokobo-starting-perks'];
function ex(a: string, b: string, status: VerificationStatus = 'partially-verified', sources: string[] = ['wf-perks'], note?: string): ExclusionRule {
  return { perks: [a, b], sources: [...sources, ...NK_EX], gameVersion: V, status, note };
}

export const PERK_RULES: PerkRules = {
  sources: ['user-screenshots', 'wf-perks', 'psdb-perks', 'viki-perks', 'gamers-scenarios'],
  gameVersion: V,
  status: 'verified',
  basePoints: { value: 3, sources: ['user-screenshots', 'wf-perks', 'psdb-perks', 'viki-perks', 'nicokobo-starting-perks', 'allthings-difficulty'], gameVersion: '100-REV6 / 1.0.x / 0.46D', status: 'verified',
    note: 'User-reported from 100-REV6 screenshots (not re-examined in this pass) and stated by five community sources; allthings-difficulty quotes the screen text "Available Perk Points: 3".' },
  baseSlots: { value: 4, sources: ['user-screenshots', 'wf-perks', 'psdb-perks', 'viki-perks', 'nicokobo-starting-perks', 'allthings-difficulty'], gameVersion: '100-REV6 / 1.0.x / 0.46D', status: 'verified',
    note: 'allthings-difficulty quotes the screen text "Perks: 0/4".' },
  firstRunLocksPerks: { value: true, sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'gamers-scenarios', 'nicokobo-starting-perks', 'allthings-difficulty'], gameVersion: V, status: 'partially-verified',
    note: 'allthings-difficulty quotes the screen text "Starting Perks are not available on your first run". Community sources say the Starting Perks panel is unavailable on the first run. No source lists perks that are only locked for first runs.' },
  everyPerkUsesSlot: { value: true, sources: ['wf-perks', 'psdb-perks', 'wiki-best-perks'], gameVersion: V, status: 'partially-verified',
    note: 'Negative and zero-cost perks also occupy a slot (nicokobo-starting-perks agrees); Colorful Character occupies one of its own slots.' },
  validatedAtContinue: { value: true, sources: ['user-screenshots', 'nicokobo-starting-perks'], gameVersion: '100-REV6 / 0.46D', status: 'partially-verified',
    note: 'User report (100-REV6) plus nicokobo-starting-perks: "selection may temporarily exceed a limit, but Continue validates it". The game does not auto-remove perks, so neither does this app.' },
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

const DIFF_SRC = ['gamers-scenarios', 'wf-specializations', 'nicokobo-game-modes', 'psdb-difficulty', 'allthings-difficulty'];

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'price-gouge', name: 'Price Gouge', subtitle: 'Cozy Mode', sources: DIFF_SRC, gameVersion: V, status: 'partially-verified',
    menuPage: { value: 1, sources: ['allthings-difficulty'], gameVersion: V, status: 'unverified' } },
  { id: 'mark-up', name: 'Mark Up', subtitle: 'Normal Mode', sources: DIFF_SRC, gameVersion: V, status: 'partially-verified',
    menuPage: { value: 1, sources: ['allthings-difficulty'], gameVersion: V, status: 'unverified' },
    isDefault: { value: true, sources: ['psdb-difficulty'], gameVersion: '1.0.0.2', status: 'unverified', note: 'Only psdb-difficulty says Mark Up is the default.' } },
  { id: 'thin-margins', name: 'Thin Margins', subtitle: 'Hard Mode', sources: DIFF_SRC, gameVersion: V, status: 'partially-verified',
    menuPage: { value: 1, sources: ['allthings-difficulty'], gameVersion: V, status: 'unverified' } },
  { id: 'red-ink', name: 'Red Ink', subtitle: 'Challenge Mode', sources: DIFF_SRC, gameVersion: V, status: 'partially-verified',
    menuPage: { value: 2, sources: ['allthings-difficulty'], gameVersion: V, status: 'unverified', note: 'Red Ink sits on a second page of the Difficulty screen.' } },
];

/**
 * First-playthrough and start-of-run rules. No source documents a difficulty restriction on the first run.
 */
export const START_RULES: StartRule[] = [
  { id: 'menu-order', text: 'Start flow: specialization -> Starting Perks -> Difficulty and options.', sources: ['nicokobo-starting-perks', 'allthings-difficulty'], gameVersion: '0.46D / 1.0', status: 'partially-verified' },
  { id: 'first-run-perks-locked', text: 'First run: Starting Perks are not available ("Starting Perks are not available on your first run").', sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'gamers-scenarios', 'nicokobo-starting-perks', 'allthings-difficulty'], gameVersion: V, status: 'partially-verified' },
  { id: 'first-run-non-apprentice', text: 'First run: choosing a specialization other than Apprentice shows a confirmation prompt, then you can continue.', sources: ['nicokobo-starting-perks'], gameVersion: '0.46D', status: 'unverified', note: 'Single source (static analysis).' },
  { id: 'first-run-skip-intro', text: 'First run: ticking Skip Intro shows a confirmation prompt.', sources: ['nicokobo-game-modes'], gameVersion: '0.46D', status: 'unverified', note: 'Single source (static analysis).' },
  { id: 'forced-skip-intro', text: 'Fence, Rock Bottom, Gunsmith and Chemist always skip the intro (Skip Intro is forced on).', sources: ['nicokobo-game-modes', 'nicokobo-occupations'], gameVersion: '0.46D', status: 'unverified', note: 'Two pages of one site.' },
  { id: 'first-run-difficulty', text: 'No source documents a difficulty restriction on the first run; all four difficulties appear selectable.', sources: ['allthings-difficulty', 'psdb-difficulty'], gameVersion: V, status: 'unverified', note: 'Absence of evidence; check in-game.' },
  { id: 'option-skip-intro', text: 'Difficulty screen option: Skip Intro (checkbox).', sources: ['allthings-difficulty', 'nicokobo-game-modes'], gameVersion: V, status: 'partially-verified' },
  { id: 'option-endless', text: 'Difficulty screen option: Endless Mode (checkbox; tooltip "Certain scripted events and customers will not spawn").', sources: ['allthings-difficulty', 'nicokobo-game-modes'], gameVersion: V, status: 'partially-verified' },
];

export const BASELINE: BaselineDef = {
  inventoryGrid: { value: { width: 24, height: 10 }, sources: ['wf-perks'], gameVersion: V, status: 'unverified', note: 'Inferred from Minimalist/Ascetic texts ("instead of 24x10").' },
  dumpingGroundSearches: { value: 5, sources: ['wf-perks'], gameVersion: V, status: 'unverified', note: 'From the Degenerative Osteoarthritis text ("Normal shopkeepers start with 5 daily max attempts").' },
  usualRent: { value: 200, sources: ['wf-specializations', 'wiki-tips'], gameVersion: V, status: 'partially-verified', note: 'wiki-tips: "starts around 200 credits".' },
};
