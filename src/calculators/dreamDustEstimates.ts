import { mixtureFromPartial, type ComponentMixture } from './dreamDustVerified';

export const PREVIOUS_BATCH_MUSH_FRACTION = 0.673;
export const PREVIOUS_BATCH_FRACTION_NOTE =
  'Assumed 67.30% Dream Cap Mush from a previous spectrometer reading of one owner batch. Editable. Not a guarantee for this pile.';

/**
 * Estimated composition when only a mush fraction is known.
 * Remainder is Other/Unmodeled — not silently assigned to Water/Protein/Wiki defaults.
 */
export function estimatedMushAndOther(totalUL: number, mushFraction: number): ComponentMixture {
  const clamped = Math.min(1, Math.max(0, mushFraction));
  const mush = Math.round(totalUL * clamped);
  const other = Math.max(0, totalUL - mush);
  return mixtureFromPartial({ dreamCapMush: mush, other });
}
