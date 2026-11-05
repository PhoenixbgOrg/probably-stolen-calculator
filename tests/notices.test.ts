import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../src/data/registry';
import { EMPTY_BUILD } from '../src/engine/types';
import { createProfile, emptyStore, MemoryStorage, revalidateProfile } from '../src/persistence/store';
import { DISMISSALS_KEY, filterStartupNotices, loadDismissals, recordDismissals } from '../src/persistence/noticeDismissals';

const [a, b] = REGISTRY.rules.exclusions[0]!.perks;
const bad = { ...EMPTY_BUILD, playthrough: 'subsequent' as const, perkIds: [a, b] };

function twoBadProfiles() {
  let s = createProfile(emptyStore(), 'One', bad, 'x').store;
  s = createProfile(s, 'Two', bad, 'x').store;
  return s;
}

describe('startup notice dismissal', () => {
  it('revalidation notices carry profile id and a stable signature', () => {
    const s = twoBadProfiles();
    const n1 = revalidateProfile(REGISTRY, s.profiles[0]!).notices[0]!;
    const n2 = revalidateProfile(REGISTRY, s.profiles[0]!).notices[0]!;
    expect(n1.profileId).toBe(s.profiles[0]!.id);
    expect(n1.signature).toBeTruthy();
    expect(n1.signature).toBe(n2.signature);
  });
  it('shows only the active profile notices, and hides dismissed ones after reload', () => {
    const s = twoBadProfiles();
    const notices = s.profiles.flatMap((p) => revalidateProfile(REGISTRY, p).notices);
    const generic = { level: 'error' as const, message: 'storage' };
    const active = s.profiles[1]!.id;
    const st = new MemoryStorage();
    let shown = filterStartupNotices([...notices, generic], active, loadDismissals(st));
    expect(shown.map((n) => n.profileId)).toEqual([active, undefined]);
    recordDismissals(st, shown);
    expect(JSON.parse(st.getItem(DISMISSALS_KEY)!).v).toBe(1);
    shown = filterStartupNotices([...notices, generic], active, loadDismissals(st));
    expect(shown).toEqual([generic]);
  });
  it('a dismissed notice reappears when the problem changes', () => {
    const s = twoBadProfiles();
    const p = s.profiles[0]!;
    const st = new MemoryStorage();
    recordDismissals(st, revalidateProfile(REGISTRY, p).notices);
    const changed = { ...p, build: { ...p.build, perkIds: [...p.build.perkIds, 'unknown-x'] } };
    expect(filterStartupNotices(revalidateProfile(REGISTRY, changed).notices, p.id, loadDismissals(st))).toHaveLength(1);
  });
  it('ignores corrupt dismissal data', () => {
    const st = new MemoryStorage();
    st.setItem(DISMISSALS_KEY, '{oops');
    expect(loadDismissals(st).size).toBe(0);
  });
});
