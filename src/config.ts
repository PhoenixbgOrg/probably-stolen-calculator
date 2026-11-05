/** Site-wide link configuration. All footer/credits URLs live here; components never hardcode them. */
export interface SiteLink { label: string; url: string; title: string; external: boolean }

export const GITHUB_REPO_URL = 'https://github.com/PhoenixbgOrg/probably-stolen-calculator';
/** Repository name; also the GitHub Pages project base path (/probably-stolen-calculator/). */
export const REPO_NAME = 'probably-stolen-calculator';
export const SOURCES_ROUTE = '#/sources';

export const GAME_LINKS: readonly SiteLink[] = [
  { label: 'Get the Game', url: 'https://store.steampowered.com/app/4348910/', title: 'Probably Stolen on Steam (official store page)', external: true },
  { label: 'Game Wiki', url: 'https://www.probablystolen-wiki.wiki/', title: 'Probably Stolen Wiki (community fan site)', external: true },
  { label: 'Technical Wiki', url: 'https://probably-stolen.nicokobo.com/en/', title: 'Probably Stolen Wiki by nicokobo (community fan site, static data analysis)', external: true },
  { label: 'Sources & Credits', url: SOURCES_ROUTE, title: 'Research sources, credits and disclaimer', external: false },
  { label: 'GitHub', url: GITHUB_REPO_URL, title: 'Source code of this calculator on GitHub', external: true },
];

export const OWNER_NAME = 'PhoenixbgOrg';
export const OWNER_PROJECTS: readonly SiteLink[] = [
  { label: 'RitualForge Labs', url: 'https://ritualforgelabs.com', title: 'RitualForge Labs (project by PhoenixbgOrg)', external: true },
  { label: 'PhoenixCore OS', url: 'https://phoenixcoreos.org', title: 'PhoenixCore OS (project by PhoenixbgOrg)', external: true },
  { label: 'GitHub Projects', url: 'https://github.com/PhoenixbgOrg', title: 'All PhoenixbgOrg projects on GitHub', external: true },
];

/**
 * Future optional "Buy me a coffee" (PayPal) button. Disabled: the footer slot renders nothing and no script,
 * SDK, link or network request exists. Enabling later only needs enabled:true and a plain https link.
 */
export const DONATIONS: { enabled: boolean; url: string | null; label: string } = { enabled: false, url: null, label: 'Buy me a coffee' };

/** Base-aware URL for a file in /public (works under a GitHub Pages sub-path). */
export const publicUrl = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
