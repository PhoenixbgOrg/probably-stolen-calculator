import type { ProfessionDef } from './types';

/**
 * All profession calculators.
 * Order matches game start-screen order.
 * Junker excluded (WIP in game, not selectable).
 */
export const PROFESSIONS: readonly ProfessionDef[] = [
  { id: 'chemist', name: 'Chemist', tag: 'Advanced Start', implemented: true },
  { id: 'water-merchant', name: 'Water Merchant', tag: null, implemented: true },
  { id: 'hydroponic-farmer', name: 'Hydroponic Farmer', tag: 'Advanced Start', implemented: true },
  { id: 'aquafarmer', name: 'Aquafarmer', tag: 'Advanced Start', implemented: true },
  { id: 'rat-wrangler', name: 'Rat Wrangler', tag: 'Advanced Start', implemented: true },
  { id: 'gunsmith', name: 'Gunsmith', tag: 'Advanced Start', implemented: true },
  { id: 'fence', name: 'Fence', tag: null, implemented: true },
  { id: 'apprentice', name: 'Apprentice', tag: 'Recommended For New Players', implemented: true },
  { id: 'rock-bottom', name: 'Rock Bottom', tag: 'Extreme Challenge Mode', implemented: true },
];

export function getProfession(id: string): ProfessionDef | undefined {
  return PROFESSIONS.find(p => p.id === id);
}
