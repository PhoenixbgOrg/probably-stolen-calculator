import { describe, expect, test } from 'vitest';
import { defaultWizardState } from '../src/calculators/chemistWizard';
import { CHEMIST_SESSION_KEY, loadChemistSession, saveChemistSession } from '../src/persistence/chemistSession';
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
    expect(loaded.notice).toBeNull();
  });
});
