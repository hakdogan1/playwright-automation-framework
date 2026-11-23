import { defineConfig, devices } from '@playwright/test';
import { resolveEnvironment } from './core/config/env';
import { ensureRun } from './core/reporting/run-context';
import { buildPolicy } from './core/guard/policy';
import type { CoreOptions } from './core/fixtures';
import { qaPractice, QA_PRACTICE_ANALYTICS_IDS } from './apps/qa-practice/app.config';

const isCI = !!process.env.CI;
// One evidence folder per run: evidence/runs/<runId>/ (git-ignored, retention in core/reporting/retention.ts).
const run = ensureRun();

// Fails fast with a clear message on invalid TEST_ENV / BASE_URL / GUARD_MODE.
const qa = resolveEnvironment(qaPractice);
if (qa.defaulted && !process.env.PW_ENV_NOTICE_SHOWN) {
  process.env.PW_ENV_NOTICE_SHOWN = '1';
  console.log(`[env] TEST_ENV not set → using "production" (read-only guard) against ${qa.baseURL}`);
}

const qaHost = new URL(qa.baseURL).host;

// P1-7 mitigation (evidence: evidence/runs/20261122T170320Z-9dfc9c and 20261122T170808Z-a9e282, docs/navigation-timeout.md):
// with route interception active, Chromium + HTTP/3 (QUIC) occasionally left JS chunk requests
// pending until the load timeout (4/23 contexts; 0/23 with QUIC disabled). Root cause UNKNOWN.
// Chromium-based projects therefore run over HTTP/2. Residual risk: HTTP/3 is not exercised.
const chromiumLaunch = { launchOptions: { args: ['--disable-quic'] } };
const qaOptions: Partial<CoreOptions> & { baseURL: string } = {
  baseURL: qa.baseURL,
  testEnv: qa.env,
  guardMode: qa.guardMode,
  guardPolicy: buildPolicy({ env: qa.env, appHosts: [qaHost] }),
  analyticsIds: QA_PRACTICE_ANALYTICS_IDS,
  requireTcId: true,
};
const seedOptions: typeof qaOptions = { ...qaOptions, requireTcId: false };

export default defineConfig({
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // A test that only passes on retry is reported as flaky AND fails the CI run, so a retry can never
  // turn a red build green. Locally retries are 0, so flaky tests already fail.
  // Verified by framework-tests/ci-flaky-gate.spec.ts (keep the three CI keys literal: AI Guard reads them).
  failOnFlakyTests: isCI,
  retryStrategy: 'isolated',
  // Refuses to start a run in which two tests would share an artifact folder: Playwright deletes the
  // folder before each test, so the second would erase the first test's evidence (output-collisions.ts).
  globalSetup: './core/reporting/collision-global-setup.ts',
  // Be gentle with production (shared hosting): 2 workers. The earlier "host stalls under
  // parallel load" hypothesis was not supported by P1-7 diagnostics (docs/navigation-timeout.md).
  workers: qa.env === 'production' ? 2 : isCI ? 2 : 4,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  outputDir: `${run.dir}/artifacts`,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `${run.dir}/html` }],
    ['json', { outputFile: `${run.dir}/results.json` }],
    ['./core/reporting/bug-draft-reporter.ts', { outputDir: `${run.dir}/bug-drafts`, testCaseDirs: ['apps/qa-practice/test-cases'] }],
    ['./core/reporting/evidence-reporter.ts'],
  ],
  use: {
    trace: 'retain-on-failure-and-retries',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  ...(isCI ? { captureGitInfo: { commit: true } } : {}),
  projects: [
    {
      name: 'framework',
      testDir: './framework-tests',
      testIgnore: '**/fixtures/**',
      use: { ...devices['Desktop Chrome'], ...chromiumLaunch },
    },
    {
      name: 'qa-practice-chromium',
      testDir: './apps/qa-practice/tests',
      use: { ...devices['Desktop Chrome'], ...chromiumLaunch, ...qaOptions },
    },
    {
      name: 'qa-practice-mobile',
      testDir: './apps/qa-practice/tests',
      grep: /@smoke|@responsive/,
      use: { ...devices['Pixel 7'], ...chromiumLaunch, ...qaOptions },
    },
    {
      name: 'qa-practice-firefox',
      testDir: './apps/qa-practice/tests',
      default: false,
      use: { ...devices['Desktop Firefox'], ...qaOptions },
    },
    {
      // P1-7 navigation diagnostics (production, read-only, gentle). Manual only.
      name: 'diagnostics',
      testDir: './diagnostics',
      testMatch: '*.diag.ts',
      default: false,
      // The matrix records its own traces (only for timeouts).
      use: { ...devices['Desktop Chrome'], trace: 'off', video: 'off' },
    },
    {
      // Seed for Playwright Test Agents. Guarded like every other project; no TC-ID required.
      name: 'qa-practice-agent-seed',
      testDir: './apps/qa-practice/agents',
      default: false,
      use: { ...devices['Desktop Chrome'], ...chromiumLaunch, ...seedOptions },
    },
    {
      name: 'qa-practice-webkit',
      testDir: './apps/qa-practice/tests',
      default: false,
      use: { ...devices['Desktop Safari'], ...qaOptions },
    },
  ],
});
