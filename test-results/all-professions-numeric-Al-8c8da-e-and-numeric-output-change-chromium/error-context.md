# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: all-professions-numeric.spec.ts >> All 8 Other Professions - Public Site Numeric Validation >> Water Merchant - baseline and numeric output change
- Location: e2e/all-professions-numeric.spec.ts:10:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "
    Probably Stolen CalculatorUnofficial fan tool · game data 1.0.x (user screenshots: 100-REV6) (data 2026-11-05.4)CalculatorsCharacter BuilderGame GuideSources & CreditsWater Merchant CalculatorOne-night Water Purifier calculation. Enter the dirtiness multiplier shown/derived for the measured purity tier; this avoids guessing an interpolation tier.Total liquid volume (mL)Actual water component (mL)Removable impurity (mL)Dirtiness multiplier (measured/source tier)Machine performance bonus (%)Machine quality bonus (%)Removal budget70.000 mLActually converted to water70.000 mLFinal purity97.000%Quality cap99.00%Power used4Source: Water purification. The machine converts removed components into equal water volume; it does not shrink the batch.Game & ResourcesGet the Game ↗ (opens in a new tab)Game Wiki ↗ (opens in a new tab)Technical Wiki ↗ (opens in a new tab)Sources & CreditsGitHub ↗ (opens in a new tab)More Projects by PhoenixbgOrgRitualForge Labs ↗ (opens in a new tab)PhoenixCore OS ↗ (opens in a new tab)GitHub Projects ↗ (opens in a new tab)Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See Sources & Credits.····
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
        - img "Water Merchant" [ref=e17]
        - heading "Water Merchant Calculator" [level=2] [ref=e52]
      - generic [ref=e54]:
        - paragraph [ref=e55]: One-night Water Purifier calculation. Enter the dirtiness multiplier shown/derived for the measured purity tier; this avoids guessing an interpolation tier.
        - generic [ref=e56]:
          - generic [ref=e57]: Total liquid volume (mL)
          - spinbutton "Total liquid volume (mL)" [active] [ref=e58]: "1000"
        - generic [ref=e59]:
          - generic [ref=e60]: Actual water component (mL)
          - spinbutton "Actual water component (mL)" [ref=e61]: "900"
        - generic [ref=e62]:
          - generic [ref=e63]: Removable impurity (mL)
          - spinbutton "Removable impurity (mL)" [ref=e64]: "100"
        - generic [ref=e65]:
          - generic [ref=e66]: Dirtiness multiplier (measured/source tier)
          - spinbutton "Dirtiness multiplier (measured/source tier)" [ref=e67]: "2"
        - generic [ref=e68]:
          - generic [ref=e69]: Machine performance bonus (%)
          - spinbutton "Machine performance bonus (%)" [ref=e70]: "0"
        - generic [ref=e71]:
          - generic [ref=e72]: Machine quality bonus (%)
          - spinbutton "Machine quality bonus (%)" [ref=e73]: "0"
        - generic [ref=e74]:
          - generic [ref=e75]:
            - generic [ref=e76]: Removal budget
            - strong [ref=e77]: 70.000 mL
          - generic [ref=e78]:
            - generic [ref=e79]: Actually converted to water
            - strong [ref=e80]: 70.000 mL
          - generic [ref=e81]:
            - generic [ref=e82]: Final purity
            - strong [ref=e83]: 97.000%
          - generic [ref=e84]:
            - generic [ref=e85]: Quality cap
            - strong [ref=e86]: 99.00%
          - generic [ref=e87]:
            - generic [ref=e88]: Power used
            - strong [ref=e89]: "4"
        - paragraph [ref=e90]:
          - text: "Source:"
          - link "Water purification" [ref=e91] [cursor=pointer]:
            - /url: https://probably-stolen.nicokobo.com/en/wiki/terms/water-purification
          - text: . The machine converts removed components into equal water volume; it does not shrink the batch.
  - contentinfo [ref=e92]:
    - generic [ref=e93]:
      - navigation "Game & Resources" [ref=e94]:
        - heading "Game & Resources" [level=2] [ref=e95]
        - list [ref=e96]:
          - listitem [ref=e97]:
            - link "Get the Game (opens in a new tab)" [ref=e98] [cursor=pointer]:
              - /url: https://store.steampowered.com/app/4348910/
              - text: Get the Game
              - generic [aria-hidden] [ref=e99]: ↗
              - generic [ref=e100]: (opens in a new tab)
          - listitem [ref=e101]:
            - link "Game Wiki (opens in a new tab)" [ref=e102] [cursor=pointer]:
              - /url: https://www.probablystolen-wiki.wiki/
              - text: Game Wiki
              - generic [aria-hidden] [ref=e103]: ↗
              - generic [ref=e104]: (opens in a new tab)
          - listitem [ref=e105]:
            - link "Technical Wiki (opens in a new tab)" [ref=e106] [cursor=pointer]:
              - /url: https://probably-stolen.nicokobo.com/en/
              - text: Technical Wiki
              - generic [aria-hidden] [ref=e107]: ↗
              - generic [ref=e108]: (opens in a new tab)
          - listitem [ref=e109]:
            - link "Sources & Credits" [ref=e110] [cursor=pointer]:
              - /url: "#/sources"
          - listitem [ref=e111]:
            - link "GitHub (opens in a new tab)" [ref=e112] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg/probably-stolen-calculator
              - text: GitHub
              - generic [aria-hidden] [ref=e113]: ↗
              - generic [ref=e114]: (opens in a new tab)
      - navigation "More Projects by PhoenixbgOrg" [ref=e115]:
        - heading "More Projects by PhoenixbgOrg" [level=2] [ref=e116]
        - list [ref=e117]:
          - listitem [ref=e118]:
            - link "RitualForge Labs (opens in a new tab)" [ref=e119] [cursor=pointer]:
              - /url: https://ritualforgelabs.com
              - text: RitualForge Labs
              - generic [aria-hidden] [ref=e120]: ↗
              - generic [ref=e121]: (opens in a new tab)
          - listitem [ref=e122]:
            - link "PhoenixCore OS (opens in a new tab)" [ref=e123] [cursor=pointer]:
              - /url: https://phoenixcoreos.org
              - text: PhoenixCore OS
              - generic [aria-hidden] [ref=e124]: ↗
              - generic [ref=e125]: (opens in a new tab)
          - listitem [ref=e126]:
            - link "GitHub Projects (opens in a new tab)" [ref=e127] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg
              - text: GitHub Projects
              - generic [aria-hidden] [ref=e128]: ↗
              - generic [ref=e129]: (opens in a new tab)
    - paragraph [ref=e130]:
      - text: Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See
      - link "Sources & Credits" [ref=e131] [cursor=pointer]:
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
> 40  |     expect(changedContent).not.toBe(pageContent);
      |                                ^ Error: expect(received).not.toBe(expected) // Object.is equality
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
  92  |     expect(changedContent).not.toBe(pageContent);
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
```