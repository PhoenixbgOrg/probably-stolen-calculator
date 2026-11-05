import type { FlagKey } from './types';

/**
 * Human-readable labels for gameplay flags. Each label restates the perk text the flag was derived from
 * (see perks.ts); it adds no new game facts. Record<FlagKey, ...> makes the compiler require a label for every flag.
 */
export const FLAG_LABELS: Record<FlagKey, string> = {
  noNightRobbery: 'Never robbed during the night',
  vendingMachine: 'Starts with a vending machine',
  waterLinesConnected: 'Water lines connected from the start',
  shabbyToolbox: 'Starts with a shabby toolbox and shabby tools',
  undergroundExchangeAtStart: 'Underground Exchange available from the start',
  freeJanitorialService: 'Janitorial Service is free',
  commissaryAtStart: 'Commissary available from the start',
  commissaryBanned: 'Banned from the Commissary',
  allCassettes: 'All music cassettes in the cassette player at start',
  offGridReactor: 'Off the station power grid (not affected by blackouts)',
  augContentAtStart: 'Augmented content unlocked from the start',
  noScavenging: 'Cannot scavenge',
  noBargaining: 'Cannot bargain with customers',
  cannotReadGuides: 'Cannot read guides',
  noWantedCustomers: 'Wanted-poster customers never visit',
  lotteryUnlocked: 'Lottery content unlocked; always buys lottery tickets',
  weeklyImmunivaxRequired: 'Weekly Immunivax shot required',
  blackmailWeeklyFee: 'Weekly blackmail payment',
  noInjuryWhileScavenging: 'No injuries while scavenging',
  retainCustomersAfterNightOut: 'Keeps customers after a night out',
  secretAdmirerGifts: 'Occasional random items from a secret admirer',
  agoraphobiaRest: 'Must rest 2 nights at the Store between after-hours outings',
  addictionAlcohol: 'Alcohol addiction',
  addictionNarcotic: 'Narcotic addiction',
  addictionNicotine: 'Nicotine addiction',
  scavengingDeclinesWeekly: 'Scavenging attempts decline each week',
  inventoryDebris: 'Inventory starts with three removable debris piles',
  luckIncreased: 'Luck increased',
  luckDecreased: 'Luck decreased',
};

export function flagLabel(flag: string): string {
  return (FLAG_LABELS as Record<string, string>)[flag] ?? flag.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}
