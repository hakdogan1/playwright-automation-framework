import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { artifactFolderName, findCollisions, listConfig, listedTests } from '../core/reporting/output-collisions';

/**
 * Artifact folder collisions (found in run 20261123T080136Z-251ec9). Playwright names a test's
 * output folder after its sanitized title and deletes that folder before each test, so two titles
 * that differ only in punctuation make the second test delete the first one's evidence.
 * The global setup lists the suite and refuses to start such a run.
 */
const CONFIG = 'framework-tests/fixtures/collision-project/playwright.config.ts';
const FIRST = 'email "a b@c.test"';
const SECOND = 'email "a.b@@c.test"';

function runProject(guard: boolean) {
  const out = mkdtempSync(join(tmpdir(), 'pqf-collision-'));
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(TEST_|PW_|PLAYWRIGHT_|PQF_|CI$)/.test(k) || k === 'PLAYWRIGHT_BROWSERS_PATH'));
  const run = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', CONFIG], {
    env: { ...env, PQF_COLLISION_OUT: out, ...(guard ? { PQF_COLLISION_GUARD: '1' } : {}) },
    encoding: 'utf8',
    timeout: 90_000,
  });
  const artifacts = join(out, 'artifacts');
  const folders = existsSync(artifacts) ? readdirSync(artifacts).filter((f) => !f.startsWith('.')) : [];
  const stats = existsSync(join(out, 'results.json'))
    ? (JSON.parse(readFileSync(join(out, 'results.json'), 'utf8')) as { stats: { expected: number; unexpected: number } }).stats
    : undefined;
  return { run, artifacts, folders, stats, output: `${run.stdout}\n${run.stderr}` };
}

test.describe('artifact folder collisions', () => {
  test('reproduction: without the guard, the second test deletes the first test\'s folder', () => {
    test.slow();
    const { run, artifacts, folders, stats } = runProject(false);
    expect(run.status).toBe(0);
    expect(stats).toMatchObject({ expected: 2, unexpected: 0 });
    expect(folders, 'two different tests, one artifact folder').toHaveLength(1);
    expect(readFileSync(join(artifacts, folders[0]!, 'who.txt'), 'utf8'), 'only the second test\'s file is left').toBe('second');
  });

  test('the predicted folder names are exactly the ones Playwright creates', () => {
    test.slow();
    const tests = listedTests(listConfig(CONFIG, { PQF_COLLISION_OUT: mkdtempSync(join(tmpdir(), 'pqf-collision-list-')) }));
    expect(tests.map((t) => t.titlePath.join(' › ')).sort()).toEqual([FIRST, SECOND].sort());
    const predicted = [...new Set(tests.map(artifactFolderName))];
    const { folders } = runProject(false);
    expect(predicted).toEqual(folders);
    const collisions = findCollisions(tests);
    expect(collisions).toHaveLength(1);
    expect(collisions[0]!.tests.join('\n')).toContain(FIRST);
    expect(collisions[0]!.tests.join('\n')).toContain(SECOND);
  });

  test('with the guard, the run is refused before any test runs', () => {
    test.slow();
    const { run, folders, stats, output } = runProject(true);
    expect(run.status).toBe(1);
    expect(output).toContain('artifact folder collision');
    expect(output).toContain(FIRST);
    expect(output).toContain(SECOND);
    expect(folders, 'no test wrote anything').toHaveLength(0);
    expect(stats?.expected ?? 0, 'no test passed').toBe(0);
  });

  test('the framework\'s own suite has no artifact folder collisions', () => {
    test.slow();
    expect(findCollisions(listedTests(listConfig('playwright.config.ts')))).toEqual([]);
  });
});
