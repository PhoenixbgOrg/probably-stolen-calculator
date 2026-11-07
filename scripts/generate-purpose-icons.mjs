/**
 * Writes original 32×32 purpose-based SVG tiles to public/icons/.
 * These are calculator symbols, not game sprites. Geometry is invented here
 * from the documented purpose of each name; in-game artwork was not copied.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../public/icons');
mkdirSync(outDir, { recursive: true });

const BG = '#1d1826';
const INK = {
  spec: '#9fd3c4',
  pos: '#8fd16a',
  neu: '#e8a84a',
  neg: '#e0605a',
  machine: '#7ec8e3',
  chemical: '#c9a0e8',
  water: '#6cb4d4',
  dark: '#15111c',
};

function svg(id, title, color, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges" role="img" aria-labelledby="t">
  <title id="t">${title} — calculator symbol, not a game sprite</title>
  <rect width="32" height="32" fill="${BG}"/>
  <rect x="1" y="1" width="30" height="30" fill="none" stroke="${color}" stroke-width="2"/>
  ${body}
</svg>
`;
}

const r = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;

const drawings = {
  chemist: [r(13, 3, 6, 3, INK.spec), r(14, 6, 4, 3, INK.spec), r(8, 9, 16, 16, INK.spec), r(10, 17, 12, 6, INK.water)],
  'water-merchant': [r(13, 3, 6, 3, INK.water), r(10, 6, 12, 20, INK.spec), r(12, 14, 8, 10, INK.water)],
  'hydroponic-farmer': [r(15, 4, 2, 10, INK.pos), r(8, 6, 6, 3, INK.pos), r(18, 6, 6, 3, INK.pos), r(10, 16, 12, 10, INK.neu)],
  aquafarmer: [r(4, 14, 4, 4, INK.water), r(8, 10, 14, 12, INK.spec), r(22, 12, 6, 8, INK.spec), r(12, 12, 2, 2, INK.dark)],
  'rat-wrangler': [r(6, 8, 4, 4, INK.neu), r(8, 10, 10, 8, INK.spec), r(18, 14, 8, 6, INK.spec), r(24, 18, 4, 6, INK.neu)],
  gunsmith: [r(6, 16, 8, 8, INK.neu), r(10, 12, 16, 6, INK.spec), r(24, 10, 4, 4, INK.spec)],
  fence: [r(6, 8, 20, 16, INK.neu), r(8, 10, 16, 12, INK.dark), r(14, 14, 4, 4, INK.neg)],
  apprentice: [r(6, 10, 20, 14, INK.spec), r(6, 10, 20, 2, INK.neu), r(15, 10, 2, 14, INK.neu)],
  'rock-bottom': [r(8, 8, 4, 16, INK.neg), r(20, 8, 4, 16, INK.neg), r(8, 22, 16, 4, INK.neg)],
  junker: [r(6, 18, 20, 8, INK.neu), r(8, 12, 6, 6, INK.spec), r(16, 8, 8, 10, INK.water)],
  diplomatic: [r(4, 12, 10, 8, INK.pos), r(18, 12, 10, 8, INK.pos), r(12, 14, 8, 4, INK.spec)],
  intimidating: [r(8, 6, 16, 18, INK.neg), r(12, 12, 2, 2, INK.dark), r(18, 12, 2, 2, INK.dark), r(12, 20, 8, 2, INK.dark)],
  'vending-machine': [r(8, 4, 16, 24, INK.spec), r(10, 6, 12, 8, INK.water), r(12, 20, 8, 4, INK.neu)],
  vigilant: [r(6, 12, 20, 8, INK.pos), r(14, 14, 4, 4, INK.dark), r(8, 10, 16, 2, INK.pos)],
  'well-connected': [r(6, 6, 4, 4, INK.pos), r(22, 6, 4, 4, INK.pos), r(6, 22, 4, 4, INK.pos), r(22, 22, 4, 4, INK.pos), r(14, 14, 4, 4, INK.spec)],
  'working-pipes': [r(4, 14, 24, 4, INK.spec), r(24, 18, 4, 8, INK.water)],
  handy: [r(10, 6, 4, 16, INK.neu), r(8, 8, 16, 4, INK.spec), r(20, 12, 4, 10, INK.neu)],
  lucky: [r(10, 8, 12, 16, INK.pos), r(10, 20, 4, 4, INK.pos), r(18, 20, 4, 4, INK.pos)],
  'model-citizen': [r(8, 6, 16, 10, INK.pos), r(12, 16, 8, 10, INK.spec)],
  'proficient-scavenger': [r(8, 16, 16, 8, INK.neu), r(12, 8, 8, 8, INK.pos), r(20, 12, 6, 6, INK.spec)],
  'revolution-sympathizer': [r(8, 6, 16, 4, INK.pos), r(14, 10, 4, 16, INK.pos), r(8, 22, 16, 4, INK.pos)],
  savings: [r(10, 8, 12, 16, INK.neu), r(12, 12, 8, 8, INK.pos)],
  'sawyers-crew': [r(6, 10, 8, 12, INK.spec), r(18, 10, 8, 12, INK.spec), r(12, 14, 8, 4, INK.pos)],
  'secret-admirer': [r(10, 8, 12, 10, INK.pos), r(8, 12, 16, 8, INK.pos), r(14, 12, 4, 4, INK.dark)],
  'short-sleeper': [r(6, 10, 20, 12, INK.spec), r(10, 14, 4, 4, INK.neu), r(18, 14, 4, 4, INK.neu)],
  sycophant: [r(8, 8, 16, 16, INK.pos), r(12, 12, 8, 4, INK.dark), r(14, 18, 4, 4, INK.dark)],
  tapehead: [r(6, 10, 20, 12, INK.spec), r(10, 14, 4, 4, INK.dark), r(18, 14, 4, 4, INK.dark)],
  tinkerer: [r(8, 8, 6, 16, INK.neu), r(18, 8, 6, 16, INK.neu), r(12, 14, 8, 4, INK.spec)],
  'welfare-program': [r(8, 8, 16, 6, INK.pos), r(10, 16, 12, 8, INK.spec)],
  'wilds-favorite': [r(8, 6, 16, 8, INK.pos), r(12, 14, 8, 12, INK.spec)],
  'aug-menace': [r(8, 8, 16, 16, INK.neu), r(12, 12, 8, 8, INK.neg)],
  'colorful-character': [r(6, 8, 6, 16, INK.pos), r(13, 8, 6, 16, INK.neu), r(20, 8, 6, 16, INK.water)],
  'makeshift-reactor': [r(10, 6, 12, 20, INK.neu), r(14, 10, 4, 12, INK.spec)],
  'careful-scavenger': [r(8, 16, 16, 8, INK.neu), r(10, 8, 4, 8, INK.spec), r(18, 10, 4, 6, INK.pos)],
  hoarder: [r(6, 18, 8, 8, INK.neu), r(12, 12, 8, 14, INK.spec), r(18, 8, 8, 18, INK.water)],
  'prime-real-estate': [r(6, 18, 20, 8, INK.neu), r(8, 10, 6, 8, INK.spec), r(18, 6, 8, 12, INK.pos)],
  ascetic: [r(14, 6, 4, 20, INK.neg), r(10, 10, 12, 4, INK.neg)],
  'awful-negotiator': [r(6, 12, 8, 8, INK.neg), r(18, 12, 8, 8, INK.spec), r(14, 14, 4, 4, INK.dark)],
  'sentinel-collapse-disorder': [r(8, 6, 16, 6, INK.neg), r(12, 12, 8, 14, INK.neu)],
  blabbermouth: [r(10, 8, 12, 10, INK.neg), r(12, 18, 8, 6, INK.spec)],
  blackmail: [r(8, 8, 16, 16, INK.neg), r(12, 12, 8, 2, INK.dark), r(12, 16, 8, 2, INK.dark)],
  'known-snitch': [r(8, 8, 16, 12, INK.neg), r(14, 20, 4, 6, INK.neu)],
  maimed: [r(8, 10, 6, 14, INK.spec), r(18, 16, 6, 8, INK.neg)],
  minimalist: [r(12, 12, 8, 8, INK.neg)],
  'public-enemy': [r(8, 8, 16, 16, INK.neg), r(10, 10, 12, 12, INK.dark), r(14, 14, 4, 4, INK.neg)],
  agoraphobia: [r(6, 6, 20, 4, INK.neg), r(6, 6, 4, 20, INK.neg), r(22, 6, 4, 20, INK.neg), r(6, 22, 20, 4, INK.neg)],
  'alcohol-addiction': [r(12, 4, 8, 4, INK.neg), r(10, 8, 12, 18, INK.chemical)],
  'bad-lease': [r(8, 8, 16, 16, INK.neg), r(12, 12, 8, 8, INK.dark)],
  'banned-from-the-commissary': [r(8, 8, 16, 16, INK.spec), r(10, 14, 12, 4, INK.neg), r(14, 10, 4, 12, INK.neg)],
  convict: [r(8, 6, 16, 20, INK.neg), r(8, 10, 16, 2, INK.dark), r(8, 16, 16, 2, INK.dark)],
  'degenerative-osteoarthritis': [r(8, 18, 16, 6, INK.neg), r(10, 8, 4, 10, INK.spec), r(18, 10, 4, 8, INK.spec)],
  'gambling-addiction': [r(8, 8, 16, 16, INK.neg), r(10, 10, 5, 5, INK.neu), r(17, 17, 5, 5, INK.neu)],
  illiterate: [r(8, 8, 16, 16, INK.spec), r(10, 12, 12, 2, INK.neg), r(10, 18, 8, 2, INK.neg)],
  'narcotic-addiction': [r(14, 6, 4, 10, INK.neg), r(10, 14, 12, 10, INK.chemical)],
  'nicotine-addiction': [r(6, 18, 16, 4, INK.neg), r(20, 8, 4, 14, INK.neu)],
  'on-wilds-bad-side': [r(8, 10, 16, 14, INK.spec), r(12, 14, 8, 2, INK.neg), r(14, 18, 4, 4, INK.neg)],
  'side-street': [r(6, 8, 10, 16, INK.spec), r(20, 14, 6, 10, INK.neg)],
  unlucky: [r(10, 8, 12, 14, INK.neg), r(10, 20, 4, 4, INK.neg), r(18, 20, 4, 4, INK.neg), r(12, 12, 8, 2, INK.dark)],
  blender: [r(10, 4, 12, 6, INK.machine), r(8, 10, 16, 16, INK.machine), r(12, 14, 8, 8, INK.water)],
  'heating-plate': [r(6, 18, 20, 8, INK.machine), r(10, 10, 12, 8, INK.neg), r(14, 6, 4, 4, INK.neu)],
  'filter-container': [r(8, 6, 16, 20, INK.machine), r(10, 10, 12, 12, INK.water)],
  'kotton-fabric': [r(6, 8, 20, 4, INK.machine), r(6, 14, 20, 4, INK.spec), r(6, 20, 20, 4, INK.machine)],
  'water-filter': [r(10, 4, 12, 24, INK.machine), r(12, 8, 8, 16, INK.water), r(14, 12, 4, 4, INK.dark)],
  evaporator: [r(8, 6, 16, 8, INK.machine), r(10, 14, 12, 12, INK.water), r(14, 4, 4, 4, INK.spec)],
  'chem-finisher': [r(8, 8, 16, 16, INK.machine), r(12, 12, 8, 8, INK.chemical), r(14, 4, 4, 4, INK.spec)],
  'dream-cap': [r(10, 8, 12, 8, INK.chemical), r(12, 16, 8, 10, INK.spec)],
  'dream-cap-mush': [r(8, 14, 16, 10, INK.chemical), r(12, 6, 8, 8, INK.spec)],
  'dream-cap-extract': [r(12, 4, 8, 6, INK.chemical), r(10, 10, 12, 16, INK.chemical), r(12, 18, 8, 6, INK.spec)],
  alcohol: [r(12, 4, 8, 4, INK.machine), r(10, 8, 12, 18, INK.chemical), r(12, 16, 8, 8, INK.water)],
  acid: [r(10, 6, 12, 20, INK.neg), r(14, 4, 4, 4, INK.machine), r(12, 14, 8, 8, INK.neu)],
  base: [r(10, 6, 12, 20, INK.pos), r(14, 4, 4, 4, INK.machine), r(12, 14, 8, 8, INK.spec)],
  'dream-dust': [r(10, 6, 12, 20, INK.chemical), r(12, 10, 8, 12, INK.spec)],
  protein: [r(8, 10, 16, 12, INK.chemical), r(12, 14, 8, 4, INK.neu)],
  'chemical-contaminant': [r(8, 8, 16, 16, INK.neg), r(12, 12, 8, 8, INK.neu)],
  'heavy-metal': [r(8, 12, 16, 10, INK.neu), r(12, 8, 8, 4, INK.machine)],
};

const titles = {
  chemist: 'Chemist',
  'water-merchant': 'Water Merchant',
  'hydroponic-farmer': 'Hydroponic Farmer',
  aquafarmer: 'Aquafarmer',
  'rat-wrangler': 'Rat Wrangler',
  gunsmith: 'Gunsmith',
  fence: 'Fence',
  apprentice: 'Apprentice',
  'rock-bottom': 'Rock Bottom',
  junker: 'Junker',
  diplomatic: 'Diplomatic',
  intimidating: 'Intimidating',
  'vending-machine': 'Vending Machine',
  vigilant: 'Vigilant',
  'well-connected': 'Well Connected',
  'working-pipes': 'Working Pipes',
  handy: 'Handy',
  lucky: 'Lucky',
  'model-citizen': 'Model Citizen',
  'proficient-scavenger': 'Proficient Scavenger',
  'revolution-sympathizer': 'Revolution Sympathizer',
  savings: 'Savings',
  'sawyers-crew': "Sawyer's Crew",
  'secret-admirer': 'Secret Admirer',
  'short-sleeper': 'Short Sleeper',
  sycophant: 'Sycophant',
  tapehead: 'Tapehead',
  tinkerer: 'Tinkerer',
  'welfare-program': 'Welfare Program',
  'wilds-favorite': "Wild's Favorite",
  'aug-menace': 'Aug Menace',
  'colorful-character': 'Colorful Character',
  'makeshift-reactor': 'Makeshift Reactor',
  'careful-scavenger': 'Careful Scavenger',
  hoarder: 'Hoarder',
  'prime-real-estate': 'Prime Real Estate',
  ascetic: 'Ascetic',
  'awful-negotiator': 'Awful Negotiator',
  'sentinel-collapse-disorder': 'Sentinel Collapse Disorder',
  blabbermouth: 'Blabbermouth',
  blackmail: 'Blackmail',
  'known-snitch': 'Known Snitch',
  maimed: 'Maimed',
  minimalist: 'Minimalist',
  'public-enemy': 'Public Enemy',
  agoraphobia: 'Agoraphobia',
  'alcohol-addiction': 'Alcohol Addiction',
  'bad-lease': 'Bad Lease',
  'banned-from-the-commissary': 'Banned From The Commissary',
  convict: 'Convict',
  'degenerative-osteoarthritis': 'Degenerative Osteoarthritis',
  'gambling-addiction': 'Gambling Addiction',
  illiterate: 'Illiterate',
  'narcotic-addiction': 'Narcotic Addiction',
  'nicotine-addiction': 'Nicotine Addiction',
  'on-wilds-bad-side': "On Wild's Bad Side",
  'side-street': 'Side Street',
  unlucky: 'Unlucky',
  blender: 'Blender',
  'heating-plate': 'Heating Plate',
  'filter-container': 'Filter Container',
  'kotton-fabric': 'Kotton Fabric',
  'water-filter': 'Water Filter',
  evaporator: 'Evaporator',
  'chem-finisher': 'Chem Finisher',
  'dream-cap': 'Dream Cap',
  'dream-cap-mush': 'Dream Cap Mush',
  'dream-cap-extract': 'Dream Cap Extract',
  alcohol: 'Alcohol',
  acid: 'Acid',
  base: 'Base',
  'dream-dust': 'Dream Dust',
  protein: 'Protein',
  'chemical-contaminant': 'Chemical Contaminant',
  'heavy-metal': 'Heavy Metal',
};

const colors = {
  chemist: INK.spec, 'water-merchant': INK.spec, 'hydroponic-farmer': INK.spec, aquafarmer: INK.spec,
  'rat-wrangler': INK.spec, gunsmith: INK.spec, fence: INK.spec, apprentice: INK.spec,
  'rock-bottom': INK.spec, junker: INK.neu,
  blender: INK.machine, 'heating-plate': INK.machine, 'filter-container': INK.machine,
  'kotton-fabric': INK.machine, 'water-filter': INK.machine, evaporator: INK.machine, 'chem-finisher': INK.machine,
  'dream-cap': INK.chemical, 'dream-cap-mush': INK.chemical, 'dream-cap-extract': INK.chemical,
  alcohol: INK.chemical, acid: INK.neg, base: INK.pos, 'dream-dust': INK.chemical,
  protein: INK.chemical, 'chemical-contaminant': INK.neg, 'heavy-metal': INK.neu,
};

const positive = new Set(['diplomatic','intimidating','vending-machine','vigilant','well-connected','working-pipes','handy','lucky','model-citizen','proficient-scavenger','revolution-sympathizer','savings','sawyers-crew','secret-admirer','short-sleeper','sycophant','tapehead','tinkerer','welfare-program','wilds-favorite']);
const neutral = new Set(['aug-menace','colorful-character','makeshift-reactor','careful-scavenger','hoarder','prime-real-estate']);

for (const [id, body] of Object.entries(drawings)) {
  const color = colors[id] ?? (positive.has(id) ? INK.pos : neutral.has(id) ? INK.neu : INK.neg);
  writeFileSync(join(outDir, `${id}.svg`), svg(id, titles[id] ?? id, color, body.join('')));
}

console.log(`wrote ${Object.keys(drawings).length} icons to public/icons`);
