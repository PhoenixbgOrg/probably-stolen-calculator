/**
 * Improved pixel icon system with authentic hand-drawn pixel art for all specializations and perks.
 * Each icon is independently created to represent the specific gameplay mechanic.
 * All artwork is original; visual style inspired by general retro pixel art conventions.
 */

import type { IconTone } from './IconConcepts';
import { PERK_CONCEPTS, PROFESSION_CONCEPTS } from './IconConcepts';

/**
 * Draw recognizable pixel silhouettes for each perk/profession.
 * 9x9 grid, each concept hand-crafted to be visually distinct.
 */
function drawPixelArt(id: string): boolean[][] {
  const grid = Array(9).fill(null).map(() => Array(9).fill(false));
  
  // Helper to set pixels
  const set = (x: number, y: number) => { if (x >= 0 && x < 9 && y >= 0 && y < 9 && grid[y]) grid[y]![x] = true; };
  const rect = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) set(x + dx, y + dy);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;
    while (true) {
      set(x, y);
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  };

  // Profession icons
  if (id === 'chemist') {
    // Flask/beaker
    rect(3, 1, 3, 1); // rim
    set(2, 2); set(6, 2); // neck
    rect(2, 3, 5, 4); // body
    set(3, 5); set(4, 5); // liquid
  } else if (id === 'water-merchant') {
    // Water bottle
    rect(3, 0, 3, 1); // cap
    rect(2, 1, 5, 6); // bottle
    rect(3, 4, 3, 2); // water inside
  } else if (id === 'hydroponic-farmer') {
    // Plant in pot
    set(4, 1); set(3, 2); set(5, 2); // leaves
    set(4, 2); set(4, 3); // stem
    rect(2, 4, 5, 3); // pot
  } else if (id === 'aquafarmer') {
    // Fish silhouette
    set(1, 3); // tail
    rect(2, 2, 3, 3); // body
    set(5, 3); set(6, 2); set(6, 4); // head/mouth
    set(3, 2); // eye
  } else if (id === 'rat-wrangler') {
    // Rat silhouette
    set(1, 2); // ear
    rect(2, 2, 3, 2); // head
    set(3, 2); // eye
    rect(4, 3, 3, 2); // body
    line(7, 4, 8, 6); // tail
  } else if (id === 'gunsmith') {
    // Pistol
    rect(1, 3, 3, 2); // grip
    rect(3, 2, 4, 2); // barrel
    set(7, 2); // front sight
  } else if (id === 'fence') {
    // Box with contraband mark
    rect(2, 2, 5, 5); // box
    set(4, 4); set(3, 5); set(5, 5); // X mark
  } else if (id === 'apprentice') {
    // Storage crate
    rect(1, 2, 7, 5); // crate
    line(1, 2, 7, 2); line(1, 6, 7, 6); // planks
    line(4, 2, 4, 6); // center
  } else if (id === 'rock-bottom') {
    // Empty broken container
    set(2, 2); set(3, 2); set(5, 2); set(6, 2); // broken top
    set(2, 3); set(6, 3);
    set(2, 4); set(6, 4);
    set(2, 5); set(3, 5); set(5, 5); set(6, 5); // broken bottom
  } else if (id === 'junker') {
    // Scrap pile
    rect(2, 4, 5, 3); // base
    set(3, 3); set(5, 3); set(4, 2); // scattered top
  }
  
  // Positive perks
  else if (id === 'diplomatic') {
    // Handshake
    rect(1, 3, 3, 2); // left hand
    rect(5, 3, 3, 2); // right hand
    set(3, 4); set(4, 4); set(5, 4); // joined
  } else if (id === 'intimidating') {
    // Stern face
    rect(2, 2, 5, 5); // head
    set(3, 3); set(5, 3); // angry eyes
    line(3, 6, 5, 6); // frown
  } else if (id === 'vending-machine') {
    // Machine
    rect(2, 1, 5, 6); // body
    set(3, 2); set(4, 2); set(5, 2); // display row 1
    set(3, 3); set(4, 3); set(5, 3); // display row 2
    rect(3, 5, 3, 1); // slot
  } else if (id === 'vigilant') {
    // Eye
    rect(2, 3, 5, 2); // eye shape
    set(4, 3); // pupil
  } else if (id === 'well-connected') {
    // Network nodes
    set(2, 2); set(6, 2); set(2, 6); set(6, 6); set(4, 4); // nodes
    line(2, 2, 4, 4); line(6, 2, 4, 4); line(2, 6, 4, 4); line(6, 6, 4, 4); // connections
  } else if (id === 'working-pipes') {
    // Pipe with water
    rect(1, 3, 7, 2); // pipe
    set(7, 4); set(8, 5); set(8, 6); // water drops
  } else if (id === 'handy') {
    // Toolbox
    rect(2, 3, 5, 3); // box
    rect(3, 2, 3, 1); // handle
    set(3, 4); set(5, 4); // tools inside
  } else if (id === 'lucky') {
    // Four-leaf clover
    set(4, 1); set(3, 2); set(5, 2); set(2, 3); set(6, 3); // leaves
    set(4, 2); set(4, 3); set(4, 4); // stem
  } else if (id === 'model-citizen') {
    // Security badge/star
    set(4, 1); set(3, 2); set(5, 2); set(2, 3); set(6, 3);
    set(3, 4); set(5, 4); set(4, 5); // star points
    set(4, 3); // center
  } else if (id === 'proficient-scavenger') {
    // Magnifying glass
    rect(2, 2, 3, 3); // lens
    line(5, 5, 7, 7); // handle
  } else if (id === 'revolution-sympathizer') {
    // Raised fist
    rect(3, 2, 3, 2); // fist top
    rect(2, 4, 5, 3); // fist body
    set(4, 3); // knuckles
  } else if (id === 'savings') {
    // Coin stack
    rect(3, 5, 3, 1); rect(3, 3, 3, 1); rect(3, 1, 3, 1); // stacked coins
  } else if (id === 'sawyers-crew') {
    // Underground door
    rect(2, 2, 5, 5); // door frame
    set(3, 4); // handle
    line(2, 6, 1, 7); line(6, 6, 7, 7); // stairs down
  } else if (id === 'secret-admirer') {
    // Gift box
    rect(2, 3, 5, 4); // box
    line(4, 1, 4, 6); rect(3, 2, 3, 1); // ribbon
  } else if (id === 'short-sleeper') {
    // Alert person
    rect(3, 2, 3, 2); // head
    rect(3, 4, 3, 3); // body
    set(4, 1); set(5, 0); // energy lines
  } else if (id === 'sycophant') {
    // Fancy hat
    rect(2, 3, 5, 1); // brim
    rect(3, 1, 3, 2); // top
  } else if (id === 'tapehead') {
    // Cassette
    rect(2, 2, 5, 4); // case
    set(3, 3); set(5, 3); // reels
    rect(2, 5, 5, 1); // label
  } else if (id === 'tinkerer') {
    // Wrench with gear
    rect(1, 3, 3, 2); // wrench head
    line(4, 4, 6, 4); // handle
    set(6, 2); set(7, 3); set(6, 4); // gear
  } else if (id === 'welfare-program') {
    // Food stamp ticket
    rect(2, 3, 5, 3); // ticket
    set(1, 4); set(7, 4); // perforations
  } else if (id === 'wilds-favorite') {
    // Discount tag
    rect(2, 2, 5, 4); // tag
    set(2, 2); // hole
    set(4, 4); set(3, 5); set(5, 5); // minus/discount
  }
  
  // Neutral perks
  else if (id === 'aug-menace') {
    // Aug silhouette with target
    rect(3, 2, 3, 2); // head with aug
    set(6, 2); // aug implant
    rect(3, 4, 3, 3); // body
    set(1, 3); set(7, 3); set(4, 0); set(4, 6); // crosshair
  } else if (id === 'colorful-character') {
    // Three slot boxes
    rect(1, 2, 2, 3); rect(3, 2, 2, 3); rect(5, 2, 2, 3); // three slots
  } else if (id === 'makeshift-reactor') {
    // Atom symbol
    set(4, 4); // nucleus
    set(2, 2); set(6, 6); set(2, 6); set(6, 2); // electrons
    line(2, 2, 6, 6); line(2, 6, 6, 2); // orbits
  } else if (id === 'careful-scavenger') {
    // Shield
    rect(2, 1, 5, 6); // shield shape
    set(3, 2); set(5, 2); set(3, 4); set(5, 4); // pattern
  } else if (id === 'hoarder') {
    // Clutter pile
    rect(1, 5, 7, 2); // base mess
    set(2, 4); set(4, 3); set(6, 4); // scattered items
  } else if (id === 'prime-real-estate') {
    // Person in door
    rect(2, 1, 5, 6); // doorway
    set(4, 3); rect(3, 4, 3, 2); // person
  }
  
  // Negative perks
  else if (id === 'ascetic') {
    // Very small grid
    rect(2, 2, 3, 5); // narrow inventory
    line(2, 2, 4, 2); line(2, 4, 4, 4); // grid lines
  } else if (id === 'awful-negotiator') {
    // Speech bubble with X
    rect(2, 2, 4, 3); // bubble
    set(2, 5); // tail
    line(3, 3, 4, 4); line(4, 3, 3, 4); // X
  } else if (id === 'sentinel-collapse-disorder') {
    // Syringe
    rect(1, 3, 2, 2); // plunger
    rect(3, 3, 3, 2); // barrel
    set(6, 4); // needle
  } else if (id === 'blabbermouth') {
    // Talking mouth with evidence
    rect(2, 3, 3, 2); // mouth
    set(5, 2); set(6, 3); set(7, 2); // words/evidence
  } else if (id === 'blackmail') {
    // Envelope with threat
    rect(2, 3, 5, 3); // envelope
    line(2, 3, 4, 5); line(6, 3, 4, 5); // flap
    set(4, 4); // seal/threat
  } else if (id === 'known-snitch') {
    // Wanted poster with slash
    rect(2, 1, 5, 5); // poster
    line(2, 1, 6, 5); // slash
  } else if (id === 'maimed') {
    // Dumping ground with X
    rect(2, 4, 5, 3); // ground
    line(2, 2, 6, 6); line(6, 2, 2, 6); // X ban
  } else if (id === 'minimalist') {
    // Medium grid
    rect(2, 2, 5, 5); // inventory
    line(2, 2, 6, 2); line(2, 4, 6, 4); // grid
  } else if (id === 'public-enemy') {
    // Target/crosshair
    set(4, 4); // center
    line(4, 1, 4, 7); line(1, 4, 7, 4); // cross
    rect(2, 2, 5, 5); // outer ring (corners only)
    set(2, 2); set(6, 2); set(2, 6); set(6, 6);
  } else if (id === 'agoraphobia') {
    // Anxious person in door
    rect(2, 1, 5, 6); // doorway
    set(4, 3); rect(3, 4, 3, 2); // person
    set(2, 3); set(6, 3); // anxiety marks
  } else if (id === 'alcohol-addiction') {
    // Bottle with dependency
    rect(3, 1, 3, 5); // bottle
    set(4, 3); // liquid
    set(1, 6); set(7, 6); // dependency marks
  } else if (id === 'bad-lease') {
    // Contract with high price
    rect(2, 2, 5, 4); // paper
    set(3, 3); set(4, 3); set(5, 3); // lines
    set(5, 4); set(5, 5); // high number
  } else if (id === 'banned-from-the-commissary') {
    // Store with ban
    rect(2, 2, 5, 4); // store
    line(1, 1, 7, 7); // ban slash
  } else if (id === 'convict') {
    // Prison bars
    line(2, 1, 2, 6); line(4, 1, 4, 6); line(6, 1, 6, 6); // bars
    rect(1, 1, 7, 1); rect(1, 6, 7, 1); // top/bottom
  } else if (id === 'degenerative-osteoarthritis') {
    // Person with declining meter
    set(4, 2); rect(3, 3, 3, 3); // person
    rect(6, 2, 1, 5); // meter
    set(6, 6); set(6, 5); // declining
  } else if (id === 'gambling-addiction') {
    // Dice
    rect(2, 2, 3, 3); // die
    set(3, 3); set(4, 3); set(3, 4); // dots
  } else if (id === 'illiterate') {
    // Book with X
    rect(2, 2, 5, 5); // book
    line(3, 3, 5, 5); line(5, 3, 3, 5); // X
  } else if (id === 'narcotic-addiction') {
    // Pills with dependency
    set(2, 3); set(3, 3); set(5, 3); set(6, 3); // pills
    set(2, 5); set(3, 5); set(5, 5); set(6, 5);
    set(1, 2); set(7, 6); // dependency marks
  } else if (id === 'nicotine-addiction') {
    // Cigarette
    rect(2, 4, 4, 1); // cigarette
    set(6, 3); set(7, 2); // smoke
  } else if (id === 'on-wilds-bad-side') {
    // Shop with penalty
    rect(2, 2, 5, 4); // shop
    set(4, 4); line(3, 5, 5, 5); // plus/penalty
  } else if (id === 'side-street') {
    // Empty store/leaving person
    rect(2, 2, 3, 4); // store
    set(6, 4); rect(6, 5, 1, 2); // person leaving
    set(7, 5); // arrow
  } else if (id === 'unlucky') {
    // Broken horseshoe
    rect(2, 2, 5, 4); // horseshoe outline
    set(2, 5); set(6, 5); // ends down (unlucky)
    line(3, 3, 5, 5); // crack
  }
  
  return grid;
}

interface ImprovedPixelIconProps {
  id: string;
  tone: IconTone;
  size?: number;
  showTooltip?: boolean;
}

export function ImprovedPixelIcon({ id, tone, size = 40, showTooltip = true }: ImprovedPixelIconProps) {
  const concept = PERK_CONCEPTS[id] || PROFESSION_CONCEPTS[id];
  const grid = drawPixelArt(id);
  
  const tooltipText = showTooltip && concept ? concept.tooltip : undefined;
  const ariaLabel = concept?.accessibleLabel || id;
  
  return (
    <svg
      className={`picon picon-${tone}`}
      width={size}
      height={size}
      viewBox="0 0 9 9"
      aria-label={ariaLabel}
      role="img"
      shapeRendering="crispEdges"
    >
      {tooltipText && <title>{tooltipText}</title>}
      {grid.flatMap((row, y) =>
        row.map((filled, x) =>
          filled ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null
        )
      )}
    </svg>
  );
}

export function CategoryMarker({ category }: { category: 'positive' | 'negative' | 'neutral' }) {
  const glyph = category === 'positive' ? '+' : category === 'negative' ? '−' : '◆';
  const label = category === 'positive' ? 'Positive perk' : category === 'negative' ? 'Negative perk' : 'Neutral perk';
  return <span className={`cat-marker cat-${category}`} aria-label={label}>{glyph}</span>;
}
