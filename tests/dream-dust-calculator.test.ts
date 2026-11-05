/**
 * Dream Dust calculator tests
 * Verifies mechanics from probably-stolen.org/chemistry/
 */

import { describe, test, expect } from 'vitest';
import {
  calculateDreamDust,
  calculatePurityUpgrade,
  getFinisherContamination,
  getPurityGrade,
  type DreamDustInputs,
} from '../src/calculators/dreamDust';

describe('Dream Dust Calculator', () => {
  describe('Finisher contamination (VERIFIED)', () => {
    test('0 modules = 12% contamination', () => {
      expect(getFinisherContamination(0)).toBe(12);
    });

    test('1 module = 6% contamination', () => {
      expect(getFinisherContamination(1)).toBe(6);
    });

    test('2 modules = 3% contamination', () => {
      expect(getFinisherContamination(2)).toBe(3);
    });

    test('3 modules = 1% contamination', () => {
      expect(getFinisherContamination(3)).toBe(1);
    });

    test('4+ modules = 0% contamination', () => {
      expect(getFinisherContamination(4)).toBe(0);
      expect(getFinisherContamination(5)).toBe(0);
      expect(getFinisherContamination(10)).toBe(0);
    });
  });

  describe('Purity grades (VERIFIED)', () => {
    test('Lab Pure ≥99% with +135% modifier', () => {
      const grade = getPurityGrade(99);
      expect(grade.name).toBe('Lab Pure');
      expect(grade.modifier).toBe(1.35);
    });

    test('Street Standard 60-89%', () => {
      const grade = getPurityGrade(70);
      expect(grade.name).toBe('Street Standard');
      expect(grade.modifier).toBe(0);
    });

    test('Starch Grade <30% with -95% modifier', () => {
      const grade = getPurityGrade(25);
      expect(grade.name).toBe('Starch Grade');
      expect(grade.modifier).toBe(-0.95);
    });

    test('Cut Product 45-59%', () => {
      const grade = getPurityGrade(45);
      expect(grade.name).toBe('Cut Product');
    });
  });

  describe('Primary scenario: 42% → 45% purity', () => {
    test('0 modules produces ~42% purity (12% contamination)', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
        targetPurity: 45,
      };

      const result = calculateDreamDust(inputs);

      // With 0 modules, finisher adds 12% contamination
      expect(result.finisherContaminationPercent).toBe(12);

      // Optimal 5:1 ratio
      expect(result.alcoholToMushRatio).toBeCloseTo(5.0, 1);
      expect(result.isOptimalRatio).toBe(true);

      // Final purity should be around 42-47% range (depends on extraction estimate)
      expect(result.finalPurityPercent).toBeGreaterThan(35);
      expect(result.finalPurityPercent).toBeLessThan(50);

      // Should fail 45% target with 0 modules
      expect(result.meetsTarget).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('1 module improves purity to ~44% (6% contamination)', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 1,
        hasEvaporator: true,
        hasSpectrometer: false,
        targetPurity: 45,
      };

      const result = calculateDreamDust(inputs);

      expect(result.finisherContaminationPercent).toBe(6);
      expect(result.finalPurityPercent).toBeGreaterThan(42);
      expect(result.finalPurityPercent).toBeLessThan(46);

      // 1 module gets close but may not quite reach 45% with this extract purity
      // Expect recommendation for further improvement
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('2 modules achieves ~46% purity (3% contamination)', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 2,
        hasEvaporator: true,
        hasSpectrometer: false,
        targetPurity: 45,
      };

      const result = calculateDreamDust(inputs);

      expect(result.finisherContaminationPercent).toBe(3);
      expect(result.finalPurityPercent).toBeGreaterThan(44);
      expect(result.meetsTarget).toBe(true);
    });
  });

  describe('Alcohol ratio validation (VERIFIED)', () => {
    test('5:1 ratio is optimal', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(result.alcoholToMushRatio).toBeCloseTo(5.0, 1);
      expect(result.isOptimalRatio).toBe(true);
      expect(result.ratioRecommendation).toContain('optimal');
    });

    test('Suboptimal ratio triggers recommendation', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 30, // 3:1 ratio
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(result.alcoholToMushRatio).toBeCloseTo(3.0, 1);
      expect(result.isOptimalRatio).toBe(false);
      expect(result.ratioRecommendation).toContain('below optimal');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Temperature range (VERIFIED)', () => {
    test('Temperature range is 40-59°C', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(result.temperatureRange).toBe('40-59°C');
      expect(result.temperatureWarning).toContain('60°C');
    });
  });

  describe('Vial production (VERIFIED)', () => {
    test('2 mL batch size per vial', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      // Total batch should equal (extract + contamination)
      const expectedBatch = result.remainingAfterEvap + result.contaminationML;
      expect(result.totalBatchVolume).toBeCloseTo(expectedBatch, 2);

      // Vials = floor(batch / 2)
      const expectedVials = Math.floor(result.totalBatchVolume / 2);
      expect(result.vialsProduced).toBe(expectedVials);

      // Leftover
      const expectedLeftover = result.totalBatchVolume % 2;
      expect(result.leftoverML).toBeCloseTo(expectedLeftover, 2);
    });

    test('Base vial value is 18 Credits', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(result.baseValuePerVial).toBe(18);
    });

    test('Grade modifiers apply to vial value', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 4, // 0% contamination = very high purity
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      const expectedValue = result.baseValuePerVial * (1 + result.gradeModifier);
      expect(result.estimatedValuePerVial).toBeCloseTo(expectedValue, 2);
      expect(result.totalEstimatedValue).toBeCloseTo(
        result.estimatedValuePerVial * result.vialsProduced,
        1
      );
    });
  });

  describe('Evaporation requirement (VERIFIED)', () => {
    test('Finisher requires dry batch', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(result.needsEvaporation).toBe(true);
      expect(result.alcoholToRemove).toBe(50);
    });
  });

  describe('Cartel mission (OWNER-PROVIDED)', () => {
    test('70% cap constraint is labeled as owner-provided', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 4,
        hasEvaporator: true,
        hasSpectrometer: false,
        targetPurity: 70,
      };

      const result = calculateDreamDust(inputs);

      expect(result.cartelMissionStatus).toBeDefined();
      expect(result.cartelMissionStatus?.requiredPurity).toBe(70);
      expect(result.cartelMissionStatus?.note).toContain('owner-provided');
      expect(result.cartelMissionStatus?.note).toContain('pending');
    });

    test('Mission status check works', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
        targetPurity: 50,
      };

      const result = calculateDreamDust(inputs);

      expect(result.cartelMissionStatus?.meetsRequirement).toBe(
        result.finalPurityPercent >= 50
      );
    });
  });

  describe('Purity upgrade calculator', () => {
    test('Upgrade from 0 to 1 module', () => {
      const upgrade = calculatePurityUpgrade(40, 0, 45);

      expect(upgrade.needsUpgrade).toBe(true);
      expect(upgrade.modulesNeeded).toBeGreaterThan(0);
      expect(upgrade.cost).toBeGreaterThan(0);
    });

    test('No upgrade needed if already meeting target', () => {
      const upgrade = calculatePurityUpgrade(50, 2, 45);

      expect(upgrade.needsUpgrade).toBe(false);
    });

    test('Module cost is 250 Credits per module', () => {
      const upgrade = calculatePurityUpgrade(40, 0, 45);

      const moduleDiff = upgrade.modulesNeeded - 0;
      expect(upgrade.cost).toBe(moduleDiff * 250);
    });
  });

  describe('Source limitations', () => {
    test('Limitations array documents unverified mechanics', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.limitations.some((lim) => lim.includes('Blending'))).toBe(true);
      expect(result.limitations.some((lim) => lim.includes('Extraction'))).toBe(true);
    });

    test('Source references are included', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(result.sourceRefs.length).toBeGreaterThan(0);
      expect(result.sourceRefs.some((ref) => ref.includes('probably-stolen.org'))).toBe(
        true
      );
    });
  });

  describe('Recommendations system', () => {
    test('Recommends module upgrades when helpful', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 50,
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
        targetPurity: 50,
      };

      const result = calculateDreamDust(inputs);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some((rec) => rec.includes('module') || rec.includes('Module'))
      ).toBe(true);
    });

    test('Recommends alcohol adjustment for suboptimal ratio', () => {
      const inputs: DreamDustInputs = {
        dreamCapAmount: 10,
        alcoholAmount: 20, // 2:1 ratio
        alcoholType: 'ethanol',
        blenderModules: 0,
        finisherModules: 0,
        hasEvaporator: true,
        hasSpectrometer: false,
      };

      const result = calculateDreamDust(inputs);

      expect(
        result.recommendations.some((rec) => rec.toLowerCase().includes('alcohol'))
      ).toBe(true);
    });
  });
});
