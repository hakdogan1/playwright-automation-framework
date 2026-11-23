import { defineConfig } from '@playwright/test';

/**
 * Sub-project run by framework-tests/evidence-collision.spec.ts. No network, no app.
 * Output goes to a temp folder (PQF_COLLISION_OUT), never to evidence/.
 */
const out = process.env.PQF_COLLISION_OUT;
if (!out) throw new Error('PQF_COLLISION_OUT must point to a temp folder');

export default defineConfig({
  testDir: '.',
  testMatch: 'collision.spec.ts',
  workers: 1,
  fullyParallel: false,
  outputDir: `${out}/artifacts`,
  reporter: [['json', { outputFile: `${out}/results.json` }]],
  // The guard under test; off for the reproduction run.
  ...(process.env.PQF_COLLISION_GUARD === '1' ? { globalSetup: '../../../core/reporting/collision-global-setup.ts' } : {}),
});
