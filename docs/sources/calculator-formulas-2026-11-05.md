# Calculator formula snapshot — 2026-11-05

These are implementation notes, not copied third-party code. The nicokobo pages describe
static-analysis findings and may differ from a later game build; calculators expose measured
inputs where save-specific state matters.

## Chemist

- https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing
- https://probably-stolen.nicokobo.com/en/items/blender
- https://probably-stolen.nicokobo.com/en/items/chem_finisher

Implemented:

- Dream Cap reference composition and integer-µL scaling.
- Blender loss by Chemical Equipment Modules: 35%, 20%, 10%, 5%, 0%.
- Chemical branches 1, 2, 4, 9, 10 and 22 in documented execution order.
- Finisher proportional 2,000 µL sample and proportional contamination replacement:
  12%, 6%, 3%, 1%, 0%.
- Dryness threshold: combined evaporatives ≤100 µL.

Not inferred: filtering callbacks and overnight Evaporator processing. The final-product
calculator therefore requires measured post-processing total, active and evaporative volume.

## Water Merchant

- https://probably-stolen.nicokobo.com/en/wiki/terms/water-purification
- https://probably-stolen.nicokobo.com/en/wiki/occupations/occupation-water-merchant

One-night removal budget:

`[25 + 0.003 × min(volume, 10000)] × max(0, dirtiness + performance/100) × 1.25`

The dirtiness multiplier is an input because its tier/interpolation depends on measured purity.
The result is capped by removable impurity and machine-quality purity cap.

## Hydroponic Farmer

- https://probably-stolen.nicokobo.com/en/wiki/terms/hydroponics

The seven-crop table supplies progress, base yield, nightly mixed solution, nutrient center,
tolerance and mineral consumption. Speed is measured because traits/modules change it.

## Aquafarmer

- https://probably-stolen.nicokobo.com/en/collections/aquaculture
- https://probably-stolen.nicokobo.com/en/items/fish_fillet

Potential meat calories:

`floor(max(0, cumulative absorbed calories - current egg calories) × species conversion)`

Tilapia/Eel/Sturgeon 90%, Gutter Tilapia 85%, Graft Tilapia 70%, Electric Eel 25%.

## Rat Wrangler

- https://probably-stolen.nicokobo.com/en/wiki/terms/rat-ranching

Round measured body weight; ordinary disease multiplies by 0.75 and rounds again. Portion in
400, 200, 100 and 50 g order, adding one 50 g piece for any positive remainder.

## Gunsmith

- https://probably-stolen.nicokobo.com/en/wiki/intents/gunsmith-orders

Five documented Basic order templates are implemented with strict `>` requirements, inclusive
base-payment ranges and additive bonuses. Market and retail modifiers remain separate.

## Fence, Apprentice and Rock Bottom

- https://probably-stolen.nicokobo.com/en/wiki/occupations/occupation-fence
- https://probably-stolen.nicokobo.com/en/wiki/occupations/occupation-apprentice
- https://probably-stolen.nicokobo.com/en/wiki/occupations/occupation-rock-bottom

These starts do not define a fixed production recipe. Their calculators use current-save cash,
actual purchase cost, realised revenue, fees and bills. Defaults use documented starting cash
and rent; no resale margin or customer schedule is invented.
