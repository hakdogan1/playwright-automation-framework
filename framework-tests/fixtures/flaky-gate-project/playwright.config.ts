import { defineConfig } from '@playwright/test';

/**
 * Sub-project run by framework-tests/ci-flaky-gate.spec.ts. No browser, no network, no app.
 * The three CI keys are the same expressions as in the root playwright.config.ts; the self-test
 * checks that statically, so this project proves the behaviour of the real policy.
 * Output goes to a temp folder (PQF_FLAKY_GATE_OUT), never to evidence/.
 */
const isCI = !!process.env.CI;
const out = process.env.PQF_FLAKY_GATE_OUT;
if (!out) throw new Error('PQF_FLAKY_GATE_OUT must point to a temp folder');

export default defineConfig({
  testDir: '.',
  testMatch: 'flaky-gate.spec.ts',
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  failOnFlakyTests: isCI,
  outputDir: `${out}/artifacts`,
  reporter: [['json', { outputFile: `${out}/results.json` }]],
});
