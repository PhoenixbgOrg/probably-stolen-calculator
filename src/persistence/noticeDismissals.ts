import type { Notice, StorageLike } from './store';

/** Separate, small, versioned key; the profile schema is untouched. */
export const DISMISSALS_KEY = 'psc.dismissedNotices.v1';
const MAX_ENTRIES = 200;

export const dismissalId = (n: Notice): string | null => (n.profileId && n.signature ? `${n.profileId}|${n.signature}` : null);

export function loadDismissals(storage: StorageLike): Set<string> {
  try {
    const raw = storage.getItem(DISMISSALS_KEY);
    if (!raw) return new Set();
    const v = JSON.parse(raw) as { v?: number; ids?: unknown };
    return v && v.v === 1 && Array.isArray(v.ids) ? new Set(v.ids.filter((x): x is string => typeof x === 'string')) : new Set();
  } catch { return new Set(); }
}

export function recordDismissals(storage: StorageLike, notices: Notice[]): void {
  const ids = [...notices].map(dismissalId).filter((x): x is string => x !== null);
  if (ids.length === 0) return;
  const set = loadDismissals(storage);
  for (const id of ids) { set.delete(id); set.add(id); }
  try { storage.setItem(DISMISSALS_KEY, JSON.stringify({ v: 1, ids: [...set].slice(-MAX_ENTRIES) })); } catch { /* storage full/unavailable: dismissal is session-only */ }
}

/** Startup filter: profile-specific notices show only for the active profile and only if not dismissed for the same problem. */
export function filterStartupNotices(notices: Notice[], activeProfileId: string | null, dismissed: Set<string>): Notice[] {
  return notices.filter((n) => {
    if (!n.profileId) return true;
    if (n.profileId !== activeProfileId) return false;
    const id = dismissalId(n);
    return id === null || !dismissed.has(id);
  });
}
