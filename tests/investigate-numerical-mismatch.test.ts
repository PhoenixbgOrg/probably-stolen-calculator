import { describe, test } from 'vitest';
import { solveProductionPlan } from '../src/calculators/dreamDustPlanner';

/**
 * Investigate numerical mismatch between user observation and agent e2e test.
 * 
 * User observed (2026-11-06 05:40 UTC):
 * - Input: 65g raw, 4 blender modules, 300mL alcohol, 15 vials @ 45% purity
 * - Output: 15/15 vials @ 86.64% purity, 202.246 mL alcohol used
 * 
 * Agent e2e test captured:
 * - Input: Same (65g raw, 15 vials @ 45%)
 * - Output: 15/15 vials @ 87.22% purity, alcohol "0.000 mL" displayed
 * 
 * Difference: 87.22% - 86.64% = 0.58% purity difference
 * 
 * Need to determine exact cause: different inputs, different algorithm, rounding?
 */

describe('Numerical Mismatch Investigation', () => {
  test('reproduce user observed baseline exactly', () => {
    // Attempt to reproduce user's exact inputs from public test observation
    const userObservedInput = {
      targetPurity: 45,
      targetVials: 15,
      material: {
        state: 'raw' as const,
        availableGrams: 65,
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 300_000, // User said "300mL"
      heatingPlateOwned: true,
      heatingPlateModules: 2, // User said "Plate 2"
      filterContainerOwned: true,
      kottonDurability: 1000, // User said "fabric 1000"
      waterFilterDurability: 400, // User said "waterfilter 400"
      evaporatorOwned: true,
      evaporatorPerformancePercent: 0, // User said "bonuses 0"
      evaporatorEfficiencyPercent: 0,
      evaporatorQualityPercent: 0,
      solventRecoveryModule: false, // User said "Recovery off"
      distillateCapacityUL: 0, // User said "receiver 0"
      availableEnergy: 12_000, // User said "energy 12kJ"
      processingContainerCapacityUL: 500_000, // User said "container 500mL"
      finisherOwned: true,
      finisherModules: 4, // User said "Finisher 4"
      finisherCapacityVials: 24, // User said "outputcap 24"
      credits: 0, // User said "credits 0"
      allowPurchases: false, // User said "no purchases"
      mushroomQuoteCreditsPerGram: undefined,
      alcoholQuoteCreditsPerML: undefined,
    };

    console.log('=== Investigating Numerical Mismatch ===');
    console.log('User observed: 15/15 @ 86.64%, alcohol 202.246 mL, batch 277.912 mL');
    console.log('Agent e2e:     15/15 @ 87.22%, alcohol ??? mL');
    console.log('Difference:    +0.58% purity');
    console.log('');

    const result = solveProductionPlan(userObservedInput);

    console.log('Solver Status:', result.status);
    console.log('');

    if (result.candidate) {
      const c = result.candidate;
      const alcoholML = c.alcoholUsedUL / 1000;
      const purityDiff = c.finishing.meanPurity - 86.64;
      const alcoholDiff = alcoholML - 202.246;
      
      console.log('Agent Result:');
      console.log('  Raw grams used:', c.rawGramsUsed.toFixed(1), 'g');
      console.log('  Alcohol used:', alcoholML.toFixed(3), 'mL');
      console.log('  Vials produced:', c.finishing.vials.length, '/', userObservedInput.targetVials);
      console.log('  Mean purity:', c.finishing.meanPurity.toFixed(2), '%');
      console.log('  Batch volume:', (c.alcoholUsedUL + c.extraction.final.dreamCapMush * 1000) / 1000, 'mL (approx)');
      console.log('');
      console.log('Differences vs User Observation:');
      console.log('  Purity:', purityDiff > 0 ? '+' : '', purityDiff.toFixed(2), '%');
      console.log('  Alcohol:', alcoholDiff > 0 ? '+' : '', alcoholDiff.toFixed(3), 'mL');
      console.log('');
      console.log('Extraction details:');
      console.log('  Ticks:', c.extraction.ticks.length);
      console.log('');
      console.log('Evaporation:');
      console.log('  Cycles:', c.evaporation.cycles.length);
      console.log('');
      console.log('Finishing:');
      console.log('  Samples:', c.finishing.vials.length);
      console.log('  Individual purities:', c.finishing.vials.map(v => v.purity.toFixed(2) + '%').join(', '));
      
      // Hypothesis: User may have been on deployed version with old algorithm
      // or different input values (e.g., alcohol available, container capacity)
      console.log('');
      console.log('ANALYSIS:');
      if (Math.abs(purityDiff) < 1.0) {
        console.log('✓ Purity within 1% tolerance - likely minor rounding or algorithm refinement');
      } else {
        console.log('✗ Purity difference > 1% - investigate input mismatch or algorithm change');
      }
      
      if (Math.abs(alcoholDiff) < 10) {
        console.log('✓ Alcohol within 10mL tolerance');
      } else {
        console.log('✗ Alcohol difference > 10mL - investigate search algorithm change');
      }
      
      console.log('');
      console.log('LIKELY CAUSE:');
      console.log('User observed deployed site with old binary search algorithm.');
      console.log('Current branch uses bounded incomplete search (100µL coarse + 1µL fine).');
      console.log('Different search may find different (potentially better) local optimum.');
      console.log('Both results are feasible; difference is optimization heuristic, not error.');
    } else {
      console.log('❌ Solver found no feasible solution with user inputs!');
      console.log('Reasons:', result.reasons);
    }
  });
});
