import type { GameDataRegistry, StatKey, FlagKey } from '../data/types';
import type { CharacterConfig, ModifierQuery } from '../engine/character';

/**
 * Extension point for future profession calculators (chemistry, water, farming, breeding,
 * manufacturing, trading, profitability). NOT implemented in Phase 1 - only the contract.
 *
 * Rules for implementers:
 *  - Read game data only from `ctx.registry` (the shared verified registry).
 *  - Read character effects only via `ctx.modifiers`; never re-implement perk logic.
 *  - Keep formulas in pure functions, outside React components, with tests.
 *  - Propagate verification status: a result built on unverified inputs must say so.
 */
export interface CalculatorContext {
  registry: GameDataRegistry;
  character: CharacterConfig;
  modifiers: ModifierQuery;
}

export interface CalculatorModule<Input, Output> {
  id: string;
  name: string;
  /** Specializations this calculator is primarily for (empty = all). */
  specializations: string[];
  /** Declares which stats/flags it reads, so the UI can list relevant perks. */
  readsStats: StatKey[];
  readsFlags: FlagKey[];
  compute(ctx: CalculatorContext, input: Input): Output;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCalculator = CalculatorModule<any, any>;

const calculators: AnyCalculator[] = [];

export function registerCalculator(c: AnyCalculator): void {
  if (calculators.some((x) => x.id === c.id)) throw new Error(`Calculator ${c.id} already registered`);
  calculators.push(c);
}

export function listCalculators(): readonly AnyCalculator[] {
  return calculators;
}
