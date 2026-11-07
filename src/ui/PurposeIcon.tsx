import { publicUrl } from '../config';
import { getIconEntry } from '../data/iconManifest';
import type { IconTone } from './IconConcepts';

export type { IconTone };

export function PurposeIcon({
  id,
  size = 32,
  showTooltip = true,
  showCaption = false,
  tone,
}: {
  id: string;
  size?: number;
  showTooltip?: boolean;
  showCaption?: boolean;
  tone?: IconTone;
}) {
  const entry = getIconEntry(id);
  const label = entry?.accessibleLabel ?? id;
  const caption = entry?.caption ?? 'Calculator symbol — not a game sprite';
  const title = showTooltip ? `${label}. ${caption}` : caption;
  return (
    <span className={`purpose-icon purpose-${tone ?? 'spec'}`} data-icon-id={id}>
      <img
        className="picon"
        src={publicUrl(`icons/${id}.svg`)}
        width={size}
        height={size}
        alt={label}
        title={title}
        data-testid={`icon-${id}`}
      />
      {showCaption && (
        <span className="icon-not-game" data-testid={`icon-caption-${id}`}>
          Not a game sprite
        </span>
      )}
    </span>
  );
}

export function CategoryMarker({ category }: { category: 'positive' | 'negative' | 'neutral' }) {
  const glyph = category === 'positive' ? '+' : category === 'negative' ? '−' : '◆';
  const label = category === 'positive' ? 'Positive perk' : category === 'negative' ? 'Negative perk' : 'Neutral perk';
  return (
    <span className={`cat-marker cat-${category}`} aria-label={label}>
      {glyph}
    </span>
  );
}
