import { useRef, useState } from 'react';
import type { Dispatch } from 'react';
import { exportProfiles, importProfiles } from '../persistence/store';
import type { AppState, Action } from '../state/reducer';

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProfilesPanel({ state, dispatch }: { state: AppState; dispatch: Dispatch<Action> }) {
  const { store } = state;
  const active = store.profiles.find((p) => p.id === store.activeProfileId);
  const [rename, setRename] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const res = importProfiles(await f.text());
    dispatch({ type: 'importProfiles', profiles: res.profiles, notices: res.notices });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <aside className="panel" aria-labelledby="prof-h">
      <h2 id="prof-h">Profiles</h2>
      <label className="block">Active profile
        <select value={store.activeProfileId ?? ''} onChange={(e) => dispatch({ type: 'switchProfile', id: e.target.value })}>
          {store.profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <p className="small muted">Changes are saved automatically in this browser.</p>
      {active && (rename === null ? (
        <div className="btn-col">
          <button type="button" onClick={() => setRename(active.name)}>Rename</button>
          <button type="button" onClick={() => dispatch({ type: 'newProfile', name: `Build ${store.profiles.length + 1}` })}>New profile</button>
          <button type="button" onClick={() => dispatch({ type: 'duplicateProfile', id: active.id })}>Duplicate</button>
          <button type="button" onClick={() => { if (confirm('Reset the active build (specialization, perks, settings)?')) dispatch({ type: 'resetBuild' }); }}>Reset build</button>
          <button type="button" className="danger" onClick={() => { if (confirm(`Delete profile "${active.name}"?`)) dispatch({ type: 'deleteProfile', id: active.id }); }}>Delete</button>
          <button type="button" onClick={() => download(`${active.name.replace(/[^\w-]+/g, '_')}.psc.json`, exportProfiles([active]))}>Export active (JSON)</button>
          <button type="button" onClick={() => download('all-profiles.psc.json', exportProfiles(store.profiles))}>Export all (JSON)</button>
          <button type="button" onClick={() => fileRef.current?.click()}>Import JSON…</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onImport(e.target.files?.[0])} />
        </div>
      ) : (
        <form className="btn-col" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'renameProfile', id: active.id, name: rename }); setRename(null); }}>
          <label className="block">New name <input autoFocus value={rename} maxLength={120} onChange={(e) => setRename(e.target.value)} /></label>
          <button type="submit" className="primary">Save name</button>
          <button type="button" onClick={() => setRename(null)}>Cancel</button>
        </form>
      ))}
      {store.quarantine.length > 0 && (
        <div className="quarantine">
          <h3>Quarantined data ({store.quarantine.length})</h3>
          <p className="small">These saved items could not be read and were set aside instead of deleted.</p>
          <ul className="plain small">
            {store.quarantine.map((q) => (
              <li key={q.id}>
                {new Date(q.at).toLocaleString()} — {q.reason}
                <div className="btn-row">
                  <button type="button" onClick={() => download(`quarantine-${q.id}.json`, q.raw)}>Download</button>
                  <button type="button" className="danger" onClick={() => { if (confirm('Permanently discard this quarantined item?')) dispatch({ type: 'discardQuarantine', id: q.id }); }}>Discard</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
