import { getPerk } from '../data/registry';
import type { GameDataRegistry, PerkDef } from '../data/types';
import type { BuildInput, PerkEvaluation, Playthrough, Rejection, Violation } from './types';

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
 *
 * Like the game (user report for 100-REV6; nicokobo-starting-perks), a selection may temporarily break these
 * rules. Nothing is removed automatically: `togglePerk` only toggles, and `validate` reports what is wrong and
 * how to fix it. The UI blocks "Continue" while `validate` returns violations.
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

/** Pure toggle: removes the perk if selected, otherwise appends it. Never removes anything else. */
export function togglePerk(current: readonly string[], perkId: string): string[] {
  return current.includes(perkId) ? current.filter((id) => id !== perkId) : [...current, perkId];
}

/**
 * Reasons the UI refuses to *add* a perk at all (removal is always allowed).
 * Only things the game itself prevents: the locked first-run panel and perks that do not exist / have no known cost.
 * Points, slots and conflicts are NOT checked here; they are reported by `validate`.
 */
export function addBlockers(reg: GameDataRegistry, current: readonly string[], perkId: string, playthrough: Playthrough): Rejection[] {
  if (current.includes(perkId)) return [];
  const perk = getPerk(reg, perkId);
  if (!perk) return [{ code: 'unknown-perk', message: `Unknown perk "${perkId}".` }];
  const out: Rejection[] = [];
  if (playthrough === 'first' && reg.rules.firstRunLocksPerks.value === true) out.push({ code: 'first-run-locked', message: 'Starting perks are not available on a first playthrough.' });
  if (perk.cost.value === null) out.push({ code: 'unknown-cost', message: `${perk.name} has no verified point cost, so it cannot be selected.` });
  return out;
}

/** Validate a whole build. Returns every violation; an empty array means the build is valid. Pure. */
export function validate(reg: GameDataRegistry, build: BuildInput): Violation[] {
  const v: Violation[] = [];
  if (build.specializationId === null) {
    v.push({ code: 'no-specialization', message: 'No specialization is selected.', perkIds: [], fix: 'Choose a specialization.' });
  } else {
    const spec = reg.specializations.find((s) => s.id === build.specializationId);
    if (!spec) v.push({ code: 'unknown-specialization', message: `Unknown specialization "${build.specializationId}".`, perkIds: [], fix: 'Choose a specialization from the list.' });
    else if (!spec.playable) v.push({ code: 'specialization-unavailable', message: `${spec.name} is marked "Work in Progress" in the game and cannot be started.`, perkIds: [], fix: 'Choose a different specialization.' });
  }
  const ids = build.perkIds;
  const seen = new Set<string>();
  const dupes = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  if (dupes.length > 0) v.push({ code: 'already-selected', message: 'A perk is selected more than once.', perkIds: [...new Set(dupes)], fix: 'Deselect the duplicate.' });
  if (build.playthrough === 'first' && reg.rules.firstRunLocksPerks.value === true && ids.length > 0) {
    v.push({ code: 'first-run-locked', message: 'Starting perks are not available on a first playthrough.', perkIds: [...new Set(ids)], fix: 'Clear all perks, or switch to a later playthrough.' });
  }
  for (const id of new Set(ids)) {
    const p = getPerk(reg, id);
    if (!p) { v.push({ code: 'unknown-perk', message: `"${id}" is not a known perk in the current game data.`, perkIds: [id], fix: `Deselect "${id}".` }); continue; }
    if (p.cost.value === null) v.push({ code: 'unknown-cost', message: `${p.name} has no verified point cost.`, perkIds: [id], fix: `Deselect ${p.name}.` });
    for (const r of p.requires) if (!ids.includes(r)) v.push({ code: 'missing-prerequisite', message: `${p.name} requires ${perkName(reg, r)}.`, perkIds: [id, r], fix: `Select ${perkName(reg, r)} or deselect ${p.name}.` });
  }
  for (const rule of reg.rules.exclusions) {
    const [a, b] = rule.perks;
    if (ids.includes(a) && ids.includes(b)) {
      v.push({ code: 'conflict', message: `${perkName(reg, a)} and ${perkName(reg, b)} cannot be taken together.`, perkIds: [a, b], fix: `Deselect ${perkName(reg, a)} or ${perkName(reg, b)}.` });
    }
  }
  const ev = evaluatePerks(reg, ids);
  if (ev.remainingPoints < 0) {
    const costly = [...new Set(ids)].filter((id) => (getPerk(reg, id)?.cost.value ?? 0) > 0);
    v.push({ code: 'not-enough-points', message: `Perks cost ${ev.pointsSpent} points but only ${ev.totalPoints} are available (${ev.remainingPoints}).`,
      perkIds: costly, fix: `Free ${-ev.remainingPoints} point(s): deselect a positive perk or add a negative one.` });
  }
  if (ev.usedSlots > ev.maxSlots) {
    v.push({ code: 'no-free-slot', message: `${ev.usedSlots} perks selected but only ${ev.maxSlots} slots are available.`,
      perkIds: [...new Set(ids)], fix: `Deselect ${ev.usedSlots - ev.maxSlots} perk(s)${ids.includes('colorful-character') ? '' : ', or take Colorful Character for +3 slots'}.` });
  }
  return v;
}

export function isValid(reg: GameDataRegistry, build: BuildInput): boolean {
  return validate(reg, build).length === 0;
}

/** Perk ids that appear in at least one violation (for highlighting). */
export function offendingPerkIds(violations: readonly Violation[]): Set<string> {
  return new Set(violations.flatMap((x) => x.perkIds));
}
