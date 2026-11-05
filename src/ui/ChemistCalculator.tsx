import React, { useState } from 'react';
import {
  calculateDreamDustPerUpdate,
  dreamCapGramsToMushML,
  type DreamDustInputs,
  type DreamDustOutputs,
  PURITY_GRADES,
  DREAM_CAP_REFERENCE_WEIGHT_G,
  DREAM_CAP_REFERENCE_MUSH_ML,
} from '../calculators/dreamDust';

/**
 * Dream Dust production calculator UI
 * Shows PER-UPDATE extraction formulas from source
 * Requires Composition Spectrometer measurements for purity
 */
export function ChemistCalculator() {
  // Basic inputs
  const [dreamCapGrams, setDreamCapGrams] = useState(32.5); // reference weight
  const [alcoholML, setAlcoholML] = useState(136.7); // 5:1 ratio
  const [finisherModules, setFinisherModules] = useState(0);
  
  // Optional Spectrometer measurements
  const [hasSpectrometerData, setHasSpectrometerData] = useState(false);
  const [extractML, setExtractML] = useState<number | undefined>();
  const [totalML, setTotalML] = useState<number | undefined>();
  const [targetPurity, setTargetPurity] = useState<number | undefined>(45);
  
  // Calculate
  const inputs: DreamDustInputs = {
    dreamCapGrams,
    alcoholML,
    finisherModules,
    currentExtractML: hasSpectrometerData ? extractML : undefined,
    currentMixtureTotalML: hasSpectrometerData ? totalML : undefined,
    targetPurity: targetPurity,
  };
  
  const outputs: DreamDustOutputs = calculateDreamDustPerUpdate(inputs);
  
  return (
    <div className="calculator chemist-calculator">
      <div className="calculator-header">
        <h2>Dream Dust Per-Update Calculator</h2>
        <p className="subtitle">
          Source-derived extraction formulas (per heating-plate update, ~1 second)
        </p>
        <p className="subtitle small">
          Primary source: <a href="https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing" target="_blank" rel="noopener noreferrer">nicokobo.com wiki (retrieved via WebSearch 2026-11-05)</a>
        </p>
      </div>
      
      <div className="calculator-content">
        {/* CRITICAL NOTICE */}
        <section className="disclaimer-section">
          <h4>⚠️ Per-Update Calculation</h4>
          <p className="disclaimer">
            <strong>These are per-update values</strong> (~once per second while heated at ≥40°C). Actual extraction requires heating mush with alcohol over many updates until mush is depleted. This calculator shows the source-derived formula but cannot predict total production without heating duration.
          </p>
        </section>
        
        {/* INPUTS */}
        <section className="input-section">
          <h3>Materials</h3>
          
          <div className="input-group">
            <label htmlFor="dreamCap">
              Dream Cap Amount (grams)
              <span className="help-text">Reference: {DREAM_CAP_REFERENCE_WEIGHT_G}g = {DREAM_CAP_REFERENCE_MUSH_ML}mL mush (before blending loss)</span>
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
              Converts to: {outputs.dreamCapMushML.toFixed(3)} mL mush
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="alcohol">
              Alcohol Amount (mL)
              <span className="help-text">Optimal: 5:1 alcohol to mush (≥5:1 reaches 50% per-update cap)</span>
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
              {outputs.isOptimalRatio ? ' (OPTIMAL ≥5)' : ' (SUBOPTIMAL <5)'}
            </div>
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
        </section>
        
        {/* SPECTROMETER INPUTS */}
        <section className="input-section">
          <h3>Composition Spectrometer Measurements (Optional)</h3>
          <p className="info-text">
            For purity calculation, measure your finished mixture with the Composition Spectrometer
          </p>
          
          <div className="input-group">
            <label>
              <input
                type="checkbox"
                checked={hasSpectrometerData}
                onChange={(e) => setHasSpectrometerData(e.target.checked)}
              />
              {' '}I have Composition Spectrometer readings
            </label>
          </div>
          
          {hasSpectrometerData && (
            <>
              <div className="input-group">
                <label htmlFor="extractML">
                  Dream Cap Extract (mL)
                  <span className="help-text">Active ingredient volume from Spectrometer</span>
                </label>
                <input
                  id="extractML"
                  type="number"
                  min="0"
                  step="0.001"
                  value={extractML || ''}
                  onChange={(e) => setExtractML(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="totalML">
                  Total Mixture (mL)
                  <span className="help-text">Total volume from Spectrometer</span>
                </label>
                <input
                  id="totalML"
                  type="number"
                  min="0"
                  step="0.001"
                  value={totalML || ''}
                  onChange={(e) => setTotalML(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="targetPurity">
                  Target Purity (%)
                  <span className="help-text">Optional comparison target</span>
                </label>
                <input
                  id="targetPurity"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={targetPurity || ''}
                  onChange={(e) => setTargetPurity(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </>
          )}
        </section>
        
        {/* OUTPUTS */}
        <section className="output-section">
          <h3>Per-Update Extraction (Source-Derived Formula)</h3>
          
          <div className="output-group">
            <h4>Extraction Formula (Branch 4)</h4>
            <p className="output-note small">
              Source: "q=min(M,max(2000,round(0.1M)))" and "y=round(q×min(0.5,0.1A/M))"
            </p>
            <div className="output-row">
              <span className="output-label">Processed mush per update:</span>
              <span className="output-value">
                {outputs.perUpdateProcessedMushML.toFixed(3)} mL
                <span className="badge verified">SOURCE-DERIVED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Extract yield per update:</span>
              <span className="output-value">
                {outputs.perUpdateExtractYieldML.toFixed(3)} mL
                <span className="badge verified">SOURCE-DERIVED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Plant Matter per update:</span>
              <span className="output-value">
                {outputs.perUpdatePlantMatterML.toFixed(3)} mL
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Extraction efficiency:</span>
              <span className="output-value">
                {outputs.extractionEfficiency.toFixed(1)}%
                {outputs.atYieldCap && <span className="badge success">AT 50% CAP</span>}
              </span>
            </div>
          </div>
          
          <div className="output-group">
            <h4>Temperature Requirements</h4>
            <div className="output-row">
              <span className="output-label">Extraction starts at:</span>
              <span className="output-value">
                {outputs.extractionTempRange}
                <span className="badge verified">SOURCE-DERIVED</span>
              </span>
            </div>
            <div className="alert warning">
              ⚠️ Mush degrades: {outputs.degradationThresholds.mush}<br/>
              ⚠️ Extract degrades: {outputs.degradationThresholds.extract}
            </div>
          </div>
          
          <div className="output-group">
            <h4>Chem Finisher Requirements</h4>
            <div className="output-row">
              <span className="output-label">Sample size:</span>
              <span className="output-value">
                {outputs.finisherSampleSizeML} mL
                <span className="badge verified">SOURCE-DERIVED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Contamination:</span>
              <span className="output-value">
                {outputs.finisherContaminationPercent}% (with {finisherModules} modules)
                <span className="badge verified">SOURCE-DERIVED</span>
              </span>
            </div>
            <div className="output-row">
              <span className="output-label">Dry input required:</span>
              <span className="output-value">
                Evaporative components ≤0.1 mL
                <span className="badge verified">SOURCE-DERIVED</span>
              </span>
            </div>
          </div>
          
          {/* Purity (only if Spectrometer data provided) */}
          {outputs.calculatedPurity !== undefined && (
            <div className="output-group highlight">
              <h4>Measured Purity (from Spectrometer)</h4>
              <div className="output-row">
                <span className="output-label">Purity:</span>
                <span className="output-value large">
                  {outputs.calculatedPurity.toFixed(2)}%
                  <span className={`badge grade-${outputs.purityGrade?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {outputs.purityGrade}
                  </span>
                </span>
              </div>
              {targetPurity !== undefined && (
                <div className={`alert ${outputs.calculatedPurity >= targetPurity ? 'success' : 'error'}`}>
                  {outputs.calculatedPurity >= targetPurity ? '✓' : '✗'} Target: {targetPurity}%
                  {outputs.calculatedPurity >= targetPurity ? ' (MEETS TARGET)' : ' (BELOW TARGET)'}
                </div>
              )}
              <div className="output-row">
                <span className="output-label">Grade modifier:</span>
                <span className="output-value">
                  {((outputs.gradeModifier || 0) * 100).toFixed(0)}%
                  <span className="badge verified">SOURCE-DERIVED</span>
                </span>
              </div>
              <div className="output-row">
                <span className="output-label">Base value:</span>
                <span className="output-value">
                  {outputs.baseValuePerVial}₵ per vial
                  <span className="badge verified">SOURCE-DERIVED</span>
                </span>
              </div>
            </div>
          )}
          
          {/* Missing inputs warning */}
          {outputs.missingInputs.length > 0 && (
            <div className="output-group">
              <h4>⚠️ Missing Inputs</h4>
              <ul>
                {outputs.missingInputs.map((input, i) => (
                  <li key={i}>{input}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recommendations */}
          {outputs.recommendations.length > 0 && (
            <div className="output-group recommendations">
              <h4>Recommendations</h4>
              <ul>
                {outputs.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        
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
