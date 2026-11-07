export type IconAssetKind = 'profession' | 'perk' | 'machine' | 'chemical';
export type ArtworkPermission = 'none-found';
export type ArtworkStatus = 'purpose-based-original-svg';

export interface IconManifestEntry {
  id: string;
  name: string;
  kind: IconAssetKind;
  assetPath: string;
  nameReferenceUrl: string;
  nameReferenceTitle: string;
  individualArtworkUrl: string | null;
  artworkPermission: ArtworkPermission;
  artworkStatus: ArtworkStatus;
  appearanceVerifiedVsGameSprite: false;
  license: 'project-original-svg-not-game-asset';
  caption: string;
  accessibleLabel: string;
  note: string;
}

const CAPTION = 'Calculator symbol — not a game sprite';
const NO_SPRITE =
  'No licensed authentic game icon was found. This file is an original purpose-based SVG drawn in this repo. Appearance vs the in-game sprite is unverified and is not claimed authentic.';
const TERMS =
  'Nicokobo terms 2026-11-01: game icons belong to rights holders; wiki CC BY-SA is wiki text only. No official fan-kit license found 2026-11-07.';

const NK_OCC = 'https://probably-stolen.nicokobo.com/en/collections/occupations';
const NK_PERKS = 'https://probably-stolen.nicokobo.com/en/wiki/perks/starting-perks';
const WF_SPEC = 'https://walkthroughforge.com/probably-stolen/starting-specializations/';
const WF_PERKS = 'https://walkthroughforge.com/probably-stolen/starting-perks/';
const CHEM = 'https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing';

function entry(
  id: string,
  name: string,
  kind: IconAssetKind,
  nameReferenceUrl: string,
  nameReferenceTitle: string,
  extraNote = '',
): IconManifestEntry {
  return {
    id,
    name,
    kind,
    assetPath: `icons/${id}.svg`,
    nameReferenceUrl,
    nameReferenceTitle,
    individualArtworkUrl: null,
    artworkPermission: 'none-found',
    artworkStatus: 'purpose-based-original-svg',
    appearanceVerifiedVsGameSprite: false,
    license: 'project-original-svg-not-game-asset',
    caption: CAPTION,
    accessibleLabel: `${name} (calculator symbol, not a game sprite)`,
    note: [NO_SPRITE, TERMS, extraNote].filter(Boolean).join(' '),
  };
}

export const ICON_MANIFEST: IconManifestEntry[] = [
  entry('chemist', 'Chemist', 'profession', NK_OCC, 'Occupations and starting perks (collection)', `Name also listed at ${WF_SPEC}.`),
  entry('water-merchant', 'Water Merchant', 'profession', 'https://www.probablystolen-wiki.wiki/water/Probably-Stolen-water-merchant', 'Water Merchant guide'),
  entry('hydroponic-farmer', 'Hydroponic Farmer', 'profession', NK_OCC, 'Occupations and starting perks (collection)', `Name also listed at ${WF_SPEC}.`),
  entry('aquafarmer', 'Aquafarmer', 'profession', NK_OCC, 'Occupations and starting perks (collection)', `Name also listed at ${WF_SPEC}.`),
  entry('rat-wrangler', 'Rat Wrangler', 'profession', NK_OCC, 'Occupations and starting perks (collection)', `Name also listed at ${WF_SPEC}.`),
  entry('gunsmith', 'Gunsmith', 'profession', 'https://www.probablystolen-wiki.wiki/scenarios/Probably-Stolen-gunsmith', 'Gunsmith setup guide'),
  entry('fence', 'Fence', 'profession', NK_OCC, 'Occupations and starting perks (collection)', `Name also listed at ${WF_SPEC}.`),
  entry('apprentice', 'Apprentice', 'profession', NK_OCC, 'Occupations and starting perks (collection)', `Name also listed at ${WF_SPEC}.`),
  entry('rock-bottom', 'Rock Bottom', 'profession', NK_OCC, 'Occupations and starting perks (collection)', `Name also listed at ${WF_SPEC}.`),
  entry('junker', 'Junker (WIP, not selectable)', 'profession', NK_OCC, 'Occupations and starting perks (collection)', 'Shown disabled. Not a startable profession.'),
  entry('diplomatic', 'Diplomatic', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}. No per-perk artwork page.`),
  entry('intimidating', 'Intimidating', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('vending-machine', 'Vending Machine', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('vigilant', 'Vigilant', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('well-connected', 'Well Connected', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('working-pipes', 'Working Pipes', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('handy', 'Handy', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('lucky', 'Lucky', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('model-citizen', 'Model Citizen', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('proficient-scavenger', 'Proficient Scavenger', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('revolution-sympathizer', 'Revolution Sympathizer', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('savings', 'Savings', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('sawyers-crew', "Sawyer's Crew", 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('secret-admirer', 'Secret Admirer', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('short-sleeper', 'Short Sleeper', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('sycophant', 'Sycophant', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('tapehead', 'Tapehead', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('tinkerer', 'Tinkerer', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('welfare-program', 'Welfare Program', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('wilds-favorite', "Wild's Favorite", 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('aug-menace', 'Aug Menace', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('colorful-character', 'Colorful Character', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('makeshift-reactor', 'Makeshift Reactor', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('careful-scavenger', 'Careful Scavenger', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('hoarder', 'Hoarder', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('prime-real-estate', 'Prime Real Estate', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('ascetic', 'Ascetic', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('awful-negotiator', 'Awful Negotiator', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('sentinel-collapse-disorder', 'Sentinel Collapse Disorder', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('blabbermouth', 'Blabbermouth', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('blackmail', 'Blackmail', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('known-snitch', 'Known Snitch', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('maimed', 'Maimed', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('minimalist', 'Minimalist', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('public-enemy', 'Public Enemy', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('agoraphobia', 'Agoraphobia', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('alcohol-addiction', 'Alcohol Addiction', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('bad-lease', 'Bad Lease', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('banned-from-the-commissary', 'Banned From The Commissary', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('convict', 'Convict', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('degenerative-osteoarthritis', 'Degenerative Osteoarthritis', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('gambling-addiction', 'Gambling Addiction', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('illiterate', 'Illiterate', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('narcotic-addiction', 'Narcotic Addiction', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('nicotine-addiction', 'Nicotine Addiction', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('on-wilds-bad-side', "On Wild's Bad Side", 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('side-street', 'Side Street', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('unlucky', 'Unlucky', 'perk', NK_PERKS, 'Starting Perks (article)', `Name also listed at ${WF_PERKS}.`),
  entry('blender', 'Blender', 'machine', 'https://probably-stolen.nicokobo.com/en/items/blender', 'Blender'),
  entry('heating-plate', 'Heating Plate', 'machine', 'https://probably-stolen.nicokobo.com/en/items/heating_plate', 'Heating Plate'),
  entry('filter-container', 'Filter Container / Water Pitcher', 'machine', 'https://probably-stolen.nicokobo.com/en/items/water_filter', 'Water Filter', 'Pitcher/container is the host for the filter. Separate pitcher artwork page was not confirmed.'),
  entry('kotton-fabric', 'Kotton Fabric', 'machine', 'https://probably-stolen.nicokobo.com/en/items/kotton_fabric', 'Kotton Fabric'),
  entry('water-filter', 'Water Filter', 'machine', 'https://probably-stolen.nicokobo.com/en/items/water_filter', 'Water Filter'),
  entry('evaporator', 'Evaporator', 'machine', 'https://probably-stolen.nicokobo.com/en/items/evaporator', 'Evaporator'),
  entry('chem-finisher', 'Chem Finisher', 'machine', 'https://probably-stolen.nicokobo.com/en/items/chem_finisher', 'Chem Finisher'),
  entry('dream-cap', 'Dream Cap', 'chemical', 'https://probably-stolen.nicokobo.com/en/items/dream_cap', 'Dream Cap'),
  entry('dream-cap-mush', 'Dream Cap Mush', 'chemical', CHEM, 'Chemical processing', 'Component of Dream Cap, not a separate licensed sprite.'),
  entry('dream-cap-extract', 'Dream Cap Extract', 'chemical', CHEM, 'Chemical processing'),
  entry('alcohol', 'Alcohol', 'chemical', CHEM, 'Chemical processing', 'No separate Alcohol item sprite license found.'),
  entry('acid', 'Acid', 'chemical', CHEM, 'Chemical processing', 'Acidic Solution name; no licensed bottle sprite found.'),
  entry('base', 'Base', 'chemical', CHEM, 'Chemical processing', 'Basic Solution name; no licensed bottle sprite found.'),
  entry('dream-dust', 'Dream Dust', 'chemical', 'https://probably-stolen.nicokobo.com/en/items/chem_finisher', 'Chem Finisher', 'Finisher output "Vial of Dream Dust"; vial sprite not copied.'),
  entry('protein', 'Protein', 'chemical', CHEM, 'Chemical processing'),
  entry('chemical-contaminant', 'Chemical Contaminant', 'chemical', CHEM, 'Chemical processing'),
  entry('heavy-metal', 'Heavy Metal', 'chemical', CHEM, 'Chemical processing'),
];

export function getIconEntry(id: string): IconManifestEntry | undefined {
  return ICON_MANIFEST.find((entry) => entry.id === id);
}

export function iconManifestSummary(): {
  professionsOriginal: number;
  perksOriginal: number;
  machinesOriginal: number;
  chemicalsOriginal: number;
  appearanceUnverified: number;
} {
  return {
    professionsOriginal: ICON_MANIFEST.filter((entry) => entry.kind === 'profession' && entry.id !== 'junker').length,
    perksOriginal: ICON_MANIFEST.filter((entry) => entry.kind === 'perk').length,
    machinesOriginal: ICON_MANIFEST.filter((entry) => entry.kind === 'machine').length,
    chemicalsOriginal: ICON_MANIFEST.filter((entry) => entry.kind === 'chemical').length,
    appearanceUnverified: ICON_MANIFEST.filter((entry) => entry.appearanceVerifiedVsGameSprite === false).length,
  };
}
