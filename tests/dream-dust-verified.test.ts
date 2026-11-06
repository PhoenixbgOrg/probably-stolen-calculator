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
import {
  applyFilter,
  evaporateToDryness,
  finishComponentMixture,
  solveProductionPlan,
} from '../src/calculators/dreamDustPlanner';

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

  test('filter steps spend durability in component order and preserve small active/protein components', () => {
    const mixture = {
      dreamCapMush: 0,
      dreamCapExtract: 10_000,
      plantMatter: 2_500,
      water: 0,
      protein: 1_000,
      mineral: 500,
      microbes: 0,
      physicalContaminant: 2_000,
      alcohol: 0,
      insolubleDebris: 0,
    };
    const kotton = applyFilter(mixture, 'Kotton Fabric', 150, 4);
    expect(kotton.output.plantMatter).toBe(500);
    expect(kotton.output.dreamCapExtract).toBe(10_000);
    expect(kotton.output.protein).toBe(1_000);
    expect(kotton.remainingDurability).toBe(0);

    const ordinary = applyFilter(kotton.output, 'Water Filter', 22, 5);
    // Hand calculation: physical 2,000 -> 500 -> 3 floor (4 durability),
    // then mineral 500 -> 0 (1 durability); plant is later and remains.
    expect(ordinary.output.physicalContaminant).toBe(3);
    expect(ordinary.output.mineral).toBe(0);
    expect(ordinary.output.plantMatter).toBe(500);
    expect(ordinary.output.dreamCapExtract).toBe(10_000);
    expect(ordinary.remainingDurability).toBe(0);
  });

  test('Evaporator proportionally removes Water and Alcohol and recovers with quality', () => {
    const mixture = {
      dreamCapMush: 0,
      dreamCapExtract: 8_000,
      plantMatter: 0,
      water: 40_000,
      protein: 2_000,
      mineral: 0,
      microbes: 0,
      physicalContaminant: 0,
      alcohol: 60_000,
      insolubleDebris: 0,
    };
    const result = evaporateToDryness(mixture, {
      performancePercent: 0,
      efficiencyPercent: 0,
      qualityPercent: 50,
      availableEnergy: 6,
      distillateCapacityUL: 100_000,
      solventRecoveryModule: false,
    });
    expect(result.success).toBe(true);
    expect(result.cycles).toHaveLength(1);
    expect(result.removed.water).toBe(40_000);
    expect(result.removed.alcohol).toBe(60_000);
    expect(result.recovered.water).toBe(20_000);
    expect(result.recovered.alcohol).toBe(30_000);
    expect(result.lost.water).toBe(20_000);
    expect(result.lost.alcohol).toBe(30_000);
    expect(result.output.water + result.output.alcohol).toBe(0);
    expect(result.energyUsed).toBe(6);
  });

  test('component Finisher replacement conserves 2,000 µL and accounts every component', () => {
    const result = finishComponentMixture(
      {
        dreamCapMush: 0,
        dreamCapExtract: 1_000,
        plantMatter: 0,
        water: 0,
        protein: 1_000,
        mineral: 0,
        microbes: 0,
        physicalContaminant: 0,
        alcohol: 0,
        insolubleDebris: 0,
      },
      2,
      1,
    );
    const vial = result.vials[0]!;
    expect(totalUL(vial.sampled)).toBe(2_000);
    expect(totalUL(vial.replaced)).toBe(60);
    expect(vial.replaced.dreamCapExtract).toBe(30);
    expect(vial.replaced.protein).toBe(30);
    expect(totalUL(vial.final)).toBe(2_000);
    expect(vial.final.dreamCapExtract).toBe(970);
    expect(vial.final.protein).toBe(970);
    expect(vial.final.physicalContaminant).toBe(60);
    expect(vial.purity).toBe(48.5);
  });

  test('raw reverse planner produces a sourced end-to-end plan and enforces equipment', () => {
    const input = {
      targetPurity: 45,
      targetVials: 15,
      material: {
        state: 'raw' as const,
        availableGrams: 65,
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 300_000,
      heatingPlateOwned: true,
      heatingPlateModules: 2,
      filterContainerOwned: true,
      kottonDurability: 1_000,
      waterFilterDurability: 400,
      evaporatorOwned: true,
      evaporatorPerformancePercent: 0,
      evaporatorEfficiencyPercent: 0,
      evaporatorQualityPercent: 0,
      solventRecoveryModule: false,
      distillateCapacityUL: 0,
      availableEnergy: 12,
      processingContainerCapacityUL: 500_000,
      finisherOwned: true,
      finisherModules: 4,
      finisherCapacityVials: 24,
      credits: 0,
      allowPurchases: false,
    };
    const result = solveProductionPlan(input);
    expect(result.status).toBe('feasible');
    expect(result.candidate).not.toBeNull();
    expect(result.candidate!.finishing.vials).toHaveLength(15);
    expect(result.candidate!.finishing.meanPurity).toBeGreaterThanOrEqual(45);
    expect(result.candidate!.extraction.final.dreamCapMush).toBe(0);
    expect(result.candidate!.evaporation.output.water + result.candidate!.evaporation.output.alcohol).toBeLessThanOrEqual(100);
    expect(totalUL(result.candidate!.waste)).toBeGreaterThan(0);
    const plan = result.candidate!;
    // Independent volume ledger: raw chemical volume + added Alcohol equals every
    // documented pre-finisher loss/recovery branch plus the dried mixture.
    expect(totalUL(plan.materialUsed) + plan.alcoholUsedUL).toBe(
      totalUL(plan.blenderLoss) +
      totalUL(plan.extractionLoss) +
      totalUL(plan.filtration.removed) +
      totalUL(plan.evaporation.removed) +
      totalUL(plan.finalMixtureBeforeFinishing),
    );
    expect(totalUL(plan.evaporation.removed)).toBe(
      totalUL(plan.evaporation.recovered) + totalUL(plan.evaporation.lost),
    );
    expect(totalUL(plan.finalMixtureBeforeFinishing)).toBe(
      plan.finishing.vials.length * 2_000 + totalUL(plan.finishing.remaining),
    );

    const blocked = solveProductionPlan({
      ...input,
      heatingPlateModules: 1,
    });
    expect(blocked.status).toBe('unsupported-input');
    expect(blocked.reasons.join(' ')).toContain('at least 2');
  });

  test('planner reports bounded no-solution with insufficient inventory and energy', () => {
    const result = solveProductionPlan({
      targetPurity: 70,
      targetVials: 10,
      material: {
        state: 'raw',
        availableGrams: 10,
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 10_000,
      heatingPlateOwned: true,
      heatingPlateModules: 2,
      filterContainerOwned: true,
      kottonDurability: 1_000,
      waterFilterDurability: 400,
      evaporatorOwned: true,
      evaporatorPerformancePercent: 0,
      evaporatorEfficiencyPercent: 0,
      evaporatorQualityPercent: 0,
      solventRecoveryModule: false,
      distillateCapacityUL: 0,
      availableEnergy: 0,
      processingContainerCapacityUL: 100_000,
      finisherOwned: true,
      finisherModules: 4,
      finisherCapacityVials: 10,
      credits: 0,
      allowPurchases: false,
    });
    expect(result.status).toBe('no-solution-in-supported-search');
    expect(result.reasons.join(' ')).toContain('Insufficient energy');
    expect(result.searchSummary).toContain('configurations');
    expect(result.boundary).toContain('not a global impossibility proof');
  });

  test('planner tracks both bestPurity and maxQuantity candidates independently', () => {
    // With limited material, bestPurity and maxQuantity may differ: higher purity with fewer vials
    // vs lower purity with more vials. Both should be reported.
    const result = solveProductionPlan({
      targetPurity: 45,
      targetVials: 15,
      material: { state: 'raw', availableGrams: 45, blenderOwned: true, blenderModules: 4 },
      alcoholAvailableUL: 300_000,
      heatingPlateOwned: true,
      heatingPlateModules: 2,
      filterContainerOwned: true,
      kottonDurability: 1_000,
      waterFilterDurability: 400,
      evaporatorOwned: true,
      evaporatorPerformancePercent: 0,
      evaporatorEfficiencyPercent: 0,
      evaporatorQualityPercent: 0,
      solventRecoveryModule: false,
      distillateCapacityUL: 0,
      availableEnergy: 12,
      processingContainerCapacityUL: 500_000,
      finisherOwned: true,
      finisherModules: 4,
      finisherCapacityVials: 24,
      credits: 0,
      allowPurchases: false,
    });
    
    expect(result.status).toBe('no-solution-in-supported-search');
    expect(result.bestPurityCandidate).not.toBeNull();
    expect(result.maxQuantityCandidate).not.toBeNull();
    
    // Best purity should be higher purity, potentially fewer vials
    expect(result.bestPurityCandidate!.finishing.meanPurity).toBeGreaterThan(87);
    
    // Max quantity should produce more vials, possibly at slightly lower purity
    expect(result.maxQuantityCandidate!.finishing.vials.length).toBeGreaterThanOrEqual(
      result.bestPurityCandidate!.finishing.vials.length,
    );
    
    // Verify independent tracking: maxQuantity can have more vials even if purity is marginally lower
    if (result.maxQuantityCandidate!.finishing.vials.length > result.bestPurityCandidate!.finishing.vials.length) {
      // This is the expected case: trading purity for quantity
      expect(result.maxQuantityCandidate!.finishing.meanPurity).toBeLessThanOrEqual(
        result.bestPurityCandidate!.finishing.meanPurity + 0.1, // within margin
      );
    }
  });
});
