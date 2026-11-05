import type { Difficulty } from '../data/types';

export type Playthrough = 'first' | 'subsequent';

/** The minimal, serialisable description of a build. Everything else is derived from it. */
export interface BuildInput {
  specializationId: string | null;
  /** Perk ids in selection order (order matters for deterministic cascade removal). */
  perkIds: string[];
  playthrough: Playthrough;
  difficulty: Difficulty;
}

export const EMPTY_BUILD: BuildInput = {
  specializationId: null,
  perkIds: [],
  playthrough: 'subsequent',
  difficulty: 'mark-up',
};

export type RejectionCode =
  | 'unknown-perk'
  | 'already-selected'
  | 'first-run-locked'
  | 'unknown-cost'
  | 'conflict'
  | 'missing-prerequisite'
  | 'no-free-slot'
  | 'not-enough-points';

export interface Rejection {
  code: RejectionCode;
  message: string;
  /** Related perk ids (e.g. the conflicting perk). */
  related?: string[];
}

export interface PerkEvaluation {
  basePoints: number;
  pointsGranted: number;
  pointsSpent: number;
  /** basePoints + pointsGranted */
  totalPoints: number;
  remainingPoints: number;
  baseSlots: number;
  maxSlots: number;
  usedSlots: number;
  valid: boolean;
  problems: Rejection[];
}

export interface AutoRemoval {
  perkId: string;
  reason: Rejection;
}
