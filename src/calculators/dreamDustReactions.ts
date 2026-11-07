import { takeProportionalMixture } from './dreamDustPlanner';
import {
  COMPONENT_KEYS,
  type ComponentMixture,
  emptyMixture,
  totalUL,
} from './dreamDustVerified';

export const REACTION_SOURCE_VERSION = '0.46D / Steam Build 26337366';
export const REACTION_SOURCE_URL = 'https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing';

export interface ReactionTick {
  tick: number;
  organicWasteMineralizedUL: number;
  microbesRemovedByReagentUL: number;
  stabilizerSettledUL: number;
  proteinPrecipitatedUL: number;
  acidConsumedByPrecipitationUL: number;
  baseConsumedByPrecipitationUL: number;
  fatRemovedUL: number;
  neutralizedUL: number;
  chlorineUsedUL: number;
  state: ComponentMixture;
  progressed: boolean;
}

export interface AcidBaseTreatmentResult {
  initial: ComponentMixture;
  final: ComponentMixture;
  ticks: ReactionTick[];
  stoppedBecause: 'updates-complete' | 'no-progress';
  unmodeledWarnings: string[];
  predictionBlocked: boolean;
  blockReasons: string[];
  sourceBoundary: string;
}

export interface DoseResult {
  ok: boolean;
  reason: string | null;
  dose: ComponentMixture;
  remaining: ComponentMixture;
}

function clone(mixture: ComponentMixture): ComponentMixture {
  return { ...mixture };
}

function subtractMixture(a: ComponentMixture, b: ComponentMixture): ComponentMixture {
  const out = emptyMixture();
  for (const key of COMPONENT_KEYS) out[key] = a[key] - b[key];
  return out;
}

export function chemistryPredictionBlockers(mixture: ComponentMixture): string[] {
  const reasons: string[] = [];
  if (mixture.other > 0) {
    reasons.push(
      'Other > 0 µL. Unmodeled volume may be Organic Waste, Stabilizer, Fat, Chlorine, Lipobond, or something else. Predicted confirmation is blocked. Enter a full measured composition to continue.',
    );
  }
  return reasons;
}

/**
 * Homogeneous dose from remaining stock. Every component scales; nothing is cherry-picked.
 * Remaining stock is the leftover bottle, not silently renormalized.
 */
export function takeReagentDose(stock: ComponentMixture, doseUL: number): DoseResult {
  const available = totalUL(stock);
  if (!Number.isInteger(doseUL) || doseUL < 0) {
    return { ok: false, reason: 'Dose must be a whole non-negative µL volume', dose: emptyMixture(), remaining: stock };
  }
  if (doseUL === 0) {
    return { ok: true, reason: null, dose: emptyMixture(), remaining: clone(stock) };
  }
  if (doseUL > available) {
    return {
      ok: false,
      reason: `Dose ${doseUL} µL exceeds remaining stock ${available} µL`,
      dose: emptyMixture(),
      remaining: clone(stock),
    };
  }
  const dose = takeProportionalMixture(stock, doseUL);
  return { ok: true, reason: null, dose, remaining: subtractMixture(stock, dose) };
}

function consumeAcidFirst(state: ComponentMixture, amount: number): void {
  const fromAcid = Math.min(state.acid, amount);
  state.acid -= fromAcid;
  state.base = Math.max(0, state.base - (amount - fromAcid));
}

/** Wiki branch 13. */
export function applyOrganicWasteMineralization(input: ComponentMixture): {
  output: ComponentMixture;
  processedUL: number;
} {
  const state = clone(input);
  const reagent = state.acid + state.base;
  if (reagent <= 0 || state.organicWaste <= 0) return { output: state, processedUL: 0 };
  const q = Math.min(state.organicWaste, 40 * reagent);
  const consume = Math.ceil(q / 40);
  consumeAcidFirst(state, consume);
  state.organicWaste -= q;
  state.mineral += Math.floor(q / 10);
  return { output: state, processedUL: q };
}

/** Wiki branch 14. Limiting factor 20, consumption divisor 100. */
export function applyAcidBaseMicrobeRemoval(input: ComponentMixture): {
  output: ComponentMixture;
  microbesRemovedUL: number;
} {
  const state = clone(input);
  const reagent = state.acid + state.base;
  if (reagent <= 0 || state.microbes <= 0) return { output: state, microbesRemovedUL: 0 };
  const q = Math.min(state.microbes, 20 * reagent);
  consumeAcidFirst(state, Math.ceil(q / 100));
  state.microbes -= q;
  return { output: state, microbesRemovedUL: q };
}

/** Wiki branch 15. */
export function applyStabilizerSedimentation(input: ComponentMixture): {
  output: ComponentMixture;
  settledUL: number;
} {
  const state = clone(input);
  const acidStart = state.acid;
  const baseStart = state.base;
  if (state.stabilizingAgent <= 0 || acidStart + baseStart <= 0) return { output: state, settledUL: 0 };
  const n = Math.min(acidStart + baseStart, state.stabilizingAgent);
  const q = Math.min(n, Math.max(1_000, Math.trunc(0.2 * n)));
  state.stabilizingAgent -= q;
  state.insolubleDebris += q;
  const acidLoss = Math.min(state.acid, Math.max(100, Math.trunc(0.05 * acidStart)));
  const baseLoss = Math.min(state.base, Math.max(100, Math.trunc(0.05 * baseStart)));
  state.acid -= acidLoss;
  state.base -= baseLoss;
  return { output: state, settledUL: q };
}

/**
 * Wiki branch 16: Protein precipitation.
 * Protein C>0 and Acid A ≠ Base B:
 *   n = min(|A-B|, C)
 *   q = min(n, max(1, trunc(0.2 n)))
 * Protein −q, Insoluble Debris +q, excess Acid or Base −q.
 */
export function applyProteinPrecipitation(input: ComponentMixture): {
  output: ComponentMixture;
  proteinPrecipitatedUL: number;
  acidConsumedUL: number;
  baseConsumedUL: number;
} {
  const state = clone(input);
  const protein = state.protein;
  const acid = state.acid;
  const base = state.base;
  if (protein <= 0 || acid === base) {
    return { output: state, proteinPrecipitatedUL: 0, acidConsumedUL: 0, baseConsumedUL: 0 };
  }
  const n = Math.min(Math.abs(acid - base), protein);
  const q = Math.min(n, Math.max(1, Math.trunc(0.2 * n)));
  state.protein -= q;
  state.insolubleDebris += q;
  if (acid > base) {
    state.acid -= q;
    return { output: state, proteinPrecipitatedUL: q, acidConsumedUL: q, baseConsumedUL: 0 };
  }
  state.base -= q;
  return { output: state, proteinPrecipitatedUL: q, acidConsumedUL: 0, baseConsumedUL: q };
}

/** Wiki branch 17. */
export function applyLipobondFatRemoval(input: ComponentMixture): {
  output: ComponentMixture;
  fatRemovedUL: number;
} {
  const state = clone(input);
  if (state.fatOil <= 0 || state.lipobondAgent <= 0) return { output: state, fatRemovedUL: 0 };
  const n = Math.min(state.fatOil, 8 * state.lipobondAgent);
  const q = Math.min(n, Math.max(1_000, Math.trunc(0.2 * n)));
  const c = Math.floor(q / 8);
  state.fatOil -= q;
  state.lipobondAgent -= c;
  state.insolubleDebris += q + c;
  return { output: state, fatRemovedUL: q };
}

/**
 * Wiki branch 18: Acid/Base neutralization.
 * A>0 and B>0: n = min(A,B); q = min(n, max(1000, trunc(0.1 n))); each loses q; no product.
 */
export function applyAcidBaseNeutralization(input: ComponentMixture): {
  output: ComponentMixture;
  neutralizedUL: number;
} {
  const state = clone(input);
  if (state.acid <= 0 || state.base <= 0) {
    return { output: state, neutralizedUL: 0 };
  }
  const n = Math.min(state.acid, state.base);
  const q = Math.min(n, Math.max(1_000, Math.trunc(0.1 * n)));
  state.acid -= q;
  state.base -= q;
  return { output: state, neutralizedUL: q };
}

/** Wiki branch 21. Floor uses trunc(total × 0.007). */
export function applyChlorineTreatment(input: ComponentMixture): {
  output: ComponentMixture;
  chlorineUsedUL: number;
} {
  const state = clone(input);
  if (state.chlorine <= 0 || state.water <= 0) return { output: state, chlorineUsedUL: 0 };
  const c = Math.min(state.chlorine, 15_000);
  let budget = Math.trunc(5.1 * c);
  const floor = Math.trunc(totalUL(state) * 0.007);
  const excessContaminant = Math.max(0, state.chemicalContaminant - floor);
  const fromContaminant = Math.min(excessContaminant, budget);
  state.chemicalContaminant -= fromContaminant;
  budget -= fromContaminant;
  const fromMicrobes = Math.min(state.microbes, budget);
  state.microbes -= fromMicrobes;
  state.chlorine -= c;
  const extra = Math.min(state.chlorine, Math.max(1_000, Math.trunc(0.2 * state.chlorine)));
  state.chlorine -= extra;
  return { output: state, chlorineUsedUL: c + extra };
}

export function runSourcedChemistryTick(input: ComponentMixture): ReactionTick {
  const organic = applyOrganicWasteMineralization(input);
  const microbes = applyAcidBaseMicrobeRemoval(organic.output);
  const stabilizer = applyStabilizerSedimentation(microbes.output);
  const precipitation = applyProteinPrecipitation(stabilizer.output);
  const fat = applyLipobondFatRemoval(precipitation.output);
  const neutralization = applyAcidBaseNeutralization(fat.output);
  const chlorine = applyChlorineTreatment(neutralization.output);
  const progressed =
    organic.processedUL +
      microbes.microbesRemovedUL +
      stabilizer.settledUL +
      precipitation.proteinPrecipitatedUL +
      fat.fatRemovedUL +
      neutralization.neutralizedUL +
      chlorine.chlorineUsedUL >
    0;
  return {
    tick: 1,
    organicWasteMineralizedUL: organic.processedUL,
    microbesRemovedByReagentUL: microbes.microbesRemovedUL,
    stabilizerSettledUL: stabilizer.settledUL,
    proteinPrecipitatedUL: precipitation.proteinPrecipitatedUL,
    acidConsumedByPrecipitationUL: precipitation.acidConsumedUL,
    baseConsumedByPrecipitationUL: precipitation.baseConsumedUL,
    fatRemovedUL: fat.fatRemovedUL,
    neutralizedUL: neutralization.neutralizedUL,
    chlorineUsedUL: chlorine.chlorineUsedUL,
    state: chlorine.output,
    progressed,
  };
}

export function addMeasuredReagent(
  batch: ComponentMixture,
  reagent: ComponentMixture,
): ComponentMixture {
  const out = emptyMixture();
  for (const key of COMPONENT_KEYS) out[key] = batch[key] + reagent[key];
  return out;
}

/**
 * Run sourced branches 13, 14, 15, 16, 17, 18, 21 in wiki order.
 * Neutralization (18) runs only when both Acid and Base are already in the mixture.
 * Adding Acid and Base is a caller action; this function does not pour stock.
 */
export function simulateAcidBaseTreatment(
  initial: ComponentMixture,
  updates: number,
): AcidBaseTreatmentResult {
  if (!Number.isInteger(updates) || updates < 0 || updates > 10_000) {
    throw new Error('Updates must be an integer from 0 to 10,000');
  }
  const blockReasons = chemistryPredictionBlockers(initial);
  let state = clone(initial);
  const ticks: ReactionTick[] = [];
  let stoppedBecause: AcidBaseTreatmentResult['stoppedBecause'] = 'updates-complete';

  for (let tick = 1; tick <= updates; tick += 1) {
    const result = runSourcedChemistryTick(state);
    result.tick = tick;
    state = result.state;
    ticks.push(result);
    if (!result.progressed) {
      stoppedBecause = 'no-progress';
      break;
    }
  }

  return {
    initial: clone(initial),
    final: state,
    ticks,
    stoppedBecause,
    unmodeledWarnings: blockReasons,
    predictionBlocked: blockReasons.length > 0,
    blockReasons,
    sourceBoundary:
      `Implements wiki branches 13, 14, 15, 16, 17, 18, 21 in order (${REACTION_SOURCE_VERSION}). ` +
      'Not a 1:1 Protein:Acid dose. Heat branches 1–3 are not run here. ' +
      `Source: ${REACTION_SOURCE_URL}`,
  };
}

export function conservationDeltaUL(before: ComponentMixture, after: ComponentMixture): number {
  return totalUL(after) - totalUL(before);
}
