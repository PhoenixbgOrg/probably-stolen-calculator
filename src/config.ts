/** Site-wide links. Set GITHUB_REPO_URL once the official repository exists (null = shown as "coming soon"). */
export const GITHUB_REPO_URL: string | null = null;

export const EXTERNAL_LINKS = [
  { label: 'Get the Game', url: 'https://store.steampowered.com/app/4348910/', title: 'Probably Stolen on Steam (official store page)' },
  { label: 'Game Wiki', url: 'https://www.probablystolen-wiki.wiki/', title: 'Probably Stolen Wiki (community fan site)' },
  { label: 'Technical Wiki', url: 'https://probably-stolen.nicokobo.com/en/', title: 'Probably Stolen Wiki by nicokobo (community fan site, static data analysis)' },
] as const;

/** Base-aware URL for a file in /public (works under a GitHub Pages sub-path). */
export const publicUrl = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
