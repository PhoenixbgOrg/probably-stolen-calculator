import { describe, expect, test } from 'vitest';
import { solveProductionPlan } from '../src/calculators/dreamDustPlanner';
import { solveMeasuredTarget, totalUL } from '../src/calculators/dreamDustVerified';

describe('forward/reverse production validation', () => {
  test('recipe execution → measurement → reverse solver consistency', () => {
    // Forward: Run production plan
    const forwardInput = {
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

    const forwardResult = solveProductionPlan(forwardInput);
    
    expect(forwardResult.status).toBe('feasible');
    expect(forwardResult.candidate).not.toBeNull();
    
    const plan = forwardResult.candidate!;
    
    // Extract measurement from completed plan (before finishing)
    const measured = {
      totalUL: totalUL(plan.finalMixtureBeforeFinishing),
      activeUL: plan.finalMixtureBeforeFinishing.dreamCapExtract,
      evaporativeUL: plan.finalMixtureBeforeFinishing.water + plan.finalMixtureBeforeFinishing.alcohol,
    };
    
    // Reverse: Feed measurement to reverse solver
    const reverseInput = {
      ...measured,
      targetPurity: 45,
      targetVials: 15,
      currentModules: 4,
      maxModulesOwned: 4,
      finisherOwned: true,
      finisherCapacityVials: 24,
    };
    
    const reverseResult = solveMeasuredTarget(reverseInput);
    
    // Validation: Reverse should confirm forward result
    expect(reverseResult.status).toBe('feasible-now');
    expect(reverseResult.options).toHaveLength(1); // Only 4 modules tested
    
    const reverseOption = reverseResult.options[0]!;
    expect(reverseOption.modules).toBe(4);
    expect(reverseOption.meetsTargetNow).toBe(true);
    expect(reverseOption.achievedMeanPurity).toBeCloseTo(plan.finishing.meanPurity, 1);
    expect(reverseOption.vialsAvailable).toBeGreaterThanOrEqual(15);
    
    // Should require zero additional composition changes since forward met target
    expect(reverseOption.minimumPureActiveAdditionUL).toBe(0);
    expect(reverseOption.minimumSelectiveOtherRemovalUL).toBe(0);
  });

  test('insufficient forward result → reverse correctly identifies deficiency', () => {
    // Forward with insufficient material
    const forwardInput = {
      targetPurity: 45,
      targetVials: 15,
      material: {
        state: 'raw' as const,
        availableGrams: 20, // Too little
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 100_000,
      heatingPlateOwned: true,
      heatingPlateModules: 2,
      filterContainerOwned: true,
      kottonDurability: 500,
      waterFilterDurability: 200,
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

    const forwardResult = solveProductionPlan(forwardInput);
    expect(forwardResult.status).toBe('no-solution-in-supported-search');
    expect(forwardResult.bestPurityCandidate).not.toBeNull();
    
    const plan = forwardResult.bestPurityCandidate!;
    
    // Measure what was achieved
    const measured = {
      totalUL: totalUL(plan.finalMixtureBeforeFinishing),
      activeUL: plan.finalMixtureBeforeFinishing.dreamCapExtract,
      evaporativeUL: plan.finalMixtureBeforeFinishing.water + plan.finalMixtureBeforeFinishing.alcohol,
    };
    
    // Reverse analysis
    const reverseInput = {
      ...measured,
      targetPurity: 45,
      targetVials: 15,
      currentModules: 4,
      maxModulesOwned: 4,
      finisherOwned: true,
      finisherCapacityVials: 24,
    };
    
    const reverseResult = solveMeasuredTarget(reverseInput);
    
    // Should identify deficiency
    if (reverseResult.status === 'insufficient-resources') {
      expect(reverseResult.reasons.length).toBeGreaterThan(0);
    } else {
      // If composition-change-required, should show needed addition
      expect(reverseResult.status).toBe('composition-change-required');
      expect(reverseResult.options[0]!.minimumPureActiveAdditionUL).toBeGreaterThan(0);
    }
  });
});
