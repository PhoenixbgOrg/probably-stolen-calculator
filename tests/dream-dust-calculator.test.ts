/**
 * Dream Dust calculator tests - SOURCE-DERIVED FORMULAS ONLY
 * Tests verify implementation matches wiki formulas exactly
 */

import { describe, test, expect } from 'vitest';
import {
  calculateDreamDustPerUpdate,
  dreamCapGramsToMushML,
  getFinisherContamination,
  getPurityGrade,
  getCartelRequirement,
  evaluateCartelDelivery,
  DREAM_CAP_REFERENCE_WEIGHT_G,
  DREAM_CAP_REFERENCE_MUSH_ML,
  CARTEL_DELIVERIES,
  type DreamDustInputs,
} from '../src/calculators/dreamDust';

describe('Dream Dust Calculator - Source-Derived', () => {
  describe('Dream Cap reference weight conversion (SOURCE-DERIVED)', () => {
    test('32.5g reference = 27.333mL mush', () => {
      const result = dreamCapGramsToMushML(DREAM_CAP_REFERENCE_WEIGHT_G);
      expect(result).toBe(DREAM_CAP_REFERENCE_MUSH_ML);
    });

    test('65g (2x reference) = 54.666mL mush', () => {
      const result = dreamCapGramsToMushML(65);
      expect(result).toBeCloseTo(54.666, 3);
    });

    test('16.25g (0.5x reference) = 13.666mL mush (truncated to µL)', () => {
      const result = dreamCapGramsToMushML(16.25);
      // 0.5 * 27.333 = 13.6665, truncate to µL = 13.666mL
      expect(result).toBe(13.666);
    });
  });

  describe('Finisher contamination (SOURCE-DERIVED)', () => {
    test('0 modules = 12%', () => {
      expect(getFinisherContamination(0)).toBe(12);
    });

    test('1 module = 6%', () => {
      expect(getFinisherContamination(1)).toBe(6);
    });

    test('2 modules = 3%', () => {
      expect(getFinisherContamination(2)).toBe(3);
    });

    test('3 modules = 1%', () => {
      expect(getFinisherContamination(3)).toBe(1);
    });

    test('4+ modules = 0%', () => {
      expect(getFinisherContamination(4)).toBe(0);
      expect(getFinisherContamination(5)).toBe(0);
      expect(getFinisherContamination(10)).toBe(0);
    });
  });

  describe('Purity grades (SOURCE-DERIVED)', () => {
    test('Lab Pure ≥99% = +135%', () => {
      const grade = getPurityGrade(99);
      expect(grade.name).toBe('Lab Pure');
      expect(grade.modifier).toBe(1.35);
    });

    test('Pharma-Grade 90-98.99% = +85%', () => {
      const grade = getPurityGrade(95);
      expect(grade.name).toBe('Pharma-Grade');
      expect(grade.modifier).toBe(0.85);
    });

    test('Near Pharma 80-89.99% = +40%', () => {
      const grade = getPurityGrade(85);
      expect(grade.name).toBe('Near Pharma');
      expect(grade.modifier).toBe(0.40);
    });

    test('Street Standard 60-79.99% = +0%', () => {
      const grade = getPurityGrade(70);
      expect(grade.name).toBe('Street Standard');
      expect(grade.modifier).toBe(0);
    });

    test('Cut Product 45-59.99% = -45%', () => {
      const grade = getPurityGrade(50);
      expect(grade.name).toBe('Cut Product');
      expect(grade.modifier).toBe(-0.45);
    });

    test('Junk Grade 30-44.99% = -75%', () => {
      const grade = getPurityGrade(40);
      expect(grade.name).toBe('Junk Grade');
      expect(grade.modifier).toBe(-0.75);
    });

    test('Starch Grade <30% = -95%', () => {
      const grade = getPurityGrade(25);
      expect(grade.name).toBe('Starch Grade');
      expect(grade.modifier).toBe(-0.95);
    });
  });

  describe('Per-update extraction formula (SOURCE-DERIVED branch 4)', () => {
    test('Optimal 5:1 ratio reaches 50% per-update yield cap', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333, // reference amount
        alcoholML: 136.665, // 5x mush (5:1)
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      // M = 27.333mL = 27333µL
      // q = min(M, max(2000, round(0.1*M))) = min(27333, max(2000, 2733)) = 2733µL
      expect(result.perUpdateProcessedMushML).toBeCloseTo(2.733, 3);

      // A/M = 136.665/27.333 = 5 >= 5, so min(0.5, 0.1*A/M) = 0.5
      // y = round(2733 * 0.5) = 1367µL
      expect(result.perUpdateExtractYieldML).toBeCloseTo(1.367, 3);
      expect(result.extractionEfficiency).toBeCloseTo(50, 1);
      expect(result.atYieldCap).toBe(true);
    });

    test('Suboptimal 3:1 ratio yields <50% per update', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 82, // 3x mush (3:1)
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      // A/M = 82/27.333 = 3, so min(0.5, 0.1*3) = 0.3
      // y = round(2733 * 0.3) = 820µL
      expect(result.perUpdateExtractYieldML).toBeCloseTo(0.820, 3);
      expect(result.extractionEfficiency).toBeCloseTo(30, 1);
      expect(result.atYieldCap).toBe(false);
    });

    test('10:1 ratio still caps at 50% per update (no benefit beyond 5:1)', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 273.33, // 10x mush
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      // A/M = 10, min(0.5, 0.1*10) = min(0.5, 1) = 0.5
      expect(result.extractionEfficiency).toBeCloseTo(50, 1);
      expect(result.atYieldCap).toBe(true);
    });

    test('Minimum 2mL mush processing when M < 20mL', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 10, // 10mL mush
        alcoholML: 50, // 5:1 optimal
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      // M = 10mL = 10000µL
      // q = min(10000, max(2000, round(0.1*10000))) = min(10000, 2000) = 2000µL
      expect(result.perUpdateProcessedMushML).toBe(2);

      // y = round(2000 * 0.5) = 1000µL = 1mL
      expect(result.perUpdateExtractYieldML).toBe(1);
    });
  });

  describe('Purity calculation (requires Spectrometer)', () => {
    test('Calculates purity from measured extract and total', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
        currentExtractML: 5, // measured Dream Cap Extract
        currentMixtureTotalML: 10, // measured total mixture
      };

      const result = calculateDreamDustPerUpdate(inputs);

      // P = 5/10 * 100% = 50%
      expect(result.calculatedPurity).toBe(50);
      expect(result.purityGrade).toBe('Cut Product');
      expect(result.gradeModifier).toBe(-0.45);
    });

    test('Reports missing inputs when Spectrometer data absent', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
        // no currentExtractML or currentMixtureTotalML
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.calculatedPurity).toBeUndefined();
      expect(result.missingInputs.length).toBeGreaterThan(0);
      expect(result.missingInputs.some((m) => m.includes('Spectrometer'))).toBe(true);
    });
  });

  describe('Temperature requirements (SOURCE-DERIVED)', () => {
    test('Extraction starts at ≥40°C', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.extractionTempRange).toBe('≥40°C');
    });

    test('Degradation thresholds documented', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.degradationThresholds.mush).toContain('50°C');
      expect(result.degradationThresholds.extract).toContain('60°C');
    });
  });

  describe('Finisher requirements (SOURCE-DERIVED)', () => {
    test('Dream Dust requires 2mL sample', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.finisherSampleSizeML).toBe(2);
    });

    test('Requires dry input (evaporatives ≤0.1mL)', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.requiresDryInput).toBe(true);
    });

    test('Base value is 18 Credits per vial', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.baseValuePerVial).toBe(18);
    });
  });

  describe('Recommendations system', () => {
    test('Recommends increasing alcohol for suboptimal ratio', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 82, // 3:1 ratio
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('5:1'))).toBe(true);
    });

    test('Recommends adding modules when contamination high', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.recommendations.some((r) => r.includes('module'))).toBe(true);
    });
  });

  describe('Source references and limitations', () => {
    test('Includes source references', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.sourceRefs.length).toBeGreaterThan(0);
      expect(result.sourceRefs.some((ref) => ref.includes('nikokobo.com') || ref.includes('probably-stolen.org'))).toBe(true);
    });

    test('Documents limitations clearly', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.limitations.some((lim) => lim.includes('PER-UPDATE'))).toBe(true);
    });
  });

  describe('Cartel delivery progression (SOURCE-VERIFIED)', () => {
    test('Day 8 first delivery: 10 vials at 40%', () => {
      const req = getCartelRequirement(8);
      expect(req).not.toBeNull();
      expect(req?.quota).toBe(10);
      expect(req?.requiredPurity).toBe(40);
      expect(req?.source).toBe('VERIFIED');
    });

    test('Day 15: 15 vials at 45%', () => {
      const req = getCartelRequirement(15);
      expect(req).not.toBeNull();
      expect(req?.quota).toBe(15);
      expect(req?.requiredPurity).toBe(45);
    });

    test('Day 50: 40 vials at 70% (purity cap)', () => {
      const req = getCartelRequirement(50);
      expect(req).not.toBeNull();
      expect(req?.quota).toBe(40);
      expect(req?.requiredPurity).toBe(70);
    });

    test('Day 57: purity stays capped at 70%', () => {
      const req = getCartelRequirement(57);
      expect(req).not.toBeNull();
      expect(req?.quota).toBe(45); // 40 + 5×1
      expect(req?.requiredPurity).toBe(70); // capped
    });

    test('Non-delivery day returns null', () => {
      expect(getCartelRequirement(5)).toBeNull();
      expect(getCartelRequirement(9)).toBeNull();
    });

    test('All explicit entries match owner-provided data', () => {
      const expected = [
        { day: 8, quota: 10, purity: 40 },
        { day: 15, quota: 15, purity: 45 },
        { day: 22, quota: 20, purity: 50 },
        { day: 29, quota: 25, purity: 55 },
        { day: 36, quota: 30, purity: 60 },
        { day: 43, quota: 35, purity: 65 },
        { day: 50, quota: 40, purity: 70 },
      ];

      expected.forEach(({ day, quota, purity }) => {
        const req = getCartelRequirement(day);
        expect(req?.quota).toBe(quota);
        expect(req?.requiredPurity).toBe(purity);
      });
    });
  });

  describe('Cartel delivery evaluation (SOURCE-VERIFIED formulas)', () => {
    test('Fatal: no vials delivered (n=0)', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      const result = evaluateCartelDelivery(req, 0, 50);
      expect(result.isFatal).toBe(true);
      expect(result.meetsRequirement).toBe(false);
    });

    test('Fatal: purity ≤ R/4 (deception)', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      // R=40, R/4=10, so P≤10 is fatal
      const result = evaluateCartelDelivery(req, 10, 10);
      expect(result.isFatal).toBe(true);
      expect(result.note).toContain('deception');
    });

    test('Low purity: R/4 < P ≤ R-5 (no purity reward)', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      // R=40, so 10 < P ≤ 35 is low
      const result = evaluateCartelDelivery(req, 10, 35);
      expect(result.isFatal).toBe(false);
      expect(result.meetsPurity).toBe(false);
      expect(result.reputationChange).toBe(10 + (-5)); // quota +10, purity -5
    });

    test('Good purity below requirement: R-5 < P < R', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      // R=40, P=38 is in good range but below requirement
      const result = evaluateCartelDelivery(req, 10, 38);
      expect(result.isFatal).toBe(false);
      expect(result.meetsPurity).toBe(true); // purity reward passes
      expect(result.meetsRequirement).toBe(true);
      expect(result.reputationChange).toBe(10 + (-2)); // quota +10, purity -2
    });

    test('Good purity meeting requirement: R ≤ P ≤ R+10', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      // R=40, P=45 meets requirement
      const result = evaluateCartelDelivery(req, 10, 45);
      expect(result.meetsRequirement).toBe(true);
      expect(result.reputationChange).toBe(10 + 5); // quota +10, purity +5
    });

    test('High purity: P > R+10', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      // R=40, P=55 > 50
      const result = evaluateCartelDelivery(req, 10, 55);
      expect(result.meetsPurity).toBe(true);
      expect(result.reputationChange).toBe(10 + 3); // quota +10, purity +trunc((55-40)/4)=+3
    });

    test('Insufficient quantity: n < Q', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      // Deliver only 8 of 10 required
      const result = evaluateCartelDelivery(req, 8, 45);
      expect(result.meetsQuota).toBe(false);
      expect(result.meetsRequirement).toBe(false);
      expect(result.reputationChange).toBe(8 + 5); // partial quantity +8, good purity +5
    });

    test('Excess vials: n > Q (all collected)', () => {
      const req = CARTEL_DELIVERIES[0];
      if (!req) throw new Error('Day 8 requirement not found');
      // Deliver 12 (2 extra), but only Q=10 counts for reputation
      const result = evaluateCartelDelivery(req, 12, 45);
      expect(result.meetsQuota).toBe(true);
      expect(result.reputationChange).toBe(10 + 5); // capped at Q=10
    });
  });

  describe('Full pipeline with Cartel delivery', () => {
    test('Day 8 delivery simulation: meets 40% requirement', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 1, // 6% contamination
        currentExtractML: 10,
        currentMixtureTotalML: 24, // 10/(10+14) = 41.7% purity
        currentDay: 8,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.calculatedPurity).toBeCloseTo(41.7, 1);
      expect(result.vialsProduced).toBe(12); // floor(24/2)
      expect(result.cartelStatus).toBeDefined();
      expect(result.cartelStatus?.requirement.quota).toBe(10);
      expect(result.cartelStatus?.requirement.requiredPurity).toBe(40);
      expect(result.cartelStatus?.meetsRequirement).toBe(true);
    });

    test('Day 22 delivery simulation: fails 50% requirement with low purity', () => {
      const inputs: DreamDustInputs = {
        dreamCapMushML: 27.333,
        alcoholML: 136.665,
        finisherModules: 0, // 12% contamination
        currentExtractML: 10,
        currentMixtureTotalML: 25, // 40% purity
        currentDay: 22,
      };

      const result = calculateDreamDustPerUpdate(inputs);

      expect(result.calculatedPurity).toBe(40);
      expect(result.vialsProduced).toBe(12);
      expect(result.cartelStatus?.requirement.requiredPurity).toBe(50);
      expect(result.cartelStatus?.meetsPurity).toBe(false); // 40% < 45% (R-5)
      expect(result.cartelStatus?.meetsRequirement).toBe(false);
    });
  });
});
