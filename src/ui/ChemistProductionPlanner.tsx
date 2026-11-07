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
  type DraftReading,
  type MixtureSnapshot,
  type StageRecord,
  type WizardStageId,
  addAcidDose,
  addBaseDose,
  applyStageInput,
  calculateNextNight,
  calculateStage,
  canAcceptPrediction,
  canCalculateStage,
  canConfirmPendingNight,
  canConfirmReadings,
  canEnterStage,
  confirmPendingNight,
  confirmStage,
  continueToFinal,
  defaultWizardState,
  draftMeasuredKeys,
  filterEvapOutput,
  goToStage,
  inputMixtureFor,
  lastConfirmedNight,
  predictAcidBase,
  predictFilterEvap,
  predictFinish,
  previousStage,
  runChemistryUpdates,
  runForward,
  setAcidStock,
  setBaseStock,
  setDraftField,
  snapshotEvidence,
  syncStale,
} from '../calculators/chemistWizard';
import { estimatedMushAndOther, PREVIOUS_BATCH_FRACTION_NOTE, PREVIOUS_BATCH_MUSH_FRACTION } from '../calculators/dreamDustEstimates';
import { SAFE_EXTRACTION_TEMPERATURE_C } from '../calculators/dreamDustPlanner';
import { CITATIONS, UNKNOWN_LIMITS } from '../calculators/sourceCitations';
import { getIconEntry, iconManifestSummary } from '../data/iconManifest';
import { PurposeIcon } from './PurposeIcon';
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
  emptyable = false,
  onClear,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
  emptyable?: boolean;
  onClear?: () => void;
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
        value={emptyable && Number.isNaN(value) ? '' : value}
        onChange={(event) => {
          if (emptyable && event.target.value === '') {
            onClear?.();
            return;
          }
          onChange(Number(event.target.value));
        }}
      />
      {help && <span className="help-text">{help}</span>}
    </div>
  );
}

function NamedIcon({ id, label }: { id: string; label: string }) {
  return (
    <span className="named-icon">
      <PurposeIcon id={id} size={32} showCaption />
      <span>{label}</span>
    </span>
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

function DraftMixtureFields({
  idPrefix,
  draft,
  onChange,
}: {
  idPrefix: string;
  draft: DraftReading;
  onChange: (key: ComponentKey, ul: number | null) => void;
}) {
  return (
    <>
      {COMPONENT_KEYS.map((key) => {
        const entered = draft.values[key] !== undefined;
        return (
          <NumberField
            key={key}
            id={`${idPrefix}-${key}`}
            label={`${componentLabel(key)} (mL)`}
            value={entered ? draft.values[key]! / 1_000 : Number.NaN}
            emptyable
            onClear={() => onChange(key, null)}
            onChange={(value) => onChange(key, toUL(value))}
            help={entered ? 'Measured' : 'Blank = not measured (will not be labeled verified)'}
          />
        );
      })}
    </>
  );
}

function SnapshotTable({ snapshot }: { snapshot: MixtureSnapshot }) {
  return (
    <div className="output-section">
      <p>
        <EvidenceBadge status={snapshotEvidence(snapshot)} /> {snapshot.kind} — {snapshot.note}
      </p>
      {COMPONENT_KEYS.filter((key) => snapshot.mixture[key] !== 0 || snapshot.fieldProvenance[key] === 'measured').map(
        (key) => (
          <div className="output-row" key={key} data-testid={`snapshot-${key}`}>
            <span>
              {componentLabel(key)} <span className="muted small">{snapshot.fieldProvenance[key]}</span>
            </span>
            <strong data-testid={`snapshot-${key}-ul`}>{ml(snapshot.mixture[key])} mL</strong>
          </div>
        ),
      )}
    </div>
  );
}

function StageStatus({ record }: { record: StageRecord }) {
  if (record.stale) {
    return (
      <div className="alert warning" role="status">
        Stale: {record.staleReason ?? 'Inputs changed.'} Previous confirmation is kept in history. Draft measurements were not deleted. Calculate this stage again.
      </div>
    );
  }
  if (record.confirmed && record.accepted) {
    return (
      <div className="alert success" role="status">
        Confirmed ({record.accepted.kind}). Later stages use this output, not a skipped guess.
      </div>
    );
  }
  if (record.calculated && record.predictionBlocked) {
    return (
      <div className="alert error" role="status">
        Model confirmation is blocked. Enter a measured composition and Continue with my readings. Empty Base inventory is not the reason.
      </div>
    );
  }
  if (record.calculated && record.prediction) {
    return (
      <div className="alert info" role="status">
        Calculated. Confirm a choice before later stages can run.
      </div>
    );
  }
  return (
    <div className="alert info" role="status">
      Calculate this stage, then Continue. Visiting a later tab does not perform the operation.
    </div>
  );
}

export function ChemistProductionPlanner() {
  const [state, setState] = useState<ChemistWizardState>(defaultWizardState);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const icons = iconManifestSummary();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loaded = loadChemistSession(window.localStorage);
    setState(syncStale(loaded.state));
    setSessionNotice(loaded.notice);
  }, []);

  const update = (fn: (current: ChemistWizardState) => ChemistWizardState) => {
    setState((current) => syncStale(fn(current)));
  };

  const patch = (stage: WizardStageId, fields: Partial<ChemistWizardState>) => {
    update((current) => applyStageInput(current, stage, fields));
  };

  const forward = useMemo(() => runForward(state), [state]);
  const acidBase = useMemo(() => predictAcidBase(state), [state]);
  const filterEvap = useMemo(() => predictFilterEvap(state), [state]);
  const finish = useMemo(() => predictFinish(state), [state]);
  const drift = volumeSumDriftUL(state.groundTotalUL, state.ground);
  const currentRecord = state.stages[state.currentStage];

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
    patch('ground', {
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
  };

  const fill750 = () => {
    patch('ground', {
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
  };

  const setPureLiquid = (mlValue: number) => {
    const liquidUL = toUL(mlValue);
    patch('ground', {
      solventMode: 'pure',
      solventLiquidUL: liquidUL,
      solventAlcoholUL: liquidUL,
      solventWaterUL: 0,
      solventOtherUL: 0,
    });
  };

  const changeDraft = (stage: WizardStageId, key: ComponentKey, ul: number | null) => {
    update((current) => {
      if (ul === null) {
        const values = { ...current.stages[stage].draft.values };
        delete values[key];
        return {
          ...current,
          stages: {
            ...current.stages,
            [stage]: { ...current.stages[stage], draft: { values } },
          },
        };
      }
      return setDraftField(current, stage, key, ul);
    });
  };

  const stageButtons = (stage: WizardStageId) => {
    const prev = previousStage(stage);
    return (
      <div className="btn-row">
        {prev && (
          <button type="button" onClick={() => update((current) => goToStage(current, prev))}>
            Back
          </button>
        )}
        <button type="button" onClick={save}>
          Save progress
        </button>
        <button
          className="primary"
          type="button"
          data-testid={`calculate-${stage}`}
          disabled={!canCalculateStage(state, stage)}
          onClick={() => update((current) => calculateStage(current, stage))}
        >
          {stage === 'ground' ? 'Calculate from my materials' : `Calculate ${STAGE_LABELS[stage]}`}
        </button>
        <button
          className="primary"
          type="button"
          data-testid={`continue-prediction-${stage}`}
          disabled={!canAcceptPrediction(state, stage)}
          onClick={() => update((current) => confirmStage(current, stage, 'accept-prediction'))}
        >
          Continue with model prediction
        </button>
        <button
          type="button"
          data-testid={`continue-readings-${stage}`}
          disabled={!canConfirmReadings(state, stage)}
          onClick={() => update((current) => confirmStage(current, stage, 'confirm-readings'))}
        >
          Continue with my readings
        </button>
      </div>
    );
  };

  const readingEditor = (stage: WizardStageId) => {
    const record = state.stages[stage];
    return (
      <details open={draftMeasuredKeys(record.draft).length > 0}>
        <summary>Spectrometer draft (optional, field-by-field)</summary>
        <p className="muted small">
          Blank fields stay unmeasured. Changing one field does not verify the rest. Continue with my readings overlays measured fields onto the prediction and leaves the rest labeled predicted.
        </p>
        <DraftMixtureFields
          idPrefix={`${stage}-read`}
          draft={record.draft}
          onChange={(key, ul) => changeDraft(stage, key, ul)}
        />
        <p className="muted small">Measured now: {draftMeasuredKeys(record.draft).join(', ') || 'none'}.</p>
      </details>
    );
  };

  return (
    <div className="calculator chemist-calculator">
      <div className="calculator-header">
        <h2>Dream Dust Production Planner</h2>
        <p className="subtitle">What do you have? Plan forward from ground mixture and alcohol — vial targets are optional.</p>
        <div className="chemist-kit" role="list" aria-label="Chemist kit symbols">
          {['dream-cap', 'blender', 'alcohol', 'heating-plate', 'acid', 'base', 'kotton-fabric', 'water-filter', 'evaporator', 'chem-finisher', 'dream-dust'].map((id) => {
            const entry = getIconEntry(id);
            const name = entry?.name ?? id;
            return (
              <span
                className="kit-item"
                role="listitem"
                key={id}
                data-testid={`kit-${id}`}
                aria-label={`${name}. Calculator symbol, not a game sprite`}
              >
                <PurposeIcon id={id} size={32} showTooltip />
                <span className="kit-item-name" data-testid={`kit-name-${id}`}>
                  {name}
                </span>
                <span className="icon-not-game" data-testid={`icon-caption-${id}`}>
                  Not a game sprite
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {sessionNotice && <div className="alert warning">{sessionNotice}</div>}

      <ol className="steps wizard-steps" aria-label="Production stages">
        {WIZARD_STAGES.map((stage) => {
          const record = state.stages[stage];
          const allowed = canEnterStage(state, stage) || stage === state.currentStage || WIZARD_STAGES.indexOf(stage) <= WIZARD_STAGES.indexOf(state.currentStage);
          const className = [
            state.currentStage === stage ? 'active' : '',
            record.stale ? 'step-stale' : '',
            record.confirmed && !record.stale ? 'step-confirmed' : '',
            !allowed ? 'step-locked' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={stage}>
              <button
                type="button"
                className={className}
                disabled={!allowed}
                aria-current={state.currentStage === stage ? 'step' : undefined}
                onClick={() => update((current) => goToStage(current, stage))}
              >
                {STAGE_LABELS[stage]}
                {record.stale ? ' (stale)' : record.confirmed ? ' (confirmed)' : record.calculated ? ' (calculated)' : ''}
              </button>
            </li>
          );
        })}
      </ol>

      {state.currentStage === 'ground' && (
        <section className="input-section" data-testid="stage-ground">
          <h3><NamedIcon id="dream-cap" label="Ground Dream Caps and solvent" /></h3>
          <StageStatus record={currentRecord} />
          <NumberField
            id="ground-total"
            label="Ground mixture (mL)"
            value={state.groundTotalUL / 1_000}
            onChange={(value) => patch('ground', { groundTotalUL: toUL(value) })}
            help="Total volume of the already-ground pile. This is not automatically pure Dream Cap Mush."
          />
          <div className="input-group">
            <label>Composition</label>
            <label>
              <input
                type="radio"
                name="composition-mode"
                checked={state.compositionMode === 'measured'}
                onChange={() => patch('ground', { compositionMode: 'measured', compositionNote: '' })}
              />{' '}
              Measured
            </label>
            <label>
              <input
                type="radio"
                name="composition-mode"
                checked={state.compositionMode === 'estimated'}
                onChange={() =>
                  patch('ground', {
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
            onChange={(value) => patch('ground', { ground: { ...state.ground, dreamCapMush: toUL(value) } })}
          />
          {state.compositionMode === 'estimated' && (
            <button
              type="button"
              onClick={() =>
                patch('ground', {
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
              onChange={(ground) => patch('ground', { ground })}
              highlight={COMPONENT_KEYS.filter((key) => key !== 'dreamCapMush')}
            />
          </details>
          {drift !== 0 && state.groundTotalUL > 0 && totalUL(state.ground) > 0 && (
            <div className="alert warning">
              Component sum {ml(totalUL(state.ground))} mL differs from declared total {ml(state.groundTotalUL)} mL by {ml(drift)} mL. Not normalized.
            </div>
          )}

          <h4><NamedIcon id="alcohol" label="Alcohol / solvent" /></h4>
          <NumberField
            id="solvent-liquid"
            label="Alcohol-containing liquid (mL)"
            value={state.solventLiquidUL / 1_000}
            onChange={(value) =>
              state.solventMode === 'pure' ? setPureLiquid(value) : patch('ground', { solventLiquidUL: toUL(value) })
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
                onChange={() => patch('ground', { solventMode: 'mixed' })}
              />{' '}
              Mixed / Measured
            </label>
          </div>
          {state.solventMode === 'mixed' && (
            <>
              <NumberField id="solvent-alcohol" label="Alcohol component (mL)" value={state.solventAlcoholUL / 1_000} onChange={(value) => patch('ground', { solventAlcoholUL: toUL(value) })} />
              <NumberField id="solvent-water" label="Water component (mL)" value={state.solventWaterUL / 1_000} onChange={(value) => patch('ground', { solventWaterUL: toUL(value) })} />
              <NumberField id="solvent-other" label="Other solvent components (mL)" value={state.solventOtherUL / 1_000} onChange={(value) => patch('ground', { solventOtherUL: toUL(value) })} />
            </>
          )}
          <NumberField id="vessel-capacity" label="Vessel capacity (mL)" value={state.vesselCapacityUL / 1_000} onChange={(value) => patch('ground', { vesselCapacityUL: toUL(value) })} />

          <div className="btn-row">
            <button type="button" onClick={fill750}>
              Example 750 + 476
            </button>
            <button type="button" onClick={fill164}>
              Example 164 + 552
            </button>
          </div>
          {stageButtons('ground')}
        </section>
      )}

      {state.currentStage === 'ground' && currentRecord.calculated && currentRecord.prediction && (
        <section className="output-section">
          <h3>
            From your materials <EvidenceBadge status={forward.evidence} />
          </h3>
          {forward.reasons.map((reason) => (
            <div className="alert error" key={reason}>
              {reason}
            </div>
          ))}
          {forward.warnings.map((warning) => (
            <div className="alert warning" key={warning}>
              {warning}
            </div>
          ))}
          {forward.status === 'ok' && (
            <>
              <div className="output-row">
                <span>Available actual Dream Cap Mush</span>
                <strong data-testid="available-mush-ul">{ml(forward.availableMushUL)} mL</strong>
              </div>
              <div className="output-row">
                <span>Alcohol component</span>
                <strong data-testid="alcohol-component-ul">{ml(forward.alcoholComponentUL)} mL</strong>
              </div>
              <div className="output-row">
                <span>Available Alcohol / all available Mush</span>
                <strong data-testid="alcohol-mush-ratio">
                  {forward.alcoholToMushRatio === null ? 'n/a' : forward.alcoholToMushRatio.toFixed(2)}
                </strong>
              </div>
              <div className="output-row">
                <span>Recommended ground mix to use</span>
                <strong data-testid="recommended-ground-ul">{ml(forward.recommendedGroundUL)} mL</strong>
              </div>
              <div className="output-row">
                <span>Actual Mush in that mix</span>
                <strong data-testid="recommended-mush-ul">{ml(forward.recommendedMushUL)} mL</strong>
              </div>
              <div className="output-row">
                <span>Selected batch Alcohol / Mush ratio</span>
                <strong data-testid="selected-batch-alcohol-mush-ratio">
                  {forward.selectedBatchAlcoholToMushRatio === null
                    ? 'n/a'
                    : forward.selectedBatchAlcoholToMushRatio.toFixed(2)}
                </strong>
              </div>
              <div className="output-row">
                <span>Unused ground mixture</span>
                <strong data-testid="unused-ground-ul">{ml(forward.unusedGroundUL)} mL</strong>
              </div>
              <div className="output-row">
                <span>Initial vessel volume</span>
                <strong data-testid="initial-vessel-ul">
                  {ml(forward.initialVesselUL)} mL / {ml(state.vesselCapacityUL)} mL
                </strong>
              </div>
              <div className="output-row">
                <span>Theoretical extract ceiling (50% of selected Mush)</span>
                <strong>{ml(forward.theoreticalExtractCeilingUL)} mL</strong>
              </div>
              <p className="muted small">{forward.boundary}</p>
              <p className="muted small">Exact vial count and grade depend on later confirmed stages. This is not a guaranteed 38-vial yield.</p>
              <h4>Confirmed-output candidate (vessel after pour)</h4>
              <SnapshotTable snapshot={currentRecord.prediction} />
              {readingEditor('ground')}
            </>
          )}
        </section>
      )}

      {state.currentStage === 'extraction' && (
        <section className="input-section" data-testid="stage-extraction">
          <h3><NamedIcon id="heating-plate" label="Extraction" /></h3>
          <StageStatus record={currentRecord} />
          <p>
            Hold the liquid in the sourced 40–49°C band. Recommended plate setting {SAFE_EXTRACTION_TEMPERATURE_C}°C with 2+
            modules. Observed temperature drives the prediction; modules are not decorative.
          </p>
          {!canEnterStage(state, 'extraction') && (
            <div className="alert error">{inputMixtureFor(state, 'extraction').note}</div>
          )}
          {inputMixtureFor(state, 'extraction').snapshot && (
            <>
              <h4>Input from confirmed Ground Mixture</h4>
              <SnapshotTable snapshot={inputMixtureFor(state, 'extraction').snapshot!} />
            </>
          )}
          <NumberField
            id="heat-modules"
            label="Heating Plate modules"
            value={state.heatingPlateModules}
            onChange={(value) => patch('extraction', { heatingPlateModules: Math.trunc(value) })}
            max={4}
            step={1}
          />
          <NumberField
            id="observed-temp"
            label="Observed liquid temperature (°C)"
            value={state.observedTemperatureC ?? Number.NaN}
            emptyable
            onClear={() => patch('extraction', { observedTemperatureC: null })}
            onChange={(value) => patch('extraction', { observedTemperatureC: value })}
            help="Required if you have fewer than 2 modules. Blank uses 44°C only when 2+ modules are set."
          />
          {stageButtons('extraction')}
          {currentRecord.prediction && (
            <div data-testid="predicted-extraction">
              <h4>Predicted extraction output</h4>
              <SnapshotTable snapshot={currentRecord.prediction} />
            </div>
          )}
          {currentRecord.reasons.map((reason) => (
            <div className="alert error" key={reason}>
              {reason}
            </div>
          ))}
          {currentRecord.warnings.map((warning) => (
            <div className="alert warning" key={warning}>
              {warning}
            </div>
          ))}
          {readingEditor('extraction')}
          {currentRecord.history.length > 0 && (
            <details>
              <summary>Previous extraction snapshots ({currentRecord.history.length})</summary>
              {currentRecord.history.map((row, index) => (
                <SnapshotTable key={`${row.capturedAt}-${index}`} snapshot={row} />
              ))}
            </details>
          )}
        </section>
      )}

      {state.currentStage === 'acidBase' && (
        <section className="input-section" data-testid="stage-acidBase">
          <h3><NamedIcon id="acid" label="Acid / Base (protein)" /></h3>
          <StageStatus record={currentRecord} />
          {!canEnterStage(state, 'acidBase') && <div className="alert error">{inputMixtureFor(state, 'acidBase').note}</div>}
          {inputMixtureFor(state, 'acidBase').snapshot && (
            <>
              <h4>Input from confirmed Extraction</h4>
              <SnapshotTable snapshot={inputMixtureFor(state, 'acidBase').snapshot!} />
            </>
          )}
          {acidBase.blocked ? (
            <div className="alert warning">No confirmed extraction output yet. Calculate+Continue extraction first.</div>
          ) : acidBase.before.mixture.protein > 0 ? (
            <div className="alert warning">Protein {ml(acidBase.before.mixture.protein)} mL is a purity risk until precipitated and filtered.</div>
          ) : (
            <div className="alert success">No Protein in the confirmed extraction output. Acid/Base is still a real stage — Calculate even if you add nothing.</div>
          )}
          <p className="muted small">
            Inventory is the measured bottle. Dose is a homogeneous slice of every component. Acid and Base are separate pours. Neutralization (branch 18) runs only when you click Run chemical updates while both are already in the vessel.
          </p>
          <h4><NamedIcon id="acid" label="Acidic Solution stock (measured)" /></h4>
          <MixtureFields
            idPrefix="acid-reag"
            mixture={state.acidReagent}
            onChange={(acidReagent) => update((current) => setAcidStock(current, acidReagent))}
          />
          <div className="output-row"><span>Acid remaining</span><strong data-testid="acid-remaining-value">{ml(totalUL(state.acidRemaining))} mL</strong></div>
          <NumberField id="acid-dose" label="Acid dose to pour (mL)" value={state.acidDoseUL / 1_000} onChange={(value) => patch('acidBase', { acidDoseUL: toUL(value) })} />
          <button type="button" data-testid="add-acid-dose" onClick={() => update(addAcidDose)}>Add Acid dose</button>
          <h4><NamedIcon id="base" label="Basic Solution stock (measured)" /></h4>
          <MixtureFields
            idPrefix="base-reag"
            mixture={state.baseReagent}
            onChange={(baseReagent) => update((current) => setBaseStock(current, baseReagent))}
          />
          <div className="output-row"><span>Base remaining</span><strong data-testid="base-remaining-value">{ml(totalUL(state.baseRemaining))} mL</strong></div>
          <NumberField id="base-dose" label="Base dose to pour (mL)" value={state.baseDoseUL / 1_000} onChange={(value) => patch('acidBase', { baseDoseUL: toUL(value) })} />
          <button type="button" data-testid="add-base-dose" onClick={() => update(addBaseDose)}>Add Base dose</button>
          <NumberField id="chem-updates" label="Chemical updates to run" value={state.chemistryUpdateBudget} onChange={(value) => patch('acidBase', { chemistryUpdateBudget: Math.max(1, Math.trunc(value)) })} step={1} />
          <button type="button" data-testid="run-chemistry" onClick={() => update(runChemistryUpdates)}>Run chemical updates (wiki 13–18, 21)</button>
          {state.acidBaseLog.length > 0 && (
            <details open>
              <summary>Sequential actions ({state.acidBaseLog.length})</summary>
              {state.acidBaseLog.map((step, index) => (
                <p className="muted small" key={`${step.kind}-${index}`}>
                  {index + 1}. {step.kind} dose {ml(step.doseUL)} mL; remaining Acid {ml(step.remainingAcidUL)} / Base {ml(step.remainingBaseUL)}; vessel {ml(step.vesselUL)} mL. {step.note}
                </p>
              ))}
            </details>
          )}
          {stageButtons('acidBase')}
          {currentRecord.prediction && (
            <>
              <h4>Predicted Acid/Base output (feeds Filtration only after Continue)</h4>
              <SnapshotTable snapshot={currentRecord.prediction} />
            </>
          )}
          {currentRecord.reasons.map((reason) => (
            <div className="alert error" key={reason}>
              {reason}
            </div>
          ))}
          {currentRecord.warnings.map((warning) => (
            <div className="alert warning" key={warning}>
              {warning}
            </div>
          ))}
          {readingEditor('acidBase')}
        </section>
      )}

      {state.currentStage === 'filterEvap' && (
        <section className="input-section" data-testid="stage-filterEvap">
          <h3><NamedIcon id="water-filter" label="Filtration" /><NamedIcon id="evaporator" label="Evaporation" /></h3>
          <StageStatus record={currentRecord} />
          {!canEnterStage(state, 'filterEvap') && (
            <div className="alert error">{inputMixtureFor(state, 'filterEvap').note}</div>
          )}
          {inputMixtureFor(state, 'filterEvap').snapshot && (
            <>
              <h4>Input from confirmed Acid / Base</h4>
              <SnapshotTable snapshot={inputMixtureFor(state, 'filterEvap').snapshot!} />
            </>
          )}
          <p className="muted small">
            Filtration and evaporation are separate confirmed operations. Nights use remaining volatiles, remaining energy, and remaining receiver. Confirmed filter durability is not spent again on night 2.
          </p>
          <NumberField id="kotton" label="Kotton Fabric durability" value={state.kottonDurability} onChange={(value) => patch('filterEvap', { kottonDurability: Math.max(0, Math.trunc(value)) })} step={1} />
          <NumberField id="water-filter" label="Water Filter durability" value={state.waterFilterDurability} onChange={(value) => patch('filterEvap', { waterFilterDurability: Math.max(0, Math.trunc(value)) })} step={1} />
          <label>
            <input type="checkbox" checked={state.filterContainerOwned} onChange={(event) => patch('filterEvap', { filterContainerOwned: event.target.checked })} /> Filter container owned
          </label>
          <label>
            <input type="checkbox" checked={state.evaporatorOwned} onChange={(event) => patch('filterEvap', { evaporatorOwned: event.target.checked })} /> Evaporator owned
          </label>
          <NumberField id="evap-modules" label="Evaporator modules (count, recorded)" value={state.evaporatorModules} onChange={(value) => patch('filterEvap', { evaporatorModules: Math.max(0, Math.trunc(value)) })} step={1} help="Enter the machine P/E/Q readout. Module percents are not invented from this count." />
          <NumberField id="evap-energy" label="Owned energy (kJ)" value={state.evaporator.availableEnergy} onChange={(value) => patch('filterEvap', { evaporator: { ...state.evaporator, availableEnergy: Math.max(0, Math.trunc(value)) } })} step={1} />
          <NumberField id="evap-performance" label="Evaporator Performance (%)" value={state.evaporator.performancePercent} onChange={(value) => patch('filterEvap', { evaporator: { ...state.evaporator, performancePercent: value } })} min={-500} step={1} />
          <NumberField id="evap-efficiency" label="Evaporator Efficiency (%)" value={state.evaporator.efficiencyPercent} onChange={(value) => patch('filterEvap', { evaporator: { ...state.evaporator, efficiencyPercent: value } })} min={-500} step={1} />
          <NumberField id="evap-quality" label="Evaporator Quality (%)" value={state.evaporator.qualityPercent} onChange={(value) => patch('filterEvap', { evaporator: { ...state.evaporator, qualityPercent: value } })} min={-500} step={1} />
          <NumberField id="receiver" label="Distillate receiver capacity (mL)" value={state.evaporator.distillateCapacityUL / 1_000} onChange={(value) => patch('filterEvap', { evaporator: { ...state.evaporator, distillateCapacityUL: toUL(value) } })} />
          <label>
            <input
              type="checkbox"
              checked={state.evaporator.solventRecoveryModule}
              onChange={(event) => patch('filterEvap', { evaporator: { ...state.evaporator, solventRecoveryModule: event.target.checked } })}
            />{' '}
            Solvent Recovery Module (Alcohol only; Water and Lipobond still leave the batch)
          </label>
          {!filterEvap.blocked && (
            <div className="output-row">
              <span>Live filter removal from confirmed Acid/Base output</span>
              <strong>{ml(totalUL(filterEvap.filtration.removed))} mL</strong>
            </div>
          )}
          <h4>1. Confirm filtration</h4>
          {stageButtons('filterEvap')}
          {currentRecord.prediction && (
            <>
              <h4>Predicted filtered mixture</h4>
              <SnapshotTable snapshot={currentRecord.prediction} />
            </>
          )}
          <h4>2. Evaporation nights (from remaining volatiles)</h4>
          {state.evapNights.map((night) => (
            <div className="output-section" key={night.night}>
              <div className="output-row" data-testid={`confirmed-night-${night.night}`}>
                <span>Night {night.night} {night.confirmed ? 'confirmed' : ''} {night.stale ? 'stale' : ''}</span>
                <strong>{ml(night.removed.water + night.removed.alcohol + night.removed.lipobondAgent)} mL removed / {ml(night.remainingVolatilesUL)} left / {night.energyUsed} kJ / {ml(totalUL(night.recovered))} recovered / receiver {ml(night.remainingReceiverUL)} mL</strong>
              </div>
            </div>
          ))}
          {state.pendingNight && (
            <div className="alert info" data-testid="pending-night">
              Night {state.pendingNight.night}: removed {ml(totalUL(state.pendingNight.removed))} mL, left {ml(state.pendingNight.remainingVolatilesUL)} mL volatiles, energy {state.pendingNight.energyUsed} kJ, recovered {ml(totalUL(state.pendingNight.recovered))} mL, remaining energy {state.pendingNight.remainingEnergy} kJ, remaining receiver {ml(state.pendingNight.remainingReceiverUL)} mL.
              {state.pendingNight.reasons.map((reason) => (
                <div key={reason}>{reason}</div>
              ))}
            </div>
          )}
          <div className="btn-row">
            <button type="button" data-testid="calculate-next-night" disabled={!state.stages.filterEvap.confirmed || state.stages.filterEvap.stale} onClick={() => update(calculateNextNight)}>
              Calculate next night
            </button>
            <button type="button" data-testid="confirm-night" disabled={!canConfirmPendingNight(state, 'accept-prediction')} onClick={() => update((current) => confirmPendingNight(current, 'accept-prediction'))}>
              Confirm night (model)
            </button>
            <button type="button" data-testid="confirm-night-readings" disabled={!canConfirmPendingNight(state, 'confirm-readings')} onClick={() => update((current) => confirmPendingNight(current, 'confirm-readings'))}>
              Confirm night with my readings
            </button>
            <button type="button" data-testid="continue-final" disabled={filterEvapOutput(state).blocked} onClick={() => update(continueToFinal)}>
              Continue to Final
            </button>
          </div>
          {lastConfirmedNight(state) && (
            <p className="muted small" data-testid="no-refilter">
              Last confirmed night {lastConfirmedNight(state)!.night}. Next night starts from that remaining mixture, not a second filter pass. Filtration was not reapplied.
            </p>
          )}
          {currentRecord.warnings.map((warning) => (
            <div className="alert warning" key={warning}>
              {warning}
            </div>
          ))}
          {readingEditor('filterEvap')}
        </section>
      )}

      {state.currentStage === 'final' && (
        <section className="output-section" data-testid="stage-final">
          <h3><NamedIcon id="chem-finisher" label="Final Dust" /></h3>
          <StageStatus record={currentRecord} />
          {!canEnterStage(state, 'final') && <div className="alert error">{inputMixtureFor(state, 'final').note}</div>}
          {inputMixtureFor(state, 'final').snapshot && (
            <>
              <h4>Input from confirmed Filtration / Evaporation</h4>
              <SnapshotTable snapshot={inputMixtureFor(state, 'final').snapshot!} />
            </>
          )}
          <EvidenceBadge status={finish.before.evidence} />
          <NumberField id="finisher-modules-wizard" label="Chem Finisher modules (0–4)" value={state.finisherModules} onChange={(value) => patch('final', { finisherModules: Math.max(0, Math.trunc(value)) })} max={4} step={1} />
          <NumberField id="finisher-cap-wizard" label="Safe output capacity (vials)" value={state.finisherCapacityVials} onChange={(value) => patch('final', { finisherCapacityVials: Math.max(0, Math.trunc(value)) })} step={1} />
          {finish.blocked && <div className="alert error">{finish.before.note}</div>}
          {!finish.blocked && !finish.dryEnough && (
            <div className="alert error">Finisher dryness requires ≤100 µL total volatiles; {finish.remainingVolatilesUL} µL remain.</div>
          )}
          {finish.finishing && (
            <>
              <div className="output-row">
                <span>Possible 2.000 mL vials from confirmed dry volume</span>
                <strong>{finish.possibleVials}</strong>
              </div>
              <div className="output-row">
                <span>Predicted mean purity</span>
                <strong>{finish.finishing.meanPurity.toFixed(2)}%</strong>
              </div>
              <p className="muted small">
                Owner observations 97.95% and 97.10% were specific finished vials with missing intermediate measurements. This screen will not invent those numbers.
              </p>
            </>
          )}
          {stageButtons('final')}
          {currentRecord.prediction && <SnapshotTable snapshot={currentRecord.prediction} />}
          {readingEditor('final')}
        </section>
      )}

      <p className="muted small">
        Icons: {icons.professionsOriginal}/9 professions, {icons.perksOriginal}/48 perks, {icons.machinesOriginal} machines and {icons.chemicalsOriginal} chemicals use original purpose-based SVG tiles.
        All {icons.appearanceUnverified} tiles are labeled not game sprites; appearance vs in-game art is unverified.
        Nicokobo wiki text is CC BY-SA 4.0; game icons/screenshots are not licensed by wiki access.
      </p>

      <details className="sources-section">
        <summary>
          <strong>Sources, versions, unknowns</strong>
        </summary>
        <ul>
          {CITATIONS.map((citation) => (
            <li key={citation.id}>
              [{citation.evidence}] <a href={citation.url}>{citation.title}</a> ({citation.gameVersionPrinted}; retrieved {citation.retrieved}). {citation.note}
            </li>
          ))}
        </ul>
        <p className="muted small">Recorded unknowns (not filled in): {UNKNOWN_LIMITS.join(' ')}</p>
      </details>

      <details className="input-section">
        <summary>
          <strong>Compare to target (optional reverse search)</strong>
        </summary>
        <ChemistTargetCompare />
      </details>
    </div>
  );
}
