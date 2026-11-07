import { describe, test, expect } from 'vitest';
import {
  solveProductionPlan,
  type ProductionPlannerInput,
  type ProductionCandidate,
} from '../src/calculators/dreamDustPlanner';
import { type ComponentMixture, totalUL } from '../src/calculators/dreamDustVerified';

/**
 * Verify that candidates actually meet all constraints and targets.
 * This test validates the CURRENT implementation's output, not speculation.
 */

describe('Candidate constraint verification', () => {
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

  function verifyCandidateConstraints(
    candidate: ProductionCandidate,
    input: ProductionPlannerInput,
    label: string,
  ): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`VERIFYING: ${label}`);
    console.log('='.repeat(80));

    // Material usage
    console.log('\n1. MATERIAL USAGE:');
    console.log(`   Ground used: ${(candidate.groundULUsed / 1000).toFixed(3)} mL`);
    console.log(`   Ground available: ${(totalUL(input.material.state === 'ground' ? input.material.available : {} as ComponentMixture) / 1000).toFixed(3)} mL`);
    console.log(`   Fraction: ${((candidate.groundULUsed / totalUL(input.material.state === 'ground' ? input.material.available : {} as ComponentMixture)) * 100).toFixed(1)}%`);
    
    if (input.material.state === 'ground') {
      expect(candidate.groundULUsed).toBeLessThanOrEqual(totalUL(input.material.available));
      console.log('   ✓ Ground usage within inventory');
    }

    // Alcohol usage
    console.log('\n2. ALCOHOL USAGE:');
    console.log(`   Alcohol used: ${(candidate.alcoholUsedUL / 1000).toFixed(3)} mL`);
    console.log(`   Alcohol available: ${(input.alcoholAvailableUL / 1000).toFixed(3)} mL`);
    expect(candidate.alcoholUsedUL).toBeLessThanOrEqual(input.alcoholAvailableUL);
    console.log('   ✓ Alcohol usage within inventory');

    // Batch volume
    const batchUL = totalUL(candidate.extraction.initialMixture);
    console.log('\n3. BATCH VOLUME:');
    console.log(`   Batch volume: ${(batchUL / 1000).toFixed(3)} mL`);
    console.log(`   Container capacity: ${(input.processingContainerCapacityUL / 1000).toFixed(3)} mL`);
    expect(batchUL).toBeLessThanOrEqual(input.processingContainerCapacityUL);
    console.log('   ✓ Batch fits in container');

    // Energy
    console.log('\n4. ENERGY:');
    console.log(`   Energy used: ${candidate.evaporation.energyUsed} kJ`);
    console.log(`   Energy available: ${input.availableEnergy} kJ`);
    expect(candidate.evaporation.energyUsed).toBeLessThanOrEqual(input.availableEnergy);
    console.log('   ✓ Energy usage within budget');

    // Evaporation success
    console.log('\n5. EVAPORATION:');
    console.log(`   Success: ${candidate.evaporation.success}`);
    console.log(`   Cycles: ${candidate.evaporation.cycles.length}`);
    console.log(`   Removed: ${(totalUL(candidate.evaporation.removed) / 1000).toFixed(3)} mL`);
    console.log(`   Final evaporatives: ${((candidate.finalMixtureBeforeFinishing.water + candidate.finalMixtureBeforeFinishing.alcohol) / 1000).toFixed(3)} mL`);
    expect(candidate.evaporation.success).toBe(true);
    console.log('   ✓ Evaporation succeeded');

    // Dryness
    const evaporativesUL = candidate.finalMixtureBeforeFinishing.water + candidate.finalMixtureBeforeFinishing.alcohol;
    console.log('\n6. DRYNESS:');
    console.log(`   Evaporatives: ${evaporativesUL} µL`);
    expect(evaporativesUL).toBeLessThanOrEqual(100);
    console.log('   ✓ Mixture is dry (≤100 µL evaporatives)');

    // Finishing success
    console.log('\n7. FINISHING:');
    console.log(`   Success: ${candidate.finishing.success}`);
    console.log(`   Vials produced: ${candidate.finishing.vials.length}`);
    console.log(`   Finisher capacity: ${input.finisherCapacityVials}`);
    console.log(`   Mean purity: ${candidate.finishing.meanPurity.toFixed(2)}%`);
    expect(candidate.finishing.success).toBe(true);
    expect(candidate.finishing.vials.length).toBeLessThanOrEqual(input.finisherCapacityVials);
    console.log('   ✓ Finishing succeeded within capacity');

    // Target achievement
    console.log('\n8. TARGET ACHIEVEMENT:');
    console.log(`   Target: ${input.targetVials} vials @ ≥${input.targetPurity}%`);
    console.log(`   Actual: ${candidate.finishing.vials.length} vials @ ${candidate.finishing.meanPurity.toFixed(2)}%`);
    expect(candidate.finishing.vials.length).toBeGreaterThanOrEqual(input.targetVials);
    expect(candidate.finishing.meanPurity).toBeGreaterThanOrEqual(input.targetPurity - 0.01);
    console.log('   ✓ Target met');

    // Component accounting
    console.log('\n9. COMPONENT BREAKDOWN:');
    console.log('   Before Finisher (dry mixture):');
    const dry = candidate.finalMixtureBeforeFinishing;
    console.log(`     Extract: ${(dry.dreamCapExtract / 1000).toFixed(3)} mL`);
    console.log(`     Protein: ${(dry.protein / 1000).toFixed(3)} mL`);
    console.log(`     Microbes: ${(dry.microbes / 1000).toFixed(3)} mL`);
    console.log(`     Mineral: ${(dry.mineral / 1000).toFixed(3)} mL`);
    console.log(`     Physical: ${(dry.physicalContaminant / 1000).toFixed(3)} mL`);
    console.log(`     Plant: ${(dry.plantMatter / 1000).toFixed(3)} mL`);
    console.log(`     Total dry: ${(totalUL(dry) / 1000).toFixed(3)} mL`);

    // Extraction details
    console.log('\n10. EXTRACTION:');
    console.log(`    Temperature: 44°C (required)`);
    console.log(`    Updates: ${candidate.extraction.ticks.length}`);
    console.log(`    Extract produced: ${(candidate.extraction.final.dreamCapExtract / 1000).toFixed(3)} mL`);
    console.log(`    Reaction loss: ${(totalUL(candidate.extractionLoss) / 1000).toFixed(3)} mL`);

    // Filtration
    console.log('\n11. FILTRATION:');
    console.log(`    Removed: ${(totalUL(candidate.filtration.removed) / 1000).toFixed(3)} mL`);
    if (candidate.filtration.passes.length > 0) {
      candidate.filtration.passes.forEach(pass => {
        console.log(`    ${pass.name}: ${pass.startingDurability} → ${pass.remainingDurability}`);
      });
    } else {
      console.log('    No filters applied');
    }

    console.log(`\n${'='.repeat(80)}\n`);
  }

  test('Baseline: Verify current solver output for 40%/20 target', () => {
    const result = solveProductionPlan(baseInput);
    
    expect(result.status).toBe('feasible');
    expect(result.candidate).toBeTruthy();
    
    if (result.candidate) {
      verifyCandidateConstraints(result.candidate, baseInput, 'CURRENT SOLVER: 40%/20 target');
      
      // Store for comparison
      console.log('SUMMARY:');
      console.log(`  Ground: ${(result.candidate.groundULUsed / 1000).toFixed(3)} mL`);
      console.log(`  Alcohol: ${(result.candidate.alcoholUsedUL / 1000).toFixed(3)} mL`);
      console.log(`  Result: ${result.candidate.finishing.vials.length} vials @ ${result.candidate.finishing.meanPurity.toFixed(2)}%`);
    }
  });

  test('Public browser comparison: Check if we can reproduce 145.6 mL + 81.852 mL', () => {
    // Try to understand what configuration gives public browser output
    // We'll search for candidates with similar characteristics
    
    console.log('\n' + '='.repeat(80));
    console.log('SEARCHING FOR PUBLIC BROWSER-LIKE SOLUTIONS');
    console.log('Target: ~145.6 mL ground + ~81.852 mL alcohol → 20 @ 55.37%');
    console.log('='.repeat(80));
    
    // Test specific ground amounts near 145.6 mL
    const testGroundAmounts = [140_000, 145_000, 145_600, 150_000, 154_120];
    
    for (const groundUL of testGroundAmounts) {
      if (groundUL > totalUL(groundMixture)) continue;
      
      const scaledMixture: ComponentMixture = {
        dreamCapMush: Math.round((groundMixture.dreamCapMush * groundUL) / totalUL(groundMixture)),
        dreamCapExtract: 0,
        plantMatter: 0,
        water: Math.round((groundMixture.water * groundUL) / totalUL(groundMixture)),
        protein: Math.round((groundMixture.protein * groundUL) / totalUL(groundMixture)),
        mineral: Math.round((groundMixture.mineral * groundUL) / totalUL(groundMixture)),
        microbes: Math.round((groundMixture.microbes * groundUL) / totalUL(groundMixture)),
        physicalContaminant: Math.round((groundMixture.physicalContaminant * groundUL) / totalUL(groundMixture)),
        alcohol: 0,
        insolubleDebris: 0,
    acid: 0,
    base: 0,
    chemicalContaminant: 0,
    heavyMetal: 0,
    other: 0,
      };
      
      const result = solveProductionPlan({
        ...baseInput,
        material: { state: 'ground', available: scaledMixture },
      });
      
      if (result.candidate) {
        const c = result.candidate;
        console.log(`\nWith ${(groundUL / 1000).toFixed(1)} mL available:`);
        console.log(`  Uses: ${(c.groundULUsed / 1000).toFixed(3)} mL ground + ${(c.alcoholUsedUL / 1000).toFixed(3)} mL alcohol`);
        console.log(`  Result: ${c.finishing.vials.length} @ ${c.finishing.meanPurity.toFixed(2)}%`);
      }
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  });

  test('Alcohol-constrained: Verify 100 mL alcohol limit behavior', () => {
    const result = solveProductionPlan({
      ...baseInput,
      alcoholAvailableUL: 100_000, // 100 mL
    });
    
    expect(result.status).toBe('feasible');
    
    if (result.candidate) {
      verifyCandidateConstraints(result.candidate, {
        ...baseInput,
        alcoholAvailableUL: 100_000,
      }, 'ALCOHOL CONSTRAINED: 100 mL limit');
    }
  });
});
