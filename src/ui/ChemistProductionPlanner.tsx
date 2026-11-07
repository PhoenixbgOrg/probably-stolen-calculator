import { useEffect, useMemo, useState } from 'react';
import {
  COMPONENT_KEYS,
  type ComponentKey,
  type ComponentMixture,
  emptyMixture,
  totalUL,
  volumeSumDriftUL,
} from '../calculators/dreamDustVerified';
import {
  STAGE_LABELS,
  WIZARD_STAGES,
  type ChemistWizardState,
  type WizardStageId,
  applyGroundChange,
  canEnterStage,
  defaultWizardState,
  predictAcidBase,
  predictFilterEvap,
  predictFinish,
  readingFromMixture,
  runForward,
} from '../calculators/chemistWizard';
import { estimatedMushAndOther, PREVIOUS_BATCH_FRACTION_NOTE, PREVIOUS_BATCH_MUSH_FRACTION } from '../calculators/dreamDustEstimates';
import { SAFE_EXTRACTION_TEMPERATURE_C } from '../calculators/dreamDustPlanner';
import { CITATIONS, UNKNOWN_LIMITS } from '../calculators/sourceCitations';
import { iconManifestSummary } from '../data/iconManifest';
import { loadChemistSession, saveChemistSession } from '../persistence/chemistSession';
import { ChemistTargetCompare } from './ChemistTargetCompare';

const ml = (ul: number) => (ul / 1_000).toFixed(3);
const toUL = (value: number) => Math.max(0, Math.round(value * 1_000));
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

function EvidenceBadge({ status }: { status: string }) {
  const label =
    status === 'verified-measurement'
      ? 'Verified by measurement'
      : status === 'predicted-by-model'
        ? 'Predicted by model'
        : status === 'unsupported'
          ? 'Unsupported'
          : 'Unknown / needs measurement';
  const cls =
    status === 'verified-measurement'
      ? 'verified'
      : status === 'predicted-by-model'
        ? 'calculated'
        : status === 'unsupported'
          ? 'warning'
          : 'estimated';
  return <span className={`badge ${cls}`}>{label}</span>;
}

function MixtureFields({
  idPrefix,
  mixture,
  onChange,
  highlight,
}: {
  idPrefix: string;
  mixture: ComponentMixture;
  onChange: (mixture: ComponentMixture) => void;
  highlight?: ComponentKey[];
}) {
  const keys = highlight ?? COMPONENT_KEYS;
  return (
    <>
      {keys.map((key) => (
        <NumberField
          key={key}
          id={`${idPrefix}-${key}`}
          label={`${componentLabel(key)} (mL)`}
          value={mixture[key] / 1_000}
          onChange={(value) => onChange({ ...mixture, [key]: toUL(value) })}
        />
      ))}
    </>
  );
}

export function ChemistProductionPlanner() {
  const [state, setState] = useState<ChemistWizardState>(defaultWizardState);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [showForward, setShowForward] = useState(false);
  const icons = iconManifestSummary();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loaded = loadChemistSession(window.localStorage);
    setState(loaded.state);
    setSessionNotice(loaded.notice);
    if (loaded.state.savedAt) setShowForward(true);
  }, []);

  const patchGround = (patch: Partial<ChemistWizardState>) => {
    setShowForward(false);
    setState((current) => applyGroundChange(current, patch));
  };

  const forward = useMemo(() => runForward(state), [state]);
  const acidBase = useMemo(() => predictAcidBase(state), [state]);
  const filterEvap = useMemo(() => predictFilterEvap(state), [state]);
  const finish = useMemo(() => predictFinish(state), [state]);
  const drift = volumeSumDriftUL(state.groundTotalUL, state.ground);

  const go = (stage: WizardStageId) => {
    if (!canEnterStage(state, stage) && stage !== 'ground') return;
    setState((current) => ({ ...current, currentStage: stage }));
  };

  const save = () => {
    if (typeof window === 'undefined') return;
    const next = saveChemistSession(window.localStorage, state);
    setState(next);
  };

  const fill164 = () => {
    const ground = emptyMixture();
    ground.dreamCapMush = 110_370;
    ground.water = 21_070;
    ground.protein = 10_540;
    ground.microbes = 10_540;
    ground.physicalContaminant = 9_170;
    ground.mineral = 2_290;
    patchGround({
      compositionMode: 'measured',
      compositionNote: 'Owner-measured 164 mL-class batch. Spectrometer row sum 163.980 mL vs declared 164 mL.',
      groundTotalUL: 164_000,
      ground,
      solventMode: 'pure',
      solventLiquidUL: 552_000,
      solventAlcoholUL: 552_000,
      solventWaterUL: 0,
      solventOtherUL: 0,
      vesselCapacityUL: 2_000_000,
    });
    setShowForward(true);
  };

  const fill750 = () => {
    patchGround({
      compositionMode: 'estimated',
      compositionNote: PREVIOUS_BATCH_FRACTION_NOTE,
      groundTotalUL: 476_000,
      ground: estimatedMushAndOther(476_000, PREVIOUS_BATCH_MUSH_FRACTION),
      solventMode: 'pure',
      solventLiquidUL: 750_000,
      solventAlcoholUL: 750_000,
      solventWaterUL: 0,
      solventOtherUL: 0,
      vesselCapacityUL: 2_000_000,
    });
    setShowForward(true);
  };

  const setPureLiquid = (mlValue: number) => {
    const liquidUL = toUL(mlValue);
    patchGround({
      solventMode: 'pure',
      solventLiquidUL: liquidUL,
      solventAlcoholUL: liquidUL,
      solventWaterUL: 0,
      solventOtherUL: 0,
    });
  };

  return (
    <div className="calculator chemist-calculator">
      <div className="calculator-header">
        <h2>Dream Dust Production Planner</h2>
        <p className="subtitle">What do you have? Plan forward from ground mixture and alcohol — vial targets are optional.</p>
      </div>

      {sessionNotice && <div className="alert warning">{sessionNotice}</div>}

      <ol className="steps wizard-steps" aria-label="Production stages">
        {WIZARD_STAGES.map((stage) => (
          <li key={stage}>
            <button
              type="button"
              className={state.currentStage === stage ? 'active' : ''}
              onClick={() => go(stage)}
            >
              {STAGE_LABELS[stage]}
            </button>
          </li>
        ))}
      </ol>

      {state.currentStage === 'ground' && (
        <section className="input-section">
          <h3>Ground Dream Caps and solvent</h3>
          <NumberField
            id="ground-total"
            label="Ground mixture (mL)"
            value={state.groundTotalUL / 1_000}
            onChange={(value) => patchGround({ groundTotalUL: toUL(value) })}
            help="Total volume of the already-ground pile. This is not automatically pure Dream Cap Mush."
          />
          <div className="input-group">
            <label>Composition</label>
            <label>
              <input
                type="radio"
                name="composition-mode"
                checked={state.compositionMode === 'measured'}
                onChange={() => patchGround({ compositionMode: 'measured', compositionNote: '' })}
              />{' '}
              Measured
            </label>
            <label>
              <input
                type="radio"
                name="composition-mode"
                checked={state.compositionMode === 'estimated'}
                onChange={() =>
                  patchGround({
                    compositionMode: 'estimated',
                    compositionNote: PREVIOUS_BATCH_FRACTION_NOTE,
                  })
                }
              />{' '}
              Estimated
            </label>
            {state.compositionMode === 'estimated' && (
              <p className="help-text">{state.compositionNote || PREVIOUS_BATCH_FRACTION_NOTE}</p>
            )}
          </div>
          <NumberField
            id="ground-mush"
            label="Dream Cap Mush in mixture (mL)"
            value={state.ground.dreamCapMush / 1_000}
            onChange={(value) => patchGround({ ground: { ...state.ground, dreamCapMush: toUL(value) } })}
          />
          {state.compositionMode === 'estimated' && (
            <button
              type="button"
              onClick={() =>
                patchGround({
                  ground: estimatedMushAndOther(state.groundTotalUL, PREVIOUS_BATCH_MUSH_FRACTION),
                  compositionNote: PREVIOUS_BATCH_FRACTION_NOTE,
                })
              }
            >
              Apply 67.30% Mush, remainder Other
            </button>
          )}
          <details>
            <summary>Other components</summary>
            <p className="muted small">Unmeasured remainder belongs in Other, not in invented Water/Protein values.</p>
            <MixtureFields
              idPrefix="ground-extra"
              mixture={state.ground}
              onChange={(ground) => patchGround({ ground })}
              highlight={COMPONENT_KEYS.filter((key) => key !== 'dreamCapMush')}
            />
          </details>
          {drift !== 0 && state.groundTotalUL > 0 && totalUL(state.ground) > 0 && (
            <div className="alert warning">
              Component sum {ml(totalUL(state.ground))} mL differs from declared total {ml(state.groundTotalUL)} mL by {ml(drift)} mL. Not normalized.
            </div>
          )}

          <h4>Alcohol / solvent</h4>
          <NumberField
            id="solvent-liquid"
            label="Alcohol-containing liquid (mL)"
            value={state.solventLiquidUL / 1_000}
            onChange={(value) =>
              state.solventMode === 'pure' ? setPureLiquid(value) : patchGround({ solventLiquidUL: toUL(value) })
            }
          />
          <div className="input-group">
            <label>Purity</label>
            <label>
              <input
                type="radio"
                name="solvent-mode"
                checked={state.solventMode === 'pure'}
                onChange={() => setPureLiquid(state.solventLiquidUL / 1_000)}
              />{' '}
              Pure Alcohol
            </label>
            <label>
              <input
                type="radio"
                name="solvent-mode"
                checked={state.solventMode === 'mixed'}
                onChange={() => patchGround({ solventMode: 'mixed' })}
              />{' '}
              Mixed / Measured
            </label>
          </div>
          {state.solventMode === 'mixed' && (
            <>
              <NumberField id="solvent-alcohol" label="Alcohol component (mL)" value={state.solventAlcoholUL / 1_000} onChange={(value) => patchGround({ solventAlcoholUL: toUL(value) })} />
              <NumberField id="solvent-water" label="Water component (mL)" value={state.solventWaterUL / 1_000} onChange={(value) => patchGround({ solventWaterUL: toUL(value) })} />
              <NumberField id="solvent-other" label="Other solvent components (mL)" value={state.solventOtherUL / 1_000} onChange={(value) => patchGround({ solventOtherUL: toUL(value) })} />
            </>
          )}
          <NumberField id="vessel-capacity" label="Vessel capacity (mL)" value={state.vesselCapacityUL / 1_000} onChange={(value) => patchGround({ vesselCapacityUL: toUL(value) })} />

          <div className="btn-row">
            <button className="primary" type="button" onClick={() => setShowForward(true)}>
              Calculate from my materials
            </button>
            <button type="button" onClick={save}>Save progress</button>
            <button type="button" onClick={fill750}>Example 750 + 476</button>
            <button type="button" onClick={fill164}>Example 164 + 552</button>
          </div>
        </section>
      )}

      {showForward && state.currentStage === 'ground' && (
        <section className="output-section">
          <h3>From your materials <EvidenceBadge status={forward.evidence} /></h3>
          {forward.reasons.map((reason) => (
            <div className="alert error" key={reason}>{reason}</div>
          ))}
          {forward.warnings.map((warning) => (
            <div className="alert warning" key={warning}>{warning}</div>
          ))}
          {forward.status === 'ok' && (
            <>
              <div className="output-row"><span>Available actual Dream Cap Mush</span><strong>{ml(forward.availableMushUL)} mL</strong></div>
              <div className="output-row"><span>Alcohol component</span><strong>{ml(forward.alcoholComponentUL)} mL</strong></div>
              <div className="output-row"><span>Alcohol / Mush ratio</span><strong>{forward.alcoholToMushRatio === null ? 'n/a' : forward.alcoholToMushRatio.toFixed(2)}</strong></div>
              <div className="output-row"><span>Recommended ground mix to use</span><strong>{ml(forward.recommendedGroundUL)} mL</strong></div>
              <div className="output-row"><span>Actual Mush in that mix</span><strong>{ml(forward.recommendedMushUL)} mL</strong></div>
              <div className="output-row"><span>Unused ground mixture</span><strong>{ml(forward.unusedGroundUL)} mL</strong></div>
              <div className="output-row"><span>Initial vessel volume</span><strong>{ml(forward.initialVesselUL)} mL / {ml(state.vesselCapacityUL)} mL</strong></div>
              <div className="output-row"><span>Theoretical extract ceiling (50% of selected Mush)</span><strong>{ml(forward.theoreticalExtractCeilingUL)} mL</strong></div>
              {forward.predictedExtraction && (
                <div className="output-row">
                  <span>Model extract at {SAFE_EXTRACTION_TEMPERATURE_C}°C until Mush=0</span>
                  <strong>{ml(forward.predictedExtraction.final.dreamCapExtract)} mL</strong>
                </div>
              )}
              <p className="muted small">{forward.boundary}</p>
              <p className="muted small">Exact vial count and grade depend on protein treatment, filters, evaporation, finisher modules and final spectrometer readings. This is not a guaranteed 38-vial yield.</p>
              <button className="primary" type="button" onClick={() => go('extraction')}>Continue to extraction</button>
            </>
          )}
        </section>
      )}

      {state.currentStage === 'extraction' && (
        <section className="input-section">
          <h3>Extraction</h3>
          <p>Hold the liquid in the sourced 40–49°C band. Recommended plate setting {SAFE_EXTRACTION_TEMPERATURE_C}°C with 2+ modules. Watch the real temperature, not only the knob. Stop when Dream Cap Mush reads 0.</p>
          <NumberField id="heat-modules" label="Heating Plate modules" value={state.heatingPlateModules} onChange={(value) => setState({ ...state, heatingPlateModules: Math.trunc(value) })} max={4} step={1} />
          <NumberField id="observed-temp" label="Observed liquid temperature (°C), optional" value={state.observedTemperatureC ?? 0} onChange={(value) => setState({ ...state, observedTemperatureC: value })} />
          {forward.predictedExtraction && (
            <div className="alert info">
              Model prediction (not a guarantee): {ml(forward.predictedExtraction.final.dreamCapExtract)} mL extract after {forward.predictedExtraction.ticks.length} updates.
            </div>
          )}
          <details open>
            <summary>What did the Spectrometer show after extraction?</summary>
            <MixtureFields
              idPrefix="extract-read"
              mixture={state.afterExtraction?.mixture ?? forward.predictedExtraction?.final ?? emptyMixture()}
              onChange={(mixture) => setState({ ...state, afterExtraction: readingFromMixture(mixture, 'Post-extraction spectrometer reading') })}
            />
          </details>
          <div className="btn-row">
            <button type="button" onClick={() => go('ground')}>Back</button>
            <button type="button" onClick={save}>Save progress</button>
            <button className="primary" type="button" onClick={() => go('acidBase')}>Continue</button>
          </div>
        </section>
      )}

      {state.currentStage === 'acidBase' && (
        <section className="input-section">
          <h3>Acid / Base (protein)</h3>
          <p>Wiki branch 16 is stepwise and uses Acid/Base imbalance. It is not “add Acid equal to Protein”. Branch 18 then neutralizes Acid and Base together. Measure reagents; bottle labels are not proof.</p>
          {acidBase.before.mixture.protein > 0 ? (
            <div className="alert warning">Protein {ml(acidBase.before.mixture.protein)} mL is a purity risk until precipitated and filtered.</div>
          ) : (
            <div className="alert success">No Protein in the current snapshot. Acid/Base is optional.</div>
          )}
          <h4>Acidic Solution inventory (measured)</h4>
          <MixtureFields idPrefix="acid-reag" mixture={state.acidReagent} onChange={(acidReagent) => setState({ ...state, acidReagent })} highlight={['acid', 'water', 'chemicalContaminant', 'heavyMetal', 'other']} />
          <h4>Basic Solution inventory (measured)</h4>
          <MixtureFields idPrefix="base-reag" mixture={state.baseReagent} onChange={(baseReagent) => setState({ ...state, baseReagent })} highlight={['base', 'water', 'chemicalContaminant', 'heavyMetal', 'other']} />
          <div className="output-row"><span>Predicted Protein after sourced ticks</span><strong>{ml(acidBase.treatment.final.protein)} mL</strong></div>
          <div className="output-row"><span>Predicted Insoluble Debris</span><strong>{ml(acidBase.treatment.final.insolubleDebris)} mL</strong></div>
          {acidBase.treatment.unmodeledWarnings.map((warning) => (
            <div className="alert warning" key={warning}>{warning}</div>
          ))}
          <p className="muted small">{acidBase.treatment.sourceBoundary}</p>
          <details open>
            <summary>Spectrometer after Acid/Base</summary>
            <MixtureFields
              idPrefix="ab-read"
              mixture={state.afterAcidBase?.mixture ?? acidBase.treatment.final}
              onChange={(mixture) => setState({ ...state, afterAcidBase: readingFromMixture(mixture, 'Post-acid/base spectrometer reading') })}
            />
          </details>
          <div className="btn-row">
            <button type="button" onClick={() => go('extraction')}>Back</button>
            <button type="button" onClick={save}>Save progress</button>
            <button className="primary" type="button" onClick={() => go('filterEvap')}>Continue</button>
          </div>
        </section>
      )}

      {state.currentStage === 'filterEvap' && (
        <section className="input-section">
          <h3>Filtration / Evaporation</h3>
          <p>Typical successful order for plant matter and debris: Kotton Fabric, then Water Filter. Heavy Metal and Chemical Contaminant pass these filters. Evaporator nights depend on Performance, energy, receiver and Quality.</p>
          <NumberField id="kotton" label="Kotton Fabric durability" value={state.kottonDurability} onChange={(value) => setState({ ...state, kottonDurability: Math.max(0, Math.trunc(value)) })} step={1} />
          <NumberField id="water-filter" label="Water Filter durability" value={state.waterFilterDurability} onChange={(value) => setState({ ...state, waterFilterDurability: Math.max(0, Math.trunc(value)) })} step={1} />
          <NumberField id="evap-energy" label="Energy available (kJ)" value={state.evaporator.availableEnergy} onChange={(value) => setState({ ...state, evaporator: { ...state.evaporator, availableEnergy: Math.max(0, Math.trunc(value)) } })} step={1} />
          <NumberField id="evap-quality" label="Evaporator Quality (%)" value={state.evaporator.qualityPercent} onChange={(value) => setState({ ...state, evaporator: { ...state.evaporator, qualityPercent: value } })} min={-500} step={1} />
          <NumberField id="receiver" label="Distillate receiver capacity (mL)" value={state.evaporator.distillateCapacityUL / 1_000} onChange={(value) => setState({ ...state, evaporator: { ...state.evaporator, distillateCapacityUL: toUL(value) } })} />
          <label>
            <input
              type="checkbox"
              checked={state.evaporator.solventRecoveryModule}
              onChange={(event) => setState({ ...state, evaporator: { ...state.evaporator, solventRecoveryModule: event.target.checked } })}
            />{' '}
            Solvent Recovery Module (Alcohol only)
          </label>
          <div className="output-row"><span>Predicted filter removal</span><strong>{ml(totalUL(filterEvap.filtration.removed))} mL</strong></div>
          <div className="output-row"><span>Predicted overnight cycles</span><strong>{filterEvap.evaporation.cycles.length} ({filterEvap.evaporation.energyUsed} kJ)</strong></div>
          <div className="output-row"><span>Remaining volatiles (Water+Alcohol)</span><strong>{ml(filterEvap.remainingVolatilesUL)} mL {filterEvap.dryEnough ? '≤0.100 mL dry' : '>0.100 mL — Finisher blocked'}</strong></div>
          <details open>
            <summary>Spectrometer after filter / evap</summary>
            <MixtureFields
              idPrefix="fe-read"
              mixture={state.afterFilterEvap?.mixture ?? filterEvap.evaporation.output}
              onChange={(mixture) => setState({ ...state, afterFilterEvap: readingFromMixture(mixture, 'Post-filter/evap spectrometer reading') })}
            />
          </details>
          <div className="btn-row">
            <button type="button" onClick={() => go('acidBase')}>Back</button>
            <button type="button" onClick={save}>Save progress</button>
            <button className="primary" type="button" onClick={() => go('final')}>Continue</button>
          </div>
        </section>
      )}

      {state.currentStage === 'final' && (
        <section className="output-section">
          <h3>Final Dust</h3>
          <EvidenceBadge status={finish.before.evidence} />
          <NumberField id="finisher-modules-wizard" label="Chem Finisher modules (0–4)" value={state.finisherModules} onChange={(value) => setState({ ...state, finisherModules: Math.max(0, Math.trunc(value)) })} max={4} step={1} />
          <NumberField id="finisher-cap-wizard" label="Safe output capacity (vials)" value={state.finisherCapacityVials} onChange={(value) => setState({ ...state, finisherCapacityVials: Math.max(0, Math.trunc(value)) })} step={1} />
          {!finish.dryEnough && (
            <div className="alert error">Finisher dryness requires ≤100 µL total volatiles; {finish.remainingVolatilesUL} µL remain.</div>
          )}
          {finish.finishing && (
            <>
              <div className="output-row"><span>Possible 2.000 mL vials from current volume</span><strong>{finish.possibleVials}</strong></div>
              <div className="output-row"><span>Predicted mean purity</span><strong>{finish.finishing.meanPurity.toFixed(2)}%</strong></div>
              <p className="muted small">
                Owner observations 97.95% and 97.10% were specific finished vials with missing intermediate measurements.
                This screen will not invent those numbers. Enter a final spectrometer reading for an actual result.
              </p>
            </>
          )}
          <div className="btn-row">
            <button type="button" onClick={() => go('filterEvap')}>Back</button>
            <button type="button" onClick={save}>Save progress</button>
          </div>
        </section>
      )}

      <p className="muted small">
        Icons: {icons.professionsOriginal}/9 professions and {icons.perksOriginal}/48 perks use original in-repo pixel silhouettes.
        {icons.machinesMissing} machine and {icons.chemicalsMissing} chemical icons are missing; stages use text labels only.
        Nicokobo wiki text is CC BY-SA 4.0; game icons/screenshots are not licensed by wiki access.
      </p>

      <details className="sources-section">
        <summary><strong>Sources, versions, unknowns</strong></summary>
        <ul>
          {CITATIONS.map((citation) => (
            <li key={citation.id}>
              [{citation.evidence}] <a href={citation.url}>{citation.title}</a>
              {' '}({citation.gameVersionPrinted}; retrieved {citation.retrieved}). {citation.note}
            </li>
          ))}
        </ul>
        <p className="muted small">Recorded unknowns (not filled in): {UNKNOWN_LIMITS.join(' ')}</p>
      </details>

      <details className="input-section">
        <summary><strong>Compare to target (optional reverse search)</strong></summary>
        <ChemistTargetCompare />
      </details>
    </div>
  );
}
