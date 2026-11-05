import { describe, expect, test } from 'vitest';
import {
  applyBlenderLoss,
  dreamCapExtractDegradationFactor,
  dreamCapMushDegradationFactor,
  dreamCapRawComponents,
  finishMeasuredComposition,
  simulateExtraction,
  solveMeasuredTarget,
  totalUL,
} from '../src/calculators/dreamDustVerified';

describe('verified Dream Dust pipeline', () => {
  test('reference Dream Cap composition is independent chemical volume, not mass-to-volume', () => {
    const raw = dreamCapRawComponents(32.5);
    expect(raw).toMatchObject({
      dreamCapMush: 27_333,
      water: 4_000,
      protein: 2_000,
      mineral: 500,
      microbes: 2_000,
      physicalContaminant: 2_000,
    });
    expect(totalUL(raw)).toBe(37_833);
  });

  test('blender loss applies to every component with game rounding', () => {
    const raw = dreamCapRawComponents(32.5);
    const blended = applyBlenderLoss(raw, 0);
    expect(blended.dreamCapMush).toBe(17_766);
    expect(blended.water).toBe(2_600);
    expect(blended.protein).toBe(1_300);
    expect(blended.mineral).toBe(325);
    expect(blended.microbes).toBe(1_300);
    expect(blended.physicalContaminant).toBe(1_300);
  });

  test('first extraction update uses ties-to-even and conserves processed mush', () => {
    const result = simulateExtraction({
      dreamCapGrams: 32.5,
      alcoholML: 136.665,
      blenderModules: 4,
      temperatureC: 45,
      updates: 1,
    });
    const tick = result.ticks[0]!;
    expect(tick.processedMushUL).toBe(2_733);
    expect(tick.extractProducedUL).toBe(1_366);
    expect(tick.plantMatterProducedUL).toBe(1_367);
    expect(tick.extractProducedUL + tick.plantMatterProducedUL).toBe(tick.processedMushUL);
    expect(result.final.alcohol).toBe(136_665);
  });

  test('thermal degradation factors follow the sourced piecewise branches', () => {
    expect(dreamCapMushDegradationFactor(49)).toBe(0);
    expect(dreamCapMushDegradationFactor(50)).toBe(0);
    expect(dreamCapMushDegradationFactor(55)).toBeCloseTo(0.05);
    expect(dreamCapMushDegradationFactor(70)).toBeCloseTo(0.1);
    expect(dreamCapMushDegradationFactor(120)).toBe(1);
    expect(dreamCapExtractDegradationFactor(59)).toBe(0);
    expect(dreamCapExtractDegradationFactor(60)).toBe(0);
    expect(dreamCapExtractDegradationFactor(65)).toBeCloseTo(0.05);
    expect(dreamCapExtractDegradationFactor(120)).toBe(1);
  });

  test('55°C update applies sourced mush degradation after branch 4', () => {
    const result = simulateExtraction({
      dreamCapGrams: 32.5,
      alcoholML: 136.665,
      blenderModules: 4,
      temperatureC: 55,
      updates: 1,
    });
    const tick = result.ticks[0]!;
    expect(tick.processedMushUL).toBe(2_733);
    expect(tick.extractProducedUL).toBe(1_366);
    expect(tick.degradedMushUL).toBe(1_230);
    expect(tick.degradedExtractUL).toBe(0);
    expect(result.final.dreamCapMush).toBe(23_370);
    expect(result.final.plantMatter).toBe(2_597);
  });

  test('branch 22 boils alcohol only above 78.37°C and keeps total loss accounted', () => {
    const atPoint = simulateExtraction({
      dreamCapGrams: 0,
      alcoholML: 10,
      blenderModules: 4,
      temperatureC: 78.37,
      updates: 1,
    });
    expect(atPoint.final.alcohol).toBe(10_000);
    const abovePoint = simulateExtraction({
      dreamCapGrams: 0,
      alcoholML: 10,
      blenderModules: 4,
      temperatureC: 78.38,
      updates: 1,
    });
    expect(abovePoint.ticks[0]!.evaporatedAlcoholUL).toBe(200);
    expect(abovePoint.final.alcohol).toBe(9_800);
  });

  test('finisher samples exactly 2,000 µL and replaces, rather than adds, contamination', () => {
    const result = finishMeasuredComposition(
      { totalUL: 2_000, activeUL: 840, evaporativeUL: 0 },
      2,
      1,
    );
    expect(result.success).toBe(true);
    const vial = result.vials[0]!;
    expect(vial.physicalContaminantUL).toBe(60);
    expect(vial.replacedActiveUL).toBe(25);
    expect(vial.replacedOtherUL).toBe(35);
    expect(vial.finalActiveUL).toBe(815);
    expect(vial.finalTotalUL).toBe(2_000);
    expect(vial.purity).toBeCloseTo(40.75);
  });

  test('four modules preserve a measured 42% sample but cannot turn it into 45%', () => {
    const result = finishMeasuredComposition(
      { totalUL: 20_000, activeUL: 8_400, evaporativeUL: 0 },
      4,
      10,
    );
    expect(result.vials).toHaveLength(10);
    expect(result.meanPurity).toBe(42);
    expect(result.meanPurity).toBeLessThan(45);
  });

  test('dryness and capacity failures are explicit', () => {
    expect(
      finishMeasuredComposition(
        { totalUL: 2_000, activeUL: 1_000, evaporativeUL: 101 },
        4,
        1,
      ).reason,
    ).toContain('≤100');
    const tooSmall = finishMeasuredComposition(
      { totalUL: 1_999, activeUL: 1_000, evaporativeUL: 0 },
      4,
      1,
    );
    expect(tooSmall.success).toBe(true);
    expect(tooSmall.vials).toHaveLength(0);
    expect(
      finishMeasuredComposition(
        { totalUL: 2_000, activeUL: 1_950, evaporativeUL: 100 },
        4,
        1,
      ).reason,
    ).toContain('disjoint');
  });

  test('reverse solver respects owned modules, capacity, budget and measured resources', () => {
    const blocked = solveMeasuredTarget({
      totalUL: 20_000,
      activeUL: 8_400,
      evaporativeUL: 0,
      targetPurity: 45,
      targetVials: 10,
      currentModules: 2,
      maxModulesOwned: 4,
      finisherOwned: true,
      finisherCapacityVials: 9,
      availableBudget: 500,
      quotedModuleCost: 250,
    });
    expect(blocked.status).toBe('insufficient-resources');
    expect(blocked.reasons.join(' ')).toContain('capacity');

    const result = solveMeasuredTarget({
      totalUL: 20_000,
      activeUL: 8_400,
      evaporativeUL: 0,
      targetPurity: 45,
      targetVials: 10,
      currentModules: 2,
      maxModulesOwned: 4,
      finisherOwned: true,
      finisherCapacityVials: 10,
      availableBudget: 500,
      quotedModuleCost: 250,
    });
    expect(result.status).toBe('composition-change-required');
    expect(result.options.map((option) => option.modules)).toEqual([2, 3, 4]);
    expect(result.options[2]!.quotedUpgradeCost).toBe(500);
    expect(result.options[2]!.achievedMeanPurity).toBe(42);
    expect(result.options[2]!.minimumPureActiveAdditionUL).toBeGreaterThan(0);
    expect(result.options[2]!.minimumPureActiveAdditionUL).toBe(1_090);
    expect(result.options[2]!.minimumSelectiveOtherRemovalUL).toBeNull();
    expect(result.options[0]!.achievedMeanPurity).toBe(40.75);
    expect(result.options[0]!.minimumPureActiveAdditionUL).toBe(1_641);
  });
});
