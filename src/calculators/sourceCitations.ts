/**
 * Evidence classes for Chemist formulas. Retrieved 2026-11-07.
 *
 * [SOURCE / STATIC] nicokobo pages still print "0.46D / Steam Build 26337366"
 * while SteamDB maps build 26337366 to 1.0.0.6 (2026-10-31). Label lag is not
 * a re-verification of every formula against 100-REV6 screenshots.
 *
 * [CURRENT / STEAM NEWS] official news for 1.0.0.5–1.0.0.6.
 * [OBSERVED / OWNER] specific batches in the 2026-11-07 handoff.
 * [DERIVED] arithmetic from a cited formula.
 * [HYPOTHESIS] unmarked; never used as a silent fudge.
 */

export type EvidenceClass =
  | 'SOURCE_STATIC'
  | 'CURRENT_STEAM_NEWS'
  | 'OBSERVED_OWNER'
  | 'DERIVED'
  | 'HYPOTHESIS';

export interface Citation {
  id: string;
  evidence: EvidenceClass;
  title: string;
  url: string;
  retrieved: string;
  gameVersionPrinted: string;
  note: string;
}

export const CITATIONS: Citation[] = [
  {
    id: 'wiki-chemical-processing',
    evidence: 'SOURCE_STATIC',
    title: 'Chemical processing',
    url: 'https://probably-stolen.nicokobo.com/en/wiki/terms/chemical-processing',
    retrieved: '2026-11-07',
    gameVersionPrinted: '0.46D / Steam Build 26337366',
    note: 'Branches 13 organic-waste mineralization, 14 acid/base microbe removal, 15 stabilizer, 16 protein, 17 lipobond/fat, 18 neutralization, 21 chlorine. Lipobond bp 55°C is evaporative. Page text CC BY-SA 4.0; game assets are not.',
  },
  {
    id: 'wiki-blender',
    evidence: 'SOURCE_STATIC',
    title: 'Blender',
    url: 'https://probably-stolen.nicokobo.com/en/items/blender',
    retrieved: '2026-11-07',
    gameVersionPrinted: '0.46D / Steam Build 26337366',
    note: 'Module loss 35/20/10/5/0%; midpoint rounding away from zero per component.',
  },
  {
    id: 'wiki-water-filter',
    evidence: 'SOURCE_STATIC',
    title: 'Water Filter',
    url: 'https://probably-stolen.nicokobo.com/en/items/water_filter',
    retrieved: '2026-11-07',
    gameVersionPrinted: '0.46D / Steam Build 26337366',
    note: 'Pore 22; durability 400; liquid-table order; residual floors; Heavy Metal 12 and Chemical Contaminant 2 pass; Microbes skipped.',
  },
  {
    id: 'wiki-kotton',
    evidence: 'SOURCE_STATIC',
    title: 'Kotton Fabric',
    url: 'https://probably-stolen.nicokobo.com/en/items/kotton_fabric',
    retrieved: '2026-11-07',
    gameVersionPrinted: '0.46D / Steam Build 26337366',
    note: 'Pore 150, base durability 1000. Per-step table is on the Water Filter page; combining pore 150 with that table is DERIVED.',
  },
  {
    id: 'wiki-evaporator',
    evidence: 'SOURCE_STATIC',
    title: 'Evaporator',
    url: 'https://probably-stolen.nicokobo.com/en/items/evaporator',
    retrieved: '2026-11-07',
    gameVersionPrinted: '0.46D / Steam Build 26337366',
    note: 'Allowance round_even(300000×max(0,1+P/100)); Water, Alcohol and Lipobond evaporate; Solvent Recovery recovers Alcohol only; energy 6 modified by Efficiency.',
  },
  {
    id: 'wiki-machine-modules',
    evidence: 'SOURCE_STATIC',
    title: 'Machine Modules',
    url: 'https://probably-stolen.nicokobo.com/en/wiki/terms/machine-modules',
    retrieved: '2026-11-07',
    gameVersionPrinted: '0.46D / Steam Build 26337366',
    note: 'Universal module table: Performance 16%, Efficiency 16%, Quality 8%, Overclock 36/−44/0, etc. Evaporator uses P for allowance and Q clamped 0–100 as recovery. This app records the machine readout rather than inventing a sum from module count.',
  },
  {
    id: 'wiki-finisher',
    evidence: 'SOURCE_STATIC',
    title: 'Chem Finisher',
    url: 'https://probably-stolen.nicokobo.com/en/items/chem_finisher',
    retrieved: '2026-11-07',
    gameVersionPrinted: '0.46D / Steam Build 26337366',
    note: 'Dream Dust 2 mL; dryness Water+Alcohol+Lipobond ≤100 µL exactly passes; contamination 12/6/3/1/0% by 0–4+ modules.',
  },
  {
    id: 'wiki-terms',
    evidence: 'SOURCE_STATIC',
    title: 'Nicokobo Terms of Service',
    url: 'https://probably-stolen.nicokobo.com/en/terms',
    retrieved: '2026-11-07',
    gameVersionPrinted: 'n/a; page dated 2026-11-01',
    note: 'Site text CC BY-SA 4.0. Game names, icons, screenshots and assets belong to rights holders. Wiki accessibility is not a reuse license.',
  },
  {
    id: 'steamdb-26337366',
    evidence: 'CURRENT_STEAM_NEWS',
    title: 'SteamDB patch 26337366 = 1.0.0.6',
    url: 'https://steamdb.info/patchnotes/26337366/',
    retrieved: '2026-11-07',
    gameVersionPrinted: '1.0.0.6 (2026-10-31)',
    note: 'Same Steam build id the wiki still labels 0.46D. Patch text is modding security + Menu/Back key, not a chemistry rewrite.',
  },
  {
    id: 'steam-10005',
    evidence: 'CURRENT_STEAM_NEWS',
    title: 'Hotfix 1.0.0.5 Steam Community changelog',
    url: 'https://steamcommunity.com/app/4348910/',
    retrieved: '2026-11-07',
    gameVersionPrinted: '1.0.0.5',
    note: 'Scanners truncate to hundredth mL (1996 µL → 1.99 mL). Evaporator 1 µL leftover water bug fixed. Dry-input recipes ignore unspecified “trace moisture”. Exact new dryness threshold is UNKNOWN; this app still applies the sourced ≤100 µL check and does not invent a 1 µL pass.',
  },
  {
    id: 'steam-10006',
    evidence: 'CURRENT_STEAM_NEWS',
    title: 'Modding Security Update 1.0.0.6',
    url: 'https://store.steampowered.com/news/app/4348910/view/676261964507253217',
    retrieved: '2026-11-07',
    gameVersionPrinted: '1.0.0.6',
    note: 'No chemist formula changes named in the 1.0.0.6 news post.',
  },
];

/** 1.0.0.5 scanner display: truncate to hundredth of a millilitre. */
export function scannerDisplayML(ul: number): string {
  return (Math.trunc(ul / 10) / 100).toFixed(2);
}

export const UNKNOWN_LIMITS = [
  '1.0.0.5 “trace moisture” dryness exception: no numeric threshold in Steam news.',
  'Sleep runs 360 chemical updates before the overnight evaporator callback [SOURCE]. This app does not silently run those ticks on each night; Acid/Base updates are an explicit action.',
  'Microplastic has a filter row [SOURCE] but is not a measured Dream Dust field here; Other is never auto-filtered or inferred into a hidden reactant.',
  'Heating-plate vs container callback order remains unverified on the wiki.',
  'No official Questing Goose / tinyBuild fan-kit or icon reuse license was found. Wiki CC BY-SA covers wiki text, not game sprites.',
];
