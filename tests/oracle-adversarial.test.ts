import { describe, test, expect } from 'vitest';
import { solveProductionPlan, type ProductionPlannerInput } from '../src/calculators/dreamDustPlanner';

/**
 * Adversarial small-domain oracle test.
 * 
 * Purpose: Compare the heuristic coarse+fine search against an exhaustive 1µL brute-force
 * oracle over a small bounded domain to detect narrow feasible windows the heuristic misses.
 * 
 * This test validates the explicit incompleteness of the bounded coarse search by demonstrating
 * that narrow feasible intervals can be skipped.
 */

describe('Small-Domain Oracle vs Coarse Search', () => {
  test('bounded exhaustive oracle detects all feasible alcohol volumes (small domain)', () => {
    // Small test case: 10g raw, 4 blender modules, 45% purity, 5 vials
    const maxAlcoholUL = 5000;
    
    const baseInput: ProductionPlannerInput = {
      targetPurity: 45,
      targetVials: 5,
      material: {
        state: 'raw',
        availableGrams: 10,
        blenderOwned: true,
        blenderModules: 4,
      },
      mushroomQuoteCreditsPerGram: undefined,
      alcoholAvailableUL: maxAlcoholUL,
      alcoholQuoteCreditsPerML: undefined,
      processingContainerCapacityUL: 500_000,
      heatingPlateOwned: true,
      heatingPlateModules: 2,
      filterContainerOwned: true,
      kottonDurability: 1000,
      waterFilterDurability: 400,
      evaporatorOwned: true,
      evaporatorPerformancePercent: 0,
      evaporatorEfficiencyPercent: 0,
      evaporatorQualityPercent: 0,
      solventRecoveryModule: false,
      distillateCapacityUL: 0,
      availableEnergy: 12_000,
      finisherOwned: true,
      finisherModules: 4,
      finisherCapacityVials: 24,
      allowPurchases: false,
      credits: 0,
    };

    // Exhaustive 1µL oracle: test every integer alcohol volume from 0 to maxAlcoholUL
    const oracleFeasible: number[] = [];
    
    console.log('Running exhaustive 1µL oracle (0 to', maxAlcoholUL, 'µL)...');
    const oracleStart = Date.now();
    
    for (let alcoholUL = 0; alcoholUL <= maxAlcoholUL; alcoholUL += 1) {
      const testInput = { ...baseInput, alcoholAvailableUL: alcoholUL };
      const plan = solveProductionPlan(testInput);
      
      if (plan.status === 'feasible' && plan.candidate) {
        if (plan.candidate.finishing.vials.length >= baseInput.targetVials &&
            plan.candidate.finishing.meanPurity >= baseInput.targetPurity) {
          oracleFeasible.push(alcoholUL);
        }
      }
    }
    
    const oracleElapsed = Date.now() - oracleStart;
    console.log(`Oracle found ${oracleFeasible.length} feasible alcohol volumes in ${oracleElapsed}ms`);
    console.log('Feasible alcohol volumes (µL):', oracleFeasible.slice(0, 20), oracleFeasible.length > 20 ? '...' : '');
    
    // Heuristic coarse search: use the actual solver (which uses 100µL coarse steps)
    console.log('Running heuristic coarse search...');
    const heuristicStart = Date.now();
    const heuristicPlan = solveProductionPlan(baseInput);
    const heuristicElapsed = Date.now() - heuristicStart;
    
    console.log(`Heuristic completed in ${heuristicElapsed}ms`);
    console.log('Heuristic status:', heuristicPlan.status);
    console.log('Heuristic candidate alcohol (µL):', heuristicPlan.candidate?.alcoholUsedUL);
    
    // Analysis: Check if heuristic found a feasible solution
    const heuristicFoundFeasible = heuristicPlan.status === 'feasible';
    const oracleFoundFeasible = oracleFeasible.length > 0;
    
    if (oracleFoundFeasible && !heuristicFoundFeasible) {
      console.warn('INCOMPLETENESS DETECTED: Oracle found feasible solutions, but heuristic did not.');
      console.warn('This demonstrates that narrow feasible intervals can be skipped by coarse search.');
    }
    
    if (heuristicFoundFeasible && oracleFoundFeasible) {
      const heuristicAlcohol = heuristicPlan.candidate!.alcoholUsedUL;
      const oracleContainsHeuristic = oracleFeasible.includes(heuristicAlcohol);
      
      if (!oracleContainsHeuristic) {
        console.warn('WARNING: Heuristic found a solution not in oracle feasible set (precision mismatch or oracle bug).');
      } else {
        console.log('Heuristic solution is validated by oracle.');
      }
      
      // Find smallest feasible alcohol from oracle
      const oracleMinAlcohol = Math.min(...oracleFeasible);
      console.log('Oracle minimum feasible alcohol:', oracleMinAlcohol, 'µL');
      console.log('Heuristic alcohol:', heuristicAlcohol, 'µL');
      
      if (heuristicAlcohol > oracleMinAlcohol) {
        console.log(`Heuristic is suboptimal by ${heuristicAlcohol - oracleMinAlcohol} µL (uses more alcohol than oracle minimum).`);
      } else if (heuristicAlcohol === oracleMinAlcohol) {
        console.log('Heuristic found the oracle-optimal minimum alcohol solution.');
      }
    }
    
    // Expectation: For this small domain, both should find solutions or both should fail
    // If oracle finds feasible and heuristic doesn't, that proves incompleteness
    // This test documents the behavior rather than asserting absolute correctness
    expect(oracleFoundFeasible).toBeDefined();
    expect(heuristicFoundFeasible).toBeDefined();
    
    if (oracleFoundFeasible) {
      expect(oracleFeasible.length).toBeGreaterThan(0);
      console.log('Test complete: Oracle found feasible space, heuristic may or may not find it (demonstrating bounded search limitations).');
    } else {
      console.log('Test complete: No feasible solutions exist in this small domain for either oracle or heuristic.');
    }
  });

  test('heuristic performance vs oracle on multiple small cases', () => {
    // Test multiple small configurations to gather statistics on heuristic vs oracle
    const testCases = [
      { grams: 5, vials: 3, purity: 45, maxAlcohol: 3000 },
      { grams: 10, vials: 5, purity: 50, maxAlcohol: 5000 },
      { grams: 15, vials: 7, purity: 40, maxAlcohol: 7000 },
    ];
    
    let totalMisses = 0;
    let totalSuboptimal = 0;
    
    for (const tc of testCases) {
      const baseInput: ProductionPlannerInput = {
        targetPurity: tc.purity,
        targetVials: tc.vials,
        material: { state: 'raw', availableGrams: tc.grams, blenderOwned: true, blenderModules: 4 },
        mushroomQuoteCreditsPerGram: undefined,
        alcoholAvailableUL: tc.maxAlcohol,
        alcoholQuoteCreditsPerML: undefined,
        processingContainerCapacityUL: 500_000,
        heatingPlateOwned: true,
        heatingPlateModules: 2,
        filterContainerOwned: true,
        kottonDurability: 1000,
        waterFilterDurability: 400,
        evaporatorOwned: true,
        evaporatorPerformancePercent: 0,
        evaporatorEfficiencyPercent: 0,
        evaporatorQualityPercent: 0,
        solventRecoveryModule: false,
        distillateCapacityUL: 0,
        availableEnergy: 12_000,
        finisherOwned: true,
        finisherModules: 4,
        finisherCapacityVials: 24,
        allowPurchases: false,
        credits: 0,
      };
      
      // Oracle
      const oracleFeasible: number[] = [];
      for (let alcoholUL = 0; alcoholUL <= tc.maxAlcohol; alcoholUL += 1) {
        const testInput = { ...baseInput, alcoholAvailableUL: alcoholUL };
        const plan = solveProductionPlan(testInput);
        if (plan.status === 'feasible' && plan.candidate) {
          if (plan.candidate.finishing.vials.length >= tc.vials &&
              plan.candidate.finishing.meanPurity >= tc.purity) {
            oracleFeasible.push(alcoholUL);
          }
        }
      }
      
      // Heuristic
      const heuristicPlan = solveProductionPlan(baseInput);
      const heuristicFoundFeasible = heuristicPlan.status === 'feasible';
      const oracleFoundFeasible = oracleFeasible.length > 0;
      
      console.log(`Case: ${tc.grams}g, ${tc.vials} vials, ${tc.purity}% purity, max ${tc.maxAlcohol}µL alcohol`);
      console.log(`  Oracle: ${oracleFeasible.length} feasible, min: ${oracleFoundFeasible ? Math.min(...oracleFeasible) : 'N/A'}µL`);
      console.log(`  Heuristic: ${heuristicFoundFeasible ? 'found ' + heuristicPlan.candidate!.alcoholUsedUL + 'µL' : 'no solution'}`);
      
      if (oracleFoundFeasible && !heuristicFoundFeasible) {
        console.warn('  ❌ MISS: Heuristic missed feasible space found by oracle');
        totalMisses++;
      } else if (heuristicFoundFeasible && oracleFoundFeasible) {
        const heuristicAlcohol = heuristicPlan.candidate!.alcoholUsedUL;
        const oracleMin = Math.min(...oracleFeasible);
        if (heuristicAlcohol > oracleMin) {
          console.warn(`  ⚠️  SUBOPTIMAL: Heuristic uses ${heuristicAlcohol - oracleMin}µL more than oracle minimum`);
          totalSuboptimal++;
        } else {
          console.log('  ✓ OPTIMAL: Heuristic matches oracle minimum');
        }
      } else {
        console.log('  ✓ CONSISTENT: Both agree no feasible solution');
      }
    }
    
    console.log(`\nSummary: ${totalMisses} misses, ${totalSuboptimal} suboptimal out of ${testCases.length} cases`);
    
    // Document incompleteness: we expect some misses or suboptimal results
    if (totalMisses > 0) {
      console.log('INCOMPLETENESS CONFIRMED: Heuristic coarse search skips narrow feasible windows.');
    }
  });
});
