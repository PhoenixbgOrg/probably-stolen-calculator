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
  DREAM_CAP_REFERENCE_WEIGHT_G,
  DREAM_CAP_REFERENCE_MUSH_ML,
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
});
