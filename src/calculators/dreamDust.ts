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
  
  // Cartel delivery tracking
  currentDay?: number; // game day for Cartel delivery lookup
}

export interface CartelDeliveryRequirement {
  day: number;
  quota: number; // number of vials
  requiredPurity: number; // percentage
  source: 'VERIFIED' | 'OWNER-REPORTED';
}

export interface CartelDeliveryStatus {
  requirement: CartelDeliveryRequirement;
  meetsQuota: boolean;
  meetsPurity: boolean;
  meetsRequirement: boolean;
  reputationChange?: number;
  isFatal?: boolean; // P ≤ R/4 or n=0
  note: string;
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
  vialsProduced?: number; // floor(total / 2mL)
  
  // Value (SOURCE-DERIVED base + modifiers)
  baseValuePerVial: number; // 18 Credits
  gradeModifier?: number; // from purity grade table
  estimatedValue?: number; // vials × base × (1 + modifier)
  
  // Cartel delivery (SOURCE-VERIFIED)
  cartelStatus?: CartelDeliveryStatus;
  
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
 * Cartel delivery schedule (SOURCE-VERIFIED)
 * Sources:
 * - https://probably-stolen.nicokobo.com/en/wiki/terms/cartel-deliveries
 * - https://showgamer.com/en/guides/7319 (table matches wiki formulas)
 * 
 * Day 8 first delivery: 10 vials at 40%
 * Then +5 vials and +5% purity each week
 * Purity caps at 70% on day 50
 * Quantity continues +5 without cap
 */
export const CARTEL_DELIVERIES: CartelDeliveryRequirement[] = [
  { day: 8, quota: 10, requiredPurity: 40, source: 'VERIFIED' },
  { day: 15, quota: 15, requiredPurity: 45, source: 'VERIFIED' },
  { day: 22, quota: 20, requiredPurity: 50, source: 'VERIFIED' },
  { day: 29, quota: 25, requiredPurity: 55, source: 'VERIFIED' },
  { day: 36, quota: 30, requiredPurity: 60, source: 'VERIFIED' },
  { day: 43, quota: 35, requiredPurity: 65, source: 'VERIFIED' },
  { day: 50, quota: 40, requiredPurity: 70, source: 'VERIFIED' },
  // After day 50: quantity continues +5, purity stays 70%
  // Formula: day N (N≥50, N%7=1): quota = 40 + 5×((N-50)/7), purity = 70
];

/**
 * Get Cartel delivery requirement for a given day
 * Source: https://probably-stolen.nicokobo.com/en/wiki/terms/cartel-deliveries
 * "Deliveries on 8,15,22..." (weekly: 8 + 7n)
 * "Quota +5 without a stated cap; required purity +5, capped at 70%"
 */
export function getCartelRequirement(day: number): CartelDeliveryRequirement | null {
  // Deliveries on days 8, 15, 22, 29, ... (8 + 7n where n ≥ 0)
  if (day < 8 || (day - 8) % 7 !== 0) {
    return null; // not a delivery day
  }
  
  // Check explicit table first
  const explicitReq = CARTEL_DELIVERIES.find((req) => req.day === day);
  if (explicitReq) {
    return explicitReq;
  }
  
  // For days after 50: formula-based (purity capped at 70%)
  if (day >= 50) {
    const weeksPast50 = Math.floor((day - 50) / 7);
    return {
      day,
      quota: 40 + 5 * weeksPast50,
      requiredPurity: 70, // capped
      source: 'VERIFIED',
    };
  }
  
  return null;
}

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
 * Evaluate Cartel delivery
 * Source: https://probably-stolen.nicokobo.com/en/wiki/terms/cartel-deliveries
 * 
 * Fatal conditions:
 * - n=0 (no vials delivered)
 * - P ≤ trunc(R/4) (mean purity at or below 1/4 required)
 * 
 * Reputation:
 * - n=0: gunshot, game over
 * - 0<n<Q: +n reputation, but quantity fails
 * - n≥Q: quantity passes, +Q reputation (capped by n)
 * - P≤R/4: game over
 * - R/4<P≤R-5: low purity, -trunc(R-P), no purity reward
 * - R-5<P≤R+10: good, purity passes, -trunc(R-P) (can be negative if P<R)
 * - P>R+10: high purity, +trunc(P-R)/4
 */
export function evaluateCartelDelivery(
  requirement: CartelDeliveryRequirement,
  vialsDelivered: number,
  meanPurity: number
): CartelDeliveryStatus {
  const Q = requirement.quota;
  const R = requirement.requiredPurity;
  const n = vialsDelivered;
  const P = meanPurity;
  
  // Fatal condition 1: no vials
  if (n === 0) {
    return {
      requirement,
      meetsQuota: false,
      meetsPurity: false,
      meetsRequirement: false,
      isFatal: true,
      note: 'FATAL: No vials delivered (gunshot, game over per source)',
    };
  }
  
  // Fatal condition 2: P ≤ trunc(R/4)
  const fatalPurityThreshold = Math.trunc(R / 4);
  if (P <= fatalPurityThreshold) {
    return {
      requirement,
      meetsQuota: false,
      meetsPurity: false,
      meetsRequirement: false,
      isFatal: true,
      note: `FATAL: Mean purity ${P.toFixed(1)}% ≤ ${fatalPurityThreshold}% (R/4) - deception branch, game over per source`,
    };
  }
  
  // Quantity check
  const meetsQuota = n >= Q;
  const quantityRep = meetsQuota ? Math.min(n, Q) : n;
  
  // Purity check
  let purityRep = 0;
  let meetsPurity = false;
  let purityNote = '';
  
  if (P <= R - 5) {
    // Low purity: R/4 < P ≤ R-5
    purityRep = -Math.trunc(R - P);
    meetsPurity = false;
    purityNote = `Low purity (${P.toFixed(1)}% ≤ ${R - 5}%), no purity reward`;
  } else if (P <= R + 10) {
    // Good branch: R-5 < P ≤ R+10
    purityRep = -Math.trunc(R - P); // can be positive if P > R
    meetsPurity = true;
    if (P < R) {
      purityNote = `Good range but below requirement (${P.toFixed(1)}% < ${R}%), purity reward passes with ${purityRep} rep`;
    } else {
      purityNote = `Good purity (${P.toFixed(1)}% ≥ ${R}%), purity reward passes with +${Math.abs(purityRep)} rep`;
    }
  } else {
    // High purity: P > R+10
    purityRep = Math.trunc((P - R) / 4);
    meetsPurity = true;
    purityNote = `High purity (${P.toFixed(1)}% > ${R + 10}%), purity reward passes with +${purityRep} rep`;
  }
  
  const totalRep = quantityRep + purityRep;
  const meetsRequirement = meetsQuota && meetsPurity;
  
  let note = '';
  if (!meetsQuota) {
    note += `Quantity: ${n}/${Q} vials (FAILS, +${quantityRep} rep). `;
  } else {
    note += `Quantity: ${n}/${Q} vials (PASSES, +${quantityRep} rep). `;
  }
  note += purityNote;
  note += ` Total: ${totalRep > 0 ? '+' : ''}${totalRep} reputation (before difficulty multipliers).`;
  
  return {
    requirement,
    meetsQuota,
    meetsPurity,
    meetsRequirement,
    reputationChange: totalRep,
    isFatal: false,
    note,
  };
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
  let vialsProduced: number | undefined;
  let estimatedValue: number | undefined;
  
  if (inputs.currentExtractML !== undefined && inputs.currentMixtureTotalML !== undefined) {
    // SOURCE-DERIVED: "Product purity P = intended active-component volume / total component volume ×100%"
    calculatedPurity = (inputs.currentExtractML / inputs.currentMixtureTotalML) * 100;
    const grade = getPurityGrade(calculatedPurity);
    purityGrade = grade.name;
    gradeModifier = grade.modifier;
    
    // Vials produced (SOURCE-DERIVED: 2mL per vial)
    vialsProduced = Math.floor(inputs.currentMixtureTotalML / finisherSampleSizeML);
    
    // Estimated value
    const baseValuePerVial = 18; // Credits (SOURCE-DERIVED)
    const valuePerVial = baseValuePerVial * (1 + gradeModifier);
    estimatedValue = vialsProduced * valuePerVial;
    
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
  
  // Cartel delivery evaluation (if day and measurements provided)
  let cartelStatus: CartelDeliveryStatus | undefined;
  if (inputs.currentDay !== undefined && calculatedPurity !== undefined && vialsProduced !== undefined) {
    const requirement = getCartelRequirement(inputs.currentDay);
    if (requirement) {
      cartelStatus = evaluateCartelDelivery(requirement, vialsProduced, calculatedPurity);
      
      if (cartelStatus.isFatal) {
        recommendations.push(`⚠️ FATAL DELIVERY: ${cartelStatus.note}`);
      } else if (!cartelStatus.meetsRequirement) {
        recommendations.push(`⚠️ Cartel delivery requirements not met. ${cartelStatus.note}`);
      }
    }
  }
  
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
    vialsProduced,
    gradeModifier,
    estimatedValue,
    baseValuePerVial,
    cartelStatus,
    recommendations,
    missingInputs,
    sourceRefs: [
      'https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing (retrieved 2026-11-05)',
      'https://probably-stolen.org/chemistry/ (finisher contamination table)',
      'https://probably-stolen.nikokobo.com/en/wiki/terms/cartel-deliveries (retrieved 2026-11-05)',
      'https://showgamer.com/en/guides/7319 (cartel table verified)',
    ],
    limitations,
  };
}
