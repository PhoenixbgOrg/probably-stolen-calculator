import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../src/data/registry';

describe('machine-readable data', () => {
  it('data/game-data.json matches the registry (run npm run export-data)', () => {
    const json = JSON.parse(readFileSync('./data/game-data.json', 'utf8'));
    expect(json).toEqual(JSON.parse(JSON.stringify(REGISTRY)));
  });
});
