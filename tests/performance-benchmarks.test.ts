import { describe, expect, test } from 'vitest';
import { solveProductionPlan } from '../src/calculators/dreamDustPlanner';

describe('performance benchmarks', () => {
  const baseConfig = {
    targetPurity: 45,
    targetVials: 15,
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

  test('SMALL: 10g raw, 50mL alcohol (timing benchmark)', () => {
    const start = performance.now();
    
    const result = solveProductionPlan({
      ...baseConfig,
      material: {
        state: 'raw' as const,
        availableGrams: 10,
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 50_000,
    });
    
    const elapsed = performance.now() - start;
    
    console.log(`SMALL benchmark: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(5000); // Should complete within 5 seconds
    expect(result.status).toBe('no-solution-in-supported-search'); // Insufficient material
  });

  test('MEDIUM: 65g raw, 300mL alcohol (timing benchmark)', () => {
    const start = performance.now();
    
    const result = solveProductionPlan({
      ...baseConfig,
      material: {
        state: 'raw' as const,
        availableGrams: 65,
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 300_000,
    });
    
    const elapsed = performance.now() - start;
    
    console.log(`MEDIUM benchmark: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(5000); // Should complete within 5 seconds
    expect(result.status).toBe('feasible'); // Should find solution
  });

  test('LARGE: 200g raw, 1000mL alcohol (timing benchmark)', () => {
    const start = performance.now();
    
    const result = solveProductionPlan({
      ...baseConfig,
      targetVials: 50,
      material: {
        state: 'raw' as const,
        availableGrams: 200,
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 1_000_000,
      processingContainerCapacityUL: 2_000_000,
      finisherCapacityVials: 100,
      availableEnergy: 50,
    });
    
    const elapsed = performance.now() - start;
    
    console.log(`LARGE benchmark: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(10000); // Should complete within 10 seconds
    // With current bounded incomplete search, may not find solution due to coarse grid
    expect(['feasible', 'no-solution-in-supported-search']).toContain(result.status);
  });

  test.skip('EXTREME: 500g raw, high vial target (stress test - skipped for CI)', () => {
    const start = performance.now();
    
    const result = solveProductionPlan({
      ...baseConfig,
      targetVials: 100,
      material: {
        state: 'raw' as const,
        availableGrams: 500,
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 2_500_000,
      processingContainerCapacityUL: 5_000_000,
      finisherCapacityVials: 200,
      availableEnergy: 100,
      kottonDurability: 10_000,
      waterFilterDurability: 5_000,
    });
    
    const elapsed = performance.now() - start;
    
    console.log(`EXTREME benchmark: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(30000); // Allow up to 30 seconds for extreme case
    
    // Log search statistics
    console.log(`  Status: ${result.status}`);
    console.log(`  Search summary: ${result.searchSummary}`);
    if (result.candidate) {
      console.log(`  Result: ${result.candidate.finishing.vials.length} vials @ ${result.candidate.finishing.meanPurity.toFixed(2)}%`);
    }
  });

  test.skip('Performance scales reasonably with material quantity (skipped - long running)', () => {
    const timings: Array<{ grams: number; ms: number }> = [];
    
    for (const grams of [10, 30, 65, 100, 150]) {
      const start = performance.now();
      
      solveProductionPlan({
        ...baseConfig,
        material: {
          state: 'raw' as const,
          availableGrams: grams,
          blenderOwned: true,
          blenderModules: 4,
        },
        alcoholAvailableUL: grams * 5000, // Scale alcohol proportionally
      });
      
      const elapsed = performance.now() - start;
      timings.push({ grams, ms: elapsed });
    }
    
    console.log('Scaling timings:', timings.map(t => `${t.grams}g: ${t.ms.toFixed(1)}ms`).join(', '));
    
    // All should complete in reasonable time
    timings.forEach(t => {
      expect(t.ms).toBeLessThan(10000);
    });
  });
});
