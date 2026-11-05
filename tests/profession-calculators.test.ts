import { describe, expect, test } from 'vitest';
import {
  calculateCashFlow,
  calculateFishHarvest,
  calculateHydroponicCycle,
  calculateRatButcher,
  calculateWaterPurifierNight,
  evaluateBasicGunOrder,
} from '../src/calculators/professionCalculators';

describe('profession calculators', () => {
  test('water purifier uses volume, dirtiness, performance and quality cap', () => {
    const result = calculateWaterPurifierNight({
      volumeML: 1_000,
      currentWaterML: 900,
      removableImpurityML: 100,
      dirtinessMultiplier: 2,
      performancePercent: 0,
      qualityPercent: 0,
    });
    expect(result.budgetML).toBe(70);
    expect(result.removedML).toBe(70);
    expect(result.finalPurity).toBe(97);
    expect(result.powerUsed).toBe(4);
  });

  test('water purifier stops at its quality cap', () => {
    const result = calculateWaterPurifierNight({
      volumeML: 1_000,
      currentWaterML: 989,
      removableImpurityML: 11,
      dirtinessMultiplier: 20,
      performancePercent: 100,
      qualityPercent: 0,
    });
    expect(result.removedML).toBeCloseTo(1);
    expect(result.finalPurity).toBeCloseTo(99);
  });

  test('hydroponic cycle uses crop table, measured speed and quality yield', () => {
    const result = calculateHydroponicCycle('dreamCap', 50, 8, 400, 10_000);
    expect(result.nights).toBe(4);
    expect(result.output).toBe(10);
    expect(result.waterRequiredML).toBe(400);
    expect(result.powerRequired).toBe(32);
    expect(result.mineralConsumedUL).toBe(840);
    expect(result.startingConcentration).toBe(250);
    expect(result.nutrientStatus).toBe('in-range');
  });

  test('fish harvest subtracts egg calories and floors species conversion', () => {
    const result = calculateFishHarvest('tilapia', 5_000, 100, 2);
    expect(result.potentialCalories).toBe(4_320);
    expect(result.pieces).toEqual({ '900': 4, '400': 1, '200': 1, '100': 1, scrap: 0 });
  });

  test('rat butcher rounds disease loss then portions in descending order', () => {
    expect(calculateRatButcher(400, true)).toEqual({
      effectiveWeightG: 300,
      pieces: { '400': 0, '200': 1, '100': 1, '50': 0 },
      totalBaseValue: 95,
    });
    expect(calculateRatButcher(351, false).pieces).toEqual({
      '400': 0,
      '200': 1,
      '100': 1,
      '50': 2,
    });
  });

  test('basic Gunsmith order uses strict thresholds and additive bonuses', () => {
    const result = evaluateBasicGunOrder('accurate', {
      firepower: 18,
      accuracy: 31,
      reliability: 25,
      size: 0,
      style: 0,
      suppression: 0,
    });
    expect(result.passes).toBe(true);
    expect(result.bonus).toBe(184);
    expect(result.paymentMin).toBe(270);
    expect(result.paymentMax).toBe(280);
  });

  test('cash flow planner uses user-entered realised costs and revenue', () => {
    const result = calculateCashFlow({
      cash: 550,
      rent: 200,
      otherBills: 50,
      purchaseCost: 100,
      saleRevenue: 160,
      fees: 10,
      cycles: 2,
    });
    expect(result.cycleProfit).toBe(50);
    expect(result.endingCash).toBe(400);
    expect(result.affordable).toBe(true);
  });
});
