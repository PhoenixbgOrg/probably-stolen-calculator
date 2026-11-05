import type { Violation } from '../engine/types';

export type Screen = 'spec' | 'perks' | 'overview';

const SPEC_CODES = new Set(['no-specialization', 'unknown-specialization', 'specialization-unavailable']);

/** The screen where the first violation can be fixed: Specialization for specialization problems, else Perks. */
export function fixScreenFor(violations: readonly Violation[]): Screen {
  return violations.some((v) => SPEC_CODES.has(v.code)) ? 'spec' : 'perks';
}

/** Message shown whenever navigation to the Overview is refused (Continue button and step bar alike). */
export function blockedMessage(violations: readonly Violation[]): string {
  const where = fixScreenFor(violations) === 'spec' ? 'Specialization' : 'Starting Perks';
  return `Cannot open the Overview: the build is invalid (${violations.length} problem${violations.length === 1 ? '' : 's'}). ${violations.map((v) => v.message).join(' ')} Fix it on the ${where} screen.`;
}

/**
 * Continue gating. Like the game ("Continue validates the selection"), the Overview can only be opened when the build
 * is valid. Used by both the Continue button and the step bar.
 */
export function navigate(target: Screen, violations: readonly Violation[]): { screen: Screen; blocked: boolean; message: string | null } {
  if (target === 'overview' && violations.length > 0) return { screen: fixScreenFor(violations), blocked: true, message: blockedMessage(violations) };
  return { screen: target, blocked: false, message: null };
}

/** Roving-focus index for a radiogroup: arrows wrap, Home/End jump. Returns null for keys it does not handle. */
export function rovingIndex(current: number, key: string, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowRight': case 'ArrowDown': return (current + 1) % count;
    case 'ArrowLeft': case 'ArrowUp': return (current - 1 + count) % count;
    case 'Home': return 0;
    case 'End': return count - 1;
    default: return null;
  }
}

/** Top-level page from the URL hash (hash routing: survives refresh/deep links under any sub-path, no 404 fallback needed). */
export type Page = 'builder' | 'sources';
export const pageFromHash = (hash: string): Page => (hash.replace(/^#\/?/, '').split(/[?/]/)[0] === 'sources' ? 'sources' : 'builder');
