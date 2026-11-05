/**
 * Core types for profession calculators.
 * Each calculator implements production economics for a specific profession.
 * All values must be verified from game data; no placeholder calculations.
 */

import type { Difficulty } from '../data/types';
import type { CharacterConfig } from '../engine/character';

/**
 * Equipment item that can be purchased and used in production.
 */
export interface Equipment {
  id: string;
  name: string;
  /** Purchase cost in credits. */
  baseCost: number;
  /** Durability if applicable. */
  durability?: { max: number; current: number };
  /** Module slots if applicable. */
  moduleSlots?: number;
  /** Equipment condition/quality tier. */
  condition?: 'shabby' | 'poor' | 'fair' | 'good' | 'new';
}

/**
 * Module that can be placed in equipment.
 */
export interface Module {
  id: string;
  name: string;
  baseCost: number;
  /** Equipment types this module is compatible with. */
  compatibleWith: string[];
}

/**
 * Material required for production.
 */
export interface Material {
  id: string;
  name: string;
  /** Purchase cost per unit. */
  unitCost: number;
  /** Where this material can be obtained. */
  sources: string[];
}

/**
 * Production output item.
 */
export interface Product {
  id: string;
  name: string;
  /** Base selling price. */
  basePrice: number;
  /** Quality tiers if applicable. */
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

/**
 * Production recipe: inputs -> output.
 */
export interface Recipe {
  id: string;
  productId: string;
  /** Required materials with quantities. */
  materials: Array<{ materialId: string; quantity: number }>;
  /** Required equipment. */
  equipmentIds: string[];
  /** Production time in in-game time units. */
  productionTime?: number;
  /** Yield (units produced per recipe execution). */
  yield: number;
}

/**
 * Calculator input: what the player wants to achieve.
 */
export interface CalculatorInput {
  /** Selected equipment and modules. */
  equipment: Array<{ equipmentId: string; moduleIds: string[] }>;
  /** Production target: what to produce and how much. */
  target: { productId: string; quantity: number };
  /** Budget constraints. */
  budget?: {
    maxInitialInvestment?: number;
    maxOperatingCost?: number;
  };
  /** Difficulty and character modifiers. */
  difficulty: Difficulty;
  /** Optional: character build for specialization bonuses. */
  character?: CharacterConfig;
}

/**
 * Calculator output: costs, materials, profitability.
 */
export interface CalculatorOutput {
  /** Equipment purchase costs. */
  equipmentCosts: Array<{ equipmentId: string; cost: number }>;
  /** Module costs. */
  moduleCosts: Array<{ moduleId: string; cost: number }>;
  /** Total initial investment. */
  totalInitialInvestment: number;
  /** Required materials per production cycle. */
  materialsPerCycle: Array<{ materialId: string; quantity: number; cost: number }>;
  /** Expected output per cycle. */
  outputPerCycle: { productId: string; quantity: number; quality?: string };
  /** Estimated revenue per cycle. */
  revenuePerCycle: number;
  /** Estimated cost per cycle (materials + operations). */
  costPerCycle: number;
  /** Profit per cycle. */
  profitPerCycle: number;
  /** Limitations and warnings. */
  limitations: string[];
  /** Source references for calculations. */
  sourceRefs: string[];
}

/**
 * Calculator module interface.
 * Each profession implements this to provide calculation logic.
 */
export interface ProfessionCalculator {
  professionId: string;
  professionName: string;
  /** Available equipment for this profession. */
  equipment: Equipment[];
  /** Available modules. */
  modules: Module[];
  /** Materials used in this profession. */
  materials: Material[];
  /** Producible items. */
  products: Product[];
  /** Production recipes. */
  recipes: Recipe[];
  /** Calculate production economics. */
  calculate(input: CalculatorInput): CalculatorOutput;
  /** Validate input and return errors if any. */
  validate(input: CalculatorInput): string[];
}

/**
 * Profession definition for routing and display.
 */
export interface ProfessionDef {
  id: string;
  name: string;
  tag: string | null;
  /** Whether the calculator is implemented (false = show Coming Soon). */
  implemented: boolean;
}
