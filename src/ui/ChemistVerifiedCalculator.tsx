import { useMemo, useState } from 'react';
import {
  COMPONENT_KEYS,
  DREAM_DUST_SAMPLE_UL,
  finishMeasuredComposition,
  simulateExtraction,
  solveMeasuredTarget,
  totalUL,
} from '../calculators/dreamDustVerified';
import { evaluateCartelDelivery, getCartelRequirement, getPurityGrade } from '../calculators/dreamDust';

const asUL = (ml: number) => Math.max(0, Math.trunc(ml * 1_000));
const asML = (ul: number) => (ul / 1_000).toFixed(3);

export function ChemistVerifiedCalculator() {
  const [dreamCapGrams, setDreamCapGrams] = useState(32.5);
  const [alcoholML, setAlcoholML] = useState(136.665);
  const [blenderModules, setBlenderModules] = useState(4);
  const [temperatureC, setTemperatureC] = useState(45);
  const [updates, setUpdates] = useState(30);
  const [measuredTotalML, setMeasuredTotalML] = useState(20);
  const [measuredActiveML, setMeasuredActiveML] = useState(8.4);
  const [measuredEvaporativeML, setMeasuredEvaporativeML] = useState(0);
  const [finisherModules, setFinisherModules] = useState(4);
  const [requestedVials, setRequestedVials] = useState(10);
  const [targetPurity, setTargetPurity] = useState(45);
  const [maxModulesOwned, setMaxModulesOwned] = useState(4);
  const [capacityVials, setCapacityVials] = useState(24);
  const [moduleQuote, setModuleQuote] = useState(250);
  const [budget, setBudget] = useState(500);
  const [finisherOwned, setFinisherOwned] = useState(true);
  const [cartelDay, setCartelDay] = useState(8);

  const extraction = useMemo(
    () =>
      simulateExtraction({
        dreamCapGrams,
        alcoholML,
        blenderModules,
        temperatureC,
        updates,
      }),
    [dreamCapGrams, alcoholML, blenderModules, temperatureC, updates],
  );

  const measured = {
    totalUL: asUL(measuredTotalML),
    activeUL: asUL(measuredActiveML),
    evaporativeUL: asUL(measuredEvaporativeML),
  };
  const finished = useMemo(
    () => finishMeasuredComposition(measured, finisherModules, requestedVials),
    [measuredTotalML, measuredActiveML, measuredEvaporativeML, finisherModules, requestedVials],
  );
  const reverse = useMemo(
    () =>
      solveMeasuredTarget({
        ...measured,
        targetPurity,
        targetVials: requestedVials,
        currentModules: finisherModules,
        maxModulesOwned,
        finisherOwned,
        finisherCapacityVials: capacityVials,
        quotedModuleCost: moduleQuote,
        availableBudget: budget,
      }),
    [
      measuredTotalML,
      measuredActiveML,
      measuredEvaporativeML,
      targetPurity,
      requestedVials,
      finisherModules,
      maxModulesOwned,
      finisherOwned,
      capacityVials,
      moduleQuote,
      budget,
    ],
  );
  const firstTick = extraction.ticks[0];
  const lastTick = extraction.ticks.at(-1);
  const cartelRequirement = getCartelRequirement(cartelDay);
  const cartelStatus = cartelRequirement && finished.success
    ? evaluateCartelDelivery(cartelRequirement, finished.vials.length, finished.meanPurity)
    : null;

  return (
    <div className="calculator chemist-calculator">
      <div className="calculator-header">
        <h2>Dream Dust Calculator</h2>
        <p className="subtitle">
          Source-supported extraction plus measured post-processing and exact per-vial finishing
        </p>
      </div>

      <section className="disclaimer-section">
        <h3>Prediction boundary</h3>
        <p>
          Extraction applies the documented component scale, Blender loss, reaction branches 1, 2,
          4, 9, 10 and boiling branch 22 in integer µL. Filtering and the overnight Evaporator do
          not have a complete sourced callback here, so final-product calculations require a
          Composition Spectrometer measurement after those stages.
        </p>
      </section>

      <section className="input-section">
        <h3>1. Extraction inputs</h3>
        <div className="input-group">
          <label htmlFor="cap-grams">Dream Cap weight (g)</label>
          <input id="cap-grams" type="number" min="0" step="0.1" value={dreamCapGrams} onChange={(event) => setDreamCapGrams(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="alcohol-ml">Alcohol added (mL)</label>
          <input id="alcohol-ml" type="number" min="0" step="0.001" value={alcoholML} onChange={(event) => setAlcoholML(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="blender-modules">Blender Chemical Equipment Modules (0–4)</label>
          <input id="blender-modules" type="number" min="0" max="4" step="1" value={blenderModules} onChange={(event) => setBlenderModules(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="heat-c">Heating temperature (°C)</label>
          <input id="heat-c" type="number" step="0.01" value={temperatureC} onChange={(event) => setTemperatureC(Number(event.target.value))} />
          <span className="help-text">Degradation is calculated at ≥50°C; alcohol boils only above 78.37°C.</span>
        </div>
        <div className="input-group">
          <label htmlFor="updates">Chemical updates (approximately once per second)</label>
          <input id="updates" type="number" min="0" max="10000" step="1" value={updates} onChange={(event) => setUpdates(Math.max(0, Math.trunc(Number(event.target.value))))} />
        </div>
      </section>

      <section className="output-section">
        <h3>Extraction result</h3>
        <div className="output-row"><span>Raw chemical volume</span><strong>{asML(totalUL(extraction.initialRaw))} mL</strong></div>
        <div className="output-row"><span>After Blender</span><strong>{asML(totalUL(extraction.initialAfterBlender))} mL</strong></div>
        <div className="output-row"><span>Initial mixture after alcohol</span><strong>{asML(totalUL(extraction.initialMixture))} mL</strong></div>
        <div className="output-row"><span>Updates run</span><strong>{extraction.ticks.length} ({extraction.stoppedBecause})</strong></div>
        <div className="output-row"><span>Extract after heating</span><strong>{asML(extraction.final.dreamCapExtract)} mL</strong></div>
        <div className="output-row"><span>Mush remaining</span><strong>{asML(extraction.final.dreamCapMush)} mL</strong></div>
        <div className="output-row"><span>Alcohol remaining</span><strong>{asML(extraction.final.alcohol)} mL</strong></div>
        <div className="output-row"><span>Water remaining</span><strong>{asML(extraction.final.water)} mL</strong></div>
        {firstTick && (
          <details>
            <summary>Intermediate updates</summary>
            <p>
              Update 1: q={firstTick.processedMushUL} µL, extract={firstTick.extractProducedUL} µL,
              plant matter={firstTick.plantMatterProducedUL} µL, degraded mush={firstTick.degradedMushUL} µL,
              degraded extract={firstTick.degradedExtractUL} µL.
            </p>
            {lastTick && lastTick.tick !== firstTick.tick && (
              <p>
                Update {lastTick.tick}: q={lastTick.processedMushUL} µL,
                extract={lastTick.extractProducedUL} µL, plant matter={lastTick.plantMatterProducedUL} µL,
                evaporated alcohol={lastTick.evaporatedAlcoholUL} µL.
              </p>
            )}
          </details>
        )}
        <details>
          <summary>All 10 tracked components</summary>
          <table className="purity-table">
            <tbody>
              {COMPONENT_KEYS.map((key) => (
                <tr key={key}><th>{key}</th><td>{extraction.final[key]} µL</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="input-section">
        <h3>2. Measured post-processing composition</h3>
        <p>
          Enter Spectrometer readings after any evaporation or filtration. These values replace
          unsupported guesses; they are not inferred from the extraction result.
        </p>
        <div className="input-group">
          <label htmlFor="measured-total">Measured total mixture (mL)</label>
          <input id="measured-total" type="number" min="0" step="0.001" value={measuredTotalML} onChange={(event) => setMeasuredTotalML(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="measured-active">Measured Dream Cap Extract (mL)</label>
          <input id="measured-active" type="number" min="0" step="0.001" value={measuredActiveML} onChange={(event) => setMeasuredActiveML(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="measured-evaporative">Measured total evaporatives (mL)</label>
          <input id="measured-evaporative" type="number" min="0" step="0.001" value={measuredEvaporativeML} onChange={(event) => setMeasuredEvaporativeML(Number(event.target.value))} />
          <span className="help-text">Finisher accepts exactly ≤0.100 mL (100 µL).</span>
        </div>
        <div className="input-group">
          <label htmlFor="finisher-modules">Installed Finisher modules (0–4)</label>
          <input id="finisher-modules" type="number" min="0" max="4" step="1" value={finisherModules} onChange={(event) => setFinisherModules(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="requested-vials">Vials to finish</label>
          <input id="requested-vials" type="number" min="1" step="1" value={requestedVials} onChange={(event) => setRequestedVials(Math.max(1, Math.trunc(Number(event.target.value))))} />
        </div>
      </section>

      <section className="output-section">
        <h3>Exact Finisher result</h3>
        {!finished.success ? (
          <div className="alert error">{finished.reason}</div>
        ) : (
          <>
            <div className="output-row"><span>2,000 µL samples produced</span><strong>{finished.vials.length}</strong></div>
            <div className="output-row"><span>Mean actual purity</span><strong>{finished.meanPurity.toFixed(2)}%</strong></div>
            <div className="output-row"><span>Grade</span><strong>{getPurityGrade(finished.meanPurity).name}</strong></div>
            {finished.vials[0] && (
              <p>
                First vial: sampled {finished.vials[0].sampleActiveUL} µL active; finisher replaced
                {' '}{finished.vials[0].physicalContaminantUL} µL total, including
                {' '}{finished.vials[0].replacedActiveUL} µL active; final active
                {' '}{finished.vials[0].finalActiveUL}/{DREAM_DUST_SAMPLE_UL} µL.
              </p>
            )}
          </>
        )}
      </section>

      <section className="input-section">
        <h3>Cartel progression</h3>
        <div className="input-group">
          <label htmlFor="cartel-day">Delivery day (8 + 7n)</label>
          <input id="cartel-day" type="number" min="8" step="7" value={cartelDay} onChange={(event) => setCartelDay(Math.trunc(Number(event.target.value)))} />
        </div>
        {cartelRequirement ? (
          <>
            <p>Day {cartelRequirement.day}: {cartelRequirement.quota} vials, required-purity reference {cartelRequirement.requiredPurity}%.</p>
            {cartelStatus && (
              <div className={`alert ${cartelStatus.isFatal ? 'error' : cartelStatus.meetsRequirement ? 'success' : 'warning'}`}>
                {cartelStatus.note}
              </div>
            )}
            {cartelDay > 50 && <p className="muted small">After Day 50, quota continues +5 per week while the purity reference remains capped at 70%.</p>}
          </>
        ) : <div className="alert warning">Not a scheduled delivery day.</div>}
      </section>

      <section className="input-section">
        <h3>3. Measured reverse planning</h3>
        <div className="input-group">
          <label htmlFor="target-purity">Target purity (%)</label>
          <input id="target-purity" type="number" min="0" max="100" step="0.01" value={targetPurity} onChange={(event) => setTargetPurity(Number(event.target.value))} />
        </div>
        <label><input type="checkbox" checked={finisherOwned} onChange={(event) => setFinisherOwned(event.target.checked)} /> Chem Finisher owned</label>
        <div className="input-group">
          <label htmlFor="max-modules">Maximum modules owned/available (0–4)</label>
          <input id="max-modules" type="number" min="0" max="4" step="1" value={maxModulesOwned} onChange={(event) => setMaxModulesOwned(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="capacity-vials">Output/equipment capacity (vials)</label>
          <input id="capacity-vials" type="number" min="0" step="1" value={capacityVials} onChange={(event) => setCapacityVials(Math.trunc(Number(event.target.value)))} />
        </div>
        <div className="input-group">
          <label htmlFor="module-quote">Quoted cost per additional module (user-provided Credits)</label>
          <input id="module-quote" type="number" min="0" step="1" value={moduleQuote} onChange={(event) => setModuleQuote(Number(event.target.value))} />
        </div>
        <div className="input-group">
          <label htmlFor="budget">Available upgrade budget (Credits)</label>
          <input id="budget" type="number" min="0" step="1" value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
        </div>
      </section>

      <section className="output-section">
        <h3>Reverse result: {reverse.status}</h3>
        {reverse.reasons.map((reason) => <div className="alert warning" key={reason}>{reason}</div>)}
        {reverse.options.map((option) => (
          <div className="output-group" key={option.modules}>
            <h4>{option.modules} module{option.modules === 1 ? '' : 's'}</h4>
            <p>
              {option.vialsAvailable} vial(s), {option.achievedMeanPurity.toFixed(2)}% mean purity;
              upgrade quote {option.quotedUpgradeCost ?? 'not supplied'} Credits.
            </p>
            {option.meetsTargetNow ? (
              <div className="alert success">Measured composition meets the target.</div>
            ) : (
              <p>
                Mathematical minimum pure-active addition:
                {' '}{option.minimumPureActiveAdditionUL === null ? 'not found in supported search' : `${option.minimumPureActiveAdditionUL} µL`}.
                Selective other-component removal:
                {' '}{option.minimumSelectiveOtherRemovalUL === null ? 'cannot preserve requested vial volume' : `${option.minimumSelectiveOtherRemovalUL} µL`}.
              </p>
            )}
            <p className="muted small">{option.note}</p>
          </div>
        ))}
        <p className="muted">{reverse.boundary}</p>
      </section>

      <section className="sources-section">
        <h3>Sources and version confidence</h3>
        <ul>
          <li><a href="https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing">Chemical processing</a> — current wiki formulas; page notes static-analysis provenance.</li>
          <li><a href="https://probably-stolen.nicokobo.com/en/items/chem_finisher">Chem Finisher</a> — exact 2 mL sample and proportional contamination replacement.</li>
          <li><a href="https://probably-stolen.nicokobo.com/en/items/blender">Blender</a> — component loss by module count.</li>
          <li>Measured mode is authoritative for the player’s current save when game-version behavior differs.</li>
        </ul>
      </section>
    </div>
  );
}
