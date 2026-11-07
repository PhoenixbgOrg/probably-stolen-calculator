import { describe, expect, test } from 'vitest';
import { estimatedMushAndOther, PREVIOUS_BATCH_MUSH_FRACTION } from '../src/calculators/dreamDustEstimates';
import { recommendFromMaterials } from '../src/calculators/dreamDustForward';
import { mixtureFromPartial, totalUL, volumeSumDriftUL } from '../src/calculators/dreamDustVerified';
import {
  applyAcidBaseNeutralization,
  applyProteinPrecipitation,
  simulateAcidBaseTreatment,
} from '../src/calculators/dreamDustReactions';

describe('materials-first forward planner', () => {
  test('750 mL pure alcohol + 476 mL ground at assumed 67.30% mush', () => {
    const groundTotalUL = 476_000;
    const ground = estimatedMushAndOther(groundTotalUL, PREVIOUS_BATCH_MUSH_FRACTION);
    expect(ground.dreamCapMush).toBe(320_348);
    expect(ground.other).toBe(155_652);
    expect(totalUL(ground)).toBe(476_000);
    expect(volumeSumDriftUL(groundTotalUL, ground)).toBe(0);

    const result = recommendFromMaterials({
      groundTotalUL,
      ground,
      compositionMode: 'estimated',
      compositionNote: 'Assumed 67.30% Mush from a previous reading',
      solvent: {
        liquidUL: 750_000,
        mode: 'pure',
        alcoholUL: 750_000,
        waterUL: 0,
        otherUL: 0,
      },
      vesselCapacityUL: 2_000_000,
    });

    expect(result.status).toBe('ok');
    expect(result.availableMushUL).toBe(320_348);
    expect(result.recommendedMushUL).toBeGreaterThanOrEqual(149_900);
    expect(result.recommendedMushUL).toBeLessThanOrEqual(150_100);
    expect(result.recommendedGroundUL / 1_000).toBeCloseTo(222.9, 0);
    expect(result.unusedGroundUL / 1_000).toBeCloseTo(253.1, 0);
    expect(result.theoreticalExtractCeilingUL / 1_000).toBeCloseTo(75, 0);
    expect(result.warnings.some((warning) => /assumed|estimated/i.test(warning))).toBe(true);
    expect(result.boundary).toMatch(/not a guaranteed/i);
  });

  test('mixed 50% alcohol is not treated as pure liquid volume', () => {
    const ground = estimatedMushAndOther(200_000, 0.673);
    const result = recommendFromMaterials({
      groundTotalUL: 200_000,
      ground,
      compositionMode: 'measured',
      compositionNote: '',
      solvent: {
        liquidUL: 400_000,
        mode: 'mixed',
        alcoholUL: 200_000,
        waterUL: 200_000,
        otherUL: 0,
      },
      vesselCapacityUL: 2_000_000,
    });
    expect(result.alcoholComponentUL).toBe(200_000);
    expect(result.recommendedMushUL).toBeLessThanOrEqual(40_000);
  });

  test('does not silently normalize component-sum drift', () => {
    const ground = mixtureFromPartial({ dreamCapMush: 100_000, water: 10_000 });
    const result = recommendFromMaterials({
      groundTotalUL: 164_000,
      ground,
      compositionMode: 'measured',
      compositionNote: '',
      solvent: { liquidUL: 100_000, mode: 'pure', alcoholUL: 100_000, waterUL: 0, otherUL: 0 },
      vesselCapacityUL: 2_000_000,
    });
    expect(result.warnings.some((warning) => /differs from declared total/i.test(warning))).toBe(true);
    expect(totalUL(ground)).toBe(110_000);
  });

  test('mush with zero total is invalid', () => {
    const result = recommendFromMaterials({
      groundTotalUL: 0,
      ground: mixtureFromPartial({ dreamCapMush: 10_000 }),
      compositionMode: 'measured',
      compositionNote: '',
      solvent: { liquidUL: 50_000, mode: 'pure', alcoholUL: 50_000, waterUL: 0, otherUL: 0 },
      vesselCapacityUL: 2_000_000,
    });
    expect(result.status).toBe('invalid');
  });
});

describe('164 mL ground + 552 mL pure alcohol extraction observation', () => {
  test('model prediction is near observed 55.18 mL extract, labeled as observation not guarantee', () => {
    const ground = mixtureFromPartial({
      dreamCapMush: 110_370,
      water: 21_070,
      protein: 10_540,
      microbes: 10_540,
      physicalContaminant: 9_170,
      mineral: 2_290,
    });
    expect(totalUL(ground)).toBe(163_980);

    const result = recommendFromMaterials({
      groundTotalUL: 164_000,
      ground,
      compositionMode: 'measured',
      compositionNote: '',
      solvent: {
        liquidUL: 552_000,
        mode: 'pure',
        alcoholUL: 552_000,
        waterUL: 0,
        otherUL: 0,
      },
      vesselCapacityUL: 2_000_000,
    });

    expect(result.status).toBe('ok');
    expect(result.predictedExtraction).toBeTruthy();
    const extractUL = result.predictedExtraction!.final.dreamCapExtract;
    expect(extractUL / 1_000).toBeCloseTo(55.18, 0);
    expect(result.predictedExtraction!.final.dreamCapMush).toBe(0);
    // OBSERVED owner extract 55.18 mL may be a 1.0.0.5 truncated display (55.18 covers 55180–55189 µL). Do not fudge.
  });
});

describe('protein precipitation branch 16 and neutralization branch 18', () => {
  test('is stepwise, not a universal 1:1 protein:acid dose', () => {
    const start = mixtureFromPartial({ protein: 10_540, acid: 10_540 });
    const once = applyProteinPrecipitation(start);
    expect(once.proteinPrecipitatedUL).toBe(2_108);
    expect(once.output.protein).toBe(8_432);
    expect(once.output.insolubleDebris).toBe(2_108);
    expect(once.output.acid).toBe(8_432);
    expect(once.proteinPrecipitatedUL).not.toBe(10_540);
  });

  test('neutralization removes min(A,B) in sourced chunks, producing no extra component', () => {
    const start = mixtureFromPartial({ acid: 5_000, base: 5_000, protein: 0 });
    const result = applyAcidBaseNeutralization(start);
    expect(result.neutralizedUL).toBe(1_000);
    expect(result.output.acid).toBe(4_000);
    expect(result.output.base).toBe(4_000);
    expect(totalUL(result.output)).toBe(8_000);
  });

  test('full treatment of 10.54 mL protein with acid only does not invent 97% purity', () => {
    const start = mixtureFromPartial({
      dreamCapExtract: 55_180,
      plantMatter: 55_180,
      alcohol: 552_300,
      water: 21_070,
      protein: 10_540,
      physicalContaminant: 9_170,
      mineral: 2_290,
      acid: 20_000,
    });
    const treated = simulateAcidBaseTreatment(start, 10_000);
    expect(treated.final.protein).toBe(0);
    expect(treated.final.insolubleDebris).toBe(10_540);
    expect(treated.stoppedBecause).toBe('no-progress');
    expect(treated.sourceBoundary).toMatch(/Not a 1:1/);
    expect(treated.final.dreamCapExtract).toBe(55_180);
  });
});
