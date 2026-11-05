import { getPerk } from '../data/registry';
import type { GameDataRegistry, PerkDef } from '../data/types';
import type { AutoRemoval, PerkEvaluation, Playthrough, Rejection } from './types';

/**
 * The perk-selection engine. Pure functions only; no React, no storage.
 *
 * Rules (see docs/RESEARCH.md for sources):
 *  - Budget = base points (3) + points granted by negative perks + any `perkPoints` modifiers.
 *  - Spent = sum of positive costs. Remaining must stay >= 0.
 *  - Every perk takes one slot. Max slots = base slots (4) + `perkSlots` modifiers (Colorful Character +3).
 *  - Mutually exclusive pairs cannot both be selected.
 *  - Prerequisites (`requires`) must already be selected (none documented in 1.0; supported for data).
 *  - On a first playthrough the perk panel is locked.
 */

function perkName(reg: GameDataRegistry, id: string): string {
  return getPerk(reg, id)?.name ?? id;
}

function sumStat(perks: PerkDef[], stat: 'perkSlots' | 'perkPoints'): number {
  let total = 0;
  for (const p of perks) for (const m of p.modifiers) if (m.stat === stat && m.op === 'add' && m.value !== null) total += m.value;
  return total;
}

export function conflictsOf(reg: GameDataRegistry, perkId: string): string[] {
  const out: string[] = [];
  for (const rule of reg.rules.exclusions) {
    if (rule.perks[0] === perkId) out.push(rule.perks[1]);
    else if (rule.perks[1] === perkId) out.push(rule.perks[0]);
  }
  return out;
}

export function evaluatePerks(reg: GameDataRegistry, perkIds: readonly string[]): PerkEvaluation {
  const perks = perkIds.map((id) => getPerk(reg, id)).filter((p): p is PerkDef => p !== undefined);
  const basePoints = reg.rules.basePoints.value ?? 0;
  const baseSlots = reg.rules.baseSlots.value ?? 0;
  let granted = 0;
  let spent = 0;
  for (const p of perks) {
    const c = p.cost.value ?? 0;
    if (c < 0) granted += -c;
    else spent += c;
  }
  granted += sumStat(perks, 'perkPoints');
  const totalPoints = basePoints + granted;
  const maxSlots = baseSlots + sumStat(perks, 'perkSlots');
  const problems: Rejection[] = [];
  const remainingPoints = totalPoints - spent;
  if (remainingPoints < 0) problems.push({ code: 'not-enough-points', message: `Perks cost ${spent} points but only ${totalPoints} are available.` });
  if (perkIds.length > maxSlots) problems.push({ code: 'no-free-slot', message: `${perkIds.length} perks selected but only ${maxSlots} slots are available.` });
  const set = new Set(perkIds);
  for (const id of perkIds) {
    const p = getPerk(reg, id);
    if (!p) { problems.push({ code: 'unknown-perk', message: `Unknown perk "${id}".`, related: [id] }); continue; }
    for (const other of conflictsOf(reg, id)) {
      if (set.has(other) && id < other) problems.push({ code: 'conflict', message: `${p.name} and ${perkName(reg, other)} are mutually exclusive.`, related: [id, other] });
    }
    for (const r of p.requires) if (!set.has(r)) problems.push({ code: 'missing-prerequisite', message: `${p.name} requires ${perkName(reg, r)}.`, related: [id, r] });
  }
  if (new Set(perkIds).size !== perkIds.length) problems.push({ code: 'already-selected', message: 'A perk is selected more than once.' });
  return { basePoints, pointsGranted: granted, pointsSpent: spent, totalPoints, remainingPoints, baseSlots, maxSlots, usedSlots: perkIds.length, valid: problems.length === 0, problems };
}

/** All reasons why `perkId` cannot be added to `current`. Empty array = allowed. */
export function whyCannotAdd(reg: GameDataRegistry, current: readonly string[], perkId: string, playthrough: Playthrough): Rejection[] {
  const perk = getPerk(reg, perkId);
  if (!perk) return [{ code: 'unknown-perk', message: `Unknown perk "${perkId}".` }];
  const reasons: Rejection[] = [];
  if (playthrough === 'first' && reg.rules.firstRunLocksPerks.value === true) {
    reasons.push({ code: 'first-run-locked', message: 'Starting perks are not available on a first playthrough.' });
  }
  if (current.includes(perkId)) reasons.push({ code: 'already-selected', message: `${perk.name} is already selected.` });
  if (perk.cost.value === null) reasons.push({ code: 'unknown-cost', message: `${perk.name} has no verified point cost, so it cannot be selected.` });
  const conflicting = conflictsOf(reg, perkId).filter((id) => current.includes(id));
  if (conflicting.length > 0) {
    reasons.push({ code: 'conflict', message: `Cannot be combined with ${conflicting.map((id) => perkName(reg, id)).join(', ')}.`, related: conflicting });
  }
  const missing = perk.requires.filter((id) => !current.includes(id));
  if (missing.length > 0) reasons.push({ code: 'missing-prerequisite', message: `Requires ${missing.map((id) => perkName(reg, id)).join(', ')}.`, related: missing });
  if (!current.includes(perkId)) {
    const after = evaluatePerks(reg, [...current, perkId]);
    if (after.usedSlots > after.maxSlots) {
      const now = evaluatePerks(reg, current);
      reasons.push({ code: 'no-free-slot', message: `All ${now.maxSlots} perk slots are in use.` });
    }
    if (after.remainingPoints < 0) {
      const now = evaluatePerks(reg, current);
      reasons.push({ code: 'not-enough-points', message: `Costs ${perk.cost.value ?? '?'} point(s); only ${now.remainingPoints} remaining.` });
    }
  }
  return reasons;
}

export type AddResult = { ok: true; perkIds: string[] } | { ok: false; reasons: Rejection[] };

export function addPerk(reg: GameDataRegistry, current: readonly string[], perkId: string, playthrough: Playthrough): AddResult {
  const reasons = whyCannotAdd(reg, current, perkId, playthrough);
  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true, perkIds: [...current, perkId] };
}

export interface NormalizeResult {
  perkIds: string[];
  removed: AutoRemoval[];
}

/**
 * Turns any list of perk ids into a valid selection, deterministically.
 * Used after every deselection, on playthrough changes, and when loading/importing saved data.
 *
 * Order of operations:
 *  1. Drop unknown ids, duplicates and perks with no verified cost.
 *  2. First playthrough: drop everything.
 *  3. Mutually exclusive pairs: keep the one selected earlier, drop the later one.
 *  4. Drop perks whose prerequisites are missing (repeated until stable).
 *  5. While slots are exceeded: drop the most recently selected perk (LIFO), then repeat step 4.
 *  6. While points are negative: drop the most recently selected perk that costs points, then repeat step 4.
 */
export function normalizeSelection(reg: GameDataRegistry, input: readonly string[], playthrough: Playthrough): NormalizeResult {
  const removed: AutoRemoval[] = [];
  const kept: string[] = [];
  for (const id of input) {
    const p = getPerk(reg, id);
    if (!p) { removed.push({ perkId: id, reason: { code: 'unknown-perk', message: `"${id}" is not a known perk in the current game data.` } }); continue; }
    if (kept.includes(id)) continue;
    if (p.cost.value === null) { removed.push({ perkId: id, reason: { code: 'unknown-cost', message: `${p.name} has no verified point cost.` } }); continue; }
    kept.push(id);
  }
  if (playthrough === 'first' && reg.rules.firstRunLocksPerks.value === true) {
    for (const id of kept) removed.push({ perkId: id, reason: { code: 'first-run-locked', message: 'Starting perks are not available on a first playthrough.' } });
    return { perkIds: [], removed };
  }
  let list: string[] = [];
  for (const id of kept) {
    const clash = conflictsOf(reg, id).find((o) => list.includes(o));
    if (clash) removed.push({ perkId: id, reason: { code: 'conflict', message: `${perkName(reg, id)} conflicts with ${perkName(reg, clash)}, which was selected first.`, related: [clash] } });
    else list.push(id);
  }
  const dropMissingPrereqs = () => {
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of list) {
        const p = getPerk(reg, id);
        const missing = p?.requires.filter((r) => !list.includes(r)) ?? [];
        if (missing.length > 0) {
          list = list.filter((x) => x !== id);
          removed.push({ perkId: id, reason: { code: 'missing-prerequisite', message: `${perkName(reg, id)} requires ${missing.map((m) => perkName(reg, m)).join(', ')}.`, related: missing } });
          changed = true;
          break;
        }
      }
    }
  };
  dropMissingPrereqs();
  for (let guard = 0; guard < 1000; guard++) {
    const ev = evaluatePerks(reg, list);
    if (ev.usedSlots > ev.maxSlots) {
      const id = list[list.length - 1]!;
      list = list.slice(0, -1);
      removed.push({ perkId: id, reason: { code: 'no-free-slot', message: `${perkName(reg, id)} no longer fits: only ${ev.maxSlots} slots are available.` } });
      dropMissingPrereqs();
      continue;
    }
    if (ev.remainingPoints < 0) {
      const idx = findLastIndex(list, (id) => (getPerk(reg, id)?.cost.value ?? 0) > 0);
      if (idx < 0) break; // cannot happen: negative remaining implies a positive cost exists
      const id = list[idx]!;
      list = list.filter((_, i) => i !== idx);
      removed.push({ perkId: id, reason: { code: 'not-enough-points', message: `${perkName(reg, id)} can no longer be afforded (${ev.totalPoints} points available, ${ev.pointsSpent} spent).` } });
      dropMissingPrereqs();
      continue;
    }
    break;
  }
  return { perkIds: list, removed };
}

function findLastIndex<T>(arr: readonly T[], pred: (x: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i]!)) return i;
  return -1;
}

/** Deselect a perk and cascade-remove anything that becomes invalid. */
export function removePerk(reg: GameDataRegistry, current: readonly string[], perkId: string, playthrough: Playthrough): NormalizeResult {
  return normalizeSelection(reg, current.filter((id) => id !== perkId), playthrough);
}

/** Preview what would be auto-removed if `perkId` were deselected (used for UI warnings). */
export function previewRemoval(reg: GameDataRegistry, current: readonly string[], perkId: string, playthrough: Playthrough): AutoRemoval[] {
  return removePerk(reg, current, perkId, playthrough).removed;
}
