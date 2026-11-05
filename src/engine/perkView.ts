import type { GameDataRegistry, PerkDef } from '../data/types';
import { addBlockers, conflictsOf, togglePerk, validate } from './perkEngine';
import type { BuildInput, Rejection, Violation } from './types';

/**
 * What the explicit Add/Remove button in the perk description panel does for one perk.
 * Viewing a perk never changes the build; only this action does (and only through the existing togglePerk logic).
 */
export interface PerkActionView {
  perk: PerkDef;
  selected: boolean;
  /** 'add' | 'remove' are allowed; 'blocked' means adding is refused (e.g. first playthrough). */
  kind: 'add' | 'remove' | 'blocked';
  label: string;
  /** Why adding is refused (kind === 'blocked'). */
  blockers: Rejection[];
  /** Rules the build would break after the action (new violations only). Adding is still allowed, like the game. */
  wouldBreak: Violation[];
  /** Problems this perk currently causes (when selected). */
  currentProblems: Violation[];
  /** Rules that removing it would fix. */
  removalFixes: Violation[];
  /** Ids of mutually exclusive perks, and which of them are selected. */
  exclusive: string[];
  exclusiveSelected: string[];
}

const key = (v: Violation) => `${v.code}|${v.message}`;

export function perkActionView(reg: GameDataRegistry, build: BuildInput, perkId: string): PerkActionView | null {
  const perk = reg.perks.find((p) => p.id === perkId);
  if (!perk) return null;
  const selected = build.perkIds.includes(perkId);
  const now = validate(reg, build);
  const nowKeys = new Set(now.map(key));
  const exclusive = conflictsOf(reg, perkId);
  const exclusiveSelected = exclusive.filter((o) => build.perkIds.includes(o));
  const currentProblems = selected ? now.filter((v) => v.perkIds.includes(perkId)) : [];
  if (selected) {
    const after = validate(reg, { ...build, perkIds: togglePerk(build.perkIds, perkId) });
    const afterKeys = new Set(after.map(key));
    return {
      perk, selected, kind: 'remove', label: 'Remove perk', blockers: [],
      wouldBreak: after.filter((v) => !nowKeys.has(key(v))),
      currentProblems, removalFixes: now.filter((v) => !afterKeys.has(key(v))), exclusive, exclusiveSelected,
    };
  }
  const blockers = addBlockers(reg, build.perkIds, perkId, build.playthrough);
  if (blockers.length > 0) {
    return { perk, selected, kind: 'blocked', label: 'Cannot add', blockers, wouldBreak: [], currentProblems, removalFixes: [], exclusive, exclusiveSelected };
  }
  const after = validate(reg, { ...build, perkIds: togglePerk(build.perkIds, perkId) });
  const wouldBreak = after.filter((v) => !nowKeys.has(key(v)));
  return {
    perk, selected, kind: 'add', label: wouldBreak.length ? 'Add perk anyway (build becomes invalid)' : 'Add perk',
    blockers, wouldBreak, currentProblems, removalFixes: [], exclusive, exclusiveSelected,
  };
}

/** Grid ordering helper: perks by their explicit `order` field. */
export function perksInOrder(reg: GameDataRegistry): PerkDef[] {
  return [...reg.perks].sort((a, b) => a.order - b.order);
}

/**
 * The "Cannot open the Overview" banner belongs to one profile and one invalid state. It must be cleared when the
 * active profile changes or the build becomes valid.
 */
export function shouldClearBlockedBanner(bannerProfileId: string | null, activeProfileId: string | null, valid: boolean): boolean {
  return valid || bannerProfileId !== activeProfileId;
}
