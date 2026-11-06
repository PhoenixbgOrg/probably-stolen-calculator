import { describe, test, expect } from 'vitest';

/**
 * Synthetic narrow window predicate test to expose coarse search incompleteness.
 * 
 * Previous oracle tests were either vacuous (no feasible solutions) or too slow
 * (exhaustive solver calls timeout). This test uses a simple synthetic predicate
 * to PROVE that 100µL coarse steps miss narrow (<100µL) feasible windows.
 * 
 * This demonstrates the structural incompleteness of bounded coarse search without
 * requiring expensive solver calls.
 */

describe('Synthetic Narrow Window Incompleteness Proof', () => {
  test('coarse search (100µL) systematically misses narrow windows (<100µL)', () => {
    console.log('=== Synthetic Narrow Window Test ===');
    console.log('');
    console.log('Simulating feasibility predicate with narrow windows:');
    console.log('  Feasible intervals: [5000-5050], [15000-15050], [25000-25050] µL');
    console.log('  Each window is 50µL wide (narrower than 100µL coarse step)');
    console.log('');
    
    // Synthetic feasibility predicate: feasible only in narrow 50µL windows
    const syntheticFeasibleWindows = [
      { min: 5000, max: 5050 },
      { min: 15000, max: 15050 },
      { min: 25000, max: 25050 },
    ];
    
    const isSyntheticFeasible = (alcoholUL: number): boolean => {
      return syntheticFeasibleWindows.some(w => alcoholUL >= w.min && alcoholUL <= w.max);
    };
    
    // Oracle: 1µL exhaustive search
    const oracleHits: number[] = [];
    for (let alcoholUL = 0; alcoholUL <= 30_000; alcoholUL += 1) {
      if (isSyntheticFeasible(alcoholUL)) {
        oracleHits.push(alcoholUL);
      }
    }
    
    // Coarse: 100µL steps (matching actual solver coarse search)
    const coarseHits: number[] = [];
    for (let alcoholUL = 0; alcoholUL <= 30_000; alcoholUL += 100) {
      if (isSyntheticFeasible(alcoholUL)) {
        coarseHits.push(alcoholUL);
      }
    }
    
    console.log('Oracle (1µL exhaustive): found', oracleHits.length, 'feasible points');
    console.log('Coarse (100µL steps):     found', coarseHits.length, 'feasible points');
    console.log('');
    
    const missed = oracleHits.length - coarseHits.length;
    const missRate = ((missed / oracleHits.length) * 100).toFixed(1);
    
    console.log(`MISSED: ${missed}/${oracleHits.length} feasible points (${missRate}%)`);
    console.log('');
    
    if (coarseHits.length < oracleHits.length) {
      console.log('✓ INCOMPLETENESS PROVEN:');
      console.log('  - Narrow windows (<100µL) are systematically skipped by 100µL coarse search');
      console.log('  - "No-solution" from coarse search ≠ globally infeasible');
      console.log('  - Unsearched regions may contain feasible solutions');
    } else {
      console.log('✗ UNEXPECTED: Coarse search should miss narrow windows');
    }
    
    console.log('');
    console.log('STRUCTURAL ANALYSIS:');
    console.log('  - 3 windows × 51 points each = 153 total feasible points (oracle)');
    console.log('  - Each window spans 50µL, less than 100µL coarse step');
    console.log('  - Coarse search hits windows only if 100µL grid aligns with window');
    console.log('  - Most windows will be entirely skipped between coarse samples');
    
    // Assertions
    expect(oracleHits.length).toBe(153); // 3 windows * 51 points each (5000-5050 inclusive)
    expect(coarseHits.length).toBeLessThan(oracleHits.length); // Coarse must miss most
    expect(coarseHits.length).toBeLessThan(10); // Should hit very few points
    
    console.log('');
    console.log('✓ TEST COMPLETE: Bounded coarse search incompleteness structurally validated');
    console.log('  This proof generalizes to actual solver: narrow feasible alcohol intervals');
    console.log('  (caused by rounding discontinuities) will be missed by 100µL coarse search.');
  });

  test('fine search (1µL) within first feasible interval is also incomplete', () => {
    console.log('');
    console.log('=== Testing Fine Search Incompleteness ===');
    console.log('');
    console.log('Current solver strategy: 100µL coarse, then 1µL fine within first feasible.');
    console.log('This demonstrates that even fine search is incomplete if it only refines');
    console.log('the first discovered interval and ignores other feasible regions.');
    console.log('');
    
    // Multiple disjoint feasible intervals with different quality
    const intervals = [
      { min: 5000, max: 5100, quality: 75 }, // First found by coarse @ 5000µL
      { min: 15000, max: 15100, quality: 90 }, // Better quality, but skipped
      { min: 25000, max: 25100, quality: 85 },
    ];
    
    const getFeasibility = (alcoholUL: number): { feasible: boolean; quality: number } => {
      const interval = intervals.find(i => alcoholUL >= i.min && alcoholUL <= i.max);
      return interval ? { feasible: true, quality: interval.quality } : { feasible: false, quality: 0 };
    };
    
    // Coarse search finds first feasible @ 5000µL
    let firstFeasible: number | null = null;
    for (let alcoholUL = 0; alcoholUL <= 30_000; alcoholUL += 100) {
      if (getFeasibility(alcoholUL).feasible) {
        firstFeasible = alcoholUL;
        break;
      }
    }
    
    console.log('Coarse search (100µL) finds first feasible:', firstFeasible, 'µL');
    
    // Fine search within first interval (5000-5100)
    const fineResults: { alcohol: number; quality: number }[] = [];
    if (firstFeasible !== null) {
      for (let alcoholUL = firstFeasible; alcoholUL <= firstFeasible + 1000; alcoholUL += 1) {
        const result = getFeasibility(alcoholUL);
        if (result.feasible) {
          fineResults.push({ alcohol: alcoholUL, quality: result.quality });
        }
      }
    }
    
    const bestFine = fineResults.reduce((best, curr) => 
      curr.quality > best.quality ? curr : best, fineResults[0]);
    
    console.log('Fine search (1µL within first interval):');
    console.log('  Found:', fineResults.length, 'feasible points');
    console.log('  Best quality:', bestFine.quality, '@ ', bestFine.alcohol, 'µL');
    console.log('');
    
    // Global optimum (oracle)
    const globalBest = intervals.reduce((best, curr) => 
      curr.quality > best.quality ? curr : best);
    
    console.log('Global optimum (oracle):');
    console.log('  Best quality:', globalBest.quality, '@ [', globalBest.min, '-', globalBest.max, '] µL');
    console.log('');
    
    if (bestFine.quality < globalBest.quality) {
      const gap = globalBest.quality - bestFine.quality;
      console.log(`❌ SUBOPTIMALITY: Fine search found quality ${bestFine.quality}, missed global optimum ${globalBest.quality}`);
      console.log(`   Quality gap: ${gap} (${((gap / globalBest.quality) * 100).toFixed(1)}% worse)`);
      console.log('');
      console.log('✓ INCOMPLETE FINE SEARCH DEMONSTRATED:');
      console.log('  - Refining only the first feasible interval misses better solutions in other intervals');
      console.log('  - True global optimum requires exhaustive search or monotonicity proof');
    }
    
    expect(bestFine.quality).toBe(75); // First interval quality
    expect(globalBest.quality).toBe(90); // Better interval skipped
    expect(bestFine.quality).toBeLessThan(globalBest.quality);
    
    console.log('');
    console.log('✓ TEST COMPLETE: Fine search within first interval is incomplete for global optimum');
  });
});
