# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chemist-calculator.spec.ts >> Chemist Dream Dust Calculator (Repaired Branch) >> baseline calculation (65g, 15 vials, 45%) produces feasible result
- Location: e2e/chemist-calculator.spec.ts:16:3

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: locator('input#planner-target-purity')
Expected: "45"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" locator('input#planner-target-purity') with timeout 5000ms
  - waiting for locator('input#planner-target-purity')

```

```yaml
- banner:
  - heading "Probably Stolen Calculator" [level=1]:
    - link "Probably Stolen Calculator":
      - /url: "#/"
  - paragraph: "Unofficial fan tool · game data 1.0.x (user screenshots: 100-REV6) (data 2026-11-05.4)"
  - navigation "Main navigation":
    - link "Calculators":
      - /url: "#/"
    - link "Character Builder":
      - /url: "#/character-builder"
    - link "Game Guide":
      - /url: "#/game-guide"
    - link "Sources & Credits":
      - /url: "#/sources"
- main:
  - heading "Probably Stolen Calculator" [level=2]
  - paragraph: Unofficial fan tool for production economics, character builds and game mechanics. Select a profession calculator to begin.
  - link "Chemist calculator (Advanced Start)":
    - /url: "#/calculators/chemist"
    - img "Chemist"
    - text: Chemist Advanced Start
  - link "Water Merchant calculator":
    - /url: "#/calculators/water-merchant"
    - img "Water Merchant"
    - text: Water Merchant
  - link "Hydroponic Farmer calculator (Advanced Start)":
    - /url: "#/calculators/hydroponic-farmer"
    - img "Hydroponic Farmer"
    - text: Hydroponic Farmer Advanced Start
  - link "Aquafarmer calculator (Advanced Start)":
    - /url: "#/calculators/aquafarmer"
    - img "Aquafarmer"
    - text: Aquafarmer Advanced Start
  - link "Rat Wrangler calculator (Advanced Start)":
    - /url: "#/calculators/rat-wrangler"
    - img "Rat Wrangler"
    - text: Rat Wrangler Advanced Start
  - link "Gunsmith calculator (Advanced Start)":
    - /url: "#/calculators/gunsmith"
    - img "Gunsmith"
    - text: Gunsmith Advanced Start
  - link "Fence calculator":
    - /url: "#/calculators/fence"
    - img "Fence"
    - text: Fence
  - link "Apprentice calculator (Recommended For New Players)":
    - /url: "#/calculators/apprentice"
    - img "Apprentice"
    - text: Apprentice Recommended For New Players
  - link "Rock Bottom calculator (Extreme Challenge Mode)":
    - /url: "#/calculators/rock-bottom"
    - img "Rock Bottom"
    - text: Rock Bottom Extreme Challenge Mode
  - paragraph:
    - strong: New to the game?
    - text: Start with the
    - link "Character Builder":
      - /url: "#/character-builder"
    - text: to plan your specialization and starting perks.
  - paragraph:
    - text: All calculators preserve existing game data accuracy standards. Values come from verified community sources; see
    - link "Sources & Credits":
      - /url: "#/sources"
    - text: .
- contentinfo:
  - navigation "Game & Resources":
    - heading "Game & Resources" [level=2]
    - list:
      - listitem:
        - link "Get the Game (opens in a new tab)":
          - /url: https://store.steampowered.com/app/4348910/
      - listitem:
        - link "Game Wiki (opens in a new tab)":
          - /url: https://www.probablystolen-wiki.wiki/
      - listitem:
        - link "Technical Wiki (opens in a new tab)":
          - /url: https://probably-stolen.nicokobo.com/en/
      - listitem:
        - link "Sources & Credits":
          - /url: "#/sources"
      - listitem:
        - link "GitHub (opens in a new tab)":
          - /url: https://github.com/PhoenixbgOrg/probably-stolen-calculator
  - navigation "More Projects by PhoenixbgOrg":
    - heading "More Projects by PhoenixbgOrg" [level=2]
    - list:
      - listitem:
        - link "RitualForge Labs (opens in a new tab)":
          - /url: https://ritualforgelabs.com
      - listitem:
        - link "PhoenixCore OS (opens in a new tab)":
          - /url: https://phoenixcoreos.org
      - listitem:
        - link "GitHub Projects (opens in a new tab)":
          - /url: https://github.com/PhoenixbgOrg
  - paragraph:
    - text: Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See
    - link "Sources & Credits":
      - /url: "#/sources"
    - text: .
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Chemist Dream Dust Calculator (Repaired Branch)', () => {
  4  |   test('loads calculator page and shows UI elements', async ({ page }) => {
  5  |     await page.goto('/#/calculator/chemist');
  6  |     
  7  |     // Check title
  8  |     await expect(page.locator('h2')).toContainText('Dream Dust Production Planner');
  9  |     
  10 |     // Check key inputs exist
  11 |     await expect(page.locator('label:has-text("Target finished purity")')).toBeVisible();
  12 |     await expect(page.locator('label:has-text("Required Dream Dust vials")')).toBeVisible();
  13 |     await expect(page.locator('button:has-text("Calculate production plan")')).toBeVisible();
  14 |   });
  15 | 
  16 |   test('baseline calculation (65g, 15 vials, 45%) produces feasible result', async ({ page }) => {
  17 |     await page.goto('/#/calculator/chemist');
  18 |     
  19 |     // Verify defaults (should be 65g, 15 vials, 45%)
  20 |     const purityInput = page.locator('input#planner-target-purity');
> 21 |     await expect(purityInput).toHaveValue('45');
     |                               ^ Error: expect(locator).toHaveValue(expected) failed
  22 |     
  23 |     const vialsInput = page.locator('input#planner-target-vials');
  24 |     await expect(vialsInput).toHaveValue('15');
  25 |     
  26 |     const rawInput = page.locator('input#raw-grams');
  27 |     await expect(rawInput).toHaveValue('65');
  28 |     
  29 |     // Click Calculate
  30 |     await page.locator('button:has-text("Calculate production plan")').click();
  31 |     
  32 |     // Wait for results (with timeout for slow calculation)
  33 |     await page.waitForSelector('text=/Production result:/i', { timeout: 15000 });
  34 |     
  35 |     // Should show feasible status
  36 |     await expect(page.locator('text=/feasible/i')).toBeVisible({ timeout: 5000 });
  37 |     
  38 |     // Should show 15/15 vials
  39 |     await expect(page.locator('text=/15 \/ 15 requested vials/i')).toBeVisible();
  40 |   });
  41 | 
  42 |   test('changing inputs shows stale indicator', async ({ page }) => {
  43 |     await page.goto('/#/calculator/chemist');
  44 |     
  45 |     // Calculate baseline
  46 |     await page.locator('button:has-text("Calculate production plan")').click();
  47 |     await page.waitForSelector('text=/feasible/i', { timeout: 15000 });
  48 |     
  49 |     // Change raw grams
  50 |     const rawInput = page.locator('input#raw-grams');
  51 |     await rawInput.fill('45');
  52 |     
  53 |     // Should show stale warning
  54 |     await expect(page.locator('text=/Inputs changed/i')).toBeVisible({ timeout: 2000 });
  55 |   });
  56 | 
  57 |   test('ground mode quick-fill populates fields', async ({ page }) => {
  58 |     await page.goto('/#/calculator/chemist');
  59 |     
  60 |     // Switch to ground mode
  61 |     await page.locator('select#material-state').selectOption('ground');
  62 |     
  63 |     // Find quick-fill button
  64 |     await expect(page.locator('button:has-text("Calculate ground from raw")')).toBeVisible();
  65 |     
  66 |     // Set quick-fill inputs (32.5g with 4 modules)
  67 |     const quickRawInputs = page.locator('input#quick-raw-grams');
  68 |     await quickRawInputs.fill('32.5');
  69 |     
  70 |     const quickBlenderInput = page.locator('input#quick-blender-modules');
  71 |     await quickBlenderInput.fill('4');
  72 |     
  73 |     // Click quick-fill
  74 |     await page.locator('button:has-text("Calculate ground from raw")').click();
  75 |     
  76 |     // Check that Dream Cap Mush is populated (~27.333mL)
  77 |     const mushInput = page.locator('input#ground-dreamCapMush');
  78 |     const mushValue = await mushInput.inputValue();
  79 |     expect(parseFloat(mushValue)).toBeCloseTo(27.333, 1);
  80 |   });
  81 | });
  82 | 
```