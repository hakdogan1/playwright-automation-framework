import { defineConfig } from '@playwright/test';
import { ensureRun } from '../../../core/reporting/run-context';

/** Sub-project run by framework-tests/reporting.spec.ts. Its failures are intentional. */
// PQF_EVIDENCE_DIR is set by the self-test to a temp folder.
const run = ensureRun();

export default defineConfig({
  testDir: '.',
  testMatch: 'samples.spec.ts',
  retries: 1,
  workers: 1,
  outputDir: `${run.dir}/artifacts`,
  reporter: [
    ['json', { outputFile: `${run.dir}/results.json` }],
    ['../../../core/reporting/bug-draft-reporter.ts', { testCaseDirs: ['framework-tests/fixtures/reporter-project/test-cases'] }],
    ['../../../core/reporting/evidence-reporter.ts'],
  ],
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure-and-retries' },
});
