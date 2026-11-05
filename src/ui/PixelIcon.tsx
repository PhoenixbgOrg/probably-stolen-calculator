/**
 * Original procedurally generated pixel icons (no game artwork). A mirrored 7x7 pattern is derived from the id hash,
 * so every perk/specialization gets a stable, distinct glyph. Category is shown by colour AND by a corner marker shape.
 */
export type IconTone = 'positive' | 'negative' | 'neutral' | 'spec' | 'disabled';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function pixelPattern(id: string, size = 7): boolean[][] {
  let h = hash(id);
  const half = Math.ceil(size / 2);
  const rows: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < half; x++) {
      h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
      // Keep a 1px margin a bit sparser so glyphs read as shapes, not noise.
      const edge = y === 0 || y === size - 1 || x === 0;
      row.push((h & 0xff) < (edge ? 90 : 150));
    }
    rows.push([...row, ...row.slice(0, size - half).reverse()]);
  }
  return rows;
}

export function PixelIcon({ id, tone, size = 40 }: { id: string; tone: IconTone; size?: number }) {
  const p = pixelPattern(id);
  return (
    <svg className={`picon picon-${tone}`} width={size} height={size} viewBox="0 0 9 9" aria-hidden="true" shapeRendering="crispEdges">
      {p.flatMap((row, y) => row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1" height="1" /> : null)))}
    </svg>
  );
}

/** Non-colour category marker: + positive, − negative, ◆ neutral. */
export function CategoryMarker({ category }: { category: 'positive' | 'negative' | 'neutral' }) {
  const glyph = category === 'positive' ? '+' : category === 'negative' ? '−' : '◆';
  return <span className={`cat-marker cat-${category}`} aria-hidden="true">{glyph}</span>;
}
