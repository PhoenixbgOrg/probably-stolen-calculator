import { describe, expect, test } from 'vitest';
import { defaultWizardState } from '../src/calculators/chemistWizard';
import { mixtureFromPartial } from '../src/calculators/dreamDustVerified';
import { CHEMIST_SESSION_KEY, loadChemistSession, parseChemistSession, saveChemistSession } from '../src/persistence/chemistSession';
import { STORAGE_KEY } from '../src/persistence/schema';
import { MemoryStorage } from '../src/persistence/store';

describe('chemist session persistence does not touch profiles', () => {
  test('saves wizard progress on a separate key', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{"schemaVersion":2,"activeProfileId":"keep-me","profiles":[],"quarantine":[]}');
    const state = defaultWizardState();
    state.groundTotalUL = 476_000;
    saveChemistSession(storage, state);
    expect(storage.getItem(STORAGE_KEY)).toContain('keep-me');
    expect(storage.getItem(CHEMIST_SESSION_KEY)).toContain('476000');
    const loaded = loadChemistSession(storage);
    expect(loaded.state.groundTotalUL).toBe(476_000);
    expect(loaded.state.schemaVersion).toBe(3);
    expect(loaded.notice).toBeNull();
  });

  test('schema 3 keeps remaining stock, action log, and confirmed nights', () => {
    const raw = JSON.stringify({
      schemaVersion: 3,
      currentStage: 'filterEvap',
      acidRemaining: { acid: 3_000 },
      acidBaseLog: [{ kind: 'add-acid', doseUL: 2_000, updates: 0, remainingAcidUL: 3_000, remainingBaseUL: 0, vesselUL: 8_000, note: 'poured' }],
      evapNights: [
        {
          night: 1,
          confirmed: true,
          stale: false,
          energyUsed: 6,
          allowanceUL: 300_000,
          remainingEnergy: 6,
          remainingReceiverUL: 0,
          remainingVolatilesUL: 100_000,
          removed: { water: 300_000 },
          recovered: {},
          lost: { water: 300_000 },
          output: { dreamCapExtract: 2_000, water: 100_000 },
          snapshot: {
            mixture: { dreamCapExtract: 2_000, water: 100_000 },
            fieldProvenance: {},
            kind: 'model-prediction',
            capturedAt: '2026-11-07T00:00:00.000Z',
            note: 'night 1',
          },
          reasons: [],
          warnings: [],
        },
      ],
    });
    const loaded = parseChemistSession(raw);
    expect(loaded.state.schemaVersion).toBe(3);
    expect(loaded.state.acidRemaining.acid).toBe(3_000);
    expect(loaded.state.acidBaseLog[0]?.kind).toBe('add-acid');
    expect(loaded.state.evapNights[0]?.energyUsed).toBe(6);
    expect(loaded.state.evapNights[0]?.output).toEqual(mixtureFromPartial({ dreamCapExtract: 2_000, water: 100_000 }));
    expect(loaded.notice).toBeNull();
  });
});
