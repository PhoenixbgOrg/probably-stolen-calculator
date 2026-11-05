import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../src/data/registry';
import { CONSULTED_ONLY, creditEntries, kindOf, SNAPSHOTS, sourceUsage } from '../src/data/credits';
import { pageFromHash } from '../src/state/navigation';
import { EXTERNAL_LINKS, GITHUB_REPO_URL } from '../src/config';

const entries = creditEntries(REGISTRY);
const onPage = new Set(entries.map((e) => e.source.id));

describe('Sources & Credits page data', () => {
  it('lists every source id referenced anywhere in the data', () => {
    for (const id of sourceUsage(REGISTRY).keys()) expect(onPage.has(id), id).toBe(true);
  });
  it('lists every registered source, each with publisher and a URL (except the private user report)', () => {
    expect(entries).toHaveLength(Object.keys(REGISTRY.sources).length);
    for (const e of entries) {
      expect(e.source.publisher).toBeTruthy();
      if (e.kind !== 'user-report') expect(e.source.url).toMatch(/^https:\/\//);
      expect(e.usedFor.length).toBeGreaterThan(0);
    }
  });
  it('labels only the Steam page as the store page; everything else is community or user report', () => {
    expect(entries.filter((e) => e.kind === 'store').map((e) => e.source.id)).toEqual(['steam-store']);
    for (const e of entries) expect(e.kindLabel.toLowerCase().includes('official') ? e.kind === 'store' : true).toBe(true);
    expect(kindOf(REGISTRY.sources['nicokobo-starting-perks']!)).toBe('community');
  });
  it('every snapshot in docs/sources is mapped, and mapped ids exist', () => {
    const files = readdirSync(new URL('../docs/sources/', import.meta.url)).sort();
    expect(Object.keys(SNAPSHOTS).sort()).toEqual(files);
    for (const [f, id] of Object.entries(SNAPSHOTS)) {
      if (id === null) expect(CONSULTED_ONLY.some((c) => c.file === f), f).toBe(true);
      else expect(onPage.has(id), f).toBe(true);
    }
  });
  it('every source id named in docs/RESEARCH.md is on the page', () => {
    const doc = readFileSync(new URL('../docs/RESEARCH.md', import.meta.url), 'utf8');
    const known = new Set(Object.keys(REGISTRY.sources));
    const named = [...doc.matchAll(/\b([a-z]+(?:-[a-z0-9]+)+)\b/g)].map((m) => m[1]!).filter((x) => known.has(x));
    expect(named.length).toBeGreaterThan(0);
    for (const id of named) expect(onPage.has(id)).toBe(true);
    for (const url of doc.match(/https:\/\/[^\s)>\]]+/g) ?? []) {
      const all = [...Object.values(REGISTRY.sources).map((s) => s.url), ...CONSULTED_ONLY.map((c) => c.url)];
      expect(all.some((u) => u && (u === url || url.startsWith(u) || u.startsWith(url))), url).toBe(true);
    }
  });
  it('carries version info for nicokobo and the Steam screenshot', () => {
    expect(REGISTRY.sources['nicokobo-occupations']!.gameVersion).toMatch(/0\.46D.*26337366/);
    expect(REGISTRY.sources['steam-store']!.notes).toMatch(/052A/);
  });
});

describe('site links and routing', () => {
  it('has the required external links and a GitHub placeholder', () => {
    expect(EXTERNAL_LINKS.map((l) => l.url)).toEqual([
      'https://store.steampowered.com/app/4348910/', 'https://www.probablystolen-wiki.wiki/', 'https://probably-stolen.nicokobo.com/en/',
    ]);
    expect(GITHUB_REPO_URL).toBeNull();
  });
  it('parses hash routes', () => {
    expect(pageFromHash('#/sources')).toBe('sources');
    expect(pageFromHash('#sources')).toBe('sources');
    expect(pageFromHash('#/sources/x')).toBe('sources');
    expect(pageFromHash('')).toBe('builder');
    expect(pageFromHash('#/')).toBe('builder');
    expect(pageFromHash('#/sourcesx')).toBe('builder');
  });
});
