# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: all-professions-numeric.spec.ts >> All 8 Other Professions - Public Site Numeric Validation >> Gunsmith - baseline and numeric output change
- Location: e2e/all-professions-numeric.spec.ts:121:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "
    Probably Stolen CalculatorUnofficial fan tool · game data 1.0.x (user screenshots: 100-REV6) (data 2026-11-05.4)CalculatorsCharacter BuilderGame GuideSources & CreditsGunsmith CalculatorAdvanced StartBasic orderAccurateFirepowerBig and intimidatingAccurate/suppressedStylishFirepowerAccuracyReliabilitySizeStyleSuppression levelBase requirements passAdditive bonus46 CreditsPayment range before market/retail modifiers132–142 CreditsSource: Gunsmith Orders. Strict > thresholds are preserved. This calculator covers five documented Basic templates, not Mid/High/service orders.Game & ResourcesGet the Game ↗ (opens in a new tab)Game Wiki ↗ (opens in a new tab)Technical Wiki ↗ (opens in a new tab)Sources & CreditsGitHub ↗ (opens in a new tab)More Projects by PhoenixbgOrgRitualForge Labs ↗ (opens in a new tab)PhoenixCore OS ↗ (opens in a new tab)GitHub Projects ↗ (opens in a new tab)Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See Sources & Credits.····
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
        - img "Gunsmith" [ref=e17]
        - generic [ref=e32]:
          - heading "Gunsmith Calculator" [level=2] [ref=e33]
          - generic [ref=e34]: Advanced Start
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]: Basic order
          - combobox "Basic order" [ref=e39]:
            - option "Accurate" [selected]
            - option "Firepower"
            - option "Big and intimidating"
            - option "Accurate/suppressed"
            - option "Stylish"
        - generic [ref=e40]:
          - generic [ref=e41]: Firepower
          - spinbutton "Firepower" [active] [ref=e42]: "50"
        - generic [ref=e43]:
          - generic [ref=e44]: Accuracy
          - spinbutton "Accuracy" [ref=e45]: "21"
        - generic [ref=e46]:
          - generic [ref=e47]: Reliability
          - spinbutton "Reliability" [ref=e48]: "10"
        - generic [ref=e49]:
          - generic [ref=e50]: Size
          - spinbutton "Size" [ref=e51]: "10"
        - generic [ref=e52]:
          - generic [ref=e53]: Style
          - spinbutton "Style" [ref=e54]: "5"
        - generic [ref=e55]:
          - generic [ref=e56]: Suppression level
          - spinbutton "Suppression level" [ref=e57]: "0"
        - generic [ref=e58]: Base requirements pass
        - generic [ref=e59]:
          - generic [ref=e60]: Additive bonus
          - strong [ref=e61]: 46 Credits
        - generic [ref=e62]:
          - generic [ref=e63]: Payment range before market/retail modifiers
          - strong [ref=e64]: 132–142 Credits
        - paragraph [ref=e65]:
          - text: "Source:"
          - link "Gunsmith Orders" [ref=e66] [cursor=pointer]:
            - /url: https://probably-stolen.nicokobo.com/en/wiki/intents/gunsmith-orders
          - text: . Strict > thresholds are preserved. This calculator covers five documented Basic templates, not Mid/High/service orders.
  - contentinfo [ref=e67]:
    - generic [ref=e68]:
      - navigation "Game & Resources" [ref=e69]:
        - heading "Game & Resources" [level=2] [ref=e70]
        - list [ref=e71]:
          - listitem [ref=e72]:
            - link "Get the Game (opens in a new tab)" [ref=e73] [cursor=pointer]:
              - /url: https://store.steampowered.com/app/4348910/
              - text: Get the Game
              - generic [aria-hidden] [ref=e74]: ↗
              - generic [ref=e75]: (opens in a new tab)
          - listitem [ref=e76]:
            - link "Game Wiki (opens in a new tab)" [ref=e77] [cursor=pointer]:
              - /url: https://www.probablystolen-wiki.wiki/
              - text: Game Wiki
              - generic [aria-hidden] [ref=e78]: ↗
              - generic [ref=e79]: (opens in a new tab)
          - listitem [ref=e80]:
            - link "Technical Wiki (opens in a new tab)" [ref=e81] [cursor=pointer]:
              - /url: https://probably-stolen.nicokobo.com/en/
              - text: Technical Wiki
              - generic [aria-hidden] [ref=e82]: ↗
              - generic [ref=e83]: (opens in a new tab)
          - listitem [ref=e84]:
            - link "Sources & Credits" [ref=e85] [cursor=pointer]:
              - /url: "#/sources"
          - listitem [ref=e86]:
            - link "GitHub (opens in a new tab)" [ref=e87] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg/probably-stolen-calculator
              - text: GitHub
              - generic [aria-hidden] [ref=e88]: ↗
              - generic [ref=e89]: (opens in a new tab)
      - navigation "More Projects by PhoenixbgOrg" [ref=e90]:
        - heading "More Projects by PhoenixbgOrg" [level=2] [ref=e91]
        - list [ref=e92]:
          - listitem [ref=e93]:
            - link "RitualForge Labs (opens in a new tab)" [ref=e94] [cursor=pointer]:
              - /url: https://ritualforgelabs.com
              - text: RitualForge Labs
              - generic [aria-hidden] [ref=e95]: ↗
              - generic [ref=e96]: (opens in a new tab)
          - listitem [ref=e97]:
            - link "PhoenixCore OS (opens in a new tab)" [ref=e98] [cursor=pointer]:
              - /url: https://phoenixcoreos.org
              - text: PhoenixCore OS
              - generic [aria-hidden] [ref=e99]: ↗
              - generic [ref=e100]: (opens in a new tab)
          - listitem [ref=e101]:
            - link "GitHub Projects (opens in a new tab)" [ref=e102] [cursor=pointer]:
              - /url: https://github.com/PhoenixbgOrg
              - text: GitHub Projects
              - generic [aria-hidden] [ref=e103]: ↗
              - generic [ref=e104]: (opens in a new tab)
    - paragraph [ref=e105]:
      - text: Unofficial fan project, not affiliated with or endorsed by the developers or publisher of Probably Stolen. Values come from community sources and may be outdated; badges show verification status. See
      - link "Sources & Credits" [ref=e106] [cursor=pointer]:
        - /url: "#/sources"
      - text: .
```

# Test source

```ts
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
  141 |     console.log(changedContent?.slice(0, 800));
  142 |     
  143 |     expect(changedContent).toBeDefined();
> 144 |     expect(changedContent).not.toBe(pageContent);
      |                                ^ Error: expect(received).not.toBe(expected) // Object.is equality
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