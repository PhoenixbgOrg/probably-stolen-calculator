import { describe, test, expect } from 'vitest';
import {
  solveProductionPlan,
  type ProductionPlannerInput,
} from '../src/calculators/dreamDustPlanner';
import { type ComponentMixture, totalUL } from '../src/calculators/dreamDustVerified';

/**
 * Owner exact reproduction case from live PUBLIC Chemist calculator.
 * 
 * PUBLIC BROWSER EVIDENCE (2026-11-05, data version 2026-11-05.4, game 1.0.x REV6):
 * URL: /#/calculators/chemist
 * 
 * EXACT INPUTS:
 * - Mode: "Already-ground measured mixture — Blender bypassed"
 * - Target: 40% purity, 20 vials
 * - Ground measured components (6 non-zero):
 *   - Dream Cap Mush: 104.56 mL
 *   - Water: 18.88 mL
 *   - Protein: 9.44 mL
 *   - Mineral: 2.36 mL
 *   - Microbes: 9.44 mL
 *   - Physical Contaminant: 9.44 mL
 *   - (4 other components: 0 mL each)
 *   Total = 154.12 mL
 * - Alcohol available: 1000 mL
 * - Container: 500 mL
 * - Heating Plate: owned, 2 modules
 * - Filter: owned, Fabric 1000, Water 400
 * - Evaporator: owned, 0% bonuses, no Recovery, receiver 0
 * - Energy: 12 kJ
 * - Finisher: 4 modules, capacity 24
 * - Credits: 0, no purchases
 * - Raw 65g/blender 4 hidden (ground mode, untouched)
 * 
 * ACTUAL PUBLIC OUTPUT (BASELINE):
 * - Status: feasible
 * - Result: 20 vials @ 55.37% mean purity
 * - Ground mixture used: 145.600 mL (94.5% of available)
 * - Alcohol used: 81.852 mL
 * - Batch volume: 227.452 mL
 * - Extraction: 44°C, 26 updates, 22.148 mL extract, 0 mL reaction loss
 * - Filtration: removed 87.763 mL
 * - Evaporation: 1 cycle, 6 kJ, removed 99.688 mL
 * - Remaining: input 8.52 mL, alcohol 918.148 mL, dry 0.001 mL
 * - Waste: 187.451 mL
 * - Before Finisher: extract 22.148 mL, protein 8.918 mL, microbes 8.918 mL, mineral 0.003 mL, physical 0.014 mL
 * - Runtime: 1.6-2.4 seconds
 * 
 * VARIATION 1: Half mixture (proportional scaling ALL 6 components, total 77.06 mL):
 * - Status: no-solution-in-supported-search
 * - Best shown: 5/20 vials @ 84.70%
 * - Uses: 29 mL mixture + 98.375 mL alcohol
 * - 10 updates, 9.838 mL extract, 1.776 mL reaction loss
 * - 12.055 mL filter, 101.928 mL evap, 1.616 mL dry left
 * - Max finishable: 15 vials (displayed note: needed 28,384 µL additional dry)
 * - NOTE: Best-quality ≠ max-volume; bounded search, not proof of impossibility
 * 
 * VARIATION 2: Full batch, alcohol 100 mL only:
 * - Status: feasible
 * - Result: 20 vials @ 53.99%
 * - Uses: 150.100 mL mixture + 77.637 mL alcohol (batch 227.737 mL)
 * - 21.595 mL extract, 0 loss, 91.713 mL filter, 96.024 mL evap
 * - Remaining: 22.363 mL alcohol, dry 0 mL
 * 
 * VARIATION 3: Full batch, alcohol 1000 mL, target 70% / 20 vials:
 * - Status: feasible
 * - Result: 20 vials @ 76.37%
 * - Uses: 154 mL mixture + 132.847 mL alcohol (batch 286.847 mL)
 * - 30.550 mL extract, 9.433 mL reaction loss, 85.701 mL filter, 151.712 mL evap
 * - Dry: 0.001 mL
 * 
 * CRITICAL OBSERVATIONS:
 * - Owner's reported 67.22% does NOT match current public 55.37% baseline
 * - Do NOT label math wrong merely on mismatch - may be version/config difference
 * - Current solver uses 145.6/154.12 mL (94.5%), NOT 100%
 * - Bounded incomplete search acknowledged; "no-solution" ≠ proof of impossibility
 * - User expects actual game units for simple ground mode, no invented composition
 * - Half-mixture yields higher purity (84.70%) but insufficient volume (15 max vs 20 needed)
 * 
 * DEFECT INVESTIGATION SCOPE:
 * - Quantify resource tradeoffs and lexicographic priority compliance
 * - Verify homogeneous fraction scaling is available and correctly prioritized
 * - Check if cheaper feasible alternatives exist in bounded search space
 * - Document source/version differences rather than assuming one is "wrong"
 * - Capture actual deployed SHA via evidence, not historical assumption
 */

describe('Owner reproduction: 154.12mL ground mixture, 40%/20 vials target', () => {
  const groundMixture: ComponentMixture = {
    dreamCapMush: 104_560, // 104.56 mL
    dreamCapExtract: 0,
    plantMatter: 0,
    water: 18_880, // 18.88 mL
    protein: 9_440, // 9.44 mL
    mineral: 2_360, // 2.36 mL
    microbes: 9_440, // 9.44 mL
    physicalContaminant: 9_440, // 9.44 mL
    alcohol: 0,
    insolubleDebris: 0,
    acid: 0,
    base: 0,
    chemicalContaminant: 0,
    heavyMetal: 0,
    other: 0,
    organicWaste: 0,
    stabilizingAgent: 0,
    fatOil: 0,
    lipobondAgent: 0,
    chlorine: 0,
  };

  const baseInput: ProductionPlannerInput = {
    targetPurity: 40,
    targetVials: 20,
    material: {
      state: 'ground',
      available: groundMixture,
    },
    alcoholAvailableUL: 1_000_000, // 1000 mL
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
    processingContainerCapacityUL: 500_000, // 500 mL
    finisherOwned: true,
    finisherModules: 4,
    finisherCapacityVials: 24,
    credits: 0,
    allowPurchases: false,
  };

  test('Reproduce exact owner inputs and capture reported vs expected behavior', () => {
    console.log('='.repeat(80));
    console.log('OWNER REPRODUCTION CASE: 154.12mL ground mixture → 40%/20 vials');
    console.log('='.repeat(80));
    console.log('');
    console.log('Ground mixture components (µL):');
    for (const [key, value] of Object.entries(groundMixture)) {
      if (typeof value === 'number' && value > 0) {
        console.log(`  ${key}: ${value} µL (${(value / 1000).toFixed(3)} mL)`);
      }
    }
    console.log(`  TOTAL: ${totalUL(groundMixture)} µL (${(totalUL(groundMixture) / 1000).toFixed(3)} mL)`);
    console.log('');

    const result = solveProductionPlan(baseInput);

    console.log(`Result status: ${result.status}`);
    console.log('');

    if (result.reasons.length > 0) {
      console.log('Reasons:');
      result.reasons.forEach((r) => console.log(`  - ${r}`));
      console.log('');
    }

    const candidate = result.candidate ?? result.bestPurityCandidate;
    if (candidate) {
      console.log('SOLVER SELECTED SOLUTION:');
      console.log(`  Ground mixture used: ${candidate.groundULUsed} µL (${(candidate.groundULUsed / 1000).toFixed(3)} mL)`);
      console.log(`  Ground mixture remaining: ${totalUL(groundMixture) - candidate.groundULUsed} µL (${((totalUL(groundMixture) - candidate.groundULUsed) / 1000).toFixed(3)} mL)`);
      console.log(`  Alcohol used: ${candidate.alcoholUsedUL} µL (${(candidate.alcoholUsedUL / 1000).toFixed(3)} mL)`);
      console.log(`  Vials produced: ${candidate.finishing.vials.length}`);
      console.log(`  Mean purity: ${candidate.finishing.meanPurity.toFixed(2)}%`);
      console.log(`  Evaporation success: ${candidate.evaporation.success}`);
      console.log(`  Evaporation cycles: ${candidate.evaporation.cycles.length}`);
      console.log(`  Energy used: ${candidate.evaporation.energyUsed} kJ`);
      console.log('');

      // Calculate what fraction of the ground mixture was used
      const fractionUsed = candidate.groundULUsed / totalUL(groundMixture);
      console.log(`  FRACTION OF GROUND MIXTURE USED: ${(fractionUsed * 100).toFixed(2)}%`);
      console.log('');

      // Reported behavior from live site
      console.log('REPORTED LIVE SITE BEHAVIOR:');
      console.log('  ~20 vials @ 67.22%');
      console.log('');

      // Analysis
      console.log('DEFECT ANALYSIS:');
      if (candidate.finishing.meanPurity > 50) {
        console.log('  ⚠️  Solver produced MUCH HIGHER purity than target (67% vs 40% target)');
        console.log('  ⚠️  This suggests solver is using MORE material than necessary');
        console.log('  ⚠️  Target was 40%/20 vials - a LOWER fraction of the mixture should suffice');
      }
      if (candidate.groundULUsed === totalUL(groundMixture)) {
        console.log('  ⚠️  Solver used ALL available ground mixture (no leftovers)');
        console.log('  ⚠️  Optimizer should minimize material usage');
        console.log('  ⚠️  Expected: find smallest fraction that meets 40%/20 target');
      }
      console.log('');

      // Search for minimum feasible fraction
      console.log('SEARCHING FOR MINIMUM FEASIBLE FRACTION:');
      const targetVials = 20;
      const targetPurity = 40;
      
      // Binary search for minimum feasible ground volume
      let minFeasibleUL: number | null = null;
      const totalGroundUL = totalUL(groundMixture);
      
      // Start with minimum volume needed for 20 vials (20 * 2000 µL = 40,000 µL dry minimum)
      // But we need to account for extraction, filtration, evaporation losses
      // A rough estimate: need ~3-5x the final dry volume as starting material
      const minPossibleUL = 40_000; // Absolute minimum (20 vials * 2000 µL/vial)
      
      for (let testUL = minPossibleUL; testUL <= totalGroundUL; testUL += 1000) {
        const testInput: ProductionPlannerInput = {
          ...baseInput,
          material: {
            state: 'ground',
            available: {
              dreamCapMush: Math.round((groundMixture.dreamCapMush * testUL) / totalGroundUL),
              dreamCapExtract: 0,
              plantMatter: 0,
              water: Math.round((groundMixture.water * testUL) / totalGroundUL),
              protein: Math.round((groundMixture.protein * testUL) / totalGroundUL),
              mineral: Math.round((groundMixture.mineral * testUL) / totalGroundUL),
              microbes: Math.round((groundMixture.microbes * testUL) / totalGroundUL),
              physicalContaminant: Math.round((groundMixture.physicalContaminant * testUL) / totalGroundUL),
              alcohol: 0,
              insolubleDebris: 0,
    acid: 0,
    base: 0,
    chemicalContaminant: 0,
    heavyMetal: 0,
    other: 0,
    organicWaste: 0,
    stabilizingAgent: 0,
    fatOil: 0,
    lipobondAgent: 0,
    chlorine: 0,
            },
          },
        };
        
        const testResult = solveProductionPlan(testInput);
        const testCandidate = testResult.candidate;
        
        if (
          testCandidate &&
          testCandidate.finishing.vials.length >= targetVials &&
          testCandidate.finishing.meanPurity >= targetPurity - 0.01
        ) {
          minFeasibleUL = testUL;
          console.log(`  ✓ Found feasible at ${testUL} µL (${(testUL / 1000).toFixed(1)} mL, ${((testUL / totalGroundUL) * 100).toFixed(1)}%): ${testCandidate.finishing.vials.length} vials @ ${testCandidate.finishing.meanPurity.toFixed(2)}%`);
          break;
        }
      }
      
      if (minFeasibleUL) {
        console.log('');
        console.log(`  MINIMUM FEASIBLE FRACTION: ${(minFeasibleUL / 1000).toFixed(1)} mL (${((minFeasibleUL / totalGroundUL) * 100).toFixed(1)}% of available)`);
        console.log(`  CURRENT SOLVER USES: ${(candidate.groundULUsed / 1000).toFixed(1)} mL (${((candidate.groundULUsed / totalGroundUL) * 100).toFixed(1)}% of available)`);
        console.log(`  POTENTIAL SAVINGS: ${((candidate.groundULUsed - minFeasibleUL) / 1000).toFixed(1)} mL of ground mixture`);
      } else {
        console.log('  ℹ️  No feasible solution found in coarse search (1mL steps)');
      }
      console.log('');
    }

    console.log('='.repeat(80));
  });

  test('Verify homogeneous fraction scaling preserves composition ratios', () => {
    const totalUL_original = totalUL(groundMixture);
    const fraction = 0.5; // Take 50% of the mixture
    const scaledUL = Math.round(totalUL_original * fraction);

    // Scale all components proportionally
    const scaled: ComponentMixture = {
      dreamCapMush: Math.round((groundMixture.dreamCapMush * scaledUL) / totalUL_original),
      dreamCapExtract: 0,
      plantMatter: 0,
      water: Math.round((groundMixture.water * scaledUL) / totalUL_original),
      protein: Math.round((groundMixture.protein * scaledUL) / totalUL_original),
      mineral: Math.round((groundMixture.mineral * scaledUL) / totalUL_original),
      microbes: Math.round((groundMixture.microbes * scaledUL) / totalUL_original),
      physicalContaminant: Math.round((groundMixture.physicalContaminant * scaledUL) / totalUL_original),
      alcohol: 0,
      insolubleDebris: 0,
    acid: 0,
    base: 0,
    chemicalContaminant: 0,
    heavyMetal: 0,
    other: 0,
    organicWaste: 0,
    stabilizingAgent: 0,
    fatOil: 0,
    lipobondAgent: 0,
    chlorine: 0,
    };

    // Check that ratios are preserved (within rounding tolerance)
    const originalMushRatio = groundMixture.dreamCapMush / totalUL_original;
    const scaledMushRatio = scaled.dreamCapMush / totalUL(scaled);
    expect(Math.abs(originalMushRatio - scaledMushRatio)).toBeLessThan(0.01);

    const originalWaterRatio = groundMixture.water / totalUL_original;
    const scaledWaterRatio = scaled.water / totalUL(scaled);
    expect(Math.abs(originalWaterRatio - scaledWaterRatio)).toBeLessThan(0.01);

    console.log('Homogeneous scaling verified:');
    console.log(`  Original: ${totalUL_original} µL, mush ratio: ${(originalMushRatio * 100).toFixed(2)}%`);
    console.log(`  Scaled (50%): ${totalUL(scaled)} µL, mush ratio: ${(scaledMushRatio * 100).toFixed(2)}%`);
  });
});
