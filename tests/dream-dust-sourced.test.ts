import { describe, expect, test } from 'vitest';
import { applyFilter, evaporateToDryness, finishComponentMixture } from '../src/calculators/dreamDustPlanner';
import {
  applyAcidBaseNeutralization,
  applyProteinPrecipitation,
  simulateAcidBaseTreatment,
} from '../src/calculators/dreamDustReactions';
import { scannerDisplayML } from '../src/calculators/sourceCitations';
import { mixtureFromPartial, totalUL, volatileUL } from '../src/calculators/dreamDustVerified';

describe('SOURCE STATIC chemical-processing branch 16 (retrieved 2026-11-07)', () => {
  test('excess Acid: n=min(|A-B|,C); q=min(n,max(1,trunc(0.2n)))', () => {
    const start = mixtureFromPartial({ protein: 10_540, acid: 20_000, base: 0 });
    const n = Math.min(Math.abs(20_000 - 0), 10_540);
    const q = Math.min(n, Math.max(1, Math.trunc(0.2 * n)));
    expect(n).toBe(10_540);
    expect(q).toBe(2_108);
    const once = applyProteinPrecipitation(start);
    expect(once.proteinPrecipitatedUL).toBe(2_108);
    expect(once.acidConsumedUL).toBe(2_108);
    expect(once.baseConsumedUL).toBe(0);
    expect(once.output.insolubleDebris).toBe(2_108);
    expect(once.output.protein).toBe(8_432);
  });

  test('excess Base consumes Base, not Acid', () => {
    const once = applyProteinPrecipitation(mixtureFromPartial({ protein: 100, acid: 10, base: 80 }));
    expect(once.proteinPrecipitatedUL).toBe(14);
    expect(once.baseConsumedUL).toBe(14);
    expect(once.acidConsumedUL).toBe(0);
  });

  test('A===B skips precipitation even if Protein remains', () => {
    const once = applyProteinPrecipitation(mixtureFromPartial({ protein: 5_000, acid: 100, base: 100 }));
    expect(once.proteinPrecipitatedUL).toBe(0);
    expect(once.output.protein).toBe(5_000);
  });

  test('is not a 1:1 dump of all Protein in one update', () => {
    const once = applyProteinPrecipitation(mixtureFromPartial({ protein: 10_540, acid: 10_540 }));
    expect(once.proteinPrecipitatedUL).not.toBe(10_540);
  });
});

describe('SOURCE STATIC chemical-processing branch 18', () => {
  test('n=min(A,B); q=min(n,max(1000,trunc(0.1n))); each loses q; no product', () => {
    const start = mixtureFromPartial({ acid: 8_000, base: 5_000, protein: 0 });
    const n = Math.min(8_000, 5_000);
    const q = Math.min(n, Math.max(1_000, Math.trunc(0.1 * n)));
    expect(q).toBe(1_000);
    const result = applyAcidBaseNeutralization(start);
    expect(result.neutralizedUL).toBe(1_000);
    expect(result.output.acid).toBe(7_000);
    expect(result.output.base).toBe(4_000);
    expect(totalUL(result.output)).toBe(totalUL(start) - 2_000);
  });

  test('n below 1000 still fully neutralizes that n (floor is min(n,1000))', () => {
    const result = applyAcidBaseNeutralization(mixtureFromPartial({ acid: 400, base: 250 }));
    expect(result.neutralizedUL).toBe(250);
    expect(result.output.acid).toBe(150);
    expect(result.output.base).toBe(0);
  });
});

describe('filter pore / durability / residue SOURCE STATIC water_filter + kotton', () => {
  test('Kotton pore 150 does not remove Physical Contaminant (size 100)', () => {
    const input = mixtureFromPartial({
      physicalContaminant: 9_000,
      plantMatter: 2_000,
      dreamCapExtract: 20_000,
      heavyMetal: 118,
      chemicalContaminant: 642,
      protein: 1_000,
    });
    const kotton = applyFilter(input, 'Kotton Fabric', 150, 1_000);
    expect(kotton.output.physicalContaminant).toBe(9_000);
    expect(kotton.output.heavyMetal).toBe(118);
    expect(kotton.output.chemicalContaminant).toBe(642);
    expect(kotton.output.protein).toBe(1_000);
    expect(kotton.output.dreamCapExtract).toBe(20_000);
    expect(kotton.output.plantMatter).toBeLessThan(2_000);
  });

  test('Water Filter pore 22 reduces Physical Contaminant with 0.16% floor and leaves Heavy Metal', () => {
    const input = mixtureFromPartial({
      physicalContaminant: 2_000,
      mineral: 500,
      heavyMetal: 118,
      chemicalContaminant: 642,
      dreamCapExtract: 10_000,
    });
    const water = applyFilter(input, 'Water Filter', 22, 400);
    expect(water.output.physicalContaminant).toBe(Math.floor(2_000 * 0.0016));
    expect(water.output.heavyMetal).toBe(118);
    expect(water.output.chemicalContaminant).toBe(642);
    expect(water.output.dreamCapExtract).toBe(10_000);
  });

  test('Other/unmodeled volume is not silently filtered', () => {
    const input = mixtureFromPartial({ other: 50_000, plantMatter: 1_000 });
    const water = applyFilter(input, 'Water Filter', 22, 400);
    expect(water.output.other).toBe(50_000);
  });
});

describe('Evaporator and Finisher SOURCE STATIC', () => {
  test('dryness: 100 µL volatiles pass, 101 µL fail', () => {
    const dry = finishComponentMixture(mixtureFromPartial({ dreamCapExtract: 2_000, water: 50, alcohol: 50 }), 4, 1);
    expect(dry.success).toBe(true);
    const wet = finishComponentMixture(mixtureFromPartial({ dreamCapExtract: 2_000, water: 51, alcohol: 50 }), 4, 1);
    expect(wet.success).toBe(false);
    expect(volatileUL(mixtureFromPartial({ water: 51, alcohol: 50 }))).toBe(101);
  });

  test('4 modules replace 0% with Physical Contaminant', () => {
    const result = finishComponentMixture(mixtureFromPartial({ dreamCapExtract: 2_000 }), 4, 1);
    expect(result.vials[0]!.purity).toBe(100);
    expect(totalUL(result.vials[0]!.replaced)).toBe(0);
  });

  test('overnight allowance 300 mL at 0% performance, recovery Alcohol-only with module', () => {
    const result = evaporateToDryness(
      mixtureFromPartial({ water: 100_000, alcohol: 200_000, dreamCapExtract: 5_000 }),
      {
        performancePercent: 0,
        efficiencyPercent: 0,
        qualityPercent: 100,
        availableEnergy: 12,
        distillateCapacityUL: 500_000,
        solventRecoveryModule: true,
      },
    );
    expect(result.success).toBe(true);
    expect(result.cycles[0]!.allowanceUL).toBe(300_000);
    expect(result.recovered.water).toBe(0);
    expect(result.recovered.alcohol).toBeGreaterThan(0);
  });
});

describe('CURRENT Steam 1.0.0.5 display vs UNKNOWN dryness exception', () => {
  test('scanner truncates to hundredth mL without rounding up', () => {
    expect(scannerDisplayML(1_996)).toBe('1.99');
    expect(scannerDisplayML(55_185)).toBe('55.18');
    expect(scannerDisplayML(55_189)).toBe('55.18');
  });

  test('does not invent a 1 µL dryness pass from the 1.0.0.5 trace-moisture sentence', () => {
    const leftover = finishComponentMixture(
      mixtureFromPartial({ dreamCapExtract: 2_000, water: 101 }),
      4,
      1,
    );
    expect(leftover.success).toBe(false);
  });
});

describe('owner observations are not forced onto the model', () => {
  test('97.10 / 97.95 are not hardcoded outputs of finishing', () => {
    const treated = simulateAcidBaseTreatment(
      mixtureFromPartial({
        dreamCapExtract: 55_180,
        plantMatter: 55_180,
        protein: 10_540,
        acid: 20_000,
      }),
      200,
    );
    const finished = finishComponentMixture(treated.final, 4, 10);
    expect(finished.meanPurity).not.toBe(97.1);
    expect(finished.meanPurity).not.toBe(97.95);
  });
});
