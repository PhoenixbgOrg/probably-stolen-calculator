import React, { useState } from 'react';
import {
  calculateDreamDust,
  calculatePurityUpgrade,
  type DreamDustInputs,
  type DreamDustOutputs,
  PURITY_GRADES,
} from '../calculators/dreamDust';

/**
 * Dream Dust production calculator UI
 * Supports the primary scenario: 42% → 45% purity with limited beginner budget
 */
export function ChemistCalculator() {
  // Input state
  const [dreamCapAmount, setDreamCapAmount] = useState(10); // grams
  const [alcoholAmount, setAlcoholAmount] = useState(50); // mL
  const [finisherModules, setFinisherModules] = useState(0);
  const [targetPurity, setTargetPurity] = useState(45); // percentage
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Calculate
  const inputs: DreamDustInputs = {
    dreamCapAmount,
    alcoholAmount,
    alcoholType: 'ethanol',
    blenderModules: 0,
    finisherModules,
    hasEvaporator: true,
    hasSpectrometer: false,
    targetPurity,
  };
  
  const outputs: DreamDustOutputs = calculateDreamDust(inputs);
  const upgrade = calculatePurityUpgrade(outputs.finalPurityPercent, finisherModules, targetPurity);
  
  return (
    <div className="calculator chemist-calculator">
      <div className="calculator-header">
        <h2>Dream Dust Production Calculator</h2>
        <p className="subtitle">
          Calculate optimal Dream Cap extraction and Chem Finisher purity
        </p>
        <p className="subtitle small">
          Based on verified mechanics from <a href="https://probably-stolen.org/chemistry/" target="_blank" rel="noopener noreferrer">probably-stolen.org/chemistry/</a>
        </p>
      </div>
      
      <div className="calculator-content">
        {/* INPUTS */}
        <section className="input-section">
          <h3>Materials & Equipment</h3>
          
          <div className="input-group">
            <label htmlFor="dreamCap">
              Dream Cap Amount (grams)
              <span className="help-text">Raw mushroom material to blend</span>
            </label>
            <input
              id="dreamCap"
              type="number"
              min="1"
              max="1000"
              value={dreamCapAmount}
              onChange={(e) => setDreamCapAmount(Number(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="alcohol">
              Alcohol Amount (mL)
              <span className="help-text">Optimal ratio is 5:1 alcohol to mush</span>
            </label>
            <input
              id="alcohol"
              type="number"
              min="1"
              max="5000"
              value={alcoholAmount}
              onChange={(e) => setAlcoholAmount(Number(e.target.value))}
            />
            {!outputs.isOptimalRatio && (
              <div className="alert warning">
                {outputs.ratioRecommendation}
              </div>
            )}
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
            <label htmlFor="targetPurity">
              Target Purity (%)
              <span className="help-text">Required for Cartel mission or personal goal</span>
            </label>
            <input
              id="targetPurity"
              type="number"
              min="0"
              max="100"
              value={targetPurity}
              onChange={(e) => setTargetPurity(Number(e.target.value))}
            />
          </div>
          
          <button
            className="toggle-advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} Advanced options
          </button>
          
          {showAdvanced && (
            <div className="advanced-section">
              <p className="info-text">
                Advanced options coming in future update (Blender modules, Spectrometer, mid-process resume)
              </p>
            </div>
          )}
        </section>
        
        {/* OUTPUTS */}
        <section className="output-section">
          <h3>Production Results</h3>
          
          {/* Step 1-2: Blending & Ratio */}
          <div className="output-group">
            <h4>1. Blending & Alcohol Ratio</h4>
            <div className="output-row">
              <span className="output-label">Blended volume:</span>
              <span className="output-value">
                {outputs.blendedVolume.toFixed(1)} mL mush
                <span className="badge estimated">ESTIMATED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Alcohol ratio:</span>
              <span className="output-value">
                {outputs.alcoholToMushRatio.toFixed(1)}:1
                {outputs.isOptimalRatio && <span className="badge verified">OPTIMAL</span>}
                {!outputs.isOptimalRatio && <span className="badge warning">SUBOPTIMAL</span>}
              </span>
            </div>
            <p className="output-note">
              {outputs.ratioRecommendation}
            </p>
          </div>
          
          {/* Step 3: Temperature */}
          <div className="output-group">
            <h4>2. Reaction Conditions</h4>
            <div className="output-row">
              <span className="output-label">Temperature range:</span>
              <span className="output-value">
                {outputs.temperatureRange}
                <span className="badge verified">VERIFIED</span>
              </span>
            </div>
            {outputs.temperatureWarning && (
              <div className="alert warning">
                ⚠️ {outputs.temperatureWarning}
              </div>
            )}
          </div>
          
          {/* Step 4: Extraction */}
          <div className="output-group">
            <h4>3. Extraction</h4>
            <div className="output-row">
              <span className="output-label">Dream Cap extract:</span>
              <span className="output-value">
                {outputs.extractedDreamCapML.toFixed(2)} mL
                <span className="badge estimated">ESTIMATED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Efficiency:</span>
              <span className="output-value">{outputs.extractionEfficiency.toFixed(1)}%</span>
            </div>
            <p className="output-note small">{outputs.extractionNote}</p>
          </div>
          
          {/* Step 5: Evaporation */}
          <div className="output-group">
            <h4>4. Evaporation</h4>
            <div className="output-row">
              <span className="output-label">Alcohol to remove:</span>
              <span className="output-value">{outputs.alcoholToRemove.toFixed(1)} mL</span>
            </div>
            <div className="output-row">
              <span className="output-label">Dry extract:</span>
              <span className="output-value">
                {outputs.remainingAfterEvap.toFixed(2)} mL
                <span className="badge verified">REQUIRED</span>
              </span>
            </div>
            <p className="output-note">Finisher requires dry batch (alcohol removed)</p>
          </div>
          
          {/* Step 6: Finisher contamination */}
          <div className="output-group">
            <h4>5. Chem Finisher</h4>
            <div className="output-row">
              <span className="output-label">Contamination:</span>
              <span className="output-value">
                {outputs.finisherContaminationPercent}% ({outputs.contaminationML.toFixed(2)} mL)
                <span className="badge verified">VERIFIED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Final batch volume:</span>
              <span className="output-value">{outputs.totalBatchVolume.toFixed(2)} mL</span>
            </div>
          </div>
          
          {/* Step 7: Final purity */}
          <div className="output-group highlight">
            <h4>6. Final Purity</h4>
            <div className="output-row">
              <span className="output-label">Purity:</span>
              <span className="output-value large">
                {outputs.finalPurityPercent.toFixed(2)}%
                <span className={`badge grade-${outputs.finalPurityGrade.toLowerCase().replace(/\s+/g, '-')}`}>
                  {outputs.finalPurityGrade}
                </span>
              </span>
            </div>
            {outputs.cartelMissionStatus && (
              <div className={`alert ${outputs.cartelMissionStatus.meetsRequirement ? 'success' : 'error'}`}>
                {outputs.cartelMissionStatus.meetsRequirement ? '✓' : '✗'} Target: {outputs.cartelMissionStatus.requiredPurity}%
                {outputs.cartelMissionStatus.meetsRequirement ? ' (MEETS REQUIREMENT)' : ' (DOES NOT MEET)'}
              </div>
            )}
          </div>
          
          {/* Step 8: Vials */}
          <div className="output-group">
            <h4>7. Vial Production</h4>
            <div className="output-row">
              <span className="output-label">Vials produced:</span>
              <span className="output-value large">
                {outputs.vialsProduced} vials
                <span className="badge verified">2 mL each</span>
              </span>
            </div>
            {outputs.leftoverML > 0 && (
              <div className="output-row">
                <span className="output-label">Leftover:</span>
                <span className="output-value">{outputs.leftoverML.toFixed(2)} mL</span>
              </div>
            )}
          </div>
          
          {/* Step 9: Value */}
          <div className="output-group">
            <h4>8. Estimated Value</h4>
            <div className="output-row">
              <span className="output-label">Base price:</span>
              <span className="output-value">{outputs.baseValuePerVial}₵ per vial</span>
            </div>
            <div className="output-row">
              <span className="output-label">Grade modifier:</span>
              <span className="output-value">
                {(outputs.gradeModifier * 100).toFixed(0)}%
                <span className="badge estimated">ESTIMATED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Value per vial:</span>
              <span className="output-value">{outputs.estimatedValuePerVial.toFixed(1)}₵</span>
            </div>
            <div className="output-row highlight">
              <span className="output-label">Total value:</span>
              <span className="output-value large">{outputs.totalEstimatedValue.toFixed(0)}₵</span>
            </div>
          </div>
          
          {/* Step 10: Recommendations */}
          {outputs.recommendations.length > 0 && (
            <div className="output-group recommendations">
              <h4>9. Recommendations</h4>
              <ul>
                {outputs.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Upgrade path */}
          {upgrade.needsUpgrade && (
            <div className="output-group upgrade-path">
              <h4>10. Upgrade Path (42% → 45% scenario)</h4>
              <div className="upgrade-card">
                <div className="output-row">
                  <span className="output-label">Current purity:</span>
                  <span className="output-value">{outputs.finalPurityPercent.toFixed(2)}%</span>
                </div>
                <div className="output-row">
                  <span className="output-label">Modules needed:</span>
                  <span className="output-value">{upgrade.modulesNeeded} (+{upgrade.modulesNeeded - finisherModules})</span>
                </div>
                <div className="output-row">
                  <span className="output-label">Estimated new purity:</span>
                  <span className="output-value">{upgrade.estimatedPurityWithUpgrade.toFixed(2)}%</span>
                </div>
                <div className="output-row">
                  <span className="output-label">Cost:</span>
                  <span className="output-value large">{upgrade.cost}₵</span>
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Purity grades reference */}
        <section className="reference-section">
          <h3>Purity Grades Reference</h3>
          <table className="purity-table">
            <thead>
              <tr>
                <th>Grade</th>
                <th>Min Purity</th>
                <th>Price Modifier</th>
              </tr>
            </thead>
            <tbody>
              {PURITY_GRADES.map((grade) => (
                <tr key={grade.name}>
                  <td>{grade.name}</td>
                  <td>{grade.minPurity}%</td>
                  <td>{(grade.modifier * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        
        {/* Cartel mission note */}
        {outputs.cartelMissionStatus && (
          <section className="disclaimer-section">
            <h4>Cartel Mission Note</h4>
            <p className="disclaimer">
              {outputs.cartelMissionStatus.note}
            </p>
            <p className="disclaimer">
              <strong>Manual mission inputs:</strong> Enter your current Cartel mission required purity in the "Target Purity" field.
              If actual game progression differs from displayed results, please provide source documentation.
            </p>
          </section>
        )}
        
        {/* Source limitations */}
        {outputs.limitations.length > 0 && (
          <section className="limitations-section">
            <h4>⚠️ Calculation Limitations</h4>
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
