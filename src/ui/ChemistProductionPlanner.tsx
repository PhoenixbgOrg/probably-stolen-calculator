import { useMemo, useState } from 'react';
import {
  COMPONENT_KEYS,
  type ComponentKey,
  type ComponentMixture,
  applyBlenderLoss,
  dreamCapRawComponents,
  finishMeasuredComposition,
  solveMeasuredTarget,
  totalUL,
} from '../calculators/dreamDustVerified';
import {
  SAFE_EXTRACTION_TEMPERATURE_C,
  SUPPORTED_GAME_VERSION,
  type ProductionPlannerInput,
  solveProductionPlan,
} from '../calculators/dreamDustPlanner';
import {
  evaluateCartelDelivery,
  getCartelRequirement,
  getPurityGrade,
} from '../calculators/dreamDust';

const ml = (ul: number) => (ul / 1_000).toFixed(3);
const ul = (value: number) => Math.max(0, Math.trunc(value * 1_000));
const componentLabel = (key: ComponentKey) =>
  key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 0.001,
  help,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}) {
  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {help && <span className="help-text">{help}</span>}
    </div>
  );
}

const defaultGround = applyBlenderLoss(dreamCapRawComponents(65), 4);

export function ChemistProductionPlanner() {
  const [targetPurity, setTargetPurity] = useState(45);
  const [targetVials, setTargetVials] = useState(15);
  const [materialState, setMaterialState] = useState<'raw' | 'ground'>('raw');
  const [rawGrams, setRawGrams] = useState(65);
  const [ground, setGround] = useState<ComponentMixture>(defaultGround);
  const [alcoholML, setAlcoholML] = useState(300);
  const [blenderOwned, setBlenderOwned] = useState(true);
  const [blenderModules, setBlenderModules] = useState(4);
  const [heatingPlateOwned, setHeatingPlateOwned] = useState(true);
  const [heatingModules, setHeatingModules] = useState(2);
  const [filterContainerOwned, setFilterContainerOwned] = useState(true);
  const [kottonDurability, setKottonDurability] = useState(1_000);
  const [waterFilterDurability, setWaterFilterDurability] = useState(400);
  const [evaporatorOwned, setEvaporatorOwned] = useState(true);
  const [evapPerformance, setEvapPerformance] = useState(0);
  const [evapEfficiency, setEvapEfficiency] = useState(0);
  const [evapQuality, setEvapQuality] = useState(0);
  const [solventRecovery, setSolventRecovery] = useState(false);
  const [distillateCapacityML, setDistillateCapacityML] = useState(0);
  const [energy, setEnergy] = useState(12);
  const [containerCapacityML, setContainerCapacityML] = useState(500);
  const [finisherOwned, setFinisherOwned] = useState(true);
  const [finisherModules, setFinisherModules] = useState(4);
  const [finisherCapacity, setFinisherCapacity] = useState(24);
  const [credits, setCredits] = useState(0);
  const [allowPurchases, setAllowPurchases] = useState(false);
  const [mushroomQuote, setMushroomQuote] = useState(0);
  const [alcoholQuote, setAlcoholQuote] = useState(0);
  const [cartelDay, setCartelDay] = useState(8);

  const makeInput = (): ProductionPlannerInput => ({
    targetPurity,
    targetVials: Math.max(1, Math.trunc(targetVials)),
    material:
      materialState === 'raw'
        ? {
            state: 'raw',
            availableGrams: Math.max(0, rawGrams),
            blenderOwned,
            blenderModules: Math.max(0, Math.trunc(blenderModules)),
          }
        : { state: 'ground', available: ground },
    alcoholAvailableUL: ul(alcoholML),
    heatingPlateOwned,
    heatingPlateModules: Math.max(0, Math.trunc(heatingModules)),
    filterContainerOwned,
    kottonDurability: Math.max(0, Math.trunc(kottonDurability)),
    waterFilterDurability: Math.max(0, Math.trunc(waterFilterDurability)),
    evaporatorOwned,
    evaporatorPerformancePercent: evapPerformance,
    evaporatorEfficiencyPercent: evapEfficiency,
    evaporatorQualityPercent: evapQuality,
    solventRecoveryModule: solventRecovery,
    distillateCapacityUL: ul(distillateCapacityML),
    availableEnergy: Math.max(0, Math.trunc(energy)),
    processingContainerCapacityUL: ul(containerCapacityML),
    finisherOwned,
    finisherModules: Math.max(0, Math.trunc(finisherModules)),
    finisherCapacityVials: Math.max(0, Math.trunc(finisherCapacity)),
    credits: Math.max(0, credits),
    allowPurchases,
    mushroomQuoteCreditsPerGram: allowPurchases ? Math.max(0, mushroomQuote) : undefined,
    alcoholQuoteCreditsPerML: allowPurchases ? Math.max(0, alcoholQuote) : undefined,
  });

  const [submitted, setSubmitted] = useState<ProductionPlannerInput>(makeInput);
  const result = useMemo(() => solveProductionPlan(submitted), [submitted]);
  const shown = result.candidate ?? result.bestPurityCandidate;
  const currentInput = makeInput();
  const isStale = JSON.stringify(currentInput) !== JSON.stringify(submitted);
  const cartelRequirement = getCartelRequirement(cartelDay);
  const cartelStatus =
    cartelRequirement && shown
      ? evaluateCartelDelivery(
          cartelRequirement,
          shown.finishing.vials.length,
          shown.finishing.meanPurity,
        )
      : null;

  const [measuredTotalML, setMeasuredTotalML] = useState(20);
  const [measuredActiveML, setMeasuredActiveML] = useState(8.4);
  const [measuredEvaporativeML, setMeasuredEvaporativeML] = useState(0);
  const measured = {
    totalUL: ul(measuredTotalML),
    activeUL: ul(measuredActiveML),
    evaporativeUL: ul(measuredEvaporativeML),
  };
  const measuredFinished = finishMeasuredComposition(measured, 4, 10);
  const measuredReverse = solveMeasuredTarget({
    ...measured,
    targetPurity: 45,
    targetVials: 10,
    currentModules: 4,
    maxModulesOwned: 4,
    finisherOwned: true,
    finisherCapacityVials: 10,
  });

  return (
    <div className="calculator chemist-calculator">
      <div className="calculator-header">
        <h2>Dream Dust Production Planner</h2>
        <p className="subtitle">
          Raw or already-ground Dream Cap → extraction → filtering → overnight evaporation → finished vials
        </p>
      </div>

      <section className="disclaimer-section">
        <h3>Verified scope</h3>
        <p>
          This planner implements the sourced subset for {SUPPORTED_GAME_VERSION}. It never assumes
          missing equipment or silently removes a component. A controlled plan requires a Heating
          Plate with at least 2 modules and a measured 40–49°C liquid temperature; the recommended
          44°C setting avoids documented degradation and boiling. This Dream Dust path accepts only
          the ten displayed components plus added Alcohol; unsupported chemicals/reactions are
          rejected rather than assumed harmless or silently removed.
        </p>
      </section>

      <section className="input-section">
        <h3>1. Target and available materials</h3>
        <NumberField id="planner-target-purity" label="Target finished purity (%)" value={targetPurity} onChange={setTargetPurity} max={100} step={0.01} />
        <NumberField id="planner-target-vials" label="Required Dream Dust vials" value={targetVials} onChange={(value) => setTargetVials(Math.trunc(value))} min={1} step={1} />
        <div className="input-group">
          <label htmlFor="material-state">Dream Cap processing state</label>
          <select id="material-state" value={materialState} onChange={(event) => setMaterialState(event.target.value as 'raw' | 'ground')}>
            <option value="raw">Raw mushroom — Blender loss applies</option>
            <option value="ground">Already-ground measured mixture — Blender bypassed</option>
          </select>
        </div>
        {materialState === 'raw' ? (
          <>
            <NumberField id="raw-grams" label="Raw Dream Cap available (g)" value={rawGrams} onChange={setRawGrams} step={0.1} />
            <label><input type="checkbox" checked={blenderOwned} onChange={(event) => setBlenderOwned(event.target.checked)} /> Blender owned</label>
            <NumberField id="blender-modules" label="Blender Chemical Equipment Modules (0–4)" value={blenderModules} onChange={(value) => setBlenderModules(Math.trunc(value))} max={4} step={1} />
          </>
        ) : (
          <details open>
            <summary>Measured already-ground component inventory</summary>
            <p className="muted small">Enter actual component volumes. No Blender loss is applied a second time.</p>
            <div className="input-group">
              <label>Quick-fill from raw Dream Cap (applies Blender loss once)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <NumberField
                  id="quick-raw-grams"
                  label="Raw grams"
                  value={rawGrams}
                  onChange={setRawGrams}
                  step={0.1}
                />
                <NumberField
                  id="quick-blender-modules"
                  label="Blender modules"
                  value={blenderModules}
                  onChange={(value) => setBlenderModules(Math.trunc(value))}
                  max={4}
                  step={1}
                />
                <button
                  type="button"
                  onClick={() => {
                    const raw = dreamCapRawComponents(rawGrams);
                    const blended = applyBlenderLoss(raw, Math.max(0, Math.trunc(blenderModules)));
                    setGround(blended);
                  }}
                >
                  Calculate ground from raw
                </button>
              </div>
            </div>
            {COMPONENT_KEYS.map((key) => (
              <NumberField
                key={key}
                id={`ground-${key}`}
                label={`${componentLabel(key)} (mL)`}
                value={ground[key] / 1_000}
                onChange={(value) => setGround((current) => ({ ...current, [key]: ul(value) }))}
              />
            ))}
          </details>
        )}
        <NumberField id="alcohol-available" label="Alcohol available (mL)" value={alcoholML} onChange={setAlcoholML} />
        <NumberField id="container-capacity" label="Processing container capacity (mL)" value={containerCapacityML} onChange={setContainerCapacityML} />
      </section>

      <section className="input-section">
        <h3>2. Owned equipment, modules and power</h3>
        <label><input type="checkbox" checked={heatingPlateOwned} onChange={(event) => setHeatingPlateOwned(event.target.checked)} /> Heating Plate owned</label>
        <NumberField id="heating-modules" label="Heating Plate Chemical Equipment Modules" value={heatingModules} onChange={(value) => setHeatingModules(Math.trunc(value))} max={4} step={1} help="The verified controlled-temperature workflow requires 2+." />
        <label><input type="checkbox" checked={filterContainerOwned} onChange={(event) => setFilterContainerOwned(event.target.checked)} /> Compatible filter container / Water Pitcher owned</label>
        <NumberField id="kotton-durability" label="Kotton Fabric durability available" value={kottonDurability} onChange={(value) => setKottonDurability(Math.trunc(value))} step={1} />
        <NumberField id="water-filter-durability" label="Water Filter durability available" value={waterFilterDurability} onChange={(value) => setWaterFilterDurability(Math.trunc(value))} step={1} />
        <label><input type="checkbox" checked={evaporatorOwned} onChange={(event) => setEvaporatorOwned(event.target.checked)} /> Evaporator owned</label>
        <NumberField id="evap-performance" label="Evaporator Performance bonus (%)" value={evapPerformance} onChange={setEvapPerformance} min={-500} step={1} />
        <NumberField id="evap-efficiency" label="Evaporator Efficiency bonus (%)" value={evapEfficiency} onChange={setEvapEfficiency} min={-500} step={1} />
        <NumberField id="evap-quality" label="Evaporator Quality bonus (%)" value={evapQuality} onChange={setEvapQuality} min={-500} step={1} help="Quality affects vapor recovery, not removal from the ingredient." />
        <label><input type="checkbox" checked={solventRecovery} onChange={(event) => setSolventRecovery(event.target.checked)} /> Evaporator Solvent Recovery Module installed</label>
        <NumberField id="distillate-capacity" label="Empty distillate receiver capacity (mL)" value={distillateCapacityML} onChange={setDistillateCapacityML} />
        <NumberField id="energy-available" label="Energy available for overnight cycles (kJ)" value={energy} onChange={(value) => setEnergy(Math.trunc(value))} step={1} />
        <label><input type="checkbox" checked={finisherOwned} onChange={(event) => setFinisherOwned(event.target.checked)} /> Chem Finisher owned</label>
        <NumberField id="finisher-modules" label="Finisher Chemical Equipment Modules (0–4)" value={finisherModules} onChange={(value) => setFinisherModules(Math.trunc(value))} max={4} step={1} />
        <NumberField id="finisher-capacity" label="Safe output capacity (vials)" value={finisherCapacity} onChange={(value) => setFinisherCapacity(Math.trunc(value))} step={1} help="The engine will not assume overflow is safely stored." />
      </section>

      <section className="input-section">
        <h3>3. Optional user-quoted purchases</h3>
        <NumberField id="credits-available" label="Credits available" value={credits} onChange={setCredits} step={1} />
        <label><input type="checkbox" checked={allowPurchases} onChange={(event) => setAllowPurchases(event.target.checked)} /> Allow purchases using my quotes</label>
        {allowPurchases && (
          <>
            <NumberField id="mushroom-quote" label="My quoted Dream Cap cost (Credits/g)" value={mushroomQuote} onChange={setMushroomQuote} step={0.01} />
            <NumberField id="alcohol-quote" label="My quoted Alcohol cost (Credits/mL)" value={alcoholQuote} onChange={setAlcoholQuote} step={0.01} />
            <p className="muted small">These are user-provided quote costs, not wiki or guaranteed shop prices.</p>
          </>
        )}
        <button className="primary-button" type="button" onClick={() => setSubmitted(makeInput())}>
          Calculate production plan
        </button>
      </section>

      <section className="output-section" aria-live="polite">
        <h3>Production result: {result.status}</h3>
        {isStale && (
          <div className="alert warning">
            ⚠️ Inputs changed. Press <strong>Calculate production plan</strong> to update results.
          </div>
        )}
        {result.reasons.map((reason) => <div className="alert warning" key={reason}>{reason}</div>)}
        <p>{result.searchSummary}</p>
        {shown && (
          <>
            <div className={`alert ${result.status === 'feasible' ? 'success' : 'warning'}`}>
              {shown.finishing.vials.length} / {submitted.targetVials} requested vials at{' '}
              {shown.finishing.meanPurity.toFixed(2)}% mean purity
              {result.status === 'feasible' ? ' — target met.' : ' — target not met in the supported search.'}
            </div>
            <h4>Recommended production plan</h4>
            <ol>
              <li>
                <strong>Prepare:</strong>{' '}
                {submitted.material.state === 'raw'
                  ? `blend ${shown.rawGramsUsed.toFixed(1)} g raw Dream Cap with ${submitted.material.blenderModules} module(s); ${ml(totalUL(shown.blenderLoss))} mL documented Blender loss.`
                  : `transfer ${ml(shown.groundULUsed)} mL of the entered already-ground mixture; Blender bypassed.`}
              </li>
              <li>
                <strong>Mix:</strong> add {ml(shown.alcoholUsedUL)} mL Alcohol. Initial batch{' '}
                {ml(totalUL(shown.extraction.initialMixture))} mL / {ml(submitted.processingContainerCapacityUL)} mL capacity.
              </li>
              <li>
                <strong>Extract:</strong> set the plate to {SAFE_EXTRACTION_TEMPERATURE_C}°C, verify the
                liquid is within 40–49°C, and hold for {shown.extraction.ticks.length} successful
                chemical updates until 0.000 mL mush remains. Extract produced:{' '}
                {ml(shown.extraction.final.dreamCapExtract)} mL; documented reaction loss{' '}
                {ml(totalUL(shown.extractionLoss))} mL.
              </li>
              <li>
                <strong>Filter:</strong>{' '}
                {shown.filtration.passes.length
                  ? shown.filtration.passes.map((pass) =>
                      `${pass.name} ${pass.startingDurability}→${pass.remainingDurability}`,
                    ).join('; ')
                  : 'no owned filter applied'}
                . Removed {ml(totalUL(shown.filtration.removed))} mL; active and Protein (particle size 5) pass these filters.
              </li>
              <li>
                <strong>Evaporate:</strong> run {shown.evaporation.cycles.length} overnight cycle(s),
                using {shown.evaporation.energyUsed} kJ. Removed {ml(totalUL(shown.evaporation.removed))} mL
                Water/Alcohol; recovered {ml(totalUL(shown.evaporation.recovered))} mL and lost{' '}
                {ml(totalUL(shown.evaporation.lost))} mL. Final evaporatives:{' '}
                {ml(shown.evaporation.output.water + shown.evaporation.output.alcohol)} mL.
              </li>
              <li>
                <strong>Finish:</strong> press Output {shown.finishing.vials.length} time(s). Each vial
                samples exactly 2.000 mL; {submitted.finisherModules} module(s) replace{' '}
                {shown.finishing.vials[0] ? ml(totalUL(shown.finishing.vials[0].replaced)) : '0.000'} mL
                per vial with Physical Contaminant.
              </li>
            </ol>

            <h4>Final result and resources</h4>
            <div className="output-row"><span>Expected mean purity</span><strong>{shown.finishing.meanPurity.toFixed(2)}%</strong></div>
            <div className="output-row"><span>Purity grade</span><strong>{getPurityGrade(shown.finishing.meanPurity).name}</strong></div>
            <div className="output-row"><span>Finished vials</span><strong>{shown.finishing.vials.length}</strong></div>
            <div className="output-row"><span>User-quoted purchases</span><strong>{shown.purchaseCost.toFixed(2)} Credits</strong></div>
            <div className="output-row"><span>Raw Dream Cap remaining</span><strong>{submitted.material.state === 'raw' ? `${Math.max(0, submitted.material.availableGrams - shown.rawGramsUsed).toFixed(1)} g` : 'not applicable'}</strong></div>
            <div className="output-row"><span>Owned Alcohol remaining</span><strong>{ml(Math.max(0, submitted.alcoholAvailableUL - shown.alcoholUsedUL))} mL</strong></div>
            <div className="output-row"><span>Total documented loss/waste</span><strong>{ml(totalUL(shown.waste))} mL</strong></div>
            <div className="output-row"><span>Dried mixture left after requested vials</span><strong>{ml(totalUL(shown.finishing.remaining))} mL</strong></div>

            <details>
              <summary>Complete 10-component accounting</summary>
              <table className="purity-table">
                <thead>
                  <tr><th>Component</th><th>After extraction</th><th>After filters</th><th>Before Finisher</th><th>Waste/loss</th></tr>
                </thead>
                <tbody>
                  {COMPONENT_KEYS.map((key) => (
                    <tr key={key}>
                      <th>{componentLabel(key)}</th>
                      <td>{shown.extraction.final[key]} µL</td>
                      <td>{shown.filtration.output[key]} µL</td>
                      <td>{shown.finalMixtureBeforeFinishing[key]} µL</td>
                      <td>{shown.waste[key]} µL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <details>
              <summary>Extraction update evidence</summary>
              {shown.extraction.ticks[0] && (
                <p>Update 1: processed {shown.extraction.ticks[0].processedMushUL} µL,
                  produced {shown.extraction.ticks[0].extractProducedUL} µL extract and{' '}
                  {shown.extraction.ticks[0].plantMatterProducedUL} µL plant matter.</p>
              )}
              {shown.extraction.ticks.at(-1) && (
                <p>Final update {shown.extraction.ticks.at(-1)!.tick}: processed{' '}
                  {shown.extraction.ticks.at(-1)!.processedMushUL} µL; remaining mush{' '}
                  {shown.extraction.final.dreamCapMush} µL.</p>
              )}
            </details>
          </>
        )}
        <p className="muted small">{result.boundary}</p>
      </section>

      <section className="input-section">
        <h3>Cartel delivery check</h3>
        <NumberField id="planner-cartel-day" label="Delivery day (8 + 7n)" value={cartelDay} onChange={(value) => setCartelDay(Math.trunc(value))} min={8} step={7} />
        {cartelRequirement && shown ? (
          <>
            <p>Day {cartelRequirement.day}: {cartelRequirement.quota} vials at the {cartelRequirement.requiredPurity}% purity reference.</p>
            {cartelStatus && <div className={`alert ${cartelStatus.meetsRequirement ? 'success' : 'warning'}`}>{cartelStatus.note}</div>}
            {cartelDay > 50 && <p className="muted small">After Day 50, quota continues +5 vials per week while the purity reference remains capped at 70%.</p>}
          </>
        ) : <div className="alert warning">Choose a scheduled delivery day and calculate a plan.</div>}
      </section>

      <details className="input-section">
        <summary><strong>Measured recovery mode — including the reported 42% → 45% case</strong></summary>
        <p>This secondary mode is for an already-processed batch measured by a Composition Spectrometer; it is not the primary recipe workflow.</p>
        <NumberField id="measured-total" label="Measured total (mL)" value={measuredTotalML} onChange={setMeasuredTotalML} />
        <NumberField id="measured-active" label="Measured Dream Cap Extract (mL)" value={measuredActiveML} onChange={setMeasuredActiveML} />
        <NumberField id="measured-evaporative" label="Measured evaporatives (mL)" value={measuredEvaporativeML} onChange={setMeasuredEvaporativeML} />
        <p>
          With 4 Finisher modules and ten 2.000 mL samples: {measuredFinished.meanPurity.toFixed(2)}%.
          To reach 45% while retaining ten vials, the mathematical minimum is{' '}
          {measuredReverse.options[0]?.minimumPureActiveAdditionUL ?? 'not found'} µL pure active addition.
          This is a composition requirement, not a fabricated in-game recipe; remeasure after a real supported process.
        </p>
      </details>

      <section className="sources-section">
        <h3>Sources and version confidence</h3>
        <ul>
          <li><a href="https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing">Chemical processing</a> — component registry, extraction, degradation and boiling.</li>
          <li><a href="https://probably-stolen.nicokobo.com/en/items/blender">Blender</a> — component loss and rounding.</li>
          <li><a href="https://probably-stolen.nicokobo.com/en/items/heating_plate">Heating Plate</a> — settings, update cadence and module controls.</li>
          <li><a href="https://probably-stolen.nicokobo.com/en/items/water_filter">Water Filter</a> and <a href="https://probably-stolen.nicokobo.com/en/items/kotton_fabric">Kotton Fabric</a> — pore sizes, durability steps and residue floors.</li>
          <li><a href="https://probably-stolen.nicokobo.com/en/items/evaporator">Evaporator</a> — overnight allowance, proportional removal, recovery, power and dryness.</li>
          <li><a href="https://probably-stolen.nicokobo.com/en/items/chem_finisher">Chem Finisher</a> — exact 2 mL sampling and proportional replacement contamination.</li>
        </ul>
        <p className="muted small">
          Sources report static checks against extracted game code/text for {SUPPORTED_GAME_VERSION}.
          Runtime Heating Plate callback order is unverified, so the recipe requires observing actual liquid temperature.
        </p>
      </section>
    </div>
  );
}
