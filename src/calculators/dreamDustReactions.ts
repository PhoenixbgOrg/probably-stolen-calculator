import {
  type ComponentMixture,
  emptyMixture,
  totalUL,
} from './dreamDustVerified';

export const REACTION_SOURCE_VERSION = '0.46D / Steam Build 26337366';
export const REACTION_SOURCE_URL = 'https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing';

export interface ReactionTick {
  tick: number;
  proteinPrecipitatedUL: number;
  acidConsumedByPrecipitationUL: number;
  baseConsumedByPrecipitationUL: number;
  neutralizedUL: number;
  state: ComponentMixture;
  progressed: boolean;
}

export interface AcidBaseTreatmentResult {
  initial: ComponentMixture;
  final: ComponentMixture;
  ticks: ReactionTick[];
  stoppedBecause: 'updates-complete' | 'no-progress' | 'protein-cleared';
  unmodeledWarnings: string[];
  sourceBoundary: string;
}

function clone(mixture: ComponentMixture): ComponentMixture {
  return { ...mixture };
}

/**
 * Wiki branch 16: Protein precipitation.
 * Protein C>0 and Acid A ≠ Base B:
 *   n = min(|A-B|, C)
 *   q = min(n, max(1, trunc(0.2 n)))
 * Protein −q, Insoluble Debris +q, excess Acid or Base −q.
 * This is stepwise. It is not "add Acid equal to Protein once".
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

function unmodeledWarnings(mixture: ComponentMixture): string[] {
  const warnings: string[] = [];
  if (mixture.microbes > 0 && mixture.acid + mixture.base > 0) {
    warnings.push(
      'Microbes are present with Acid/Base. Wiki branch 14 (Acid/Base microbe removal) is not simulated here; measure after treatment.',
    );
  }
  return warnings;
}

/**
 * Mix a measured reagent into the batch without inventing purity.
 * Reagent volumes are independent spectrometer (or labeled estimate) values.
 */
export function addMeasuredReagent(
  batch: ComponentMixture,
  reagent: ComponentMixture,
): ComponentMixture {
  const out = emptyMixture();
  (Object.keys(out) as (keyof ComponentMixture)[]).forEach((key) => {
    out[key] = batch[key] + reagent[key];
  });
  return out;
}

/**
 * Run sourced protein precipitation then neutralization for a bounded number of chemical updates.
 * Does not implement other Acid/Base branches (13, 14, 15, 21).
 */
export function simulateAcidBaseTreatment(
  initial: ComponentMixture,
  updates: number,
): AcidBaseTreatmentResult {
  if (!Number.isInteger(updates) || updates < 0 || updates > 10_000) {
    throw new Error('Updates must be an integer from 0 to 10,000');
  }
  let state = clone(initial);
  const ticks: ReactionTick[] = [];
  let stoppedBecause: AcidBaseTreatmentResult['stoppedBecause'] = 'updates-complete';

  for (let tick = 1; tick <= updates; tick += 1) {
    const precipitation = applyProteinPrecipitation(state);
    const neutralization = applyAcidBaseNeutralization(precipitation.output);
    const progressed =
      precipitation.proteinPrecipitatedUL + neutralization.neutralizedUL > 0;
    state = neutralization.output;
    ticks.push({
      tick,
      proteinPrecipitatedUL: precipitation.proteinPrecipitatedUL,
      acidConsumedByPrecipitationUL: precipitation.acidConsumedUL,
      baseConsumedByPrecipitationUL: precipitation.baseConsumedUL,
      neutralizedUL: neutralization.neutralizedUL,
      state: clone(state),
      progressed,
    });
    if (!progressed) {
      stoppedBecause = 'no-progress';
      break;
    }
    if (state.protein === 0) {
      stoppedBecause = 'protein-cleared';
      break;
    }
  }

  return {
    initial: clone(initial),
    final: state,
    ticks,
    stoppedBecause,
    unmodeledWarnings: unmodeledWarnings(initial),
    sourceBoundary:
      `Implements wiki branches 16 then 18 only (${REACTION_SOURCE_VERSION}). ` +
      'Not a 1:1 Protein:Acid dose. Other Acid/Base branches are not simulated. ' +
      `Source: ${REACTION_SOURCE_URL}`,
  };
}

export function conservationDeltaUL(before: ComponentMixture, after: ComponentMixture): number {
  return totalUL(after) - totalUL(before);
}
