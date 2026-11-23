import type { FullConfig } from '@playwright/test';
import { findCollisions, listConfig, listedTests } from './output-collisions';

/**
 * Global setup: refuses to start a run in which two tests would share an artifact folder
 * (Playwright would delete the first test's evidence; see output-collisions.ts).
 * Lists the whole config (not only the selected projects), costs one --list pass (~0.7 s).
 */
export default function collisionGlobalSetup(config: FullConfig): void {
  // The listing below loads the same config; it must not start another check.
  if (process.env.PQF_COLLISION_CHECK === 'listing') return;
  if (!config.configFile) return;
  const collisions = findCollisions(listedTests(listConfig(config.configFile)));
  if (collisions.length === 0) return;
  const lines = collisions.flatMap((c) => [`  folder "${c.folder}":`, ...c.tests.map((t) => `    - ${t}`)]);
  throw new Error(
    `[evidence] ${collisions.length} artifact folder collision(s); no test was run.\n${lines.join('\n')}\n` +
      'Playwright derives the folder from the sanitized title, so titles that differ only in punctuation share it ' +
      'and the later test deletes the earlier one\'s evidence. Make the titles unique, e.g. with a row number.',
  );
}
