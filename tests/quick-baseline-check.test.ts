import { describe, test, expect } from 'vitest';
import {
  solveProductionPlan,
  type ProductionPlannerInput,
} from '../src/calculators/dreamDustPlanner';
import { type ComponentMixture, totalUL } from '../src/calculators/dreamDustVerified';

/**
 * Quick baseline check to understand current solver behavior
 */

describe('Quick baseline diagnostic', () => {
  const groundMixture: ComponentMixture = {
    dreamCapMush: 104_560,
    dreamCapExtract: 0,
    plantMatter: 0,
    water: 18_880,
    protein: 9_440,
    mineral: 2_360,
    microbes: 9_440,
    physicalContaminant: 9_440,
    alcohol: 0,
    insolubleDebris: 0,
    acid: 0,
    base: 0,
    chemicalContaminant: 0,
    heavyMetal: 0,
    other: 0,
  };

  const baseInput: ProductionPlannerInput = {
    targetPurity: 40,
    targetVials: 20,
    material: {
      state: 'ground',
      available: groundMixture,
    },
    alcoholAvailableUL: 1_000_000,
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

  test('Current solver baseline: what does it produce?', () => {
    console.time('Solve time');
    const result = solveProductionPlan(baseInput);
    console.timeEnd('Solve time');
    
    console.log('\nRESULT:');
    console.log(`  Status: ${result.status}`);
    console.log(`  Configs evaluated: ${result.searchSummary}`);
    
    const c = result.candidate;
    if (c) {
      console.log('\nFEASIBLE CANDIDATE:');
      console.log(`  Ground: ${(c.groundULUsed / 1000).toFixed(3)} mL (${((c.groundULUsed / totalUL(groundMixture)) * 100).toFixed(1)}%)`);
      console.log(`  Alcohol: ${(c.alcoholUsedUL / 1000).toFixed(3)} mL`);
      console.log(`  Batch: ${(totalUL(c.extraction.initialMixture) / 1000).toFixed(3)} mL`);
      console.log(`  Vials: ${c.finishing.vials.length} @ ${c.finishing.meanPurity.toFixed(2)}%`);
      console.log(`  Energy: ${c.evaporation.energyUsed} kJ / ${baseInput.availableEnergy} kJ`);
      console.log(`  Extraction: ${c.extraction.ticks.length} updates`);
      console.log(`  Evaporation: ${c.evaporation.cycles.length} cycles`);
      
      // Check constraints
      const batchOK = totalUL(c.extraction.initialMixture) <= baseInput.processingContainerCapacityUL;
      const energyOK = c.evaporation.energyUsed <= baseInput.availableEnergy;
      const dryOK = (c.finalMixtureBeforeFinishing.water + c.finalMixtureBeforeFinishing.alcohol) <= 100;
      const targetOK = c.finishing.vials.length >= baseInput.targetVials && c.finishing.meanPurity >= baseInput.targetPurity - 0.01;
      
      console.log('\nCONSTRAINTS:');
      console.log(`  Batch ≤ 500mL: ${batchOK ? '✓' : '✗'}`);
      console.log(`  Energy ≤ 12kJ: ${energyOK ? '✓' : '✗'}`);
      console.log(`  Dry ≤ 100µL: ${dryOK ? '✓' : '✗'}`);
      console.log(`  Target met: ${targetOK ? '✓' : '✗'}`);
      
      expect(batchOK).toBe(true);
      expect(energyOK).toBe(true);
      expect(dryOK).toBe(true);
      expect(targetOK).toBe(true);
    }
    
    const best = result.bestPurityCandidate;
    if (best && best !== c) {
      console.log('\nBEST PURITY (non-feasible):');
      console.log(`  Ground: ${(best.groundULUsed / 1000).toFixed(3)} mL`);
      console.log(`  Alcohol: ${(best.alcoholUsedUL / 1000).toFixed(3)} mL`);
      console.log(`  Vials: ${best.finishing.vials.length} @ ${best.finishing.meanPurity.toFixed(2)}%`);
    }
    
    console.log('\nPUBLIC BROWSER REFERENCE:');
    console.log(`  Ground: 145.600 mL (94.5%)`);
    console.log(`  Alcohol: 81.852 mL`);
    console.log(`  Vials: 20 @ 55.37%`);
    
    console.log('\nDISCREPANCY:');
    if (c) {
      const groundDiff = c.groundULUsed / 1000 - 145.600;
      const alcoholDiff = c.alcoholUsedUL / 1000 - 81.852;
      const purityDiff = c.finishing.meanPurity - 55.37;
      console.log(`  Ground: ${groundDiff > 0 ? '+' : ''}${groundDiff.toFixed(3)} mL`);
      console.log(`  Alcohol: ${alcoholDiff > 0 ? '+' : ''}${alcoholDiff.toFixed(3)} mL`);
      console.log(`  Purity: ${purityDiff > 0 ? '+' : ''}${purityDiff.toFixed(2)}%`);
    }
  });
});
