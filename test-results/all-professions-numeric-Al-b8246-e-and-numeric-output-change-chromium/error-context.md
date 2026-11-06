# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: all-professions-numeric.spec.ts >> All 8 Other Professions - Public Site Numeric Validation >> Aquafarmer - baseline and numeric output change
- Location: e2e/all-professions-numeric.spec.ts:69:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "
    Probably Stolen CalculatorUnofficial fan tool · game data 1.0.x (user screenshots: 100-REV6) (data 2026-11-05.4)CalculatorsCharacter BuilderGame GuideSources & CreditsAquafarmer CalculatorAdvanced StartSpeciesTilapiaGutter TilapiaGraft TilapiaEelElectric EelSturgeonCumulative absorbed caloriesCurrent egg mass (g)Egg calories per gramPotential meat calories4500900 / 400 / 200 / 100 kcal pieces5 / 0 / 0 / 0Fish Scrap0Source: Aquaculture. Enter the fish’s measured cumulative record; deaths, predation and tank conditions are not inferred.Game & ResourcesGet the Game ↗ (opens in a new tab)Game Wiki ↗ (opens in a new tab)Technical Wiki ↗ (opens in a new tab)Sources & CreditsGitHub ↗ (opens in a new tab)More Projects by PhoenixbgOrgRitualForge Labs ↗ (opens in a new tab)PhoenixCore OS ↗ (opens in a new tab)GitHub Projects ↗ (opens in a new tab)Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See Sources & Credits.····
"
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
      - generic [ref=e16]:
        - img "Aquafarmer" [ref=e17]
        - generic [ref=e31]:
          - heading "Aquafarmer Calculator" [level=2] [ref=e32]
          - generic [ref=e33]: Advanced Start
      - generic [ref=e35]:
        - generic [ref=e36]:
          - generic [ref=e37]: Species
          - combobox "Species" [ref=e38]:
            - option "Tilapia" [selected]
            - option "Gutter Tilapia"
            - option "Graft Tilapia"
            - option "Eel"
            - option "Electric Eel"
            - option "Sturgeon"
        - generic [ref=e39]:
          - generic [ref=e40]: Cumulative absorbed calories
          - spinbutton "Cumulative absorbed calories" [active] [ref=e41]: "5000"
        - generic [ref=e42]:
          - generic [ref=e43]: Current egg mass (g)
          - spinbutton "Current egg mass (g)" [ref=e44]: "0"
        - generic [ref=e45]:
          - generic [ref=e46]: Egg calories per gram
          - spinbutton "Egg calories per gram" [ref=e47]: "2"
        - generic [ref=e48]:
          - generic [ref=e49]:
            - generic [ref=e50]: Potential meat calories
            - strong [ref=e51]: "4500"
          - generic [ref=e52]:
            - generic [ref=e53]: 900 / 400 / 200 / 100 kcal pieces
            - strong [ref=e54]: 5 / 0 / 0 / 0
          - generic [ref=e55]:
            - generic [ref=e56]: Fish Scrap
            - strong [ref=e57]: "0"
        - paragraph [ref=e58]:
          - text: "Source:"
          - link "Aquaculture" [ref=e59] [cursor=pointer]:
            - /url: https://probably-stolen.nicokobo.com/en/collections/aquaculture
          - text: . Enter the fish’s measured cumulative record; deaths, predation and tank conditions are not inferred.
  - contentinfo [ref=e60]:
    - generic [ref=e61]:
      - navigation "Game & Resources" [ref=e62]:
        - heading "Game & Resources" [level=2] [ref=e63]
        - list [ref=e64]:
          - listitem [ref=e65]:
            - link "Get the Game (opens in a new tab)" [ref=e66] [cursor=pointer]:
              - /url: https://store.steampowered.com/app/4348910/
              - text: Get the Game
              - generic [aria-hidden] [ref=e67]: ↗
              - generic [ref=e68]: (opens in a new tab)
          - listitem [ref=e69]:
            - link "Game Wiki (opens in a new tab)" [ref=e70] [cursor=pointer]:
              - /url: https://www.probablystolen-wiki.wiki/
              - text: Game Wiki
              - generic [aria-hidden] [ref=e71]: ↗
              - generic [ref=e72]: (opens in a new tab)
          - listitem [ref=e73]:
            - link "Technical Wiki (opens in a new tab)" [ref=e74] [cursor=pointer]:
              - /url: https://probably-stolen.nicokobo.com/en/
              - text: Technical Wiki
              - generic [aria-hidden] [ref=e75]: ↗
              - generic [ref=e76]: (opens in a new tab)
          - listitem [ref=e77]:
            - link "Sources & Credits" [ref=e78] [cursor=pointer]:
              - /url: "#/sources"
          - listitem [ref=e79]:
            - link "GitHub (opens in a new tab)" [ref=e80] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg/probably-stolen-calculator
              - text: GitHub
              - generic [aria-hidden] [ref=e81]: ↗
              - generic [ref=e82]: (opens in a new tab)
      - navigation "More Projects by PhoenixbgOrg" [ref=e83]:
        - heading "More Projects by PhoenixbgOrg" [level=2] [ref=e84]
        - list [ref=e85]:
          - listitem [ref=e86]:
            - link "RitualForge Labs (opens in a new tab)" [ref=e87] [cursor=pointer]:
              - /url: https://ritualforgelabs.com
              - text: RitualForge Labs
              - generic [aria-hidden] [ref=e88]: ↗
              - generic [ref=e89]: (opens in a new tab)
          - listitem [ref=e90]:
            - link "PhoenixCore OS (opens in a new tab)" [ref=e91] [cursor=pointer]:
              - /url: https://phoenixcoreos.org
              - text: PhoenixCore OS
              - generic [aria-hidden] [ref=e92]: ↗
              - generic [ref=e93]: (opens in a new tab)
          - listitem [ref=e94]:
            - link "GitHub Projects (opens in a new tab)" [ref=e95] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg
              - text: GitHub Projects
              - generic [aria-hidden] [ref=e96]: ↗
              - generic [ref=e97]: (opens in a new tab)
    - paragraph [ref=e98]:
      - text: Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See
      - link "Sources & Credits" [ref=e99] [cursor=pointer]:
        - /url: "#/sources"
      - text: .
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // CRITICAL: Must use actual deployed GitHub Pages URL, not local dev server
  4   | const PUBLIC_URL = 'https://phoenixbgorg.github.io/probably-stolen-calculator';
  5   | 
  6   | test.describe('All 8 Other Professions - Public Site Numeric Validation', () => {
  7   |   // These tests validate the DEPLOYED production site, not local changes
  8   |   test.use({ baseURL: PUBLIC_URL });
  9   |   
  10  |   test('Water Merchant - baseline and numeric output change', async ({ page }) => {
  11  |     await page.goto(`${PUBLIC_URL}/#/calculators/water-merchant`);
  12  |     await page.waitForLoadState('networkidle');
  13  |     
  14  |     await expect(page.locator('h2.panel-title')).toContainText('Water Merchant');
  15  |     
  16  |     // Record baseline visible outputs
  17  |     const pageContent = await page.textContent('body');
  18  |     console.log('=== Water Merchant baseline output ===');
  19  |     console.log(pageContent?.slice(0, 800));
  20  |     
  21  |     // Find first numeric input and record its value
  22  |     const inputs = page.locator('input[type="number"]');
  23  |     const count = await inputs.count();
  24  |     expect(count).toBeGreaterThan(0);
  25  |     
  26  |     const firstInput = inputs.first();
  27  |     const baselineValue = await firstInput.inputValue();
  28  |     console.log('Water Merchant baseline first input:', baselineValue);
  29  |     
  30  |     // Change input
  31  |     await firstInput.fill('1000');
  32  |     await page.waitForTimeout(800);
  33  |     
  34  |     const changedContent = await page.textContent('body');
  35  |     console.log('=== Water Merchant changed output ===');
  36  |     console.log(changedContent?.slice(0, 800));
  37  |     
  38  |     // Verify content changed
  39  |     expect(changedContent).toBeDefined();
  40  |     expect(changedContent).not.toBe(pageContent);
  41  |   });
  42  | 
  43  |   test('Hydroponic Farmer - baseline and numeric output change', async ({ page }) => {
  44  |     await page.goto(`${PUBLIC_URL}/#/calculators/hydroponic-farmer`);
  45  |     await page.waitForLoadState('networkidle');
  46  |     
  47  |     await expect(page.locator('h2.panel-title')).toContainText('Hydroponic Farmer');
  48  |     
  49  |     const pageContent = await page.textContent('body');
  50  |     console.log('=== Hydroponic Farmer baseline output ===');
  51  |     console.log(pageContent?.slice(0, 800));
  52  |     
  53  |     const inputs = page.locator('input[type="number"]');
  54  |     const firstInput = inputs.first();
  55  |     const baselineValue = await firstInput.inputValue();
  56  |     console.log('Hydroponic Farmer baseline first input:', baselineValue);
  57  |     
  58  |     await firstInput.fill('100');
  59  |     await page.waitForTimeout(800);
  60  |     
  61  |     const changedContent = await page.textContent('body');
  62  |     console.log('=== Hydroponic Farmer changed output ===');
  63  |     console.log(changedContent?.slice(0, 800));
  64  |     
  65  |     expect(changedContent).toBeDefined();
  66  |     expect(changedContent).not.toBe(pageContent);
  67  |   });
  68  | 
  69  |   test('Aquafarmer - baseline and numeric output change', async ({ page }) => {
  70  |     await page.goto(`${PUBLIC_URL}/#/calculators/aquafarmer`);
  71  |     await page.waitForLoadState('networkidle');
  72  |     
  73  |     await expect(page.locator('h2.panel-title')).toContainText('Aquafarmer');
  74  |     
  75  |     const pageContent = await page.textContent('body');
  76  |     console.log('=== Aquafarmer baseline output ===');
  77  |     console.log(pageContent?.slice(0, 800));
  78  |     
  79  |     const inputs = page.locator('input[type="number"]');
  80  |     const firstInput = inputs.first();
  81  |     const baselineValue = await firstInput.inputValue();
  82  |     console.log('Aquafarmer baseline first input:', baselineValue);
  83  |     
  84  |     await firstInput.fill('5000');
  85  |     await page.waitForTimeout(800);
  86  |     
  87  |     const changedContent = await page.textContent('body');
  88  |     console.log('=== Aquafarmer changed output ===');
  89  |     console.log(changedContent?.slice(0, 800));
  90  |     
  91  |     expect(changedContent).toBeDefined();
> 92  |     expect(changedContent).not.toBe(pageContent);
      |                                ^ Error: expect(received).not.toBe(expected) // Object.is equality
  93  |   });
  94  | 
  95  |   test('Rat Wrangler - baseline and numeric output change', async ({ page }) => {
  96  |     await page.goto(`${PUBLIC_URL}/#/calculators/rat-wrangler`);
  97  |     await page.waitForLoadState('networkidle');
  98  |     
  99  |     await expect(page.locator('h2.panel-title')).toContainText('Rat Wrangler');
  100 |     
  101 |     const pageContent = await page.textContent('body');
  102 |     console.log('=== Rat Wrangler baseline output ===');
  103 |     console.log(pageContent?.slice(0, 800));
  104 |     
  105 |     const inputs = page.locator('input[type="number"]');
  106 |     const firstInput = inputs.first();
  107 |     const baselineValue = await firstInput.inputValue();
  108 |     console.log('Rat Wrangler baseline first input:', baselineValue);
  109 |     
  110 |     await firstInput.fill('400');
  111 |     await page.waitForTimeout(800);
  112 |     
  113 |     const changedContent = await page.textContent('body');
  114 |     console.log('=== Rat Wrangler changed output ===');
  115 |     console.log(changedContent?.slice(0, 800));
  116 |     
  117 |     expect(changedContent).toBeDefined();
  118 |     expect(changedContent).not.toBe(pageContent);
  119 |   });
  120 | 
  121 |   test('Gunsmith - baseline and numeric output change', async ({ page }) => {
  122 |     await page.goto(`${PUBLIC_URL}/#/calculators/gunsmith`);
  123 |     await page.waitForLoadState('networkidle');
  124 |     
  125 |     await expect(page.locator('h2.panel-title')).toContainText('Gunsmith');
  126 |     
  127 |     const pageContent = await page.textContent('body');
  128 |     console.log('=== Gunsmith baseline output ===');
  129 |     console.log(pageContent?.slice(0, 800));
  130 |     
  131 |     const inputs = page.locator('input[type="number"]');
  132 |     const firstInput = inputs.first();
  133 |     const baselineValue = await firstInput.inputValue();
  134 |     console.log('Gunsmith baseline first input:', baselineValue);
  135 |     
  136 |     await firstInput.fill('50');
  137 |     await page.waitForTimeout(800);
  138 |     
  139 |     const changedContent = await page.textContent('body');
  140 |     console.log('=== Gunsmith changed output ===');
  141 |     console.log(changedContent?.slice(0, 800));
  142 |     
  143 |     expect(changedContent).toBeDefined();
  144 |     expect(changedContent).not.toBe(pageContent);
  145 |   });
  146 | 
  147 |   test('Fence - baseline and numeric output change', async ({ page }) => {
  148 |     await page.goto(`${PUBLIC_URL}/#/calculators/fence`);
  149 |     await page.waitForLoadState('networkidle');
  150 |     
  151 |     await expect(page.locator('h2.panel-title')).toContainText('Fence');
  152 |     
  153 |     const pageContent = await page.textContent('body');
  154 |     console.log('=== Fence baseline output ===');
  155 |     console.log(pageContent?.slice(0, 800));
  156 |     
  157 |     const inputs = page.locator('input[type="number"]');
  158 |     const firstInput = inputs.first();
  159 |     const baselineValue = await firstInput.inputValue();
  160 |     console.log('Fence baseline first input:', baselineValue);
  161 |     
  162 |     await firstInput.fill('500');
  163 |     await page.waitForTimeout(800);
  164 |     
  165 |     const changedContent = await page.textContent('body');
  166 |     console.log('=== Fence changed output ===');
  167 |     console.log(changedContent?.slice(0, 800));
  168 |     
  169 |     expect(changedContent).toBeDefined();
  170 |     expect(changedContent).not.toBe(pageContent);
  171 |   });
  172 | 
  173 |   test('Apprentice - baseline and numeric output change', async ({ page }) => {
  174 |     await page.goto(`${PUBLIC_URL}/#/calculators/apprentice`);
  175 |     await page.waitForLoadState('networkidle');
  176 |     
  177 |     await expect(page.locator('h2.panel-title')).toContainText('Apprentice');
  178 |     
  179 |     const pageContent = await page.textContent('body');
  180 |     console.log('=== Apprentice baseline output ===');
  181 |     console.log(pageContent?.slice(0, 800));
  182 |     
  183 |     const inputs = page.locator('input[type="number"]');
  184 |     const firstInput = inputs.first();
  185 |     const baselineValue = await firstInput.inputValue();
  186 |     console.log('Apprentice baseline first input:', baselineValue);
  187 |     
  188 |     await firstInput.fill('600');
  189 |     await page.waitForTimeout(800);
  190 |     
  191 |     const changedContent = await page.textContent('body');
  192 |     console.log('=== Apprentice changed output ===');
```