import { test, expect } from '@playwright/test';
import { ESLint } from 'eslint';

/**
 * Proves the guard-related lint rules fire. Lint is a review aid; the runtime
 * guard is what blocks requests (see guard.*.spec.ts).
 * Source is linted in memory under existing file names; nothing is written.
 */
const SPEC = 'apps/qa-practice/tests/buttons/buttons.spec.ts';
const COMPONENT = 'apps/qa-practice/components/combobox.component.ts';
const CORE = 'core/config/env.ts';

const cases: { name: string; file: string; code: string; rule: string }[] = [
  { name: 'page.route in apps', file: SPEC, rule: 'no-restricted-properties', code: "import { test } from '../../fixtures';\ntest('a', async ({ page }) => { await page.route('**/*', (r) => r.continue()); });" },
  { name: 'page.request in apps', file: SPEC, rule: 'no-restricted-syntax', code: "import { test } from '../../fixtures';\ntest('a', async ({ page }) => { await page.request.post('/x'); });" },
  { name: 'context.request in apps', file: SPEC, rule: 'no-restricted-syntax', code: "import { test } from '../../fixtures';\ntest('a', async ({ context }) => { await context.request.delete('/x'); });" },
  { name: 'browser.newPage in apps', file: SPEC, rule: 'no-restricted-syntax', code: "import { test } from '../../fixtures';\ntest('a', async ({ browser }) => { await browser.newPage(); });" },
  { name: 'newContext in apps', file: SPEC, rule: 'no-restricted-properties', code: "import { test } from '../../fixtures';\ntest('a', async ({ playwright }) => { await playwright.request.newContext(); });" },
  { name: 'importing chromium', file: SPEC, rule: 'no-restricted-imports', code: "import { chromium } from '@playwright/test';\nexport const b = chromium;" },
  { name: 'importing the playwright package', file: SPEC, rule: 'no-restricted-imports', code: "import { chromium } from 'playwright';\nexport const b = chromium;" },
  { name: 'waitForTimeout', file: SPEC, rule: 'playwright/no-wait-for-timeout', code: "import { test } from '../../fixtures';\ntest('a', async ({ page }) => { await page.waitForTimeout(100); });" },
  { name: 'component imports expect from fixtures', file: COMPONENT, rule: 'no-restricted-imports', code: "import { expect } from '../fixtures';\nexport const e = expect;" },
  { name: 'core imports apps', file: CORE, rule: 'no-restricted-imports', code: "import { qaPractice } from '../../apps/qa-practice/app.config';\nexport const a = qaPractice;" },
];

test.describe('lint rules for guard bypasses', () => {
  test.describe.configure({ mode: 'serial' });
  let eslint: ESLint;

  test.beforeAll(() => {
    eslint = new ESLint();
  });

  for (const c of cases) {
    test(`flags ${c.name}`, async () => {
      test.slow();
      const [result] = await eslint.lintText(c.code, { filePath: c.file });
      expect(result?.messages.map((m) => m.ruleId)).toContain(c.rule);
    });
  }

  test('the request fixture itself is allowed', async () => {
    test.slow();
    const [result] = await eslint.lintText("import { test, expect } from '../../fixtures';\ntest('a', async ({ request }) => {\n  const res = await request.get('/x');\n  expect(res.ok()).toBe(true);\n});\n", { filePath: SPEC });
    expect(result?.messages.filter((m) => m.severity === 2).map((m) => m.ruleId)).toEqual([]);
  });
});
