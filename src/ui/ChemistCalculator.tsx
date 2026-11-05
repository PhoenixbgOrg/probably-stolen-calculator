import { useState } from 'react';
import {
  calculateDreamDustPerUpdate,
  type DreamDustInputs,
  type DreamDustOutputs,
  PURITY_GRADES,
  DREAM_CAP_REFERENCE_WEIGHT_G,
  DREAM_CAP_REFERENCE_MUSH_ML,
} from '../calculators/dreamDust';
import {
  simulateDreamDustProduction,
  solveForTarget,
  type SimulationConfig,
} from '../calculators/dreamDustSimulation';

/**
 * Dream Dust production calculator UI
 * Full iterative simulation with component tracking
 */
export function ChemistCalculator() {
  // Mode selection
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');
  
  // Basic inputs
  const [dreamCapGrams, setDreamCapGrams] = useState(32.5); // reference weight
  const [alcoholML, setAlcoholML] = useState(136.7); // 5:1 ratio
  const [temperature, setTemperature] = useState(45); // safe temperature
  const [finisherModules, setFinisherModules] = useState(0);
  const [userModuleCost, setUserModuleCost] = useState<number | undefined>(250);
  
  // Reverse mode inputs
  const [targetPurity, setTargetPurity] = useState(45);
  const [targetVials, setTargetVials] = useState(10);
  const [maxBudget, setMaxBudget] = useState<number | undefined>();
  
  // Cartel tracking
  const [currentDay, setCurrentDay] = useState<number | undefined>(8); // first delivery day
  
  // Calculate forward simulation
  const forwardConfig: SimulationConfig = {
    dreamCapGrams,
    alcoholML,
    heatingTemperature: temperature,
    maxUpdates: 200,
    finisherModules,
    userModuleCost,
  };
  
  const forwardResult = simulateDreamDustProduction(forwardConfig);
  
  // Calculate reverse solution
  const reverseResult = mode === 'reverse' 
    ? solveForTarget(targetPurity, targetVials, maxBudget, userModuleCost)
    : null;
  
  // Legacy per-update calculation (for reference)
  const inputs: DreamDustInputs = {
    dreamCapGrams,
    alcoholML,
    finisherModules,
    currentDay: currentDay,
  };
  
  const outputs: DreamDustOutputs = calculateDreamDustPerUpdate(inputs);
  
  return (
    <div className="calculator chemist-calculator">
      <div className="calculator-header">
        <h2>Dream Dust Production Calculator</h2>
        <p className="subtitle">
          Full iterative simulation with component tracking (µL precision)
        </p>
        <p className="subtitle small">
          Primary source: <a href="https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing" target="_blank" rel="noopener noreferrer">nicokobo.com wiki (retrieved via WebSearch 2026-11-05)</a>
        </p>
      </div>
      
      <div className="mode-selector">
        <button 
          className={mode === 'forward' ? 'active' : ''}
          onClick={() => setMode('forward')}
        >
          Forward Simulation
        </button>
        <button 
          className={mode === 'reverse' ? 'active' : ''}
          onClick={() => setMode('reverse')}
        >
          Reverse Solver
        </button>
      </div>
      
      <div className="calculator-content">
        {mode === 'forward' && (
          <>
            {/* FORWARD SIMULATION */}
            <section className="disclaimer-section">
              <h4>Full Production Simulation</h4>
              <p className="disclaimer">
                <strong>Complete iterative extraction</strong> simulating all heating updates until mush is depleted, followed by evaporation and finisher processing with accurate component tracking in integer microliters (µL).
              </p>
            </section>
        
        <section className="input-section">
          <h3>Materials</h3>
          
          <div className="input-group">
            <label htmlFor="dreamCap">
              Dream Cap Amount (grams)
              <span className="help-text">Reference: {DREAM_CAP_REFERENCE_WEIGHT_G}g = {DREAM_CAP_REFERENCE_MUSH_ML}mL mush</span>
            </label>
            <input
              id="dreamCap"
              type="number"
              min="0"
              step="0.1"
              max="1000"
              value={dreamCapGrams}
              onChange={(e) => setDreamCapGrams(Number(e.target.value))}
            />
            <div className="info-badge">
              Initial mush: {Math.trunc((dreamCapGrams / DREAM_CAP_REFERENCE_WEIGHT_G) * DREAM_CAP_REFERENCE_MUSH_ML * 1000)} µL
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="alcohol">
              Alcohol Amount (mL)
              <span className="help-text">Optimal: ≥5:1 alcohol to mush (reaches 50% yield cap)</span>
            </label>
            <input
              id="alcohol"
              type="number"
              min="0"
              step="0.1"
              max="5000"
              value={alcoholML}
              onChange={(e) => setAlcoholML(Number(e.target.value))}
            />
            <div className={`info-badge ${outputs.isOptimalRatio ? 'success' : 'warning'}`}>
              Ratio: {outputs.alcoholToMushRatio.toFixed(2)}:1
              {outputs.isOptimalRatio ? ' ✓ OPTIMAL' : ' ⚠ SUBOPTIMAL'}
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="temperature">
              Heating Temperature (°C)
              <span className="help-text">40-49°C safe, ≥50°C degrades mush, ≥60°C degrades extract</span>
            </label>
            <input
              id="temperature"
              type="number"
              min="0"
              max="100"
              step="1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="finisherModules">
              Chem Finisher Modules
              <span className="help-text">Chemical Equipment Modules (0-4+)</span>
            </label>
            <input
              id="finisherModules"
              type="number"
              min="0"
              max="10"
              value={finisherModules}
              onChange={(e) => setFinisherModules(Number(e.target.value))}
            />
            <div className="info-badge">
              Contamination: {outputs.finisherContaminationPercent}%
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="moduleCost">
              Module Cost (Credits, user-provided)
              <span className="help-text">Optional: your quoted cost per Chemical Equipment Module</span>
            </label>
            <input
              id="moduleCost"
              type="number"
              min="0"
              step="1"
              value={userModuleCost || ''}
              onChange={(e) => setUserModuleCost(e.target.value ? Number(e.target.value) : undefined)}
            />
            {userModuleCost && (
              <div className="info-badge">
                {finisherModules} modules × {userModuleCost}₵ = {finisherModules * userModuleCost}₵ total
              </div>
            )}
          </div>
        </section>
        
        {/* SIMULATION RESULTS */}
        <section className="output-section">
          <h3>Simulation Results</h3>
          
          {!forwardResult.success ? (
            <div className="alert error">
              <strong>⚠️ Simulation Failed</strong><br/>
              {forwardResult.impossibleReasons?.map((reason, i) => (
                <div key={i}>{reason}</div>
              ))}
            </div>
          ) : (
            <>
              <div className="output-group highlight">
                <h4>Final Product</h4>
                <div className="output-row">
                  <span className="output-label">Purity:</span>
                  <span className="output-value large">
                    {forwardResult.finalPurity.toFixed(2)}%
                    <span className={`badge grade-${outputs.purityGrade?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {outputs.purityGrade}
                    </span>
                  </span>
                </div>
                <div className="output-row">
                  <span className="output-label">Vials produced:</span>
                  <span className="output-value large">
                    {forwardResult.finalVials} vials
                    <span className="badge verified">2 mL each</span>
                  </span>
                </div>
              </div>
              
              <div className="output-group">
                <h4>Extraction Process</h4>
                <div className="output-row">
                  <span className="output-label">Total updates:</span>
                  <span className="output-value">{forwardResult.totalUpdates}</span>
                </div>
                <div className="output-row">
                  <span className="output-label">Initial mush:</span>
                  <span className="output-value">{forwardResult.initialComponents.dreamCapMush} µL</span>
                </div>
                <div className="output-row">
                  <span className="output-label">Extract produced:</span>
                  <span className="output-value">{forwardResult.afterExtraction.dreamCapExtract} µL</span>
                </div>
                <div className="output-row">
                  <span className="output-label">Plant matter:</span>
                  <span className="output-value">{forwardResult.afterExtraction.plantMatter} µL</span>
                </div>
              </div>
              
              <div className="output-group">
                <h4>Component Tracking (after finisher)</h4>
                <table className="component-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Volume (µL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dream Cap Extract</td>
                      <td className="highlight-value">{forwardResult.afterFinisher.dreamCapExtract}</td>
                    </tr>
                    <tr>
                      <td>Plant Matter</td>
                      <td>{forwardResult.afterFinisher.plantMatter}</td>
                    </tr>
                    <tr>
                      <td>Protein</td>
                      <td>{forwardResult.afterFinisher.protein}</td>
                    </tr>
                    <tr>
                      <td>Mineral</td>
                      <td>{forwardResult.afterFinisher.mineral}</td>
                    </tr>
                    <tr>
                      <td>Microbes</td>
                      <td>{forwardResult.afterFinisher.microbes}</td>
                    </tr>
                    <tr>
                      <td>Physical Contaminant</td>
                      <td>{forwardResult.afterFinisher.physicalContaminant}</td>
                    </tr>
                    <tr>
                      <td>Insoluble Debris (finisher)</td>
                      <td>{forwardResult.afterFinisher.insolubleDebris}</td>
                    </tr>
                    <tr>
                      <td>Alcohol (evaporated)</td>
                      <td>{forwardResult.afterFinisher.alcohol}</td>
                    </tr>
                    <tr>
                      <td>Water (evaporated)</td>
                      <td>{forwardResult.afterFinisher.water}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {forwardResult.warnings.length > 0 && (
                <div className="alert warning">
                  <strong>⚠️ Warnings:</strong>
                  {forwardResult.warnings.map((warning, i) => (
                    <div key={i}>{warning}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
          </>
        )}
        
        {mode === 'reverse' && (
          <>
            {/* REVERSE SOLVER */}
            <section className="disclaimer-section">
              <h4>Reverse Solver</h4>
              <p className="disclaimer">
                <strong>Find required materials</strong> to achieve target purity and vial count. Searches over Dream Cap amounts, alcohol ratios, and module configurations.
              </p>
            </section>
            
            <section className="input-section">
              <h3>Target Requirements</h3>
              
              <div className="input-group">
                <label htmlFor="targetPurity">
                  Target Purity (%)
                  <span className="help-text">Desired final purity</span>
                </label>
                <input
                  id="targetPurity"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={targetPurity}
                  onChange={(e) => setTargetPurity(Number(e.target.value))}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="targetVials">
                  Target Vials
                  <span className="help-text">Minimum vials needed</span>
                </label>
                <input
                  id="targetVials"
                  type="number"
                  min="1"
                  step="1"
                  value={targetVials}
                  onChange={(e) => setTargetVials(Number(e.target.value))}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="maxBudget">
                  Max Budget (Credits, optional)
                  <span className="help-text">Maximum to spend on modules</span>
                </label>
                <input
                  id="maxBudget"
                  type="number"
                  min="0"
                  step="1"
                  value={maxBudget || ''}
                  onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="moduleCostReverse">
                  Module Cost (Credits, user-provided)
                  <span className="help-text">Your quoted cost per Chemical Equipment Module</span>
                </label>
                <input
                  id="moduleCostReverse"
                  type="number"
                  min="0"
                  step="1"
                  value={userModuleCost || ''}
                  onChange={(e) => setUserModuleCost(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </section>
            
            <section className="output-section">
              <h3>Recommended Configuration</h3>
              
              {!reverseResult ? (
                <div className="alert error">
                  <strong>⚠️ No Solution Found</strong><br/>
                  Unable to find a configuration that meets the target requirements within search constraints. Try lowering purity or vial targets, or increasing budget.
                </div>
              ) : (
                <>
                  <div className="output-group highlight">
                    <h4>Required Materials</h4>
                    <div className="output-row">
                      <span className="output-label">Dream Cap:</span>
                      <span className="output-value large">{reverseResult.dreamCapGrams.toFixed(1)} grams</span>
                    </div>
                    <div className="output-row">
                      <span className="output-label">Alcohol:</span>
                      <span className="output-value large">{reverseResult.alcoholML.toFixed(1)} mL</span>
                    </div>
                    <div className="output-row">
                      <span className="output-label">Finisher Modules:</span>
                      <span className="output-value large">{reverseResult.finisherModules}</span>
                    </div>
                    {reverseResult.estimatedCost !== undefined && (
                      <div className="output-row">
                        <span className="output-label">Module Cost:</span>
                        <span className="output-value large">{reverseResult.estimatedCost}₵</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="output-group">
                    <h4>Achieved Results</h4>
                    <div className="output-row">
                      <span className="output-label">Purity:</span>
                      <span className="output-value">
                        {reverseResult.achievedPurity.toFixed(2)}%
                        {reverseResult.achievedPurity >= targetPurity ? ' ✓' : ' ⚠'}
                      </span>
                    </div>
                    <div className="output-row">
                      <span className="output-label">Vials:</span>
                      <span className="output-value">
                        {reverseResult.achievedVials}
                        {reverseResult.achievedVials >= targetVials ? ' ✓' : ' ⚠'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )}
        
        {/* CARTEL DELIVERY TRACKING */}
        <section className="input-section">
          <h3>Cartel Delivery Tracking (Optional)</h3>
          <p className="info-text">
            Weekly deliveries on days 8, 15, 22, 29... (source: nikokobo wiki)
          </p>
          
          <div className="input-group">
            <label htmlFor="currentDay">
              Current Game Day
              <span className="help-text">Day 8 = first delivery (10 vials, 40%), then +5 vials +5% weekly</span>
            </label>
            <input
              id="currentDay"
              type="number"
              min="1"
              step="1"
              value={currentDay || ''}
              onChange={(e) => setCurrentDay(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </section>
        
        {/* Cartel Delivery Status */}
        {mode === 'forward' && forwardResult.success && outputs.cartelStatus && (
          <section className="output-section">
            <div className={`output-group ${outputs.cartelStatus.isFatal ? 'fatal' : outputs.cartelStatus.meetsRequirement ? 'success-group' : 'warning-group'}`}>
              <h4>Cartel Delivery Evaluation</h4>
              <div className="cartel-requirement">
                <div className="output-row">
                  <span className="output-label">Day {outputs.cartelStatus.requirement.day} Requirement:</span>
                  <span className="output-value">
                    {outputs.cartelStatus.requirement.quota} vials at {outputs.cartelStatus.requirement.requiredPurity}% purity
                    <span className="badge verified">SOURCE-VERIFIED</span>
                  </span>
                </div>
                <div className="output-row">
                  <span className="output-label">Your production:</span>
                  <span className="output-value">
                    {forwardResult.finalVials} vials at {forwardResult.finalPurity.toFixed(1)}% purity
                  </span>
                </div>
              </div>
              
              {outputs.cartelStatus.isFatal ? (
                <div className="alert error">
                  <strong>⚠️ FATAL DELIVERY</strong><br/>
                  {outputs.cartelStatus.note}
                </div>
              ) : (
                <>
                  <div className={`alert ${outputs.cartelStatus.meetsRequirement ? 'success' : 'warning'}`}>
                    <strong>{outputs.cartelStatus.meetsRequirement ? '✓ Requirements Met' : '⚠️ Requirements Not Met'}</strong><br/>
                    Quota: {outputs.cartelStatus.meetsQuota ? 'PASS' : 'FAIL'}<br/>
                    Purity: {outputs.cartelStatus.meetsPurity ? 'PASS' : 'FAIL'}<br/>
                    Reputation change: {outputs.cartelStatus.reputationChange && outputs.cartelStatus.reputationChange > 0 ? '+' : ''}{outputs.cartelStatus.reputationChange}
                  </div>
                  <p className="output-note small">{outputs.cartelStatus.note}</p>
                </>
              )}
            </div>
          </section>
        )}
        
        {/* Purity grades reference */}
        <section className="reference-section">
          <h3>Purity Grades Reference (Source-Derived)</h3>
          <table className="purity-table">
            <thead>
              <tr>
                <th>Grade</th>
                <th>Purity Range</th>
                <th>Value Modifier</th>
              </tr>
            </thead>
            <tbody>
              {PURITY_GRADES.map((grade) => (
                <tr key={grade.name}>
                  <td>{grade.name}</td>
                  <td>≥{grade.minPurity}%</td>
                  <td>{(grade.modifier * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        
        {/* Limitations */}
        {outputs.limitations.length > 0 && (
          <section className="limitations-section">
            <h4>⚠️ Calculator Limitations</h4>
            <ul>
              {outputs.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Sources */}
        <section className="sources-section">
          <h4>Sources</h4>
          <ul>
            {outputs.sourceRefs.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
