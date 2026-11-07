import { describe, expect, test } from 'vitest';
import {
  evaporateOneNight,
  filterDreamDustMixture,
  SEARCH_GROUND_STEP_UL,
  solveProductionPlan,
  solveProductionPlanAsync,
  takeProportionalMixture,
  type ProductionPlannerInput,
} from '../src/calculators/dreamDustPlanner';
import { mixtureFromPartial, simulateExtractionFromMixture, totalUL } from '../src/calculators/dreamDustVerified';

/**
 * Bounded replacement for four slow reverse-search diagnostics.
 *
 * Owner public browser (2026-11-05) OBSERVED 20 vials @ 55.37% from this 154.12 mL mix
 * on the old reverse-search UI. That number is not a sourced formula output and is not
 * re-asserted here. Source equations are checked on the forward path only.
 */
const OWNER_154 = mixtureFromPartial({
  dreamCapMush: 104_560,
  water: 18_880,
  protein: 9_440,
  mineral: 2_360,
  microbes: 9_440,
  physicalContaminant: 9_440,
});

function ownerInput(available = OWNER_154, vials = 20, purity = 40): ProductionPlannerInput {
  return {
    targetPurity: purity,
    targetVials: vials,
    material: { state: 'ground', available },
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
}

describe('owner 154.12 mL fixture — sourced forward path, not reverse-search 55.37%', () => {
  test('declared volume is 154120 µL and is not silently renormalized', () => {
    expect(totalUL(OWNER_154)).toBe(154_120);
    expect(OWNER_154.dreamCapMush).toBe(104_560);
    expect(OWNER_154.other).toBe(0);
  });

  test('half-mixture proportional slice keeps component ratios', () => {
    const half = takeProportionalMixture(OWNER_154, 77_060);
    expect(totalUL(half)).toBe(77_060);
    expect(half.dreamCapMush).toBe(52_280);
    expect(half.water).toBe(9_440);
    expect(half.protein).toBe(4_720);
  });

  test('44°C extraction of the full mix with 5× alcohol clears mush (sourced branch 4)', () => {
    const start = mixtureFromPartial({
      ...OWNER_154,
      alcohol: OWNER_154.dreamCapMush * 5,
    });
    const extracted = simulateExtractionFromMixture(start, 44, 10_000);
    expect(extracted.final.dreamCapMush).toBe(0);
    expect(extracted.final.dreamCapExtract).toBeGreaterThan(0);
    expect(extracted.final.dreamCapExtract + extracted.final.plantMatter).toBe(OWNER_154.dreamCapMush);
    expect(extracted.final.alcohol).toBe(start.alcohol);
  });

  test('one filter pass then one night spends 6 kJ and does not invent 97% purity', () => {
    const start = mixtureFromPartial({
      ...OWNER_154,
      alcohol: OWNER_154.dreamCapMush * 5,
    });
    const extracted = simulateExtractionFromMixture(start, 44, 10_000);
    const filtered = filterDreamDustMixture(extracted.final, 1_000, 400);
    const night = evaporateOneNight(filtered.output, {
      performancePercent: 0,
      efficiencyPercent: 0,
      qualityPercent: 0,
      availableEnergy: 12,
      distillateCapacityUL: 0,
      solventRecoveryModule: false,
    });
    expect(night.energyUsed).toBe(6);
    expect(night.allowanceUL).toBe(300_000);
    expect(night.remainingEnergy).toBe(6);
    const purity =
      (100 * night.output.dreamCapExtract) / Math.max(1, totalUL(night.output));
    expect(purity).toBeLessThan(90);
  });
});

describe('bounded reverse search (replaces unbounded 154 mL diagnostics)', () => {
  test('2.0 mL slice evaluates 20 configurations at 100 µL steps', () => {
    const slice = takeProportionalMixture(OWNER_154, 2_000);
    const result = solveProductionPlan(ownerInput(slice, 1, 1));
    expect(result.searchSummary).toMatch(/Evaluated 20 /);
    expect(SEARCH_GROUND_STEP_UL).toBe(100);
  });

  test('newer-request abort stops the search loop', () => {
    let calls = 0;
    const result = solveProductionPlan(ownerInput(), {
      shouldAbort: () => {
        calls += 1;
        return calls > 3;
      },
    });
    expect(result.status).toBe('search-incomplete-limit-reached');
    expect(result.reasons.join(' ')).toMatch(/cancelled/i);
  });

  test('cooperative search observes abort after a yield, not only at start', async () => {
    let abort = false;
    const pending = solveProductionPlanAsync(ownerInput(), {
      shouldAbort: () => abort,
      yieldEvery: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 15));
    abort = true;
    const result = await pending;
    expect(result.status).toBe('search-incomplete-limit-reached');
    expect(result.reasons.join(' ')).toMatch(/cancelled/i);
    const evaluated = Number(/Evaluated ([\d,]+)/.exec(result.searchSummary)?.[1]?.replace(/,/g, ''));
    expect(evaluated).toBeGreaterThan(0);
    expect(evaluated).toBeLessThan(1_541);
  });

  test('owner observation 55.37% is recorded, not used as a sourced expected purity', () => {
    const observedPublic = { vials: 20, meanPurity: 55.37, evidence: 'OBSERVED_OWNER' as const };
    expect(observedPublic.evidence).toBe('OBSERVED_OWNER');
    expect(observedPublic.meanPurity).not.toBe(97.1);
    expect(observedPublic.meanPurity).not.toBe(97.95);
  });
});
