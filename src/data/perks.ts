import type { FlagKey, ModifierDef, PerkCategory, PerkDef, StatKey, VerificationStatus } from './types';

/**
 * Starting perks for game version 1.0.x.
 *
 * Status policy (see docs/RESEARCH.md):
 * - partially-verified: cost/effect agree across >= 2 independent community sources for 1.0,
 *   but have not been checked in-game by this project.
 * - conflicting: sources disagree; the value used is the one backed by the 1.0 sources and the
 *   disagreement is documented in `note`.
 * - unverified: single source only.
 * Descriptions are the effect texts quoted by Walkthrough Forge (wf-perks).
 */

const V = '1.0.x';
// nicokobo-occupations (0.46D) lists the same cost for all 48 perks (checked 2026-11-05).
const COST_SRC = ['wf-perks', 'psdb-perks', 'nicokobo-occupations'];
const POS_COST_SRC = ['wf-perks', 'psdb-perks', 'viki-perks', 'nicokobo-occupations'];

const NK = 'nicokobo-occupations';

/**
 * Every modifier magnitude below was cross-checked on 2026-11-05 against nicokobo-occupations
 * (0.46D, static analysis) and matches, so it is cited and at least partially-verified.
 * Values stay 'conflicting' where an older source disagrees.
 */
function mod(stat: StatKey, value: number | null, status: VerificationStatus = 'partially-verified', extra: Partial<ModifierDef> = {}): ModifierDef {
  const sources = Array.from(new Set([...(extra.sources ?? ['wf-perks']), NK]));
  return { stat, op: 'add', value, gameVersion: V, status, ...extra, sources };
}

interface PerkInput {
  id: string;
  name: string;
  category: PerkCategory;
  cost: number;
  description: string;
  modifiers?: ModifierDef[];
  flags?: FlagKey[];
  status?: VerificationStatus;
  costStatus?: VerificationStatus;
  costSources?: string[];
  note?: string;
  categoryNote?: string;
  alternatives?: { value: number; sources: string[] }[];
  /** Additional wording/nuance reported by nicokobo-occupations. */
  nkNote?: string;
}

function perk(p: PerkInput): Omit<PerkDef, 'order'> {
  const costSources = Array.from(new Set([...(p.costSources ?? (p.category === 'positive' ? POS_COST_SRC : COST_SRC)), NK]));
  const note = [p.note, p.nkNote ? `nicokobo-occupations (0.46D): ${p.nkNote}` : undefined].filter(Boolean).join(' ') || undefined;
  return {
    id: p.id,
    name: p.name,
    sources: Array.from(new Set([...costSources, 'wf-perks'])),
    gameVersion: V,
    status: p.status ?? 'partially-verified',
    note,
    category: {
      value: p.category, sources: ['wf-perks', NK], gameVersion: V,
      status: p.categoryNote ? 'conflicting' : 'partially-verified', note: p.categoryNote,
    },
    cost: {
      value: p.cost, sources: costSources, gameVersion: V,
      status: p.costStatus ?? 'partially-verified', alternatives: p.alternatives, note,
    },
    description: { value: p.description, sources: ['wf-perks'], gameVersion: V, status: 'unverified',
      note: 'Text as quoted by one community source; not compared against the in-game tooltip.' },
    modifiers: p.modifiers ?? [],
    flags: p.flags ?? [],
    requires: [],
  };
}

const PERK_LIST: Omit<PerkDef, 'order'>[] = [
  // ---------- Positive ----------
  perk({ id: 'diplomatic', name: 'Diplomatic', category: 'positive', cost: 2,
    description: 'Reputation generated from trade is increased by 33%.',
    modifiers: [mod('tradeReputationGainPct', 33, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'] })] }),
  perk({ id: 'intimidating', nkNote: 'evidence input rounded after x0.67 (= 33% less), cost 2.', name: 'Intimidating', category: 'positive', cost: 2,
    description: 'All committed crimes generate 33% less available evidence.',
    costStatus: 'conflicting', status: 'conflicting',
    alternatives: [{ value: 3, sources: ['wiki-best-perks'] }],
    note: 'probablystolen-wiki lists 3 points / 25% less evidence; nicokobo-occupations (0.46D) gives 2 points / x0.67. Patch notes summarised by cozy-scenarios say it was changed from 3 to 2 points and 25% to 33%, so the wiki appears outdated. Using 2 points / 33% (wf-perks, psdb-perks, viki-perks).',
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks', 'cozy-scenarios'],
    modifiers: [mod('crimeEvidencePct', -33, 'conflicting', { sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'cozy-scenarios'] })] }),
  perk({ id: 'vending-machine', name: 'Vending Machine', category: 'positive', cost: 2,
    description: 'Start with a vending machine installed in front of your store. Allows customers to purchase items automatically during after-hours.',
    flags: ['vendingMachine'] }),
  perk({ id: 'vigilant', nkNote: '"Skips the ordinary overnight burglary branch once insurance is unlocked" - narrower than "never robbed".', name: 'Vigilant', category: 'positive', cost: 2,
    description: 'You will never get robbed during the night.', flags: ['noNightRobbery'],
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'] }),
  perk({ id: 'well-connected', name: 'Well Connected', category: 'positive', cost: 2,
    description: 'Start with an additional 15 Reputation with all factions.',
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'],
    note: 'probablystolen-wiki spells it "Well-Connected".',
    modifiers: [mod('reputation.all', 15, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'] })] }),
  perk({ id: 'working-pipes', name: 'Working Pipes', category: 'positive', cost: 2,
    description: 'You will start with the water lines already connected with unlimited Rustwater.',
    flags: ['waterLinesConnected'] }),
  perk({ id: 'handy', name: 'Handy', category: 'positive', cost: 1,
    description: 'Start with a shabby toolbox and a set of shabby tools: a screwdriver, a wire cutter, a crowbar and a plasma cutter.',
    flags: ['shabbyToolbox'] }),
  perk({ id: 'lucky', nkNote: 'initial luck +5; each system interprets luck separately.', name: 'Lucky', category: 'positive', cost: 1,
    description: 'Increases your luck. Probably.', flags: ['luckIncreased'],
    modifiers: [mod('luck', 5, 'unverified', { sources: [] })],
    note: 'Luck magnitude (+5) comes from nicokobo-occupations only; how luck is used is system-specific.' }),
  perk({ id: 'model-citizen', nkNote: 'report and Aug-kill rewards x1.5 (= +50%), Security +30.', name: 'Model Citizen', category: 'positive', cost: 1,
    description: 'Start with 30 extra Security Reputation and receive 50% more reward for reporting customers on the Wanted List.',
    status: 'conflicting',
    note: 'probablystolen-wiki says +20% wanted-list rewards; patch notes (Update 049, via cozy-scenarios) raised it from 20% to 50%; nicokobo-occupations (0.46D) gives x1.5. Using 50%.',
    modifiers: [
      mod('reputation.security', 30, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'] }),
      mod('wantedReportRewardPct', 50, 'conflicting', { sources: ['wf-perks', 'psdb-perks', 'cozy-scenarios'] }),
    ] }),
  perk({ id: 'proficient-scavenger', name: 'Proficient Scavenger', category: 'positive', cost: 1,
    description: 'You can perform up to 2 additional Search actions in the Dumping Grounds every time you visit.',
    modifiers: [mod('dumpingGroundSearches', 2, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'] })] }),
  perk({ id: 'revolution-sympathizer', name: 'Revolution Sympathizer', category: 'positive', cost: 1,
    description: 'Start with an additional 25 Reputation with The Revolution. You will receive Marketplace Requests from The Revolution more frequently.',
    modifiers: [mod('reputation.revolution', 25, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks'] })] }),
  perk({ id: 'savings', name: 'Savings', category: 'positive', cost: 1,
    description: 'Start with an additional 150 Credits.',
    note: 'probablystolen-wiki scenario page calls this "Additional 150 Credits".',
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'],
    modifiers: [mod('startingCredits', 150, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks', 'wiki-starting-scenarios'] })] }),
  perk({ id: 'sawyers-crew', nkNote: 'Underground Exchange unlocks after the day-1 introduction ends, not literally at start.', name: "Sawyer's Crew", category: 'positive', cost: 1,
    description: 'The Underground Exchange is available from the start. Janitorial Service is always free, unless the Store is vandalized. Vandalism clean up cost is significantly reduced.',
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'],
    flags: ['undergroundExchangeAtStart', 'freeJanitorialService'] }),
  perk({ id: 'secret-admirer', name: 'Secret Admirer', category: 'positive', cost: 1,
    description: 'You will occasionally receive random items from a secret admirer when opening the Store.',
    flags: ['secretAdmirerGifts'] }),
  perk({ id: 'short-sleeper', name: 'Short Sleeper', category: 'positive', cost: 1,
    description: "You won't miss out on any customers when going out during after-hours activities the night before.",
    flags: ['retainCustomersAfterNightOut'] }),
  perk({ id: 'sycophant', name: 'Sycophant', category: 'positive', cost: 1,
    description: 'Start with 15 extra Upper Levels Reputation. Reputation gained with the Upper Levels is increased by 25%, and Upper Level customers have 10% more budget.',
    modifiers: [
      mod('reputation.upper-levels', 15, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks'] }),
      mod('upperLevelsReputationGainPct', 25, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] }),
      mod('upperLevelsBudgetPct', 10, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] }),
    ] }),
  perk({ id: 'tapehead', nkNote: 'gives 7 Pristine-version starting tracks (replacing the ordinary 4 Corrupted tapes), not "all cassettes".', name: 'Tapehead', category: 'positive', cost: 1,
    description: 'You start with all music cassettes available inside the cassette player.', flags: ['allCassettes'],
    note: 'probablystolen-wiki spells it "Tape Head".' }),
  perk({ id: 'tinkerer', name: 'Tinkerer', category: 'positive', cost: 1,
    description: 'When you upgrade an item, there is a 20% chance the material used is not consumed.',
    modifiers: [mod('upgradeMaterialSaveChancePct', 20, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks'] })] }),
  perk({ id: 'welfare-program', nkNote: 'weekly genuine food stamps by adjusted wealth: 160 (W<=1200), 120, 80, 40, none above 3000.', name: 'Welfare Program', category: 'positive', cost: 1,
    description: 'The Commissary is available from the start. On Mondays, you may receive Food Stamps depending on your total wealth.',
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'], flags: ['commissaryAtStart'],
    note: 'probablystolen-wiki claims a 160-token food stamp at start; not corroborated, so not modelled.' }),
  perk({ id: 'wilds-favorite', name: "Wild's Favorite", category: 'positive', cost: 1,
    description: "All upgrades from Wild's Network cost 10% less. Insurance costs 50% less.",
    modifiers: [
      mod('wildNetworkCostPct', -10, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks'] }),
      mod('insuranceCostPct', -50, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks'] }),
    ] }),

  // ---------- Neutral ----------
  perk({ id: 'aug-menace', name: 'Aug Menace', category: 'neutral', cost: 1,
    description: 'The Augmented content is unlocked at the start of the game. Earn 25% more credits for killing an aug. The aug menace never ends, and letting too many augs get away ends the game on every difficulty.',
    categoryNote: 'Neutral per wf-perks and nicokobo-occupations ("category is not determined by the sign of its cost"); viki-perks lists it among positive perks.',
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks'], flags: ['augContentAtStart'],
    modifiers: [mod('augKillRewardPct', 25, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] })] }),
  perk({ id: 'colorful-character', nkNote: 'neutral, costs 1, occupies one slot and raises the slot limit from 4 to 7.', name: 'Colorful Character', category: 'neutral', cost: 1,
    description: 'Allows you to have 3 additional starting perk slots.',
    categoryNote: 'Neutral per wf-perks and nicokobo-occupations ("category is not determined by the sign of its cost"); viki-perks lists it among positive perks.',
    costSources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'],
    note: '+3 slots agreed by wf-perks, psdb-perks, viki-perks and wiki-best-perks ("3 additional slots, net 2" because it occupies one itself). wiki-starting-scenarios instead says "extra perk points" - treated as an error. Not checked in-game.',
    modifiers: [mod('perkSlots', 3, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'viki-perks', 'wiki-best-perks'] })] }),
  perk({ id: 'makeshift-reactor', name: 'Makeshift Reactor', category: 'neutral', cost: 1,
    description: 'You are permanently disconnected from the station power grid and are not affected by blackouts. Start with an upgradable Makeshift Micro Nuclear Reactor sold to you by Dr. Jackson. It powers the Store but needs regular repairs.',
    categoryNote: 'Neutral per wf-perks and nicokobo-occupations ("category is not determined by the sign of its cost"); viki-perks lists it among positive perks.',
    flags: ['offGridReactor'] }),
  perk({ id: 'careful-scavenger', name: 'Careful Scavenger', category: 'neutral', cost: 0,
    description: 'You can perform 2 fewer actions in the Dumping Grounds every time you visit, but you never get injured while searching.',
    flags: ['noInjuryWhileScavenging'],
    modifiers: [mod('dumpingGroundSearches', -2, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] })] }),
  perk({ id: 'hoarder', name: 'Hoarder', category: 'neutral', cost: 0,
    description: 'Start with three piles of immovable debris along the bottom of your inventory. Each pile can be removed.',
    flags: ['inventoryDebris'] }),
  perk({ id: 'prime-real-estate', name: 'Prime Real Estate', category: 'neutral', cost: 0,
    description: '1 more normal customer will visit every day, but starting rent costs 75 credits more.',
    modifiers: [
      mod('dailyRandomCustomers', 1, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] }),
      mod('startingRent', 75, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] }),
    ] }),

  // ---------- Negative (cost is negative = points granted) ----------
  perk({ id: 'ascetic', name: 'Ascetic', category: 'negative', cost: -4,
    description: 'Your main inventory is reduced to 16x10 instead of 24x10.',
    modifiers: [mod('inventoryWidth', 16, 'unverified', { op: 'set' })] }),
  perk({ id: 'awful-negotiator', name: 'Awful Negotiator', category: 'negative', cost: -3,
    description: 'You cannot bargain with customers, and you suffer a permanent trade penalty of 5%.',
    flags: ['noBargaining'], modifiers: [mod('tradePenaltyPct', 5, 'unverified')] }),
  perk({ id: 'sentinel-collapse-disorder', name: 'Sentinel Collapse Disorder', category: 'negative', cost: -3,
    description: 'You suffer from a deadly, incurable auto-immune condition and must take a weekly Immunivax injection to stay alive. Start the game with 1 Immunivax Injector.',
    flags: ['weeklyImmunivaxRequired'] }),
  perk({ id: 'blabbermouth', name: 'Blabbermouth', category: 'negative', cost: -2,
    description: 'All committed crimes generate 33% more available evidence. You will gain 50% less reputation with the Black Market and the Revolution.',
    modifiers: [mod('crimeEvidencePct', 33), mod('blackMarketRevolutionReputationGainPct', -50)] }),
  perk({ id: 'blackmail', nkNote: 'demand is 40 + current day Credits, on days congruent to 1 mod 7.', name: 'Blackmail', category: 'negative', cost: -2,
    description: 'You have a questionable past and a blackmailer is threatening to expose your secret. You will have to pay them a small weekly fee or they will expose you, leading to a major one-time loss to your reputation across most factions.',
    flags: ['blackmailWeeklyFee'], note: 'Fee amount: only nicokobo documents it (40 + current day); unverified.' }),
  perk({ id: 'known-snitch', name: 'Known Snitch', category: 'negative', cost: -2,
    description: 'Customers from the wanted poster will never visit your store. Start with -10 reputation with the Revolution and the Black Market.',
    flags: ['noWantedCustomers'],
    modifiers: [mod('reputation.revolution', -10), mod('reputation.black-market', -10)] }),
  perk({ id: 'maimed', name: 'Maimed', category: 'negative', cost: -2,
    description: 'The Dumping Ground is not available. You cannot scavenge at all.', flags: ['noScavenging'] }),
  perk({ id: 'minimalist', nkNote: 'cost -2, inventory 20x10.', name: 'Minimalist', category: 'negative', cost: -2,
    description: 'Your main inventory is reduced to 20x10 instead of 24x10.',
    costStatus: 'conflicting', status: 'conflicting',
    alternatives: [{ value: -3, sources: ['wiki-best-perks'] }],
    note: 'probablystolen-wiki says Minimalist refunds 3 points; wf-perks, psdb-perks (1.0.0.2) and nicokobo-occupations (0.46D) say 2. Using 2.',
    modifiers: [mod('inventoryWidth', 20, 'partially-verified', { op: 'set', sources: ['wf-perks', 'psdb-perks'] })] }),
  perk({ id: 'public-enemy', name: 'Public Enemy', category: 'negative', cost: -2,
    description: 'Start with -15 Reputation with all factions.',
    modifiers: [mod('reputation.all', -15)] }),
  perk({ id: 'agoraphobia', name: 'Agoraphobia', category: 'negative', cost: -1,
    description: 'After visiting an after-hours location, you must rest at the Store for 2 nights before going out again.', flags: ['agoraphobiaRest'] }),
  perk({ id: 'alcohol-addiction', name: 'Alcohol Addiction', category: 'negative', cost: -1,
    description: "You will suffer a trade penalty of 8% if you don't consume alcohol regularly. The addiction can be cured.",
    flags: ['addictionAlcohol'], modifiers: [mod('tradePenaltyPct', 8, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'cozy-scenarios'], condition: 'during withdrawal' })] }),
  perk({ id: 'bad-lease', name: 'Bad Lease', category: 'negative', cost: -1,
    description: 'Your starting rent is increased by 40 Credits.',
    modifiers: [mod('startingRent', 40, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'wiki-water-merchant'] })] }),
  perk({ id: 'banned-from-the-commissary', name: 'Banned from the Commissary', category: 'negative', cost: -1,
    description: 'The Commissary is not available, and food stamps are never introduced.', flags: ['commissaryBanned'] }),
  perk({ id: 'convict', name: 'Convict', category: 'negative', cost: -1,
    description: 'Start with 30 less Security Reputation and receive 25% less reward for reporting customers on the Wanted List.',
    note: 'wiki-starting-scenarios mislabels Convict as a "background"; 1.0 sources list it as a negative perk.',
    modifiers: [mod('reputation.security', -30, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] }), mod('wantedReportRewardPct', -25, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] })] }),
  perk({ id: 'degenerative-osteoarthritis', name: 'Degenerative Osteoarthritis', category: 'negative', cost: -1,
    description: 'Scavenging in the dumping ground works normally for the first week. After that, you lose 1 max scavenging attempt every week that passes. Once your max attempts fall below 3, you can no longer scavenge at all. Normal shopkeepers start with 5 daily max attempts. Start with 2 additional topical medication bandages.',
    flags: ['scavengingDeclinesWeekly'] }),
  perk({ id: 'gambling-addiction', name: 'Gambling Addiction', category: 'negative', cost: -1,
    description: 'You will always buy some Lottery Tickets when possible. All lottery content is unlocked from the start. The addiction can be cured.',
    flags: ['lotteryUnlocked'],
    note: 'wiki-gunsmith claims the "gambling perk" blocks guide reading - that matches Illiterate, not Gambling Addiction, in 1.0 sources.' }),
  perk({ id: 'illiterate', name: 'Illiterate', category: 'negative', cost: -1,
    description: "You won't be able to read any guide.", flags: ['cannotReadGuides'] }),
  perk({ id: 'narcotic-addiction', name: 'Narcotic Addiction', category: 'negative', cost: -1,
    description: "You will suffer a trade penalty of 8% if you don't consume narcotics regularly. The addiction can be cured.",
    flags: ['addictionNarcotic'], modifiers: [mod('tradePenaltyPct', 8, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'cozy-scenarios'], condition: 'during withdrawal' })] }),
  perk({ id: 'nicotine-addiction', name: 'Nicotine Addiction', category: 'negative', cost: -1,
    description: "You will suffer a trade penalty of 8% if you don't consume nicotine regularly. The addiction can be cured.",
    flags: ['addictionNicotine'], modifiers: [mod('tradePenaltyPct', 8, 'partially-verified', { sources: ['wf-perks', 'psdb-perks', 'cozy-scenarios'], condition: 'during withdrawal' })] }),
  perk({ id: 'on-wilds-bad-side', name: "On Wild's Bad Side", category: 'negative', cost: -1,
    description: "All upgrades from Wild's Network cost 10% more. Insurance costs 50% more.",
    modifiers: [mod('wildNetworkCostPct', 10), mod('insuranceCostPct', 50)] }),
  perk({ id: 'side-street', name: 'Side Street', category: 'negative', cost: -1,
    description: 'You get one less random customer per day.',
    modifiers: [mod('dailyRandomCustomers', -1, 'partially-verified', { sources: ['wf-perks', 'psdb-perks'] })] }),
  perk({ id: 'unlucky', nkNote: 'initial luck -5; each system interprets luck separately.', name: 'Unlucky', category: 'negative', cost: -1,
    description: 'Decreases your luck. Probably.', flags: ['luckDecreased'],
    modifiers: [mod('luck', -5, 'unverified', { sources: [] })] }),
];

/**
 * Display order: grouped positive → neutral → negative (the grouping visible in the official Steam screenshot of the
 * Starting Perks screen, build 052A); within each group, the order of the community perk tables. Exact in-game 100-REV6
 * order is unverified (see REGISTRY.ordering.perks).
 */
const GROUP: Record<string, number> = { positive: 0, neutral: 1, negative: 2 };
export const PERKS: PerkDef[] = PERK_LIST
  .map((p, i) => ({ p, i }))
  .sort((a, b) => (GROUP[a.p.category.value ?? 'neutral']! - GROUP[b.p.category.value ?? 'neutral']!) || a.i - b.i)
  .map(({ p }, i) => ({ ...p, order: i + 1 }));
