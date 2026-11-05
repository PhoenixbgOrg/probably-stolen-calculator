import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../src/data/registry';
import { CONSULTED_ONLY, creditEntries, kindOf, SNAPSHOTS, sourceUsage } from '../src/data/credits';
import { pageFromHash } from '../src/state/navigation';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DONATIONS, GAME_LINKS, GITHUB_REPO_URL, OWNER_PROJECTS, REPO_NAME, SOURCES_ROUTE } from '../src/config';
import { DonationSlot, SiteFooter } from '../src/ui/SiteFooter';

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
  it('has the required footer links, all valid https URLs (except the internal route)', () => {
    expect(GAME_LINKS.map((l) => l.label)).toEqual(['Get the Game', 'Game Wiki', 'Technical Wiki', 'Sources & Credits', 'GitHub']);
    expect(GITHUB_REPO_URL).toBe('https://github.com/PhoenixbgOrg/probably-stolen-calculator');
    expect(GITHUB_REPO_URL.endsWith(`/${REPO_NAME}`)).toBe(true);
    expect(OWNER_PROJECTS.map((l) => l.url)).toEqual(['https://ritualforgelabs.com', 'https://phoenixcoreos.org', 'https://github.com/PhoenixbgOrg']);
    for (const l of [...GAME_LINKS, ...OWNER_PROJECTS]) {
      if (!l.external) { expect(l.url).toBe(SOURCES_ROUTE); continue; }
      const u = new URL(l.url);
      expect(u.protocol, l.url).toBe('https:');
      expect(u.hostname).toContain('.');
    }
  });
  it('renders external links in a new tab with rel=noopener noreferrer and both footer sections', () => {
    const html = renderToStaticMarkup(createElement(SiteFooter));
    expect(html).toContain('Game &amp; Resources');
    expect(html).toContain('More Projects by PhoenixbgOrg');
    const ext = [...html.matchAll(/<a [^>]*href="https:[^"]*"[^>]*>/g)].map((m) => m[0]);
    expect(ext).toHaveLength(7);
    for (const a of ext) { expect(a).toContain('target="_blank"'); expect(a).toContain('rel="noopener noreferrer"'); }
    expect(html).not.toMatch(/paypal|coffee/i);
  });
  it('donation slot is disabled by default and renders nothing', () => {
    expect(DONATIONS.enabled).toBe(false);
    expect(DONATIONS.url).toBeNull();
    expect(renderToStaticMarkup(createElement(DonationSlot))).toBe('');
    expect(renderToStaticMarkup(createElement(DonationSlot, { config: { enabled: true, url: null, label: 'x' } }))).toBe('');
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
