// Writes the game-data registry as machine-readable JSON to data/. Run: npm run export-data
import { writeFileSync } from 'node:fs';
import { REGISTRY } from '../src/data/registry';
writeFileSync(new URL('../data/game-data.json', import.meta.url), JSON.stringify(REGISTRY, null, 2) + '\n');
console.log('wrote data/game-data.json');
