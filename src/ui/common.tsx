import { useId } from 'react';
import type { ReactNode } from 'react';
import type { Provenance, VerificationStatus } from '../data/types';
import { REGISTRY } from '../data/registry';

const LABEL: Record<VerificationStatus, string> = {
  verified: 'Verified',
  'partially-verified': 'Partially verified',
  unverified: 'Unverified',
  conflicting: 'Conflicting sources',
};

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return <span className={`badge badge-${status}`} title={LABEL[status]}>{LABEL[status]}</span>;
}

/** Accessible tooltip: shown on hover and keyboard focus of the trigger. */
export function Tip({ label, children }: { label: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <span className="tip">
      <button type="button" className="tip-trigger" aria-describedby={id} aria-label="More information">{label}</button>
      <span role="tooltip" id={id} className="tip-body">{children}</span>
    </span>
  );
}

export function SourceList({ p }: { p: Provenance }) {
  return (
    <span className="sources">
      Sources: {p.sources.map((s, i) => {
        const src = REGISTRY.sources[s];
        return (
          <span key={s}>{i > 0 && ', '}{src ? <a href={src.url} target="_blank" rel="noreferrer noopener">{src.publisher}</a> : s}</span>
        );
      })}
      {p.gameVersion && <> · game {p.gameVersion}</>}
    </span>
  );
}

export function ProvenanceTip({ p }: { p: Provenance }) {
  return (
    <Tip label="ⓘ">
      <StatusBadge status={p.status} />
      {p.note && <span className="tip-note">{p.note}</span>}
      <SourceList p={p} />
    </Tip>
  );
}

export function fmt(n: number | null, suffix = ''): string {
  return n === null ? 'Unknown' : `${n}${suffix}`;
}
