import type { Fact, SpecializationDef, VerificationStatus } from './types';

/**
 * Starting specializations for 1.0.x.
 * Roster (9 playable) is corroborated by wf-specializations, gamers-scenarios, cozy-scenarios and the
 * user-reported list. Start-screen tags/bullets agree between wf-specializations and gamers-scenarios.
 * Credit and rent numbers come from a single source (wf-specializations) unless noted.
 */

const V = '1.0.x';

function f<T>(value: T | null, sources: string[], status: VerificationStatus, note?: string, alternatives?: { value: T; sources: string[] }[]): Fact<T> {
  return { value, sources, gameVersion: V, status, note, alternatives };
}

const WF = ['wf-specializations'];
const WF_GW = ['wf-specializations', 'gamers-scenarios'];

const singleSourceNumber = 'Single source (wf-specializations); not checked in-game.';

export const SPECIALIZATIONS: SpecializationDef[] = [
  {
    id: 'apprentice', name: 'Apprentice', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f('Recommended For New Players', WF_GW, 'partially-verified'),
    description: f('A generalist trainee who did not specialize and spent less on setup.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f<number>(null, ['wf-specializations', 'wiki-best-perks'], 'conflicting',
      'wf-specializations says 550; wiki-best-perks says "400 starting credits" for a normal Apprentice run. No value is shown as fact.',
      [{ value: 550, sources: ['wf-specializations'] }, { value: 400, sources: ['wiki-best-perks'] }]),
    startingRent: f(200, WF, 'unverified', singleSourceNumber),
    startScreenFeatures: f(['Increased starting Credit count', 'Additional equipment (Storage Bay)', 'Start with a stock of Household Goods and Food'], WF_GW, 'partially-verified'),
    startingInventory: f(['Storage Bay (Shabby)', '2 × Peat', 'Puice', '2 × Tube of Toothpaste', '2 × Roll of Toilet Paper', 'Skipping the intro adds a Food Neon Sign and a Household Item Neon Sign'], WF, 'unverified'),
    unlocks: f([], WF, 'unverified'),
    startingReputation: f({}, WF, 'unverified'),
    advantages: ['Extra storage (Storage Bay) and sellable general stock from day one.'],
    disadvantages: ['No specialised production equipment.'],
    perkInteractions: f(['Savings adds 150 credits on top of the specialization credits.'], ['wf-specializations', 'wf-perks'], 'unverified'),
  },
  {
    id: 'water-merchant', name: 'Water Merchant', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f<string>(null, WF_GW, 'partially-verified', 'No tag shown on the start screen.'),
    description: f('Trading in scarce clean water.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(400, WF, 'unverified', singleSourceNumber),
    startingRent: f(200, WF, 'unverified', singleSourceNumber),
    startScreenFeatures: f(['Water Trading Manual', 'Water Testing and Purification Equipment', 'Additional storage (Water Containers)'], WF_GW, 'partially-verified'),
    startingInventory: f(['Water Trading Manual', 'Water Testing Kit (full of Water Testing Strips)', 'Bottle of Water Purification Tablets (full)', 'Bottle of Water (Large), filled with Ghostwater', 'Jug of Water, filled with Rustwater', 'Bottle of Water (Large)', 'Bottle of Water (Standard)', 'Bottle of Water (Small)', 'Water Pitcher', 'Water Filter', 'HydraTech Micro Water Purifier (Shabby, 75/300 durability)', 'Bottle Printer (Shabby) holding an Energy Cell', 'Skipping the intro adds a Water Neon Sign'], WF, 'unverified',
      'wiki-water-merchant calls the purifier "HydroTech"; wf-specializations says "HydraTech".'),
    unlocks: f(['Water Trading network upgrade'], WF, 'unverified'),
    startingReputation: f({}, WF, 'unverified'),
    advantages: ['Water testing and purification kit from day one.'],
    disadvantages: ['Mislabeled water is the main way this start loses money (per wf-specializations).'],
    perkInteractions: f(['wiki-water-merchant recommends Working Pipes (unlimited Rustwater), Savings, Short Sleeper and Bad Lease.'], ['wiki-water-merchant'], 'unverified'),
  },
  {
    id: 'fence', name: 'Fence', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f<string>(null, WF_GW, 'partially-verified', 'No tag shown on the start screen.'),
    description: f('Dealing in stolen goods and keeping them hidden from station security.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(450, WF, 'unverified', singleSourceNumber),
    startingRent: f(250, WF, 'unverified', 'wf-specializations gives 250; "increased starting rent" is corroborated by gamers-scenarios.'),
    startScreenFeatures: f(['Additional equipment (Smuggler’s Bay)', 'Start with a stock of Contraband', 'Increased starting reputation (Black Market)', 'Decreased starting reputation (Security)', 'Immediate access to the Janitor Underground Exchange', 'Increased starting rent'], WF_GW, 'partially-verified'),
    startingInventory: f(['Smuggler’s Bay (Shabby)', '2 × Vial of “Dream Dust”', 'Ironcraft 10 (Fair condition)', '2 × 10mm Ammunition', 'Disposable Keycard (Medical)', 'Disposable Keycard (Engineering)', 'Disposable Keycard (Security)', '2 × Black Lamp (Shabby)'], WF, 'unverified'),
    unlocks: f(['Underground Exchange from day one'], WF_GW, 'partially-verified'),
    startingReputation: f({ 'black-market': { 'price-gouge': 45, 'mark-up': 30, 'thin-margins': 22.5, 'red-ink': 15 }, security: { 'price-gouge': -15, 'mark-up': -30, 'thin-margins': -37.5, 'red-ink': -60 } }, WF, 'unverified', singleSourceNumber),
    advantages: ['Contraband stock, Smuggler’s Bay and Black Market standing from day one.'],
    disadvantages: ['Starts with negative Security reputation.', 'Increased starting rent.', 'Intro not available.'],
    perkInteractions: f(["Sawyer's Crew's Underground Exchange unlock overlaps with this start's built-in access.", 'Model Citizen (+30 Security) does not reach the 20 Security threshold on Mark Up for this start (per wf-perks).'], ['wf-specializations', 'wf-perks'], 'unverified'),
  },
  {
    id: 'rock-bottom', name: 'Rock Bottom', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f('Extreme Challenge Mode', WF_GW, 'partially-verified'),
    description: f('The mentor negotiated only a lease; you have the store and a will to survive.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(0, ['wf-specializations', 'wiki-best-perks', 'wiki-starting-scenarios'], 'partially-verified', 'wf-specializations: 0; wiki-best-perks: "zero credits"; wiki-starting-scenarios: "start with nothing".'),
    startingRent: f(200, WF, 'unverified', singleSourceNumber),
    startScreenFeatures: f([], WF_GW, 'partially-verified', 'No starting equipment.'),
    startingInventory: f([], WF, 'unverified', 'No cassettes, no stock, no equipment.'),
    unlocks: f([], WF, 'unverified'),
    startingReputation: f({}, WF, 'unverified'),
    advantages: [],
    disadvantages: ['No credits, stock, equipment or cassettes.', 'Intro not available.'],
    perkInteractions: f(['Savings and Welfare Program are recommended for this start by wiki-best-perks.'], ['wiki-best-perks'], 'unverified'),
  },
  {
    id: 'hydroponic-farmer', name: 'Hydroponic Farmer', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f('Advanced Start', WF_GW, 'partially-verified'),
    description: f('Growing crops hydroponically in limited station space.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(450, WF, 'unverified', singleSourceNumber),
    startingRent: f(240, WF, 'unverified', 'wf-specializations gives 240; "increased starting rent" is corroborated by gamers-scenarios.'),
    startScreenFeatures: f(['Hydroponic Farming Manual', 'Additional equipment (Hydroponic Systems)', 'Start with a stock of Farming Supplies and Seeds', 'Increased starting rent'], WF_GW, 'partially-verified'),
    startingInventory: f(['Hydroponic Farming Manual', 'Old Hydroponic System (Shabby)', 'Decrepit Hydroponic System (Shabby) holding an Energy Cell, a Bottle of Water (Large) with Ghostwater, 2 × Eco Module and 2 × Ruined Module (not removable)', '2 × Sealed Water Ration (Small)', '2 × Nutrifruit Seed', 'Hydroponic Nutrient Tablet Bottle (full)', '2 × Fillerweed Seed'], WF, 'unverified'),
    unlocks: f(['Retired Farmer network upgrade'], WF, 'unverified'),
    startingReputation: f({}, WF, 'unverified'),
    advantages: ['Hydroponic systems, seeds and nutrients from day one.'],
    disadvantages: ['Increased starting rent.'],
    perkInteractions: f([], [], 'unverified'),
  },
  {
    id: 'gunsmith', name: 'Gunsmith', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f('Advanced Start', WF_GW, 'partially-verified'),
    description: f('Selling firearms and munitions, modifying weapons and handling licensed orders.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(150, WF, 'unverified', singleSourceNumber),
    startingRent: f(250, WF, 'unverified', 'wf-specializations gives 250, but neither it nor gamers-scenarios lists "Increased starting rent" among Gunsmith start-screen bullets. Treat with caution.'),
    startScreenFeatures: f(['Class I Weapon Permit', 'Start with a stock of Firearms and Gun Mods', 'Start with a stock of Ammunition'], WF_GW, 'partially-verified'),
    startingInventory: f(['3D Printer', 'Firearm Neon Sign', '4 × 3D Printing Filament', 'Gunsmith Storage Bay (Shabby)', '6 × .22 SR Ammunition (Non-Lethal)', '5 × .22 SR Ammunition', 'Nestfire Compact (Poor)', 'Nestfire Compact (Good)', 'Liberator 3D Printed Pistol (Poor)', 'Liberator 3D Printed Pistol (New)', 'Suppressor', 'Red Dot Sight', '2 × .22 Magazine', 'High Capacity .22 Magazine', 'Toy Laser Pointer', 'Makeshift Suppressor', 'Laser Sight', 'Improved Internal Springs', 'Screwdriver', 'Class I Weapon Permit (in the Display Case)', 'Gun Parts'], WF, 'unverified'),
    unlocks: f(['Retired Gunsmith network upgrade', 'Weapon Permit I network upgrade'], WF, 'unverified'),
    startingReputation: f({ security: { 'price-gouge': 37.5, 'mark-up': 25, 'thin-margins': 18.75, 'red-ink': 12.5 } }, WF, 'unverified', singleSourceNumber),
    advantages: ['Weapon permit, firearms, mods and ammunition from day one.'],
    disadvantages: ['Low starting credits.', 'Permit requires Security reputation of at least 8 (per wiki-gunsmith, unverified).', 'Intro not available.'],
    perkInteractions: f(['Convict / Public Enemy lower Security reputation, which the weapon permit depends on (inference from wiki-gunsmith permit rule; unverified).'], ['wiki-gunsmith', 'wf-perks'], 'unverified'),
  },
  {
    id: 'chemist', name: 'Chemist', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f('Advanced Start', WF_GW, 'partially-verified'),
    description: f('Working with controlled substances and a chemistry lab.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(300, WF, 'unverified', singleSourceNumber),
    startingRent: f(200, WF, 'unverified', singleSourceNumber),
    startScreenFeatures: f(['Chemistry Manual', 'Chemistry Lab Equipment'], WF_GW, 'partially-verified'),
    startingInventory: f(['Blender (Shabby)', 'Heating Plate (Shabby)', 'Evaporator (Shabby) with an Energy Cell', 'Chem Finisher (Shabby)', '1ml Dropper', '5ml Dropper', '25ml Graduated Cylinder', '50ml Graduated Cylinder', '100ml Graduated Cylinder', '2 × Bottle of Water (Standard)', 'Coffee Beans', 'Water Pitcher', 'Kotton Fabric', 'Composition Spectrometer (Shabby)', 'Mini Smuggler’s Bay (Shabby)', 'Chemistry Manual'], WF, 'unverified'),
    unlocks: f(['Retired Chemist network upgrade', 'Cartel Protection nightly service', 'Sector 13 Cartel faction (only exists in this start)'], WF, 'unverified'),
    startingReputation: f({ security: { 'price-gouge': -7.5, 'mark-up': -15, 'thin-margins': -18.75, 'red-ink': -30 } }, WF, 'unverified', singleSourceNumber),
    advantages: ['Full chemistry lab from day one.'],
    disadvantages: ['Starts with negative Security reputation.', 'Intro not available.'],
    perkInteractions: f(['Model Citizen alone does not reach 20 Security on Mark Up for this start (per wf-perks).'], ['wf-perks'], 'unverified'),
  },
  {
    id: 'rat-wrangler', name: 'Rat Wrangler', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f('Advanced Start', WF_GW, 'partially-verified'),
    description: f('Raising rats for meat.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(600, WF, 'unverified', singleSourceNumber),
    startingRent: f(200, WF, 'unverified', singleSourceNumber),
    startScreenFeatures: f(['Animal Cage', 'Rats', 'Food'], WF_GW, 'partially-verified'),
    startingInventory: f(['Animal Cage (Shabby) with a Livestock Feed Dispenser', '3 × Rat (Male)', '3 × Rat (Female)', 'Meat Cleaver', 'Blue Labeler', 'Marking Pen', 'Livestock Immunity Serum (2 uses left)', '6 × Small Nutrifruit'], WF, 'unverified'),
    unlocks: f(['Ranching network upgrade'], WF, 'unverified'),
    startingReputation: f({}, WF, 'unverified'),
    advantages: ['Breeding rat herd and feed from day one.'],
    disadvantages: [],
    perkInteractions: f([], [], 'unverified'),
  },
  {
    id: 'aquafarmer', name: 'Aquafarmer', sources: WF_GW, gameVersion: V, status: 'partially-verified', playable: true,
    tag: f('Advanced Start', WF_GW, 'partially-verified'),
    description: f('Raising fish in tanks for meat.', ['gamers-scenarios'], 'unverified'),
    startingCredits: f(150, WF, 'unverified', singleSourceNumber),
    startingRent: f(240, WF, 'unverified', 'wf-specializations gives 240; "increased starting rent" is corroborated by gamers-scenarios.'),
    startScreenFeatures: f(['Recirculating Aquaculture Systems', 'Start with a stock of Tilapia and Fish Food', 'Increased starting rent'], WF_GW, 'partially-verified'),
    startingInventory: f(['2 × Recirculating Aquaculture System (Shabby), each holding a RAS Water Tank, Energy Cell, Tilapia (Male), Tilapia (Female) and Fertilized Tilapia Roe', '2 × Industrial Fish Feed', 'Scrap Metal', 'Electronic Parts (Common)', 'Kitchen Knife', 'Marking Pen', '2 × Jug of Water, filled with Ghostwater'], WF, 'unverified'),
    unlocks: f(['Aquaculture network upgrade'], WF, 'unverified'),
    startingReputation: f({}, WF, 'unverified'),
    advantages: ['Two aquaculture systems with breeding Tilapia from day one.'],
    disadvantages: ['Low starting credits.', 'Increased starting rent.'],
    perkInteractions: f([], [], 'unverified'),
  },
];
