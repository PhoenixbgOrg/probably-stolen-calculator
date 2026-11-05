export type Screen = 'spec' | 'perks' | 'overview';

/**
 * Continue gating. Like the game ("Continue validates the selection"), the Overview can only be opened when the build
 * is valid. Returns the screen to show and whether a "cannot continue" message should be displayed.
 */
export function navigate(target: Screen, valid: boolean, hasSpecialization: boolean): { screen: Screen; blocked: boolean } {
  if (target === 'overview' && !valid) return { screen: hasSpecialization ? 'perks' : 'spec', blocked: true };
  return { screen: target, blocked: false };
}
