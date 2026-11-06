# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chemist-calculator.spec.ts >> Chemist Dream Dust Calculator (Repaired Branch) >> changing inputs shows stale indicator
- Location: e2e/chemist-calculator.spec.ts:42:3

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('button:has-text("Calculate production plan")')

```

```
Error: write EPIPE
```