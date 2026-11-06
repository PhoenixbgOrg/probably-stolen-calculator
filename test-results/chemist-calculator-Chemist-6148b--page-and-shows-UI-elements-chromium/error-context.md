# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chemist-calculator.spec.ts >> Chemist Dream Dust Calculator (Repaired Branch) >> loads calculator page and shows UI elements
- Location: e2e/chemist-calculator.spec.ts:4:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h2')
Expected substring: "Dream Dust Production Planner"
Error: strict mode violation: locator('h2') resolved to 3 elements:
    1) <h2 class="panel-title">Probably Stolen Calculator</h2> aka getByRole('main').getByRole('heading', { name: 'Probably Stolen Calculator' })
    2) <h2 id="ft-game" class="ft-h">Game & Resources</h2> aka getByRole('heading', { name: 'Game & Resources' })
    3) <h2 id="ft-more" class="ft-h">More Projects by PhoenixbgOrg</h2> aka getByRole('heading', { name: 'More Projects by PhoenixbgOrg' })

Call log:
  - Expect "toContainText" locator('h2') with timeout 5000ms
  - waiting for locator('h2')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - heading [level=1] [ref=e5]:
      - link "Probably Stolen Calculator" [ref=e6] [cursor=pointer]:
        - /url: "#/"
    - paragraph [ref=e7]: "Unofficial fan tool · game data 1.0.x (user screenshots: 100-REV6) (data 2026-11-05.4)"
    - navigation "Main navigation" [ref=e8]:
      - link "Calculators" [ref=e9] [cursor=pointer]:
        - /url: "#/"
      - link "Character Builder" [ref=e10] [cursor=pointer]:
        - /url: "#/character-builder"
      - link "Game Guide" [ref=e11] [cursor=pointer]:
        - /url: "#/game-guide"
      - link "Sources & Credits" [ref=e12] [cursor=pointer]:
        - /url: "#/sources"
  - main [ref=e14]:
    - generic [ref=e15]:
      - heading "Probably Stolen Calculator" [level=2] [ref=e16]
      - paragraph [ref=e17]: Unofficial fan tool for production economics, character builds and game mechanics.Select a profession calculator to begin.
      - generic [ref=e18]:
        - link "Chemist calculator (Advanced Start)" [ref=e19] [cursor=pointer]:
          - /url: "#/calculators/chemist"
          - img "Chemist" [ref=e20]
          - generic [ref=e46]:
            - generic [ref=e47]: Chemist
            - generic [ref=e48]: Advanced Start
        - link "Water Merchant calculator" [ref=e49] [cursor=pointer]:
          - /url: "#/calculators/water-merchant"
          - img "Water Merchant" [ref=e50]
          - generic [ref=e84]: Water Merchant
        - link "Hydroponic Farmer calculator (Advanced Start)" [ref=e86] [cursor=pointer]:
          - /url: "#/calculators/hydroponic-farmer"
          - img "Hydroponic Farmer" [ref=e87]
          - generic [ref=e108]:
            - generic [ref=e109]: Hydroponic Farmer
            - generic [ref=e110]: Advanced Start
        - link "Aquafarmer calculator (Advanced Start)" [ref=e111] [cursor=pointer]:
          - /url: "#/calculators/aquafarmer"
          - img "Aquafarmer" [ref=e112]
          - generic [ref=e126]:
            - generic [ref=e127]: Aquafarmer
            - generic [ref=e128]: Advanced Start
        - link "Rat Wrangler calculator (Advanced Start)" [ref=e129] [cursor=pointer]:
          - /url: "#/calculators/rat-wrangler"
          - img "Rat Wrangler" [ref=e130]
          - generic [ref=e146]:
            - generic [ref=e147]: Rat Wrangler
            - generic [ref=e148]: Advanced Start
        - link "Gunsmith calculator (Advanced Start)" [ref=e149] [cursor=pointer]:
          - /url: "#/calculators/gunsmith"
          - img "Gunsmith" [ref=e150]
          - generic [ref=e165]:
            - generic [ref=e166]: Gunsmith
            - generic [ref=e167]: Advanced Start
        - link "Fence calculator" [ref=e168] [cursor=pointer]:
          - /url: "#/calculators/fence"
          - img "Fence" [ref=e169]
          - generic [ref=e195]: Fence
        - link "Apprentice calculator (Recommended For New Players)" [ref=e197] [cursor=pointer]:
          - /url: "#/calculators/apprentice"
          - img "Apprentice" [ref=e198]
          - generic [ref=e234]:
            - generic [ref=e235]: Apprentice
            - generic [ref=e236]: Recommended For New Players
        - link "Rock Bottom calculator (Extreme Challenge Mode)" [ref=e237] [cursor=pointer]:
          - /url: "#/calculators/rock-bottom"
          - img "Rock Bottom" [ref=e238]
          - generic [ref=e251]:
            - generic [ref=e252]: Rock Bottom
            - generic [ref=e253]: Extreme Challenge Mode
      - generic [ref=e254]:
        - paragraph [ref=e255]:
          - strong [ref=e256]: New to the game?
          - text: Start with the
          - link "Character Builder" [ref=e257] [cursor=pointer]:
            - /url: "#/character-builder"
          - text: to plan your specialization and starting perks.
        - paragraph [ref=e258]:
          - text: All calculators preserve existing game data accuracy standards. Values come from verified community sources; see
          - link "Sources & Credits" [ref=e259] [cursor=pointer]:
            - /url: "#/sources"
          - text: .
  - contentinfo [ref=e260]:
    - generic [ref=e261]:
      - navigation "Game & Resources" [ref=e262]:
        - heading "Game & Resources" [level=2] [ref=e263]
        - list [ref=e264]:
          - listitem [ref=e265]:
            - link "Get the Game (opens in a new tab)" [ref=e266] [cursor=pointer]:
              - /url: https://store.steampowered.com/app/4348910/
              - text: Get the Game
              - generic [aria-hidden] [ref=e267]: ↗
              - generic [ref=e268]: (opens in a new tab)
          - listitem [ref=e269]:
            - link "Game Wiki (opens in a new tab)" [ref=e270] [cursor=pointer]:
              - /url: https://www.probablystolen-wiki.wiki/
              - text: Game Wiki
              - generic [aria-hidden] [ref=e271]: ↗
              - generic [ref=e272]: (opens in a new tab)
          - listitem [ref=e273]:
            - link "Technical Wiki (opens in a new tab)" [ref=e274] [cursor=pointer]:
              - /url: https://probably-stolen.nicokobo.com/en/
              - text: Technical Wiki
              - generic [aria-hidden] [ref=e275]: ↗
              - generic [ref=e276]: (opens in a new tab)
          - listitem [ref=e277]:
            - link "Sources & Credits" [ref=e278] [cursor=pointer]:
              - /url: "#/sources"
          - listitem [ref=e279]:
            - link "GitHub (opens in a new tab)" [ref=e280] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg/probably-stolen-calculator
              - text: GitHub
              - generic [aria-hidden] [ref=e281]: ↗
              - generic [ref=e282]: (opens in a new tab)
      - navigation "More Projects by PhoenixbgOrg" [ref=e283]:
        - heading "More Projects by PhoenixbgOrg" [level=2] [ref=e284]
        - list [ref=e285]:
          - listitem [ref=e286]:
            - link "RitualForge Labs (opens in a new tab)" [ref=e287] [cursor=pointer]:
              - /url: https://ritualforgelabs.com
              - text: RitualForge Labs
              - generic [aria-hidden] [ref=e288]: ↗
              - generic [ref=e289]: (opens in a new tab)
          - listitem [ref=e290]:
            - link "PhoenixCore OS (opens in a new tab)" [ref=e291] [cursor=pointer]:
              - /url: https://phoenixcoreos.org
              - text: PhoenixCore OS
              - generic [aria-hidden] [ref=e292]: ↗
              - generic [ref=e293]: (opens in a new tab)
          - listitem [ref=e294]:
            - link "GitHub Projects (opens in a new tab)" [ref=e295] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg
              - text: GitHub Projects
              - generic [aria-hidden] [ref=e296]: ↗
              - generic [ref=e297]: (opens in a new tab)
    - paragraph [ref=e298]:
      - text: Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See
      - link "Sources & Credits" [ref=e299] [cursor=pointer]:
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
> 8  |     await expect(page.locator('h2')).toContainText('Dream Dust Production Planner');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
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
  21 |     await expect(purityInput).toHaveValue('45');
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