/**
 * Dream Dust full process simulation with component tracking
 * Implements iterative extraction with µL precision
 */

import {
  DREAM_CAP_REFERENCE_WEIGHT_G,
  DREAM_CAP_REFERENCE_MUSH_ML,
  getFinisherContamination,
} from './dreamDust';

/**
 * Component mixture in microliters (µL)
 * All volumes must be integers (truncated per source)
 * 10 components tracked:
 * - 6 from Dream Cap: mush, water, protein, mineral, microbes, physical contaminant
 * - 4 derived: extract (from mush), plant matter (from mush), alcohol (added), insoluble debris (finisher)
 */
export interface ComponentMixture {
  dreamCapMush: number; // µL
  dreamCapExtract: number; // µL
  plantMatter: number; // µL
  water: number; // µL
  protein: number; // µL
  mineral: number; // µL
  microbes: number; // µL
  physicalContaminant: number; // µL
  alcohol: number; // µL
  insolubleDebris: number; // µL (from finisher)
}

export interface SimulationConfig {
  dreamCapGrams: number;
  alcoholML: number;
  heatingTemperature: number; // °C
  maxUpdates: number; // safety limit
  finisherModules: number;
  userModuleCost?: number; // user-provided, not source-derived
}

export interface ExtractionUpdate {
  updateNumber: number;
  temperature: number;
  mushBefore: number; // µL
  alcoholBefore: number; // µL
  qProcessed: number; // µL
  yExtract: number; // µL
  plantMatterAdded: number; // µL
  mushAfter: number; // µL
  extractAfter: number; // µL
}

export interface SimulationResult {
  success: boolean;
  initialComponents: ComponentMixture;
  extractionUpdates: ExtractionUpdate[];
  afterExtraction: ComponentMixture;
  afterEvaporation: ComponentMixture;
  afterFinisher: ComponentMixture;
  finalPurity: number;
  finalVials: number;
  totalUpdates: number;
  warnings: string[];
  impossibleReasons?: string[];
}

export interface ReverseSolution {
  dreamCapGrams: number;
  alcoholML: number;
  finisherModules: number;
  estimatedCost?: number;
  achievedPurity: number;
  achievedVials: number;
  simulation: SimulationResult;
  searchNote: string; // bounded search disclaimer
}

/**
 * Convert Dream Cap grams to initial components (SOURCE-DERIVED)
 * Source: https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing
 * "Scale each component by actual weight / reference weight, then truncate to whole microlitres"
 */
export function dreamCapToComponents(grams: number): ComponentMixture {
  const ratio = grams / DREAM_CAP_REFERENCE_WEIGHT_G;
  
  // Reference components for 32.5g Dream Cap
  const refMush = 27.333; // mL
  const refWater = 4; // mL
  const refProtein = 2; // mL
  const refMineral = 0.5; // mL
  const refMicrobes = 2; // mL
  const refContaminant = 2; // mL
  
  // Scale and truncate to µL
  return {
    dreamCapMush: Math.trunc(ratio * refMush * 1000),
    dreamCapExtract: 0,
    plantMatter: 0,
    water: Math.trunc(ratio * refWater * 1000),
    protein: Math.trunc(ratio * refProtein * 1000),
    mineral: Math.trunc(ratio * refMineral * 1000),
    microbes: Math.trunc(ratio * refMicrobes * 1000),
    physicalContaminant: Math.trunc(ratio * refContaminant * 1000),
    alcohol: 0, // added separately
    insolubleDebris: 0,
  };
}

/**
 * Simulate one extraction update (SOURCE-DERIVED branch 4)
 * Formula: q=min(M,max(2000,round(0.1M))); y=round(q×min(0.5,0.1A/M))
 */
function simulateExtractionUpdate(
  mixture: ComponentMixture,
  temperature: number,
  updateNumber: number
): { mixture: ComponentMixture; update: ExtractionUpdate } {
  const M = mixture.dreamCapMush;
  const A = mixture.alcohol;
  
  if (M === 0 || A === 0 || temperature < 40) {
    return {
      mixture,
      update: {
        updateNumber,
        temperature,
        mushBefore: M,
        alcoholBefore: A,
        qProcessed: 0,
        yExtract: 0,
        plantMatterAdded: 0,
        mushAfter: M,
        extractAfter: mixture.dreamCapExtract,
      },
    };
  }
  
  // Branch 4 formula (in µL)
  const q = Math.min(M, Math.max(2000, Math.round(0.1 * M)));
  const yieldFactor = Math.min(0.5, (0.1 * A) / M);
  const y = Math.round(q * yieldFactor);
  const plantMatter = q - y;
  
  const newMixture: ComponentMixture = {
    ...mixture,
    dreamCapMush: M - q,
    dreamCapExtract: mixture.dreamCapExtract + y,
    plantMatter: mixture.plantMatter + plantMatter,
  };
  
  const update: ExtractionUpdate = {
    updateNumber,
    temperature,
    mushBefore: M,
    alcoholBefore: A,
    qProcessed: q,
    yExtract: y,
    plantMatterAdded: plantMatter,
    mushAfter: newMixture.dreamCapMush,
    extractAfter: newMixture.dreamCapExtract,
  };
  
  return { mixture: newMixture, update };
}

/**
 * Simulate evaporation (removes alcohol and water)
 * Source: Branch 22 documents per-update boiling formula for T > boiling point
 * Alcohol boils at 78.37°C, Water at 100.0°C
 * 
 * IMPLEMENTATION LIMITATION: Overnight Evaporator assumed to remove all evaporatives
 * based on gameplay observation. Exact component limits and side effects not sourced.
 * Per-update boiling not implemented (requires real-time heating loop integration).
 */
function simulateEvaporation(
  mixture: ComponentMixture,
  overnightEvaporator: boolean
): ComponentMixture {
  if (overnightEvaporator) {
    // ASSUMPTION: Overnight Evaporator removes all alcohol and water
    // Source does not specify exact removal limits or component degradation during evaporation
    return {
      ...mixture,
      alcohol: 0,
      water: 0,
    };
  }
  
  // Per-update evaporation not fully implemented (requires heating loop)
  return mixture;
}

/**
 * Simulate Chem Finisher (SOURCE-DERIVED)
 * Samples 2mL (2000µL), adds contamination, calculates purity
 */
function simulateFinisher(
  mixture: ComponentMixture,
  modules: number
): { mixture: ComponentMixture; purity: number; vials: number } {
  const totalVolume = Object.values(mixture).reduce((sum, v) => sum + v, 0);
  
  // Check dry input requirement (evaporatives ≤100µL)
  const evaporatives = mixture.alcohol + mixture.water;
  if (evaporatives > 100) {
    throw new Error(
      `Finisher requires dry input (evaporatives ≤100µL), got ${evaporatives}µL. Use Evaporator first.`
    );
  }
  
  // Check sufficient volume
  if (totalVolume < 2000) {
    throw new Error(
      `Insufficient volume for Finisher (need ≥2000µL per vial), got ${totalVolume}µL`
    );
  }
  
  // Calculate contamination to add
  const contaminationPercent = getFinisherContamination(modules);
  const contaminationAmount = Math.round((totalVolume * contaminationPercent) / 100);
  
  const finalMixture: ComponentMixture = {
    ...mixture,
    insolubleDebris: mixture.insolubleDebris + contaminationAmount,
  };
  
  const finalTotal = totalVolume + contaminationAmount;
  const activeIngredient = mixture.dreamCapExtract;
  const purity = (activeIngredient / finalTotal) * 100;
  const vials = Math.floor(finalTotal / 2000);
  
  return { mixture: finalMixture, purity, vials };
}

/**
 * Full simulation: extraction → evaporation → finisher
 */
export function simulateDreamDustProduction(
  config: SimulationConfig
): SimulationResult {
  const warnings: string[] = [];
  const impossibleReasons: string[] = [];
  
  // Initialize components
  let mixture = dreamCapToComponents(config.dreamCapGrams);
  mixture.alcohol = Math.trunc(config.alcoholML * 1000); // add alcohol
  
  const initialComponents = { ...mixture };
  
  // Validate temperature: restrict to proven safe range
  // Source documents degradation at ≥50°C and ≥60°C but does not quantify effects
  // Without sourced degradation implementation, restrict to safe range
  if (config.heatingTemperature < 40) {
    impossibleReasons.push(`Temperature ${config.heatingTemperature}°C below minimum 40°C (extraction requires ≥40°C per source)`);
    return {
      success: false,
      initialComponents,
      extractionUpdates: [],
      afterExtraction: mixture,
      afterEvaporation: mixture,
      afterFinisher: mixture,
      finalPurity: 0,
      finalVials: 0,
      totalUpdates: 0,
      warnings,
      impossibleReasons,
    };
  }
  
  if (config.heatingTemperature >= 50) {
    impossibleReasons.push(
      `Temperature ${config.heatingTemperature}°C ≥50°C would degrade mush/extract (source: branches 9, 10). ` +
      `Degradation effects not quantified in source; simulation restricted to proven safe range 40-49°C.`
    );
    return {
      success: false,
      initialComponents,
      extractionUpdates: [],
      afterExtraction: mixture,
      afterEvaporation: mixture,
      afterFinisher: mixture,
      finalPurity: 0,
      finalVials: 0,
      totalUpdates: 0,
      warnings,
      impossibleReasons,
    };
  }
  
  // Iterative extraction
  const extractionUpdates: ExtractionUpdate[] = [];
  let updateNum = 0;
  
  while (mixture.dreamCapMush > 0 && updateNum < config.maxUpdates) {
    const result = simulateExtractionUpdate(mixture, config.heatingTemperature, updateNum + 1);
    mixture = result.mixture;
    extractionUpdates.push(result.update);
    updateNum++;
    
    // Stop if no progress
    if (result.update.qProcessed === 0) {
      break;
    }
  }
  
  if (mixture.dreamCapMush > 0 && updateNum >= config.maxUpdates) {
    warnings.push(`Reached max updates (${config.maxUpdates}) with ${mixture.dreamCapMush}µL mush remaining`);
  }
  
  const afterExtraction = { ...mixture };
  
  // Evaporation (overnight Evaporator)
  mixture = simulateEvaporation(mixture, true);
  const afterEvaporation = { ...mixture };
  
  // Finisher
  try {
    const finisherResult = simulateFinisher(mixture, config.finisherModules);
    mixture = finisherResult.mixture;
    
    return {
      success: true,
      initialComponents,
      extractionUpdates,
      afterExtraction,
      afterEvaporation,
      afterFinisher: mixture,
      finalPurity: finisherResult.purity,
      finalVials: finisherResult.vials,
      totalUpdates: updateNum,
      warnings,
    };
  } catch (error) {
    impossibleReasons.push(error instanceof Error ? error.message : String(error));
    return {
      success: false,
      initialComponents,
      extractionUpdates,
      afterExtraction,
      afterEvaporation,
      afterFinisher: mixture,
      finalPurity: 0,
      finalVials: 0,
      totalUpdates: updateNum,
      warnings,
      impossibleReasons,
    };
  }
}

/**
 * Numeric reverse solver: find configuration to achieve target
 * BOUNDED SEARCH: Tests specific ranges, not exhaustive
 * - Dream Cap: 0.5× to 10× reference (16.25g to 325g)
 * - Alcohol ratios: 5:1, 6:1, 7:1
 * - Modules: 0 to 4
 * - Temperature: fixed 45°C (safe range)
 * Returns null if no solution found WITHIN THESE BOUNDS (not proof of global impossibility)
 */
export function solveForTarget(
  targetPurity: number,
  targetVials: number,
  maxBudget?: number,
  userModuleCost?: number
): ReverseSolution | null {
  // Search strategy: try increasing Dream Cap amounts and module counts
  const alcoholRatios = [5, 6, 7]; // try optimal and higher
  const moduleCounts = [4, 3, 2, 1, 0]; // prefer more modules for higher purity
  
  let bestSolution: ReverseSolution | null = null;
  let bestScore = Infinity; // minimize (cost + shortage)
  
  const searchNote = 
    'Solution found within search bounds: Dream Cap 16.25-325g, alcohol 5-7:1, modules 0-4, 45°C. ' +
    'Not an exhaustive search; other configurations may exist.';
  
  for (const modules of moduleCounts) {
    const moduleCost = userModuleCost ? modules * userModuleCost : 0;
    
    if (maxBudget !== undefined && moduleCost > maxBudget) {
      continue; // skip if over budget
    }
    
    for (const ratio of alcoholRatios) {
      // Try different Dream Cap amounts (bounded range)
      for (let capMultiplier = 0.5; capMultiplier <= 10; capMultiplier += 0.5) {
        const dreamCapGrams = DREAM_CAP_REFERENCE_WEIGHT_G * capMultiplier;
        const mushML = (DREAM_CAP_REFERENCE_MUSH_ML * capMultiplier);
        const alcoholML = mushML * ratio;
        
        const config: SimulationConfig = {
          dreamCapGrams,
          alcoholML,
          heatingTemperature: 45, // safe temperature (40-49°C range)
          maxUpdates: 200,
          finisherModules: modules,
          userModuleCost,
        };
        
        const simulation = simulateDreamDustProduction(config);
        
        if (!simulation.success) {
          continue;
        }
        
        const purityShortage = Math.max(0, targetPurity - simulation.finalPurity);
        const vialShortage = Math.max(0, targetVials - simulation.finalVials);
        
        // Score: prioritize meeting requirements, then minimize cost
        const score = purityShortage * 1000 + vialShortage * 100 + moduleCost;
        
        if (purityShortage === 0 && vialShortage === 0 && score < bestScore) {
          bestSolution = {
            dreamCapGrams,
            alcoholML,
            finisherModules: modules,
            estimatedCost: moduleCost,
            achievedPurity: simulation.finalPurity,
            achievedVials: simulation.finalVials,
            simulation,
            searchNote,
          };
          bestScore = score;
        }
      }
    }
  }
  
  return bestSolution; // null = no solution within search bounds (not globally impossible)
}
