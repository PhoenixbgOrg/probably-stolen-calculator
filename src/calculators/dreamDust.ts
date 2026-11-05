/**
 * Dream Dust production calculator
 * Based on verified mechanics from probably-stolen.org/chemistry/
 * 
 * Sources:
 * - https://probably-stolen.org/chemistry/ (2026-11-05)
 * - https://probably-stolen.org/starting-scenarios/chemist/ (2026-11-05)
 */

export interface DreamDustInputs {
  // Raw materials
  dreamCapAmount: number; // grams (user measurement)
  alcoholAmount: number; // mL
  alcoholType: 'ethanol' | 'other'; // affects extraction
  
  // Equipment & modules
  blenderModules: number; // Chemical Equipment Modules in Blender
  finisherModules: number; // Chemical Equipment Modules in Chem Finisher
  hasEvaporator: boolean;
  hasSpectrometer: boolean;
  
  // Current state (if resuming mid-process)
  currentMixtureVolume?: number; // mL
  currentExtractAmount?: number; // mL of Dream Cap Extract
  currentAlcoholContent?: number; // mL of alcohol in mixture
  isMixtureDry?: boolean; // after evaporation
  
  // Targets & constraints
  targetPurity?: number; // 0-100, optional target
  budget?: number; // credits available
  currentDay?: number; // for cartel tracking
}

export interface DreamDustOutputs {
  // Step 1: Blending assessment
  blendedVolume: number; // mL of mush after blending
  
  // Step 2: Alcohol ratio check
  alcoholToMushRatio: number;
  isOptimalRatio: boolean; // true if ~5:1
  ratioRecommendation: string;
  
  // Step 3: Reaction conditions
  temperatureRange: string; // "40-59°C"
  temperatureWarning: string | null;
  
  // Step 4: Extraction estimate
  extractedDreamCapML: number; // mL of Dream Cap Extract
  extractionEfficiency: number; // percentage (estimated)
  extractionNote: string; // confidence level
  
  // Step 5: Evaporation requirement
  needsEvaporation: boolean;
  alcoholToRemove: number; // mL
  remainingAfterEvap: number; // mL of dry extract
  
  // Step 6: Finisher contamination
  finisherContaminationPercent: number; // based on modules
  contaminationML: number; // added contamination
  
  // Step 7: Final purity
  finalPurityPercent: number;
  finalPurityGrade: string;
  
  // Step 8: Vial production
  totalBatchVolume: number; // mL
  vialsProduced: number; // Dream Dust vials (2mL batch size)
  leftoverML: number; // remainder
  
  // Step 9: Value & grading
  baseValuePerVial: number; // 18 Credits
  gradeModifier: number; // +135%, 0%, -95% etc
  estimatedValuePerVial: number;
  totalEstimatedValue: number;
  
  // Step 10: Recommendations
  meetsTarget: boolean | null; // null if no target
  recommendations: string[];
  
  // Cartel mission (owner-provided requirement, pending source verification)
  cartelMissionStatus?: {
    requiredPurity: number; // e.g. 45%, 70% (OWNER-PROVIDED CAP)
    meetsRequirement: boolean;
    note: string; // "Owner-provided cap, pending independent source verification"
  };
  
  // Limitations & confidence
  limitations: string[];
  sourceRefs: string[];
}

/**
 * Purity grades from probably-stolen.org/chemistry/
 * Source: https://probably-stolen.org/chemistry/ "Product grades" table
 */
export const PURITY_GRADES = [
  { name: 'Lab Pure', minPurity: 99, modifier: 1.35 }, // +135%
  { name: 'Pharma-Grade', minPurity: 90, modifier: 0.50 }, // estimated
  { name: 'Near Pharma', minPurity: 80, modifier: 0.25 }, // estimated
  { name: 'Street Standard', minPurity: 60, modifier: 0 }, // base price
  { name: 'Cut Product', minPurity: 45, modifier: -0.30 }, // estimated
  { name: 'Junk Grade', minPurity: 30, modifier: -0.70 }, // estimated
  { name: 'Starch Grade', minPurity: 0, modifier: -0.95 }, // -95%
] as const;

/**
 * Finisher contamination by Chemical Equipment Modules
 * Source: https://probably-stolen.org/chemistry/ "Finisher loss by modules" table
 */
export function getFinisherContamination(modules: number): number {
  if (modules === 0) return 12;
  if (modules === 1) return 6;
  if (modules === 2) return 3;
  if (modules === 3) return 1;
  return 0; // 4+ modules
}

/**
 * Get purity grade and modifier
 */
export function getPurityGrade(purity: number): { name: string; modifier: number } {
  for (const grade of PURITY_GRADES) {
    if (purity >= grade.minPurity) {
      return { name: grade.name, modifier: grade.modifier };
    }
  }
  return { name: 'Starch Grade', modifier: -0.95 };
}

/**
 * Calculate Dream Dust production
 * 
 * VERIFIED MECHANICS:
 * - Dream Cap → Dream Dust reaction: 40-59°C (source: probably-stolen.org/chemistry/)
 * - Optimal ratio: 5:1 alcohol:mush (source: probably-stolen.org/chemistry/)
 * - Finisher batch: 2 mL per vial (source: probably-stolen.org/chemistry/)
 * - Contamination: 12/6/3/1/0% by modules (source: probably-stolen.org/chemistry/)
 * 
 * ESTIMATED/UNVERIFIED:
 * - Extraction efficiency percentage (source mentions "best extract fraction" but not exact %)
 * - Blending volume conversion (Dream Cap grams → mL mush)
 * - Mid-grade price modifiers (only Pure +135% and Starch -95% explicitly stated)
 */
export function calculateDreamDust(inputs: DreamDustInputs): DreamDustOutputs {
  const recommendations: string[] = [];
  const limitations: string[] = [];
  
  // Step 1: Blending (ESTIMATED - no source for gram→mL conversion)
  // Assume roughly 1:1 by volume for mushroom material
  const blendedVolume = inputs.dreamCapAmount;
  limitations.push('Blending conversion (grams→mL) is estimated at 1:1, not verified from source');
  
  // Step 2: Alcohol ratio
  const alcoholToMushRatio = inputs.alcoholAmount / blendedVolume;
  const isOptimalRatio = alcoholToMushRatio >= 4.5 && alcoholToMushRatio <= 5.5;
  let ratioRecommendation = '';
  
  if (alcoholToMushRatio < 4.5) {
    ratioRecommendation = `Ratio ${alcoholToMushRatio.toFixed(1)}:1 is below optimal. Increase alcohol to ${(blendedVolume * 5).toFixed(1)} mL for best extraction.`;
    recommendations.push(ratioRecommendation);
  } else if (alcoholToMushRatio > 5.5) {
    ratioRecommendation = `Ratio ${alcoholToMushRatio.toFixed(1)}:1 exceeds optimal 5:1. Excess alcohol adds no benefit per source.`;
  } else {
    ratioRecommendation = `Ratio ${alcoholToMushRatio.toFixed(1)}:1 is optimal for extraction.`;
  }
  
  // Step 3: Temperature
  const temperatureRange = '40-59°C';
  const temperatureWarning = 'Keep below 60°C where extract degrades';
  
  // Step 4: Extraction (ESTIMATED - no exact percentage formula)
  // Source says "best extract fraction" at 5:1 but doesn't give percentage
  // Extract volume and initial purity are both estimated
  // Volume: ~45% of blended material becomes liquid extract
  // Initial purity: extract itself is only ~47% pure (rest is water, alcohol residue, etc.)
  // These values calibrated to match expected ~42% final purity with 0 modules (12% contamination)
  const extractionVolumeRate = isOptimalRatio ? 0.45 : 0.30;
  const extractedDreamCapML = blendedVolume * extractionVolumeRate;
  const extractInitialPurity = isOptimalRatio ? 0.47 : 0.35; // purity of extract before finisher
  const extractionEfficiency = extractionVolumeRate * 100;
  const extractionNote = `Extraction rate ESTIMATED at ${(extractionVolumeRate * 100).toFixed(0)}% volume yield with ${(extractInitialPurity * 100).toFixed(0)}% initial purity, not verified from source. Source states "best extract fraction" at 5:1 ratio but gives no exact percentage.`;
  limitations.push(extractionNote);
  
  // Step 5: Evaporation requirement
  const totalMixtureVolume = blendedVolume + inputs.alcoholAmount;
  const needsEvaporation = true; // finisher requires dry batch
  const alcoholToRemove = inputs.alcoholAmount;
  const remainingAfterEvap = extractedDreamCapML; // dry extract only
  
  // Step 6: Finisher contamination
  // Contamination is added to the batch, diluting the active ingredient
  const finisherContaminationPercent = getFinisherContamination(inputs.finisherModules);
  
  // Contamination adds impure material: X% of the extract volume
  const contaminationML = (extractedDreamCapML * finisherContaminationPercent) / 100;
  
  // Step 7: Final purity
  // Purity = (extract volume * extract purity) / (total volume)
  const finalBatchVolume = remainingAfterEvap + contaminationML;
  const activeDreamDustML = extractedDreamCapML * extractInitialPurity;
  const finalPurityPercent = (activeDreamDustML / finalBatchVolume) * 100;
  const purityGrade = getPurityGrade(finalPurityPercent);
  const finalPurityGrade = purityGrade.name;
  
  // Step 8: Vial production
  const BATCH_SIZE_ML = 2; // per vial
  const vialsProduced = Math.floor(finalBatchVolume / BATCH_SIZE_ML);
  const leftoverML = finalBatchVolume % BATCH_SIZE_ML;
  
  // Step 9: Value
  const baseValuePerVial = 18; // Credits
  const gradeModifier = purityGrade.modifier;
  const estimatedValuePerVial = baseValuePerVial * (1 + gradeModifier);
  const totalEstimatedValue = estimatedValuePerVial * vialsProduced;
  
  // Step 10: Target check & recommendations
  let meetsTarget: boolean | null = null;
  if (inputs.targetPurity !== undefined) {
    meetsTarget = finalPurityPercent >= inputs.targetPurity;
    if (!meetsTarget) {
      const neededModules = inputs.finisherModules + 1;
      recommendations.push(`To reach ${inputs.targetPurity}% purity, add more Chemical Equipment Modules to Finisher (currently ${inputs.finisherModules}, try ${neededModules}+)`);
    }
  }
  
  // Equipment recommendations
  if (inputs.finisherModules < 4) {
    const nextContamination = getFinisherContamination(inputs.finisherModules + 1);
    recommendations.push(`Installing 1 more Finisher module would reduce contamination from ${finisherContaminationPercent}% to ${nextContamination}%`);
  }
  
  // Cartel mission (OWNER-PROVIDED, pending verification)
  let cartelMissionStatus: DreamDustOutputs['cartelMissionStatus'];
  if (inputs.targetPurity !== undefined) {
    cartelMissionStatus = {
      requiredPurity: inputs.targetPurity,
      meetsRequirement: finalPurityPercent >= inputs.targetPurity,
      note: '70% mission cap is owner-provided requirement pending independent source verification. Cartel mission progression details not found in fetched sources.',
    };
  }
  
  return {
    blendedVolume,
    alcoholToMushRatio,
    isOptimalRatio,
    ratioRecommendation,
    temperatureRange,
    temperatureWarning,
    extractedDreamCapML,
    extractionEfficiency,
    extractionNote,
    needsEvaporation,
    alcoholToRemove,
    remainingAfterEvap,
    finisherContaminationPercent,
    contaminationML,
    finalPurityPercent,
    finalPurityGrade,
    totalBatchVolume: finalBatchVolume,
    vialsProduced,
    leftoverML,
    baseValuePerVial,
    gradeModifier,
    estimatedValuePerVial,
    totalEstimatedValue,
    meetsTarget,
    recommendations,
    cartelMissionStatus,
    limitations,
    sourceRefs: [
      'https://probably-stolen.org/chemistry/ (2026-11-05)',
      'https://probably-stolen.org/starting-scenarios/chemist/ (2026-11-05)',
    ],
  };
}

/**
 * Primary test scenario from owner: 42% → 45% purity
 */
export function calculatePurityUpgrade(
  currentPurity: number,
  currentModules: number,
  targetPurity: number
): {
  needsUpgrade: boolean;
  modulesNeeded: number;
  estimatedPurityWithUpgrade: number;
  cost: number; // Chemical Equipment Module cost
} {
  const MODULE_COST = 250; // Credits per module (from source)
  
  // Current contamination
  const currentContamination = getFinisherContamination(currentModules);
  
  // Back-calculate active ingredient from current purity
  // purity = active / (active + contamination)
  // If current purity is 42% with 12% contamination:
  // 0.42 = active / (active + 0.12 * active / 0.88)
  // Solving: active ≈ original volume before contamination
  
  // For 45% target, we need contamination low enough
  const needsUpgrade = currentPurity < targetPurity;
  
  let modulesNeeded = currentModules;
  let estimatedPurity = currentPurity;
  
  if (needsUpgrade) {
    // Try each module level
    for (let m = currentModules + 1; m <= 4; m++) {
      const newContamination = getFinisherContamination(m);
      // Recalculate purity with new contamination
      // If original had X extract + old contamination, new purity = X / (X + new contamination)
      const extractRatio = currentPurity / 100;
      const oldTotalRatio = 1;
      const oldExtract = extractRatio * oldTotalRatio;
      
      const newTotal = oldExtract / (1 - newContamination / 100);
      estimatedPurity = (oldExtract / newTotal) * 100;
      
      if (estimatedPurity >= targetPurity) {
        modulesNeeded = m;
        break;
      }
    }
  }
  
  const cost = (modulesNeeded - currentModules) * MODULE_COST;
  
  return {
    needsUpgrade,
    modulesNeeded,
    estimatedPurityWithUpgrade: estimatedPurity,
    cost,
  };
}
