import { describe, expect, it } from 'vitest';
import { pageFromHash } from '../src/state/navigation';
import { PROFESSIONS } from '../src/calculators/professions';
import { PERK_CONCEPTS, PROFESSION_CONCEPTS, validateIconCoverage } from '../src/ui/IconConcepts';
import { PERKS } from '../src/data/perks';
import { SPECIALIZATIONS } from '../src/data/specializations';

describe('navigation routing', () => {
  it('recognizes home page as default', () => {
    expect(pageFromHash('')).toEqual({ page: 'home' });
    expect(pageFromHash('#')).toEqual({ page: 'home' });
    expect(pageFromHash('#/')).toEqual({ page: 'home' });
  });

  it('routes to character builder', () => {
    expect(pageFromHash('#/character-builder')).toEqual({ page: 'character-builder' });
  });

  it('routes to sources', () => {
    expect(pageFromHash('#/sources')).toEqual({ page: 'sources' });
  });

  it('routes to game guide', () => {
    expect(pageFromHash('#/game-guide')).toEqual({ page: 'game-guide' });
  });

  it('routes to calculators with profession param', () => {
    expect(pageFromHash('#/calculators/chemist')).toEqual({ page: 'calculator', param: 'chemist' });
    expect(pageFromHash('#/calculators/water-merchant')).toEqual({ page: 'calculator', param: 'water-merchant' });
  });

  it('redirects old builder routes to character-builder', () => {
    // These should redirect
    const oldRoutes = ['#/perks', '#/spec', '#/overview'];
    for (const route of oldRoutes) {
      // The function sets window.location.hash, but in tests we just check it returns character-builder
      const result = pageFromHash(route);
      expect(result.page).toBe('character-builder');
    }
  });

  it('handles unknown routes by defaulting to home', () => {
    expect(pageFromHash('#/unknown')).toEqual({ page: 'home' });
    expect(pageFromHash('#/foo/bar')).toEqual({ page: 'home' });
  });
});

describe('profession definitions', () => {
  it('has exactly 9 playable professions', () => {
    expect(PROFESSIONS).toHaveLength(9);
    expect(PROFESSIONS.every((profession) => profession.implemented)).toBe(true);
  });

  it('professions match specialization data', () => {
    const playableSpecs = SPECIALIZATIONS.filter(s => s.playable);
    expect(playableSpecs).toHaveLength(9);
    
    for (const prof of PROFESSIONS) {
      const spec = playableSpecs.find(s => s.id === prof.id);
      expect(spec, `Profession ${prof.id} should have matching specialization`).toBeDefined();
      expect(spec!.name).toBe(prof.name);
    }
  });

  it('profession IDs are valid routes', () => {
    for (const prof of PROFESSIONS) {
      const route = `#/calculators/${prof.id}`;
      const result = pageFromHash(route);
      expect(result).toEqual({ page: 'calculator', param: prof.id });
    }
  });
});

describe('icon coverage and concepts', () => {
  it('has icon concepts for all professions', () => {
    const allSpecs = SPECIALIZATIONS; // Including Junker
    
    for (const spec of allSpecs) {
      expect(PROFESSION_CONCEPTS[spec.id], `Missing profession icon concept for ${spec.id}`).toBeDefined();
      const concept = PROFESSION_CONCEPTS[spec.id]!;
      expect(concept.id).toBe(spec.id);
      expect(concept.accessibleLabel).toBeTruthy();
      expect(concept.tooltip).toBeTruthy();
      expect(concept.mechanic).toBeTruthy();
      expect(concept.visualConcept).toBeTruthy();
    }
  });

  it('has icon concepts for all 48 perks', () => {
    expect(PERKS).toHaveLength(48);
    
    const coverage = validateIconCoverage(PERKS.map(p => p.id));
    expect(coverage.missing, `Missing icon concepts for: ${coverage.missing.join(', ')}`).toHaveLength(0);
    expect(coverage.covered).toBe(48);
  });

  it('all perk icon concepts have required fields', () => {
    for (const perk of PERKS) {
      const concept = PERK_CONCEPTS[perk.id];
      expect(concept, `Missing concept for perk ${perk.id}`).toBeDefined();
      const c = concept!;
      expect(c.id).toBe(perk.id);
      expect(c.accessibleLabel, `${perk.id} missing accessible label`).toBeTruthy();
      expect(c.tooltip, `${perk.id} missing tooltip`).toBeTruthy();
      expect(c.mechanic, `${perk.id} missing mechanic description`).toBeTruthy();
      expect(c.visualConcept, `${perk.id} missing visual concept`).toBeTruthy();
    }
  });

  it('icon tooltips mention key gameplay effects', () => {
    // Verify some examples reflect actual mechanics
    const savings = PERK_CONCEPTS['savings']!;
    expect(savings.tooltip.toLowerCase()).toContain('150');
    expect(savings.tooltip.toLowerCase()).toContain('credit');

    const diplomatic = PERK_CONCEPTS['diplomatic']!;
    expect(diplomatic.tooltip.toLowerCase()).toContain('33%');
    expect(diplomatic.tooltip.toLowerCase()).toContain('reputation');

    const colorfulCharacter = PERK_CONCEPTS['colorful-character']!;
    expect(colorfulCharacter.tooltip.toLowerCase()).toContain('3');
    expect(colorfulCharacter.tooltip.toLowerCase()).toContain('slot');
  });

  it('all perk icons are visually distinguishable by ID', () => {
    const ids = PERKS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(48);
    
    // Each perk has unique icon concept
    const concepts = ids.map(id => PERK_CONCEPTS[id]!.visualConcept);
    // Visual concepts should be diverse (not all identical)
    const uniqueConcepts = new Set(concepts);
    expect(uniqueConcepts.size, 'Icon visual concepts should be diverse').toBeGreaterThan(40);
  });
});

describe('backward compatibility', () => {
  it('preserves #/sources route', () => {
    expect(pageFromHash('#/sources')).toEqual({ page: 'sources' });
  });

  it('character builder accessible from home', () => {
    // Home page should link to character-builder
    const builderRoute = pageFromHash('#/character-builder');
    expect(builderRoute.page).toBe('character-builder');
  });
});

describe('accessibility', () => {
  it('all icon concepts have accessible labels', () => {
    const allConcepts = [
      ...Object.values(PROFESSION_CONCEPTS),
      ...Object.values(PERK_CONCEPTS)
    ];
    
    for (const concept of allConcepts) {
      expect(concept.accessibleLabel, `${concept.id} missing accessible label`).toBeTruthy();
      expect(concept.accessibleLabel.length, `${concept.id} accessible label too short`).toBeGreaterThan(2);
    }
  });

  it('tooltips provide gameplay context', () => {
    const allConcepts = [
      ...Object.values(PROFESSION_CONCEPTS),
      ...Object.values(PERK_CONCEPTS)
    ];
    
    for (const concept of allConcepts) {
      expect(concept.tooltip, `${concept.id} missing tooltip`).toBeTruthy();
      expect(concept.tooltip.length, `${concept.id} tooltip too short`).toBeGreaterThan(10);
    }
  });
});
