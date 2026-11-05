import type { PerkDef } from '../data/types';

/** Plain-language cost label. Does not change the sourced cost; only explains it. */
export function perkCostLabel(p: PerkDef): string {
  const c = p.cost.value;
  const slots = p.modifiers.filter((m) => m.stat === 'perkSlots' && m.value !== null).reduce((a, m) => a + (m.value ?? 0), 0);
  const base = c === null ? 'cost unknown' : c > 0 ? `costs ${c} point${c === 1 ? '' : 's'}` : c < 0 ? `grants ${-c} point${c === -1 ? '' : 's'}` : 'free (still uses a slot)';
  return slots > 0 ? `${base}, adds ${slots} slot${slots === 1 ? '' : 's'}` : base;
}

import type { GameDataRegistry } from '../data/types';

/** Plain explanation of why the app locks perks on a first playthrough, naming the sources and their status. */
export function firstRunExplanation(reg: GameDataRegistry): string {
  const p = reg.rules.firstRunLocksPerks;
  const names = [...new Set(p.sources.map((s) => reg.sources[s]?.publisher ?? s))];
  return `This app locks Starting Perks when "First playthrough" is selected, because these sources say the game does not offer Starting Perks on the first run: ${names.join('; ')}. Status: ${p.status} (not confirmed in-game by this project). Choose "New Game+ / later run" to plan perks.`;
}
