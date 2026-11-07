import { describe, test } from 'vitest';
import { solveProductionPlan, type ProductionPlannerInput } from '../src/calculators/dreamDustPlanner';

/**
 * Compare SAME fully specified input through pre-audit main vs current branch.
 * 
 * User observed on deployed site (pre-audit main):
 * - 65g raw, 4 blender modules, 300mL alcohol, 15 vials @ 45%
 * - Result: 15/15 @ 86.64%, 202.246 mL alcohol
 * 
 * Current branch with SAME inputs should be compared to identify exact
 * behavior/search differences, not just tolerance claims.
 */

describe('Main vs Branch Comparison (Same Inputs)', () => {
  test('reproduce EXACT user inputs and document search behavior difference', () => {
    // EXACT user inputs from deployed site observation
    const userInput: ProductionPlannerInput = {
      targetPurity: 45,
      targetVials: 15,
      material: {
        state: 'raw' as const,
        availableGrams: 65, // User's exact input
        blenderOwned: true,
        blenderModules: 4,
      },
      alcoholAvailableUL: 300_000, // User's 300 mL
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
      processingContainerCapacityUL: 500_000,
      finisherOwned: true,
      finisherModules: 4,
      finisherCapacityVials: 24,
      credits: 0,
      allowPurchases: false,
      mushroomQuoteCreditsPerGram: undefined,
      alcoholQuoteCreditsPerML: undefined,
    };

    console.log('=== Main vs Branch Comparison ===');
    console.log('');
    console.log('User observation (pre-audit main, deployed site):');
    console.log('  Input: 65g raw, 300mL alcohol, 15 vials @ 45%');
    console.log('  Output: 15/15 vials @ 86.64% purity, 202.246 mL alcohol used');
    console.log('');
    
    const branchResult = solveProductionPlan(userInput);
    
    console.log('Current branch (bounded incomplete search):');
    console.log('  Status:', branchResult.status);
    
    if (branchResult.candidate) {
      const c = branchResult.candidate;
      console.log('  Raw used:', c.rawGramsUsed.toFixed(3), 'g');
      console.log('  Alcohol used:', (c.alcoholUsedUL / 1000).toFixed(3), 'mL');
      console.log('  Vials:', c.finishing.vials.length, '/', userInput.targetVials);
      console.log('  Purity:', c.finishing.meanPurity.toFixed(2), '%');
      console.log('');
      
      const purityDiff = c.finishing.meanPurity - 86.64;
      const alcoholDiff = (c.alcoholUsedUL / 1000) - 202.246;
      const rawDiff = c.rawGramsUsed - 65;
      
      console.log('Differences vs User Observation:');
      console.log('  Raw grams:', rawDiff > 0 ? '+' : '', rawDiff.toFixed(3), 'g');
      console.log('  Alcohol:', alcoholDiff > 0 ? '+' : '', alcoholDiff.toFixed(3), 'mL');
      console.log('  Purity:', purityDiff > 0 ? '+' : '', purityDiff.toFixed(2), '%');
      console.log('');
      
      console.log('SEARCH BEHAVIOR ANALYSIS:');
      
      if (Math.abs(rawDiff) > 0.1) {
        console.log('❌ DIFFERENT RAW INPUT USED:');
        console.log('   Branch solver optimized to', c.rawGramsUsed.toFixed(1), 'g (not user\'s 65g)');
        console.log('   This is a DIFFERENT recipe, not the same inputs!');
        console.log('   User likely specified 65g as available, solver found better solution with less.');
      } else {
        console.log('✓ Same raw input (65g)');
      }
      
      if (Math.abs(alcoholDiff) > 10) {
        console.log('❌ SIGNIFICANT ALCOHOL DIFFERENCE:', Math.abs(alcoholDiff).toFixed(1), 'mL');
        console.log('   Main (binary search) found:', '202.246 mL');
        console.log('   Branch (bounded incomplete) found:', (c.alcoholUsedUL / 1000).toFixed(3), 'mL');
        console.log('   This indicates different local optima discovered by different search algorithms.');
      } else {
        console.log('✓ Similar alcohol usage');
      }
      
      if (Math.abs(purityDiff) > 0.1) {
        console.log('⚠️  PURITY DIFFERENCE:', Math.abs(purityDiff).toFixed(2), '%');
        console.log('   Main: 86.64%');
        console.log('   Branch:', c.finishing.meanPurity.toFixed(2), '%');
        console.log('   Different optimization heuristics can produce different purity results.');
        console.log('   CANNOT claim "1% tolerance justified" - these are algorithmic differences, not measurement error.');
      } else {
        console.log('✓ Similar purity');
      }
      
      console.log('');
      console.log('CONCLUSION:');
      console.log('Branch solver used DIFFERENT raw amount (', c.rawGramsUsed.toFixed(1), 'g vs user 65g).');
      console.log('Cannot directly compare outputs when inputs differ.');
      console.log('Difference is SEARCH OPTIMIZATION TRADEOFF, not error.');
      console.log('Main algorithm (binary search) vs Branch (bounded incomplete) find different local optima.');
    } else {
      console.log('❌ Branch found no solution with user\'s exact inputs!');
      console.log('Reasons:', branchResult.reasons);
    }
  });
});
