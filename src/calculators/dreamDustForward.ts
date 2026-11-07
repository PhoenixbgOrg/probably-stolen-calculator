import {
  COMPONENT_KEYS,
  type ComponentMixture,
  emptyMixture,
  mixtureFromPartial,
  simulateExtractionFromMixture,
  totalUL,
  volumeSumDriftUL,
} from './dreamDustVerified';
import { SAFE_EXTRACTION_TEMPERATURE_C, takeProportionalMixture } from './dreamDustPlanner';

export const YIELD_CAP_ALCOHOL_PER_MUSH = 5;
export const EXTRACT_CHUNK_CAP = 0.5;
export const FORWARD_SOURCE_VERSION = '0.46D / Steam Build 26337366 wiki extraction branch 4; UI game data 1.0.x / 100-REV6';

export type CompositionMode = 'measured' | 'estimated';
export type SolventMode = 'pure' | 'mixed';
export type EvidenceStatus = 'verified-measurement' | 'predicted-by-model' | 'unsupported' | 'unknown';

export interface SolventInventory {
  liquidUL: number;
  mode: SolventMode;
  alcoholUL: number;
  waterUL: number;
  otherUL: number;
}

export interface ForwardMaterialsInput {
  groundTotalUL: number;
  ground: ComponentMixture;
  compositionMode: CompositionMode;
  compositionNote: string;
  solvent: SolventInventory;
  vesselCapacityUL: number;
}

export interface ForwardMaterialsResult {
  status: 'ok' | 'invalid';
  reasons: string[];
  warnings: string[];
  availableMushUL: number;
  alcoholComponentUL: number;
  alcoholToMushRatio: number | null;
  atYieldCap: boolean;
  recommendedMushUL: number;
  recommendedGroundUL: number;
  recommendedGround: ComponentMixture;
  unusedGroundUL: number;
  unusedAlcoholInventoryUL: number;
  pouredSolventUL: number;
  initialVesselUL: number;
  vesselFits: boolean;
  theoreticalExtractCeilingUL: number;
  predictedExtraction: ReturnType<typeof simulateExtractionFromMixture> | null;
  evidence: EvidenceStatus;
  boundary: string;
}

function invalid(reasons: string[], warnings: string[] = []): ForwardMaterialsResult {
  return {
    status: 'invalid',
    reasons,
    warnings,
    availableMushUL: 0,
    alcoholComponentUL: 0,
    alcoholToMushRatio: null,
    atYieldCap: false,
    recommendedMushUL: 0,
    recommendedGroundUL: 0,
    recommendedGround: emptyMixture(),
    unusedGroundUL: 0,
    unusedAlcoholInventoryUL: 0,
    pouredSolventUL: 0,
    initialVesselUL: 0,
    vesselFits: true,
    theoreticalExtractCeilingUL: 0,
    predictedExtraction: null,
    evidence: 'unknown',
    boundary: FORWARD_SOURCE_VERSION,
  };
}

export function scaleHomogeneousGround(
  available: ComponentMixture,
  requestedUL: number,
): ComponentMixture {
  const total = totalUL(available);
  if (requestedUL <= 0) return emptyMixture();
  if (total <= 0) return emptyMixture();
  if (requestedUL >= total) return { ...available };
  return takeProportionalMixture(available, requestedUL);
}

/**
 * Materials-first recommendation. Does not require target vials or purity.
 * 5:1 is the wiki instantaneous yield-cap ratio, not a ban on extraction below that ratio.
 */
export function recommendFromMaterials(input: ForwardMaterialsInput): ForwardMaterialsResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!Number.isInteger(input.groundTotalUL) || input.groundTotalUL < 0) {
    reasons.push('Ground mixture total must be a whole µL volume');
  }
  if (!Number.isInteger(input.solvent.liquidUL) || input.solvent.liquidUL < 0) {
    reasons.push('Alcohol-containing liquid total must be a whole µL volume');
  }
  for (const key of COMPONENT_KEYS) {
    const value = input.ground[key];
    if (!Number.isInteger(value) || value < 0) {
      reasons.push(`Ground ${key} must be a whole non-negative µL volume`);
    }
  }
  if (input.ground.dreamCapMush > 0 && input.groundTotalUL === 0) {
    reasons.push('Ground Mush > 0 with total mixture 0 is invalid');
  }
  const componentSum = totalUL(input.ground);
  const groundDrift = volumeSumDriftUL(input.groundTotalUL, input.ground);
  if (input.groundTotalUL > 0 && componentSum === 0) {
    warnings.push(
      'Ground total is set but no component volumes were entered. Actual Dream Cap Mush is unknown.',
    );
  } else if (groundDrift !== 0 && componentSum > 0) {
    warnings.push(
      `Ground component sum ${componentSum} µL differs from declared total ${input.groundTotalUL} µL by ${groundDrift} µL. Difference is shown, not silently normalized.`,
    );
  }

  const solventParts = input.solvent.alcoholUL + input.solvent.waterUL + input.solvent.otherUL;
  if (input.solvent.mode === 'pure') {
    if (input.solvent.alcoholUL !== input.solvent.liquidUL) {
      warnings.push('Pure Alcohol mode expects the Alcohol component to equal the liquid volume.');
    }
  } else if (solventParts !== input.solvent.liquidUL && input.solvent.liquidUL > 0 && solventParts > 0) {
    warnings.push(
      `Solvent component sum ${solventParts} µL differs from liquid total ${input.solvent.liquidUL} µL. Difference is shown, not silently normalized.`,
    );
  }
  if (input.solvent.alcoholUL > input.solvent.liquidUL) {
    reasons.push('Alcohol component cannot exceed the alcohol-containing liquid volume');
  }
  if (input.vesselCapacityUL <= 0) {
    reasons.push('A positive vessel capacity is required to check overflow');
  }

  if (reasons.length) return invalid(reasons, warnings);

  const availableMushUL = input.ground.dreamCapMush;
  const alcoholComponentUL = input.solvent.alcoholUL;
  if (availableMushUL > 0 && alcoholComponentUL === 0) {
    warnings.push('Wiki branch 4 requires Alcohol > 0. No extraction is predicted with 0 Alcohol component.');
  }

  const ratio =
    availableMushUL > 0 ? alcoholComponentUL / availableMushUL : null;
  const mushForCap =
    alcoholComponentUL > 0 ? Math.floor(alcoholComponentUL / YIELD_CAP_ALCOHOL_PER_MUSH) : 0;
  const recommendedMushUL = Math.min(availableMushUL, mushForCap);
  let recommendedGroundUL = 0;
  if (availableMushUL > 0 && recommendedMushUL > 0) {
    recommendedGroundUL = Math.min(
      input.groundTotalUL || componentSum,
      Math.round((recommendedMushUL / availableMushUL) * (input.groundTotalUL || componentSum)),
    );
  } else if (availableMushUL === 0) {
    recommendedGroundUL = 0;
  }

  const sourceMixture =
    componentSum > 0 ? input.ground : mixtureFromPartial({ dreamCapMush: availableMushUL });
  const recommendedGround = scaleHomogeneousGround(
    sourceMixture,
    recommendedGroundUL > 0 ? recommendedGroundUL : 0,
  );
  const unusedGroundUL = Math.max(0, (input.groundTotalUL || componentSum) - totalUL(recommendedGround));
  const pouredSolventUL = input.solvent.liquidUL;
  const unusedAlcoholInventoryUL = 0;
  const initialVesselUL = totalUL(recommendedGround) + pouredSolventUL;
  const vesselFits = initialVesselUL <= input.vesselCapacityUL;
  if (!vesselFits) {
    warnings.push(
      `Selected mix ${initialVesselUL} µL exceeds vessel capacity ${input.vesselCapacityUL} µL. Choose a larger vessel before mixing.`,
    );
  }

  const theoreticalExtractCeilingUL = Math.floor(recommendedGround.dreamCapMush * EXTRACT_CHUNK_CAP);
  const atYieldCap =
    recommendedGround.dreamCapMush > 0 &&
    alcoholComponentUL >= recommendedGround.dreamCapMush * YIELD_CAP_ALCOHOL_PER_MUSH;

  let predictedExtraction: ReturnType<typeof simulateExtractionFromMixture> | null = null;
  if (recommendedGround.dreamCapMush > 0 && alcoholComponentUL > 0) {
    const initialMixture = mixtureFromPartial({
      ...recommendedGround,
      alcohol: recommendedGround.alcohol + alcoholComponentUL,
      water: recommendedGround.water + input.solvent.waterUL,
      other: recommendedGround.other + input.solvent.otherUL,
    });
    predictedExtraction = simulateExtractionFromMixture(
      initialMixture,
      SAFE_EXTRACTION_TEMPERATURE_C,
      10_000,
    );
  }

  if (input.compositionMode === 'estimated') {
    warnings.push(input.compositionNote || 'Composition is estimated, not a spectrometer reading.');
  }

  return {
    status: 'ok',
    reasons,
    warnings,
    availableMushUL,
    alcoholComponentUL,
    alcoholToMushRatio: ratio,
    atYieldCap,
    recommendedMushUL: recommendedGround.dreamCapMush,
    recommendedGroundUL: totalUL(recommendedGround),
    recommendedGround,
    unusedGroundUL,
    unusedAlcoholInventoryUL,
    pouredSolventUL,
    initialVesselUL,
    vesselFits,
    theoreticalExtractCeilingUL,
    predictedExtraction,
    evidence: input.compositionMode === 'measured' ? 'predicted-by-model' : 'unknown',
    boundary:
      `${FORWARD_SOURCE_VERSION}. 5:1 is the documented yield-cap ratio for the processed chunk, not a requirement to run extraction. ` +
      'Predicted extract is a model range, not a guaranteed in-game result. Measure after extraction.',
  };
}

export function mlToUL(ml: number): number {
  if (!Number.isFinite(ml) || ml < 0) return 0;
  return Math.round(ml * 1_000);
}

export function ulToML(ul: number): string {
  return (ul / 1_000).toFixed(3);
}
