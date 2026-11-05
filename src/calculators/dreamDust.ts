/**
 * Dream Dust production calculator - SOURCE-DERIVED FORMULAS ONLY
 * 
 * Primary source: https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing
 * Retrieved via WebSearch 2026-11-05
 * 
 * CRITICAL: All formulas are per-update (approx once per second while heated).
 * This calculator shows per-update yields; actual production requires multiple updates.
 */

export interface DreamDustInputs {
  // Raw materials (user must provide measurements)
  dreamCapGrams?: number; // optional, converts via reference weight
  dreamCapMushML?: number; // direct mush input (after blending)
  alcoholML: number;
  
  // Equipment state
  finisherModules: number; // Chemical Equipment Modules in Chem Finisher
  
  // Optional measurements (if known from Composition Spectrometer)
  currentMixtureTotalML?: number;
  currentExtractML?: number;
  
  // Targets
  targetPurity?: number; // 0-100, optional
}

export interface DreamDustOutputs {
  // Ingredient breakdown (SOURCE-DERIVED)
  dreamCapMushML: number; // from reference weight or user input
  alcoholML: number;
  alcoholToMushRatio: number;
  
  // Per-update extraction (SOURCE: branch 4 formula)
  perUpdateProcessedMushML: number; // q
  perUpdateExtractYieldML: number; // y
  perUpdatePlantMatterML: number; // q - y
  extractionEfficiency: number; // percentage of processed mush that becomes extract
  
  // Extraction analysis
  isOptimalRatio: boolean; // A/M >= 5
  atYieldCap: boolean; // reaches 50% per-update cap
  
  // Temperature requirements (SOURCE-DERIVED)
  extractionTempRange: string; // "≥40°C"
  degradationThresholds: {
    mush: string; // "≥50°C"
    extract: string; // "≥60°C"
  };
  
  // Finisher (SOURCE-DERIVED)
  finisherSampleSizeML: number; // 2mL for Dream Dust
  finisherContaminationPercent: number; // by modules: 12/6/3/1/0%
  requiresDryInput: boolean; // evaporative components ≤0.1mL
  
  // Purity calculation (if extract volume known)
  calculatedPurity?: number;
  purityGrade?: string;
  
  // Value (SOURCE-DERIVED base + modifiers)
  baseValuePerVial: number; // 18 Credits
  gradeModifier?: number; // from purity grade table
  
  // Recommendations
  recommendations: string[];
  
  // Missing inputs that prevent complete calculation
  missingInputs: string[];
  
  // Source references
  sourceRefs: string[];
  limitations: string[];
}

/**
 * Dream Cap reference weight to components (SOURCE-DERIVED)
 * Source: https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing
 * "Dream Cap | 32.5 | Dream Cap Mush 27.333; Water 4; Protein 2; Mineral 0.5; Microbes 2; Physical Contaminant 2"
 */
export const DREAM_CAP_REFERENCE_WEIGHT_G = 32.5;
export const DREAM_CAP_REFERENCE_MUSH_ML = 27.333;

/**
 * Convert Dream Cap grams to mush mL using reference weight
 * Scale: (actual_weight / reference_weight) × reference_mush, truncate to whole µL
 */
export function dreamCapGramsToMushML(grams: number): number {
  const ratio = grams / DREAM_CAP_REFERENCE_WEIGHT_G;
  const mushML = ratio * DREAM_CAP_REFERENCE_MUSH_ML;
  // Truncate to µL (3 decimal places in mL)
  return Math.floor(mushML * 1000) / 1000;
}

/**
 * Finisher contamination by Chemical Equipment Modules (SOURCE-DERIVED)
 * Source: probably-stolen.org/chemistry/ "Finisher loss by modules" table
 * NOTE: This is contamination percentage, NOT module count
 */
export function getFinisherContamination(modules: number): number {
  if (modules === 0) return 12;
  if (modules === 1) return 6;
  if (modules === 2) return 3;
  if (modules === 3) return 1;
  return 0; // 4+ modules
}

/**
 * Purity grades and value modifiers (SOURCE-DERIVED)
 * Source: https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing
 * "Product purity P = intended active-component volume / total component volume ×100%"
 */
export const PURITY_GRADES = [
  { name: 'Lab Pure', minPurity: 99, modifier: 1.35 }, // +135%
  { name: 'Pharma-Grade', minPurity: 90, modifier: 0.85 }, // +85%
  { name: 'Near Pharma', minPurity: 80, modifier: 0.40 }, // +40%
  { name: 'Street Standard', minPurity: 60, modifier: 0 }, // +0%
  { name: 'Cut Product', minPurity: 45, modifier: -0.45 }, // -45%
  { name: 'Junk Grade', minPurity: 30, modifier: -0.75 }, // -75%
  { name: 'Starch Grade', minPurity: 0, modifier: -0.95 }, // -95%
] as const;

export function getPurityGrade(purity: number): { name: string; modifier: number } {
  for (const grade of PURITY_GRADES) {
    if (purity >= grade.minPurity) {
      return { name: grade.name, modifier: grade.modifier };
    }
  }
  return { name: 'Starch Grade', modifier: -0.95 };
}

/**
 * Calculate Dream Dust extraction per-update
 * 
 * SOURCE-DERIVED FORMULA (branch 4):
 * "Dream Cap Mush → Dream Cap Extract | T≥40; mush M>0, Alcohol A>0"
 * "q=min(M,max(2000,round(0.1M)))"
 * "y=round(q×min(0.5,0.1A/M))"
 * "Mush −q; extract +y; Plant Matter +(q−y); no Alcohol consumed"
 * 
 * CRITICAL NOTES:
 * - Formulas are per-update (~once per second while heated)
 * - This is NOT total batch processing; actual extraction takes many updates
 * - "Mushroom extraction reaches its 50% per-update active-yield cap at A/M≥5"
 * - Alcohol is NOT consumed during extraction
 * 
 * LIMITATIONS:
 * - Cannot calculate total extract without knowing heating duration (updates)
 * - Cannot predict final purity without measuring extract volume
 * - Blender loss percentage not specified in source
 */
export function calculateDreamDustPerUpdate(inputs: DreamDustInputs): DreamDustOutputs {
  const recommendations: string[] = [];
  const limitations: string[] = [];
  const missingInputs: string[] = [];
  
  // Determine mush amount
  let dreamCapMushML: number;
  if (inputs.dreamCapMushML !== undefined) {
    dreamCapMushML = inputs.dreamCapMushML;
  } else if (inputs.dreamCapGrams !== undefined) {
    dreamCapMushML = dreamCapGramsToMushML(inputs.dreamCapGrams);
    limitations.push(`Dream Cap ${inputs.dreamCapGrams}g converted to ${dreamCapMushML.toFixed(3)}mL mush using reference weight ${DREAM_CAP_REFERENCE_WEIGHT_G}g = ${DREAM_CAP_REFERENCE_MUSH_ML}mL (source-derived, before blending loss)`);
  } else {
    dreamCapMushML = 0;
    missingInputs.push('Dream Cap amount (grams) or Dream Cap Mush volume (mL)');
  }
  
  const alcoholML = inputs.alcoholML;
  const alcoholToMushRatio = dreamCapMushML > 0 ? alcoholML / dreamCapMushML : 0;
  
  // Per-update extraction formula (SOURCE-DERIVED)
  const M = dreamCapMushML; // mush volume in mL (convert to µL for formula)
  const A = alcoholML; // alcohol volume in mL
  
  // q = min(M, max(2000, round(0.1*M))) [in µL]
  const M_uL = M * 1000;
  const q_uL = Math.min(M_uL, Math.max(2000, Math.round(0.1 * M_uL)));
  const perUpdateProcessedMushML = q_uL / 1000;
  
  // y = round(q × min(0.5, 0.1*A/M)) [in µL]
  let y_uL: number;
  let extractionEfficiency: number;
  if (M > 0 && A > 0) {
    const yieldFactor = Math.min(0.5, 0.1 * A / M);
    y_uL = Math.round(q_uL * yieldFactor);
    extractionEfficiency = (y_uL / q_uL) * 100;
  } else {
    y_uL = 0;
    extractionEfficiency = 0;
  }
  const perUpdateExtractYieldML = y_uL / 1000;
  const perUpdatePlantMatterML = perUpdateProcessedMushML - perUpdateExtractYieldML;
  
  // Ratio analysis
  const isOptimalRatio = alcoholToMushRatio >= 5;
  const atYieldCap = alcoholToMushRatio >= 5 && M > 0 && A > 0;
  
  if (!isOptimalRatio && M > 0) {
    const optimalAlcohol = M * 5;
    recommendations.push(`Increase alcohol to ${optimalAlcohol.toFixed(1)}mL (5:1 ratio) to reach 50% per-update yield cap. Current ratio ${alcoholToMushRatio.toFixed(1)}:1 yields only ${extractionEfficiency.toFixed(1)}% per update.`);
  }
  
  // Temperature (SOURCE-DERIVED)
  const extractionTempRange = '≥40°C';
  const degradationThresholds = {
    mush: '≥50°C (becomes Plant Matter)',
    extract: '≥60°C (breaks down, no output)',
  };
  
  // Finisher (SOURCE-DERIVED)
  const finisherSampleSizeML = 2; // Dream Dust requires 2mL sample
  const finisherContaminationPercent = getFinisherContamination(inputs.finisherModules);
  const requiresDryInput = true; // "evaporative components must be ≤100 μl"
  
  if (inputs.finisherModules < 4) {
    const nextContamination = getFinisherContamination(inputs.finisherModules + 1);
    recommendations.push(`Adding 1 more Finisher module would reduce contamination from ${finisherContaminationPercent}% to ${nextContamination}%`);
  }
  
  // Purity calculation (only if extract volume is known)
  let calculatedPurity: number | undefined;
  let purityGrade: string | undefined;
  let gradeModifier: number | undefined;
  
  if (inputs.currentExtractML !== undefined && inputs.currentMixtureTotalML !== undefined) {
    // SOURCE-DERIVED: "Product purity P = intended active-component volume / total component volume ×100%"
    calculatedPurity = (inputs.currentExtractML / inputs.currentMixtureTotalML) * 100;
    const grade = getPurityGrade(calculatedPurity);
    purityGrade = grade.name;
    gradeModifier = grade.modifier;
    
    if (inputs.targetPurity !== undefined) {
      if (calculatedPurity < inputs.targetPurity) {
        recommendations.push(`Current purity ${calculatedPurity.toFixed(2)}% is below target ${inputs.targetPurity}%. Reduce contamination by adding Finisher modules or improve extraction efficiency.`);
      }
    }
  } else {
    missingInputs.push('Current extract volume (mL) and total mixture volume (mL) from Composition Spectrometer');
    limitations.push('Cannot calculate purity without Composition Spectrometer measurements of extract and total mixture volumes');
  }
  
  // Value
  const baseValuePerVial = 18; // Credits (SOURCE-DERIVED)
  
  // Critical limitations
  limitations.push('PER-UPDATE CALCULATION: Formulas show yield per update (~1 second while heated). Actual production requires many updates until mush is depleted.');
  limitations.push('BLENDER LOSS: Source does not specify blending loss percentage. Calculator uses pre-loss component volumes.');
  limitations.push('HEATING DURATION: Cannot predict total extract without knowing heating time or update count.');
  limitations.push('FINAL PURITY: Requires Composition Spectrometer measurement of extract volume in finished mixture.');
  
  return {
    dreamCapMushML,
    alcoholML,
    alcoholToMushRatio,
    perUpdateProcessedMushML,
    perUpdateExtractYieldML,
    perUpdatePlantMatterML,
    extractionEfficiency,
    isOptimalRatio,
    atYieldCap,
    extractionTempRange,
    degradationThresholds,
    finisherSampleSizeML,
    finisherContaminationPercent,
    requiresDryInput,
    calculatedPurity,
    purityGrade,
    gradeModifier,
    baseValuePerVial,
    recommendations,
    missingInputs,
    sourceRefs: [
      'https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing (retrieved 2026-11-05)',
      'https://probably-stolen.org/chemistry/ (finisher contamination table)',
    ],
    limitations,
  };
}
