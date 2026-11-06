# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: all-professions-numeric.spec.ts >> All 8 Other Professions - Public Site Numeric Validation >> Apprentice - baseline and numeric output change
- Location: e2e/all-professions-numeric.spec.ts:173:3

# Error details

```
Error: Channel closed
```

```
Error: page.waitForTimeout: Test ended.
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
        - img "Apprentice" [ref=e17]
        - generic [ref=e53]:
          - heading "Apprentice Calculator" [level=2] [ref=e54]
          - generic [ref=e55]: Recommended For New Players
      - generic [ref=e57]:
        - paragraph [ref=e58]: Measured cash-flow planner. Enter the actual offer, realised sale, fees and bills from the current save; no unsupported customer schedule or resale margin is assumed.
        - generic [ref=e59]:
          - generic [ref=e60]: Cash available
          - spinbutton "Cash available" [active] [ref=e61]: "600"
        - generic [ref=e62]:
          - generic [ref=e63]: Next rent
          - spinbutton "Next rent" [ref=e64]: "200"
        - generic [ref=e65]:
          - generic [ref=e66]: Other bills/services
          - spinbutton "Other bills/services" [ref=e67]: "0"
        - generic [ref=e68]:
          - generic [ref=e69]: Purchase/material cost per cycle
          - spinbutton "Purchase/material cost per cycle" [ref=e70]: "100"
        - generic [ref=e71]:
          - generic [ref=e72]: Realised sale revenue per cycle
          - spinbutton "Realised sale revenue per cycle" [ref=e73]: "140"
        - generic [ref=e74]:
          - generic [ref=e75]: Fees per cycle
          - spinbutton "Fees per cycle" [ref=e76]: "0"
        - generic [ref=e77]:
          - generic [ref=e78]: Cycles before bills
          - spinbutton "Cycles before bills" [ref=e79]: "1"
        - generic [ref=e80]: Bills remain affordable
        - generic [ref=e81]:
          - generic [ref=e82]: Profit per cycle
          - strong [ref=e83]: 40 Credits
        - generic [ref=e84]:
          - generic [ref=e85]: Cash after cycles and bills
          - strong [ref=e86]: 440 Credits
        - generic [ref=e87]:
          - generic [ref=e88]: Maximum affordable purchase
          - strong [ref=e89]: 540 Credits
        - paragraph [ref=e90]:
          - text: "Source context:"
          - link "apprentice" [ref=e91] [cursor=pointer]:
            - /url: https://probably-stolen.nicokobo.com/en/wiki/occupations/occupation-apprentice
          - text: . Fence trade outcomes depend on actual stock/buyers; Apprentice and Rock Bottom are starts, not production recipes.
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
> 189 |     await page.waitForTimeout(800);
      |                ^ Error: page.waitForTimeout: Test ended.
  190 |     
  191 |     const changedContent = await page.textContent('body');
  192 |     console.log('=== Apprentice changed output ===');
  193 |     console.log(changedContent?.slice(0, 800));
  194 |     
  195 |     expect(changedContent).toBeDefined();
  196 |     expect(changedContent).not.toBe(pageContent);
  197 |   });
  198 | 
  199 |   test('Rock Bottom - baseline and numeric output change', async ({ page }) => {
  200 |     await page.goto(`${PUBLIC_URL}/#/calculators/rock-bottom`);
  201 |     await page.waitForLoadState('networkidle');
  202 |     
  203 |     await expect(page.locator('h2.panel-title')).toContainText('Rock Bottom');
  204 |     
  205 |     const pageContent = await page.textContent('body');
  206 |     console.log('=== Rock Bottom baseline output ===');
  207 |     console.log(pageContent?.slice(0, 800));
  208 |     
  209 |     const inputs = page.locator('input[type="number"]');
  210 |     const firstInput = inputs.first();
  211 |     const baselineValue = await firstInput.inputValue();
  212 |     console.log('Rock Bottom baseline first input:', baselineValue);
  213 |     
  214 |     await firstInput.fill('100');
  215 |     await page.waitForTimeout(800);
  216 |     
  217 |     const changedContent = await page.textContent('body');
  218 |     console.log('=== Rock Bottom changed output ===');
  219 |     console.log(changedContent?.slice(0, 800));
  220 |     
  221 |     expect(changedContent).toBeDefined();
  222 |     expect(changedContent).not.toBe(pageContent);
  223 |   });
  224 | });
  225 | 
```