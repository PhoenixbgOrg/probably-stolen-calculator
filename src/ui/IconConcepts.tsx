/**
 * Authentic pixel icon concepts for all specializations and perks.
 * Each icon is independently drawn to represent the verified gameplay mechanic.
 * All icons are original pixel art; no Unicode, no game asset extraction/reproduction.
 * Visual design inspired by general retro pixel art language; not copying specific game artwork.
 */

export type IconTone = 'positive' | 'negative' | 'neutral' | 'spec' | 'disabled';

/**
 * Icon concept metadata for documentation and accessibility.
 */
export interface IconConcept {
  id: string;
  visualConcept: string;
  accessibleLabel: string;
  tooltip: string;
  /** Gameplay mechanic this icon represents */
  mechanic: string;
}

/**
 * Profession/Specialization icon concepts.
 * Visual references: existing game research screenshots where available.
 */
export const PROFESSION_CONCEPTS: Record<string, IconConcept> = {
  'chemist': {
    id: 'chemist',
    visualConcept: 'Laboratory flask/beaker with liquid',
    accessibleLabel: 'Chemist',
    tooltip: 'Chemist: Working with controlled substances and a chemistry lab',
    mechanic: 'Chemistry equipment and chemical production'
  },
  'water-merchant': {
    id: 'water-merchant',
    visualConcept: 'Water bottle or water drop',
    accessibleLabel: 'Water Merchant',
    tooltip: 'Water Merchant: Trading in scarce clean water',
    mechanic: 'Water testing, purification and trading'
  },
  'hydroponic-farmer': {
    id: 'hydroponic-farmer',
    visualConcept: 'Plant/seedling in hydroponic setup',
    accessibleLabel: 'Hydroponic Farmer',
    tooltip: 'Hydroponic Farmer: Growing crops hydroponically',
    mechanic: 'Hydroponic farming and crop production'
  },
  'aquafarmer': {
    id: 'aquafarmer',
    visualConcept: 'Fish silhouette',
    accessibleLabel: 'Aquafarmer',
    tooltip: 'Aquafarmer: Raising fish in tanks for meat',
    mechanic: 'Aquaculture systems and fish farming'
  },
  'rat-wrangler': {
    id: 'rat-wrangler',
    visualConcept: 'Rat silhouette',
    accessibleLabel: 'Rat Wrangler',
    tooltip: 'Rat Wrangler: Raising rats for meat',
    mechanic: 'Rat breeding and livestock management'
  },
  'gunsmith': {
    id: 'gunsmith',
    visualConcept: 'Firearm/pistol silhouette',
    accessibleLabel: 'Gunsmith',
    tooltip: 'Gunsmith: Selling firearms and munitions',
    mechanic: 'Weapon permits, firearms and ammunition'
  },
  'fence': {
    id: 'fence',
    visualConcept: 'Hidden/smuggled goods box with contraband marker',
    accessibleLabel: 'Fence',
    tooltip: 'Fence: Dealing in stolen goods and contraband',
    mechanic: 'Contraband trading and black market access'
  },
  'apprentice': {
    id: 'apprentice',
    visualConcept: 'Storage box/crate (general merchant)',
    accessibleLabel: 'Apprentice',
    tooltip: 'Apprentice: Generalist trainee, recommended for new players',
    mechanic: 'General stock and storage, no specialization'
  },
  'rock-bottom': {
    id: 'rock-bottom',
    visualConcept: 'Empty/broken container showing hardship',
    accessibleLabel: 'Rock Bottom',
    tooltip: 'Rock Bottom: Extreme challenge - start with nothing',
    mechanic: 'No starting credits, stock or equipment'
  },
  'junker': {
    id: 'junker',
    visualConcept: 'Scrap/salvage pile (work in progress)',
    accessibleLabel: 'Junker (Work in Progress)',
    tooltip: 'Junker: Work in Progress - not yet playable',
    mechanic: 'Not yet implemented in game'
  }
};

/**
 * Perk icon concepts mapped to verified gameplay effects.
 * All 48 perks with distinct recognizable silhouettes.
 */
export const PERK_CONCEPTS: Record<string, IconConcept> = {
  // Positive perks
  'diplomatic': {
    id: 'diplomatic',
    visualConcept: 'Handshake symbol',
    accessibleLabel: 'Diplomatic',
    tooltip: 'Diplomatic: +33% reputation from trade',
    mechanic: 'Increases trade reputation gain by 33%'
  },
  'intimidating': {
    id: 'intimidating',
    visualConcept: 'Stern face/warning symbol',
    accessibleLabel: 'Intimidating',
    tooltip: 'Intimidating: -33% crime evidence',
    mechanic: 'Crimes generate 33% less evidence'
  },
  'vending-machine': {
    id: 'vending-machine',
    visualConcept: 'Vending machine silhouette',
    accessibleLabel: 'Vending Machine',
    tooltip: 'Vending Machine: Automated after-hours sales',
    mechanic: 'Vending machine for automatic sales'
  },
  'vigilant': {
    id: 'vigilant',
    visualConcept: 'Eye/watchful symbol',
    accessibleLabel: 'Vigilant',
    tooltip: 'Vigilant: Never get robbed at night',
    mechanic: 'Prevents night robbery'
  },
  'well-connected': {
    id: 'well-connected',
    visualConcept: 'Network/connection nodes',
    accessibleLabel: 'Well Connected',
    tooltip: 'Well Connected: +15 reputation with all factions',
    mechanic: 'Start with +15 reputation across all factions'
  },
  'working-pipes': {
    id: 'working-pipes',
    visualConcept: 'Water pipe with flow',
    accessibleLabel: 'Working Pipes',
    tooltip: 'Working Pipes: Unlimited Rustwater from connected lines',
    mechanic: 'Water lines connected with unlimited Rustwater'
  },
  'handy': {
    id: 'handy',
    visualConcept: 'Toolbox with tools',
    accessibleLabel: 'Handy',
    tooltip: 'Handy: Start with shabby toolbox and tools',
    mechanic: 'Toolbox with screwdriver, wire cutter, crowbar, plasma cutter'
  },
  'lucky': {
    id: 'lucky',
    visualConcept: 'Four-leaf clover or horseshoe',
    accessibleLabel: 'Lucky',
    tooltip: 'Lucky: Increases luck (+5)',
    mechanic: 'Increases luck stat by +5'
  },
  'model-citizen': {
    id: 'model-citizen',
    visualConcept: 'Security badge/star',
    accessibleLabel: 'Model Citizen',
    tooltip: 'Model Citizen: +30 Security rep, +50% wanted rewards',
    mechanic: '+30 Security reputation, +50% wanted list rewards'
  },
  'proficient-scavenger': {
    id: 'proficient-scavenger',
    visualConcept: 'Magnifying glass over items',
    accessibleLabel: 'Proficient Scavenger',
    tooltip: 'Proficient Scavenger: +2 Dumping Grounds searches',
    mechanic: '2 additional searches in Dumping Grounds'
  },
  'revolution-sympathizer': {
    id: 'revolution-sympathizer',
    visualConcept: 'Raised fist symbol',
    accessibleLabel: 'Revolution Sympathizer',
    tooltip: 'Revolution Sympathizer: +25 Revolution reputation',
    mechanic: '+25 Revolution reputation, more Revolution requests'
  },
  'savings': {
    id: 'savings',
    visualConcept: 'Credit/coin stack',
    accessibleLabel: 'Savings',
    tooltip: 'Savings: Start with +150 Credits',
    mechanic: 'Additional 150 starting credits'
  },
  'sawyers-crew': {
    id: 'sawyers-crew',
    visualConcept: 'Underground/basement door',
    accessibleLabel: "Sawyer's Crew",
    tooltip: "Sawyer's Crew: Underground Exchange access, free janitorial",
    mechanic: 'Underground Exchange access, free janitorial service'
  },
  'secret-admirer': {
    id: 'secret-admirer',
    visualConcept: 'Gift box with heart',
    accessibleLabel: 'Secret Admirer',
    tooltip: 'Secret Admirer: Random gifts when opening store',
    mechanic: 'Occasional random items from secret admirer'
  },
  'short-sleeper': {
    id: 'short-sleeper',
    visualConcept: 'Person with energy/alert symbol',
    accessibleLabel: 'Short Sleeper',
    tooltip: 'Short Sleeper: Retain customers after night out',
    mechanic: 'No customer loss from after-hours activities'
  },
  'sycophant': {
    id: 'sycophant',
    visualConcept: 'Fancy hat or upper-class symbol',
    accessibleLabel: 'Sycophant',
    tooltip: 'Sycophant: +15 Upper Levels rep, +25% rep gain, +10% budget',
    mechanic: '+15 Upper Levels rep, +25% rep gain, +10% customer budget'
  },
  'tapehead': {
    id: 'tapehead',
    visualConcept: 'Cassette tape',
    accessibleLabel: 'Tapehead',
    tooltip: 'Tapehead: Start with all music cassettes',
    mechanic: 'All cassettes available in player at start'
  },
  'tinkerer': {
    id: 'tinkerer',
    visualConcept: 'Wrench with gear/upgrade arrow',
    accessibleLabel: 'Tinkerer',
    tooltip: 'Tinkerer: 20% chance to save upgrade material',
    mechanic: '20% chance upgrade material not consumed'
  },
  'welfare-program': {
    id: 'welfare-program',
    visualConcept: 'Food stamp/ticket',
    accessibleLabel: 'Welfare Program',
    tooltip: 'Welfare Program: Commissary access, Monday food stamps',
    mechanic: 'Commissary access, weekly food stamps based on wealth'
  },
  'wilds-favorite': {
    id: 'wilds-favorite',
    visualConcept: 'Shop/network discount tag',
    accessibleLabel: "Wild's Favorite",
    tooltip: "Wild's Favorite: -10% network upgrades, -50% insurance",
    mechanic: "-10% Wild's Network costs, -50% insurance costs"
  },

  // Neutral perks
  'aug-menace': {
    id: 'aug-menace',
    visualConcept: 'Augmented person silhouette with target',
    accessibleLabel: 'Aug Menace',
    tooltip: 'Aug Menace: Aug content unlocked, +25% aug kill rewards',
    mechanic: 'Augmented content unlocked, +25% aug kill credits'
  },
  'colorful-character': {
    id: 'colorful-character',
    visualConcept: 'Three additional perk slot boxes',
    accessibleLabel: 'Colorful Character',
    tooltip: 'Colorful Character: +3 perk slots',
    mechanic: 'Allows 3 additional starting perk slots'
  },
  'makeshift-reactor': {
    id: 'makeshift-reactor',
    visualConcept: 'Nuclear reactor/atom symbol',
    accessibleLabel: 'Makeshift Reactor',
    tooltip: 'Makeshift Reactor: Off-grid power, no blackouts',
    mechanic: 'Off-grid reactor, immune to blackouts, needs repairs'
  },
  'careful-scavenger': {
    id: 'careful-scavenger',
    visualConcept: 'Shield protecting person',
    accessibleLabel: 'Careful Scavenger',
    tooltip: 'Careful Scavenger: No injury, -2 searches',
    mechanic: 'No scavenging injuries, 2 fewer Dumping Grounds searches'
  },
  'hoarder': {
    id: 'hoarder',
    visualConcept: 'Pile of clutter/debris',
    accessibleLabel: 'Hoarder',
    tooltip: 'Hoarder: Start with 3 piles of removable debris',
    mechanic: 'Three immovable debris piles at inventory bottom'
  },
  'prime-real-estate': {
    id: 'prime-real-estate',
    visualConcept: 'Person entering store door',
    accessibleLabel: 'Prime Real Estate',
    tooltip: 'Prime Real Estate: +1 customer/day, +75 rent',
    mechanic: '+1 daily customer, +75 credits starting rent'
  },

  // Negative perks
  'ascetic': {
    id: 'ascetic',
    visualConcept: 'Small/narrow inventory grid',
    accessibleLabel: 'Ascetic',
    tooltip: 'Ascetic: Inventory reduced to 16x10',
    mechanic: 'Main inventory reduced from 24x10 to 16x10'
  },
  'awful-negotiator': {
    id: 'awful-negotiator',
    visualConcept: 'Speech bubble with X',
    accessibleLabel: 'Awful Negotiator',
    tooltip: 'Awful Negotiator: No bargaining, +5% trade penalty',
    mechanic: 'Cannot bargain, 5% permanent trade penalty'
  },
  'sentinel-collapse-disorder': {
    id: 'sentinel-collapse-disorder',
    visualConcept: 'Syringe/medical injection',
    accessibleLabel: 'Sentinel Collapse Disorder',
    tooltip: 'Sentinel Collapse Disorder: Weekly Immunivax required',
    mechanic: 'Deadly condition, requires weekly injection'
  },
  'blabbermouth': {
    id: 'blabbermouth',
    visualConcept: 'Open mouth talking with evidence',
    accessibleLabel: 'Blabbermouth',
    tooltip: 'Blabbermouth: +33% crime evidence, -50% Black Market/Revolution rep',
    mechanic: '+33% crime evidence, -50% Black Market/Revolution reputation gain'
  },
  'blackmail': {
    id: 'blackmail',
    visualConcept: 'Envelope with threat/secret symbol',
    accessibleLabel: 'Blackmail',
    tooltip: 'Blackmail: Weekly payment or reputation loss',
    mechanic: 'Weekly fee to blackmailer or major reputation loss'
  },
  'known-snitch': {
    id: 'known-snitch',
    visualConcept: 'Wanted poster with slash/ban',
    accessibleLabel: 'Known Snitch',
    tooltip: 'Known Snitch: No wanted customers, -10 Revolution/Black Market rep',
    mechanic: 'Wanted customers never visit, -10 Revolution/Black Market rep'
  },
  'maimed': {
    id: 'maimed',
    visualConcept: 'Dumping ground with X/ban',
    accessibleLabel: 'Maimed',
    tooltip: 'Maimed: Cannot scavenge at all',
    mechanic: 'Dumping Ground unavailable, no scavenging'
  },
  'minimalist': {
    id: 'minimalist',
    visualConcept: 'Medium-width inventory grid',
    accessibleLabel: 'Minimalist',
    tooltip: 'Minimalist: Inventory reduced to 20x10',
    mechanic: 'Main inventory reduced from 24x10 to 20x10'
  },
  'public-enemy': {
    id: 'public-enemy',
    visualConcept: 'Target/crosshair symbol',
    accessibleLabel: 'Public Enemy',
    tooltip: 'Public Enemy: -15 reputation with all factions',
    mechanic: 'Start with -15 reputation across all factions'
  },
  'agoraphobia': {
    id: 'agoraphobia',
    visualConcept: 'Person anxious in doorway',
    accessibleLabel: 'Agoraphobia',
    tooltip: 'Agoraphobia: Must rest 2 nights after going out',
    mechanic: 'Requires 2-night rest after after-hours activities'
  },
  'alcohol-addiction': {
    id: 'alcohol-addiction',
    visualConcept: 'Bottle/drink with dependency symbol',
    accessibleLabel: 'Alcohol Addiction',
    tooltip: 'Alcohol Addiction: +8% trade penalty without alcohol',
    mechanic: '8% trade penalty during alcohol withdrawal'
  },
  'bad-lease': {
    id: 'bad-lease',
    visualConcept: 'Contract/lease with high price',
    accessibleLabel: 'Bad Lease',
    tooltip: 'Bad Lease: +40 starting rent',
    mechanic: 'Starting rent increased by 40 credits'
  },
  'banned-from-the-commissary': {
    id: 'banned-from-the-commissary',
    visualConcept: 'Store/commissary with ban symbol',
    accessibleLabel: 'Banned from the Commissary',
    tooltip: 'Banned from the Commissary: No commissary or food stamps',
    mechanic: 'Commissary unavailable, no food stamps'
  },
  'convict': {
    id: 'convict',
    visualConcept: 'Prison bars or criminal record',
    accessibleLabel: 'Convict',
    tooltip: 'Convict: -30 Security rep, -25% wanted rewards',
    mechanic: '-30 Security reputation, -25% wanted list rewards'
  },
  'degenerative-osteoarthritis': {
    id: 'degenerative-osteoarthritis',
    visualConcept: 'Person with declining ability meter',
    accessibleLabel: 'Degenerative Osteoarthritis',
    tooltip: 'Degenerative Osteoarthritis: Weekly scavenging decline',
    mechanic: 'Scavenging max attempts decrease weekly'
  },
  'gambling-addiction': {
    id: 'gambling-addiction',
    visualConcept: 'Dice or lottery ticket',
    accessibleLabel: 'Gambling Addiction',
    tooltip: 'Gambling Addiction: Compulsory lottery purchases',
    mechanic: 'Must buy lottery tickets, lottery content unlocked'
  },
  'illiterate': {
    id: 'illiterate',
    visualConcept: 'Book with X/ban',
    accessibleLabel: 'Illiterate',
    tooltip: 'Illiterate: Cannot read guides',
    mechanic: 'Unable to read any game guides'
  },
  'narcotic-addiction': {
    id: 'narcotic-addiction',
    visualConcept: 'Pills with dependency symbol',
    accessibleLabel: 'Narcotic Addiction',
    tooltip: 'Narcotic Addiction: +8% trade penalty without narcotics',
    mechanic: '8% trade penalty during narcotic withdrawal'
  },
  'nicotine-addiction': {
    id: 'nicotine-addiction',
    visualConcept: 'Cigarette with dependency symbol',
    accessibleLabel: 'Nicotine Addiction',
    tooltip: 'Nicotine Addiction: +8% trade penalty without nicotine',
    mechanic: '8% trade penalty during nicotine withdrawal'
  },
  'on-wilds-bad-side': {
    id: 'on-wilds-bad-side',
    visualConcept: 'Shop with high price/penalty',
    accessibleLabel: "On Wild's Bad Side",
    tooltip: "On Wild's Bad Side: +10% network upgrades, +50% insurance",
    mechanic: "+10% Wild's Network costs, +50% insurance costs"
  },
  'side-street': {
    id: 'side-street',
    visualConcept: 'Empty store or person leaving',
    accessibleLabel: 'Side Street',
    tooltip: 'Side Street: -1 customer per day',
    mechanic: 'One less random customer daily'
  },
  'unlucky': {
    id: 'unlucky',
    visualConcept: 'Broken horseshoe or bad luck symbol',
    accessibleLabel: 'Unlucky',
    tooltip: 'Unlucky: Decreases luck (-5)',
    mechanic: 'Decreases luck stat by -5'
  }
};

/**
 * Validates that all perk IDs have icon concepts.
 */
export function validateIconCoverage(perkIds: string[]): { missing: string[]; covered: number } {
  const missing = perkIds.filter(id => !PERK_CONCEPTS[id]);
  return { missing, covered: perkIds.length - missing.length };
}
