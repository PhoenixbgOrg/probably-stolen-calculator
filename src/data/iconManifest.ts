export type IconAssetKind = 'profession' | 'perk' | 'machine' | 'chemical';
export type IconLicenseStatus =
  | 'original-independent-pixel'
  | 'bundled-font-ofl'
  | 'missing-unlicensed';

export interface IconManifestEntry {
  id: string;
  name: string;
  kind: IconAssetKind;
  asset: 'inline-improved-pixel' | 'none';
  license: IconLicenseStatus;
  source: string;
  note: string;
}

const original = (id: string, name: string, kind: IconAssetKind): IconManifestEntry => ({
  id,
  name,
  kind,
  asset: 'inline-improved-pixel',
  license: 'original-independent-pixel',
  source: 'src/ui/ImprovedPixelIcon.tsx + src/ui/IconConcepts.tsx',
  note: 'Independent 9×9 pixel silhouette. Not a game sprite. Nicokobo terms 2026-11-01: game icons belong to rights holders; wiki CC BY-SA is wiki text only. No official fan-kit license found 2026-11-07.',
});

const missing = (id: string, name: string, kind: IconAssetKind): IconManifestEntry => ({
  id,
  name,
  kind,
  asset: 'none',
  license: 'missing-unlicensed',
  source: 'none',
  note: 'No authentic licensed icon and no official reuse permission found. UI uses English text labels. Wiki/CDN screenshots are not copied.',
});

export const ICON_MANIFEST: IconManifestEntry[] = [
  original('chemist', 'Chemist', 'profession'),
  original('water-merchant', 'Water Merchant', 'profession'),
  original('hydroponic-farmer', 'Hydroponic Farmer', 'profession'),
  original('aquafarmer', 'Aquafarmer', 'profession'),
  original('rat-wrangler', 'Rat Wrangler', 'profession'),
  original('gunsmith', 'Gunsmith', 'profession'),
  original('fence', 'Fence', 'profession'),
  original('apprentice', 'Apprentice', 'profession'),
  original('rock-bottom', 'Rock Bottom', 'profession'),
  original('junker', 'Junker (WIP, not selectable)', 'profession'),
  original('diplomatic', 'Diplomatic', 'perk'),
  original('intimidating', 'Intimidating', 'perk'),
  original('vending-machine', 'Vending Machine', 'perk'),
  original('vigilant', 'Vigilant', 'perk'),
  original('well-connected', 'Well Connected', 'perk'),
  original('working-pipes', 'Working Pipes', 'perk'),
  original('handy', 'Handy', 'perk'),
  original('lucky', 'Lucky', 'perk'),
  original('model-citizen', 'Model Citizen', 'perk'),
  original('proficient-scavenger', 'Proficient Scavenger', 'perk'),
  original('revolution-sympathizer', 'Revolution Sympathizer', 'perk'),
  original('savings', 'Savings', 'perk'),
  original('sawyers-crew', "Sawyer's Crew", 'perk'),
  original('secret-admirer', 'Secret Admirer', 'perk'),
  original('short-sleeper', 'Short Sleeper', 'perk'),
  original('sycophant', 'Sycophant', 'perk'),
  original('tapehead', 'Tapehead', 'perk'),
  original('tinkerer', 'Tinkerer', 'perk'),
  original('welfare-program', 'Welfare Program', 'perk'),
  original('wilds-favorite', "Wild's Favorite", 'perk'),
  original('aug-menace', 'Aug Menace', 'perk'),
  original('colorful-character', 'Colorful Character', 'perk'),
  original('makeshift-reactor', 'Makeshift Reactor', 'perk'),
  original('careful-scavenger', 'Careful Scavenger', 'perk'),
  original('hoarder', 'Hoarder', 'perk'),
  original('prime-real-estate', 'Prime Real Estate', 'perk'),
  original('ascetic', 'Ascetic', 'perk'),
  original('awful-negotiator', 'Awful Negotiator', 'perk'),
  original('sentinel-collapse-disorder', 'Sentinel Collapse Disorder', 'perk'),
  original('blabbermouth', 'Blabbermouth', 'perk'),
  original('blackmail', 'Blackmail', 'perk'),
  original('known-snitch', 'Known Snitch', 'perk'),
  original('maimed', 'Maimed', 'perk'),
  original('minimalist', 'Minimalist', 'perk'),
  original('public-enemy', 'Public Enemy', 'perk'),
  original('agoraphobia', 'Agoraphobia', 'perk'),
  original('alcohol-addiction', 'Alcohol Addiction', 'perk'),
  original('bad-lease', 'Bad Lease', 'perk'),
  original('banned-from-the-commissary', 'Banned From The Commissary', 'perk'),
  original('convict', 'Convict', 'perk'),
  original('degenerative-osteoarthritis', 'Degenerative Osteoarthritis', 'perk'),
  original('gambling-addiction', 'Gambling Addiction', 'perk'),
  original('illiterate', 'Illiterate', 'perk'),
  original('narcotic-addiction', 'Narcotic Addiction', 'perk'),
  original('nicotine-addiction', 'Nicotine Addiction', 'perk'),
  original('on-wilds-bad-side', "On Wild's Bad Side", 'perk'),
  original('side-street', 'Side Street', 'perk'),
  original('unlucky', 'Unlucky', 'perk'),
  missing('blender', 'Blender', 'machine'),
  missing('heating-plate', 'Heating Plate', 'machine'),
  missing('filter-container', 'Filter Container / Water Pitcher', 'machine'),
  missing('kotton-fabric', 'Kotton Fabric', 'machine'),
  missing('water-filter', 'Water Filter', 'machine'),
  missing('evaporator', 'Evaporator', 'machine'),
  missing('chem-finisher', 'Chem Finisher', 'machine'),
  missing('composition-spectrometer', 'Composition Spectrometer', 'machine'),
  missing('dream-cap-mush', 'Dream Cap Mush', 'chemical'),
  missing('dream-cap-extract', 'Dream Cap Extract', 'chemical'),
  missing('alcohol', 'Alcohol', 'chemical'),
  missing('acid', 'Acid', 'chemical'),
  missing('base', 'Base', 'chemical'),
  missing('protein', 'Protein', 'chemical'),
  missing('chemical-contaminant', 'Chemical Contaminant', 'chemical'),
  missing('heavy-metal', 'Heavy Metal', 'chemical'),
];

export function iconManifestSummary(): {
  professionsOriginal: number;
  perksOriginal: number;
  machinesMissing: number;
  chemicalsMissing: number;
} {
  return {
    professionsOriginal: ICON_MANIFEST.filter((entry) => entry.kind === 'profession' && entry.id !== 'junker' && entry.asset !== 'none').length,
    perksOriginal: ICON_MANIFEST.filter((entry) => entry.kind === 'perk' && entry.asset !== 'none').length,
    machinesMissing: ICON_MANIFEST.filter((entry) => entry.kind === 'machine' && entry.asset === 'none').length,
    chemicalsMissing: ICON_MANIFEST.filter((entry) => entry.kind === 'chemical' && entry.asset === 'none').length,
  };
}
