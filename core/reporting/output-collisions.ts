import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

/**
 * Artifact folder collisions.
 *
 * Playwright names each test's output folder after its sanitized title, and before every test it
 * deletes that folder (`removeFolders([testInfo.outputDir])`, playwright 1.65.1). Sanitizing turns
 * runs of special characters into one "-", so two titles that differ only in punctuation get the
 * same folder: the second test deletes the first test's evidence before any framework code runs.
 * The only safe point is before the run, so the global setup lists the suite and refuses to start
 * when two tests would share a folder.
 */

// Playwright's own helpers, the same ones its worker uses to name output folders.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { sanitizeForFilePath, trimLongString } = (require('playwright-core/lib/coreBundle') as {
  utils: { sanitizeForFilePath: (s: string) => string; trimLongString: (s: string, length?: number) => string };
}).utils;

/** Same constant as Playwright's worker (`windowsFilesystemFriendlyLength`). */
const FOLDER_NAME_LENGTH = 60;

export interface ListedTest {
  projectId: string;
  testDir: string;
  /** Absolute path of the spec file. */
  file: string;
  /** describe titles + test title, without the file. */
  titlePath: string[];
}

/** The folder name Playwright gives the test's first attempt (TestInfoImpl.outputDir, 1.65.1). */
export function artifactFolderName(test: ListedTest): string {
  const relativeFile = relative(test.testDir, test.file.replace(/\.(spec|test)\.(js|ts|jsx|tsx|mjs|mts|cjs|cts)$/, ''));
  const sanitizedPath = relativeFile.replace(process.platform === 'win32' ? /\\/g : /\//g, '-');
  let name = trimLongString(`${sanitizedPath}-${sanitizeForFilePath(test.titlePath.join(' '))}`, FOLDER_NAME_LENGTH);
  if (test.projectId) name += `-${sanitizeForFilePath(test.projectId)}`;
  return name;
}

export interface Collision {
  folder: string;
  tests: string[];
}

export function findCollisions(tests: readonly ListedTest[]): Collision[] {
  const byFolder = new Map<string, Set<string>>();
  for (const test of tests) {
    const folder = artifactFolderName(test);
    const label = `${test.projectId} › ${relative(test.testDir, test.file)} › ${test.titlePath.join(' › ')}`;
    byFolder.set(folder, (byFolder.get(folder) ?? new Set()).add(label));
  }
  return [...byFolder].filter(([, labels]) => labels.size > 1).map(([folder, labels]) => ({ folder, tests: [...labels] }));
}

interface JsonSuite { title: string; file: string; specs?: { title: string; file: string; tests: { projectId: string }[] }[]; suites?: JsonSuite[] }
interface JsonList { config: { rootDir: string; projects: { id: string; testDir: string }[] }; suites: JsonSuite[] }

/** Flattens `playwright test --list --reporter=json` output. */
export function listedTests(list: JsonList): ListedTest[] {
  const testDirs = new Map(list.config.projects.map((p) => [p.id, p.testDir]));
  const tests: ListedTest[] = [];
  const walk = (suite: JsonSuite, describes: string[]) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        tests.push({ projectId: t.projectId, testDir: testDirs.get(t.projectId) ?? list.config.rootDir, file: resolve(list.config.rootDir, spec.file), titlePath: [...describes, spec.title] });
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...describes, child.title]);
  };
  // Top-level suites are files; their title is the file path, which is not part of the folder name.
  for (const file of list.suites) walk(file, []);
  return tests;
}

/** Lists every test of a config without running any, using a throw-away output location. */
export function listConfig(configFile: string, env: Record<string, string> = {}): JsonList {
  const out = mkdtempSync(join(tmpdir(), 'pqf-list-'));
  try {
    const json = join(out, 'list.json');
    const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'test', '--list', '--reporter=json', '--config', configFile], {
      env: { ...process.env, ...env, PLAYWRIGHT_JSON_OUTPUT_NAME: json, PQF_EVIDENCE_DIR: join(out, 'runs'), PQF_COLLISION_CHECK: 'listing' },
      encoding: 'utf8',
      timeout: 60_000,
    });
    if (result.status !== 0) throw new Error(`Listing tests for the collision check failed:\n${result.stderr || result.stdout}`);
    return JSON.parse(readFileSync(json, 'utf8')) as JsonList;
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}
