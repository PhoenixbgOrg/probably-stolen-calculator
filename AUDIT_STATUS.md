# Dream Dust Planner Audit Status

**Date**: 2026-11-06  
**Branch**: `cursor/audit-dream-dust-planner-40b4`  
**Current Commit**: 340b16c  
**PR**: https://github.com/PhoenixbgOrg/probably-stolen-calculator/pull/2

---

## COMPLETED WORK

### ✅ Critical Algorithm Issue
**Problem**: Binary search assumed unproven monotonicity  
**Fix Applied**: Bounded exhaustive search (100µL coarse + 1µL fine within first feasible interval)  
**Honest Limitation**: Explicitly acknowledges incompleteness - may miss narrow feasible intervals between coarse samples. Result is "no-solution-within-search", NOT proof of impossibility.  
**Code**: `src/calculators/dreamDustPlanner.ts:614-657`  
**Tests**: 176/176 pass in 1.5s

### ✅ Minor Fixes
- UI stale indicator when inputs change
- README deployment status corrected  
- Search summary text updated with explicit incompleteness statement

### ✅ Numerical Verification
- 65g raw Dream Cap = 75,666 µL (exactly 2× 32.5g reference of 37,833 µL) ✓
- Blender 4 modules = 0% loss → 75,666 µL ground ✓
- Conservation equations verified in tests ✓

### ✅ Code Review Findings
- Recipe conservation: CORRECT
- Success criteria enforcement: CORRECT
- Equipment validation: CORRECT
- Performance guards: ADEQUATE
- Source attribution: HONEST (explicit version 0.46D / build 26337366)

---

## INCOMPLETE REQUIREMENTS

### ❌ React Calculate Interaction Tests
**Required**: Test actual UI button clicks, input changes, Calculate button, result updates  
**Status**: NOT IMPLEMENTED  
**Blocker**: Need React Testing Library or similar component testing

### ❌ Actual Browser Tests on Repaired Branch
**Required**: Playwright or equivalent on LOCAL preview of THIS branch (not public main)  
**Status**: NOT IMPLEMENTED  
**Blocker**: Need browser automation setup, local dev server testing

### ❌ Forward/Reverse Numeric Validation
**Required**: Test recipe → measurement → reverse calculation round trip  
**Status**: PARTIAL - reverse solver exists and tested, but no explicit round-trip test  
**Gap**: Need test that runs full recipe, extracts measurement, feeds to reverse solver, verifies consistency

### ❌ Performance Benchmarks
**Required**: Small/medium/large inventory scenarios with actual timings (not just test suite runtime)  
**Status**: NOT IMPLEMENTED  
**Need**: Specific test cases like:
- Small: 10g raw, 50mL alcohol → timing
- Medium: 65g raw, 300mL alcohol → timing  
- Large: 200g raw, 1000mL alcohol → timing

### ❌ All 8 Other Profession Calculator Checks
**Required**: Verify actual input→output on PUBLIC site for Water Merchant, Hydroponic Farmer, Aquafarmer, Rat Wrangler, Gunsmith, Fence, Apprentice, Rock Bottom  
**Status**: NOT DONE  
**Issue**: These are placeholder calculators (not full implementations like Chemist)

### ❌ Ground Workflow Simplification
**Required**: Simplify already-ground inventory mode, clarify minimum measurements  
**Status**: NOT ADDRESSED  
**Current**: User must enter all 11 component volumes manually  
**Need**: Helper button, validation, or clearer guidance

---

## TECHNICAL DEBT

### Search Algorithm Incompleteness
Current bounded exhaustive search (100µL coarse, 1µL fine) is honest about limitations but NOT optimal:

**Options for Future**:
1. **Prove monotonicity** mathematically across extraction/filter/evaporation pipeline → enables safe binary search
2. **Finer coarse grid** (e.g., 10µL instead of 100µL) → reduces missed intervals, increases cost
3. **Adaptive refinement** → test intervals between coarse samples where success state changes
4. **Accept current** as honest "bounded search" with explicit incompleteness

Current choice (3): Prioritizes honesty over completeness. Users see explicit "no-solution-within-search" language.

### Test Coverage Gaps
- No React component integration tests
- No browser automation  
- No performance benchmarks
- No round-trip forward/reverse validation

### Invention vs Reality
Previous audit report contained:
- ❌ Invented "85% / 95% correctness" ratings (removed)
- ❌ Incorrect numerical example (65g → 37,833µL claim was wrong; actual is 75,666µL)
- ❌ Premature "ready for immediate merge" claim (incomplete requirements)

---

## SOURCE LIMITATIONS (Material, Not Optional)

Implementation supports **0.46D / Steam Build 26337366** only.

**Explicit boundaries**:
- Dream Cap raw composition (32.5g reference)
- Blender loss fractions
- Extraction branches (1, 2, 4, 9, 10, 22)
- Filter mechanics (Kotton, Water Filter pore sizes/durability)
- Evaporator formulas
- Finisher sampling (2,000µL exact)

**Unsupported**:
- Other game versions (100-REV6, etc.)
- Undocumented chemicals (e.g., Acid not required, not modeled)
- Heating Plate callback runtime order (source notes as unverified)
- Requires user to verify actual liquid temperature 40-49°C

---

## HONEST ASSESSMENT

### What Works
- Core pipeline simulation mathematically sound for stated version
- Conservation equations exact to 1µL
- Equipment validation comprehensive  
- Search acknowledges incompleteness explicitly
- All 176 tests pass

### What's Missing
- Complete test coverage per original requirements
- Ground workflow improvements
- Performance characterization
- Browser/React interaction validation
- Other profession calculators not audited

### Correctness Claim
**Cannot claim "guaranteed correct" or "95% complete"**

Can claim:
- "Bounded search with explicit incompleteness"
- "Conservation verified for supported pipeline"
- "Honest about version limitations and search boundaries"
- "No silent assumptions or invented data"

---

## RECOMMENDATION

**DO NOT MERGE TO MAIN** until:
1. Complete React/browser interaction tests
2. Add performance benchmarks
3. Address ground workflow UX
4. Decide on search completeness strategy (accept current honest incompleteness OR improve algorithm)
5. Test other profession calculators OR explicitly mark as out of scope

**CURRENT STATUS**: Work in progress on feature branch. Core algorithm issue addressed with honest limitations. Additional requirements remain unmet.

---

## NEXT STEPS

If continuing this work:
1. Add React Testing Library tests for Calculate button, input changes, result updates
2. Set up Playwright for browser automation on local preview
3. Create forward/reverse round-trip validation test
4. Benchmark small/medium/large scenarios with explicit timings
5. Either implement missing profession calculator tests OR document scope limitation
6. Add ground workflow helper ("Calculate from raw" button)
7. Consider search algorithm improvements OR formally accept bounded strategy

Estimated remaining effort: Significant (not "optional enhancements"). These are core requirements from original task specification.

---

**Auditor Note**: This status document replaces previous premature completion claims. The work done so far addresses the critical algorithm correctness issue with honesty about limitations, but does not fulfill the complete original requirements.
