import { useState } from 'react';
import {
  HYDROPONIC_CROPS,
  calculateCashFlow,
  calculateFishHarvest,
  calculateHydroponicCycle,
  calculateRatButcher,
  calculateWaterPurifierNight,
  evaluateBasicGunOrder,
  type BasicGunOrderId,
  type FishSpecies,
  type HydroponicCropId,
} from '../calculators/professionCalculators';
import type { ProfessionDef } from '../calculators/types';
import { ImprovedPixelIcon } from './ImprovedPixelIcon';

const NumberField = ({
  id,
  label,
  value,
  onChange,
  min,
  step = 1,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) => (
  <div className="input-group">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="number" min={min} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </div>
);

const Header = ({ profession }: { profession: ProfessionDef }) => (
  <div className="coming-soon-header">
    <ImprovedPixelIcon id={profession.id} tone="spec" size={80} showTooltip={false} />
    <div>
      <h2 className="panel-title" style={{ margin: 0 }}>{profession.name} Calculator</h2>
      {profession.tag && <div className="tag">{profession.tag}</div>}
    </div>
  </div>
);

function WaterCalculator() {
  const [volume, setVolume] = useState(1_000);
  const [water, setWater] = useState(900);
  const [impurity, setImpurity] = useState(100);
  const [dirtiness, setDirtiness] = useState(2);
  const [performance, setPerformance] = useState(0);
  const [quality, setQuality] = useState(0);
  const result = calculateWaterPurifierNight({
    volumeML: volume,
    currentWaterML: water,
    removableImpurityML: impurity,
    dirtinessMultiplier: dirtiness,
    performancePercent: performance,
    qualityPercent: quality,
  });
  return (
    <>
      <p>One-night Water Purifier calculation. Enter the dirtiness multiplier shown/derived for the measured purity tier; this avoids guessing an interpolation tier.</p>
      <NumberField id="water-volume" label="Total liquid volume (mL)" value={volume} onChange={setVolume} min={0} />
      <NumberField id="actual-water" label="Actual water component (mL)" value={water} onChange={setWater} min={0} />
      <NumberField id="water-impurity" label="Removable impurity (mL)" value={impurity} onChange={setImpurity} min={0} />
      <NumberField id="water-dirtiness" label="Dirtiness multiplier (measured/source tier)" value={dirtiness} onChange={setDirtiness} min={0} step={0.01} />
      <NumberField id="water-performance" label="Machine performance bonus (%)" value={performance} onChange={setPerformance} step={1} />
      <NumberField id="water-quality" label="Machine quality bonus (%)" value={quality} onChange={setQuality} step={1} />
      <div className="output-group">
        <div className="output-row"><span>Removal budget</span><strong>{result.budgetML.toFixed(3)} mL</strong></div>
        <div className="output-row"><span>Actually converted to water</span><strong>{result.removedML.toFixed(3)} mL</strong></div>
        <div className="output-row"><span>Final purity</span><strong>{result.finalPurity.toFixed(3)}%</strong></div>
        <div className="output-row"><span>Quality cap</span><strong>{result.purityCap.toFixed(2)}%</strong></div>
        <div className="output-row"><span>Power used</span><strong>{result.powerUsed}</strong></div>
      </div>
      <p className="muted small">Source: <a href="https://probably-stolen.nicokobo.com/en/wiki/terms/water-purification">Water purification</a>. The machine converts removed components into equal water volume; it does not shrink the batch.</p>
    </>
  );
}

function HydroponicCalculator() {
  const [crop, setCrop] = useState<HydroponicCropId>('dreamCap');
  const [quality, setQuality] = useState(0);
  const [speed, setSpeed] = useState(8);
  const [water, setWater] = useState(400);
  const [mineral, setMineral] = useState(10_000);
  const result = calculateHydroponicCycle(crop, quality, speed, water, mineral);
  return (
    <>
      <div className="input-group">
        <label htmlFor="crop">Crop</label>
        <select id="crop" value={crop} onChange={(event) => setCrop(event.target.value as HydroponicCropId)}>
          {Object.entries(HYDROPONIC_CROPS).map(([id, row]) => <option value={id} key={id}>{row.name}</option>)}
        </select>
      </div>
      <NumberField id="hydro-quality" label="Machine quality bonus (%)" value={quality} onChange={setQuality} />
      <NumberField id="hydro-speed" label="Measured progress per effective night" value={speed} onChange={setSpeed} min={0.001} step={0.01} />
      <NumberField id="hydro-water" label="Starting actual water (mL)" value={water} onChange={setWater} min={0} />
      <NumberField id="hydro-mineral" label="Starting mineral (µL)" value={mineral} onChange={setMineral} min={0} />
      <div className="output-group">
        <div className="output-row"><span>Effective nights</span><strong>{result.nights}</strong></div>
        <div className="output-row"><span>Expected harvest count</span><strong>{result.output}</strong></div>
        <div className="output-row"><span>Mixed solution required</span><strong>{result.waterRequiredML} mL</strong></div>
        <div className="output-row"><span>Power required</span><strong>{result.powerRequired}</strong></div>
        <div className="output-row"><span>Mineral consumed</span><strong>{result.mineralConsumedUL} µL</strong></div>
        <div className="output-row"><span>Starting nutrient concentration</span><strong>{result.startingConcentration} ({result.nutrientStatus})</strong></div>
      </div>
      <p className="muted small">{result.boundary}</p>
      <p className="muted small">Source: <a href="https://probably-stolen.nicokobo.com/en/wiki/terms/hydroponics">Hydroponics</a>.</p>
    </>
  );
}

function AquafarmerCalculator() {
  const [species, setSpecies] = useState<FishSpecies>('tilapia');
  const [absorbed, setAbsorbed] = useState(5_000);
  const [eggGrams, setEggGrams] = useState(0);
  const [eggCalories, setEggCalories] = useState(2);
  const result = calculateFishHarvest(species, absorbed, eggGrams, eggCalories);
  return (
    <>
      <div className="input-group">
        <label htmlFor="fish-species">Species</label>
        <select id="fish-species" value={species} onChange={(event) => setSpecies(event.target.value as FishSpecies)}>
          <option value="tilapia">Tilapia</option><option value="gutterTilapia">Gutter Tilapia</option>
          <option value="graftTilapia">Graft Tilapia</option><option value="eel">Eel</option>
          <option value="electricEel">Electric Eel</option><option value="sturgeon">Sturgeon</option>
        </select>
      </div>
      <NumberField id="absorbed-calories" label="Cumulative absorbed calories" value={absorbed} onChange={setAbsorbed} min={0} />
      <NumberField id="egg-grams" label="Current egg mass (g)" value={eggGrams} onChange={setEggGrams} min={0} />
      <NumberField id="egg-calories" label="Egg calories per gram" value={eggCalories} onChange={setEggCalories} min={0} step={0.01} />
      <div className="output-group">
        <div className="output-row"><span>Potential meat calories</span><strong>{result.potentialCalories}</strong></div>
        <div className="output-row"><span>900 / 400 / 200 / 100 kcal pieces</span><strong>{result.pieces['900']} / {result.pieces['400']} / {result.pieces['200']} / {result.pieces['100']}</strong></div>
        <div className="output-row"><span>Fish Scrap</span><strong>{result.pieces.scrap}</strong></div>
      </div>
      <p className="muted small">Source: <a href="https://probably-stolen.nicokobo.com/en/collections/aquaculture">Aquaculture</a>. Enter the fish’s measured cumulative record; deaths, predation and tank conditions are not inferred.</p>
    </>
  );
}

function RatCalculator() {
  const [weight, setWeight] = useState(400);
  const [diseased, setDiseased] = useState(false);
  const result = calculateRatButcher(weight, diseased);
  return (
    <>
      <NumberField id="rat-weight" label="Measured rat weight (g)" value={weight} onChange={setWeight} min={0} />
      <label><input type="checkbox" checked={diseased} onChange={(event) => setDiseased(event.target.checked)} /> Ordinary disease tag</label>
      <div className="output-group">
        <div className="output-row"><span>Effective butcher weight</span><strong>{result.effectiveWeightG} g</strong></div>
        <div className="output-row"><span>400 / 200 / 100 / 50 g pieces</span><strong>{result.pieces['400']} / {result.pieces['200']} / {result.pieces['100']} / {result.pieces['50']}</strong></div>
        <div className="output-row"><span>Static base-value total</span><strong>{result.totalBaseValue} Credits</strong></div>
      </div>
      <p className="muted small">Source: <a href="https://probably-stolen.nicokobo.com/en/wiki/terms/rat-ranching">Rat ranching</a>. Base value is not guaranteed sale revenue; prion and buyer effects remain separate.</p>
    </>
  );
}

function GunsmithCalculator() {
  const [order, setOrder] = useState<BasicGunOrderId>('accurate');
  const [firepower, setFirepower] = useState(18);
  const [accuracy, setAccuracy] = useState(21);
  const [reliability, setReliability] = useState(10);
  const [size, setSize] = useState(10);
  const [style, setStyle] = useState(5);
  const [suppression, setSuppression] = useState(0);
  const result = evaluateBasicGunOrder(order, { firepower, accuracy, reliability, size, style, suppression });
  return (
    <>
      <div className="input-group">
        <label htmlFor="gun-order">Basic order</label>
        <select id="gun-order" value={order} onChange={(event) => setOrder(event.target.value as BasicGunOrderId)}>
          <option value="accurate">Accurate</option><option value="firepower">Firepower</option>
          <option value="intimidating">Big and intimidating</option><option value="suppressed">Accurate/suppressed</option>
          <option value="stylish">Stylish</option>
        </select>
      </div>
      <NumberField id="gun-firepower" label="Firepower" value={firepower} onChange={setFirepower} />
      <NumberField id="gun-accuracy" label="Accuracy" value={accuracy} onChange={setAccuracy} />
      <NumberField id="gun-reliability" label="Reliability" value={reliability} onChange={setReliability} />
      <NumberField id="gun-size" label="Size" value={size} onChange={setSize} />
      <NumberField id="gun-style" label="Style" value={style} onChange={setStyle} />
      <NumberField id="gun-suppression" label="Suppression level" value={suppression} onChange={setSuppression} />
      <div className={`alert ${result.passes ? 'success' : 'error'}`}>{result.passes ? 'Base requirements pass' : 'Base requirements fail'}</div>
      <div className="output-row"><span>Additive bonus</span><strong>{result.bonus} Credits</strong></div>
      <div className="output-row"><span>Payment range before market/retail modifiers</span><strong>{result.paymentMin}–{result.paymentMax} Credits</strong></div>
      <p className="muted small">Source: <a href="https://probably-stolen.nicokobo.com/en/wiki/intents/gunsmith-orders">Gunsmith Orders</a>. Strict &gt; thresholds are preserved. This calculator covers five documented Basic templates, not Mid/High/service orders.</p>
    </>
  );
}

function CashFlowCalculator({ professionId }: { professionId: 'fence' | 'apprentice' | 'rock-bottom' }) {
  const defaults = professionId === 'apprentice' ? { cash: 550, rent: 200 } : professionId === 'rock-bottom' ? { cash: 0, rent: 200 } : { cash: 450, rent: 250 };
  const [cash, setCash] = useState(defaults.cash);
  const [rent, setRent] = useState(defaults.rent);
  const [bills, setBills] = useState(0);
  const [purchase, setPurchase] = useState(100);
  const [revenue, setRevenue] = useState(140);
  const [fees, setFees] = useState(0);
  const [cycles, setCycles] = useState(1);
  const result = calculateCashFlow({ cash, rent, otherBills: bills, purchaseCost: purchase, saleRevenue: revenue, fees, cycles });
  return (
    <>
      <p>Measured cash-flow planner. Enter the actual offer, realised sale, fees and bills from the current save; no unsupported customer schedule or resale margin is assumed.</p>
      <NumberField id={`${professionId}-cash`} label="Cash available" value={cash} onChange={setCash} min={0} />
      <NumberField id={`${professionId}-rent`} label="Next rent" value={rent} onChange={setRent} min={0} />
      <NumberField id={`${professionId}-bills`} label="Other bills/services" value={bills} onChange={setBills} min={0} />
      <NumberField id={`${professionId}-purchase`} label="Purchase/material cost per cycle" value={purchase} onChange={setPurchase} min={0} />
      <NumberField id={`${professionId}-revenue`} label="Realised sale revenue per cycle" value={revenue} onChange={setRevenue} min={0} />
      <NumberField id={`${professionId}-fees`} label="Fees per cycle" value={fees} onChange={setFees} min={0} />
      <NumberField id={`${professionId}-cycles`} label="Cycles before bills" value={cycles} onChange={(value) => setCycles(Math.max(0, Math.trunc(value)))} min={0} />
      <div className={`alert ${result.affordable ? 'success' : 'error'}`}>{result.affordable ? 'Bills remain affordable' : 'Cash shortfall'}</div>
      <div className="output-row"><span>Profit per cycle</span><strong>{result.cycleProfit} Credits</strong></div>
      <div className="output-row"><span>Cash after cycles and bills</span><strong>{result.endingCash} Credits</strong></div>
      <div className="output-row"><span>Maximum affordable purchase</span><strong>{result.maximumAffordablePurchase} Credits</strong></div>
      <p className="muted small">
        Source context: <a href={`https://probably-stolen.nicokobo.com/en/wiki/occupations/occupation-${professionId === 'apprentice' ? 'apprentice' : professionId === 'rock-bottom' ? 'rock-bottom' : 'fence'}`}>{professionId}</a>.
        Fence trade outcomes depend on actual stock/buyers; Apprentice and Rock Bottom are starts, not production recipes.
      </p>
    </>
  );
}

export function ProfessionCalculatorPage({ profession }: { profession: ProfessionDef }) {
  let calculator;
  switch (profession.id) {
    case 'water-merchant': calculator = <WaterCalculator />; break;
    case 'hydroponic-farmer': calculator = <HydroponicCalculator />; break;
    case 'aquafarmer': calculator = <AquafarmerCalculator />; break;
    case 'rat-wrangler': calculator = <RatCalculator />; break;
    case 'gunsmith': calculator = <GunsmithCalculator />; break;
    case 'fence': calculator = <CashFlowCalculator professionId="fence" />; break;
    case 'apprentice': calculator = <CashFlowCalculator professionId="apprentice" />; break;
    case 'rock-bottom': calculator = <CashFlowCalculator professionId="rock-bottom" />; break;
    default: calculator = <p>No source-supported calculator is registered.</p>;
  }
  return (
    <div className="panel calculator">
      <Header profession={profession} />
      <div className="calculator-content">
        <section className="input-section">{calculator}</section>
      </div>
    </div>
  );
}
