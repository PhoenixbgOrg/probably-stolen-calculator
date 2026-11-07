# Audit Artifacts

## Delivered Files

### 1. Partial Audit Report
- **File:** `docs/PARTIAL_AUDIT_REPORT.md`
- **Description:** Comprehensive audit report documenting addressed issues, unmet requirements, test results, and recommendations.

### 2. Public Profession Tests
- **File:** `docs/PUBLIC_PROFESSION_TESTS.md`
- **Description:** Baseline and input-change validation for all 8 other profession calculators (Water Merchant, Hydroponic Farmer, Aquafarmer, Rat Wrangler, Gunsmith, Fence, Apprentice, Rock Bottom).

### 3. Source Backup ZIP
- **File:** `probably-stolen-calculator-audit-2026-11-06.zip`
- **Size:** 9.2 MB (under 20 MB limit)
- **SHA256:** `7812990e7dc8063359101d9e5a5bd8590d4b9ea9f183bbf8c0c520aecb12392a`
- **Checksum File:** `probably-stolen-calculator-audit-2026-11-06.zip.sha256`
- **Contents:** Full source code excluding node_modules, .git, and build artifacts
- **Verification:**
  ```bash
  sha256sum -c probably-stolen-calculator-audit-2026-11-06.zip.sha256
  ```

### 4. Git Patch
- **File:** `complete-audit-fixes.patch`
- **Size:** 391 KB
- **Line Count:** 8160 lines
- **Description:** Git patch from `main` branch HEAD to `cursor/audit-dream-dust-planner-40b4` HEAD
- **Apply Instructions:**
  ```bash
  git checkout main
  git apply complete-audit-fixes.patch
  ```

### 5. Test Output Evidence
- **E2E Test Results:** All 8 profession tests pass (see `docs/PUBLIC_PROFESSION_TESTS.md`)
- **Chemist Calculator E2E:** 4 tests pass with numeric output validation
- **Unit Tests:** 185 tests pass including oracle adversarial validation
- **Console Outputs:** Captured in test logs (purity %, vials, alcohol volumes)

## Pending Artifacts

### 6-8. Screenshots (TODO)
Screenshots are not created in this audit run. To generate:
1. Run `npm run dev` and navigate to `http://localhost:5173/#/calculators/chemist`
2. Capture baseline calculation (65g, 15 vials, 45%)
3. Capture stale warning after input change
4. Capture ground mode quick-fill demonstration

### 9-10. Reserved (Future)
Additional artifacts may be added as needed.

---

**Total Delivered:** 5 of 10 artifacts  
**Owner Action Required:** Review partial audit report and decide on merge strategy.
