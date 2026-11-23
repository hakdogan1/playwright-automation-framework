import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { protectedConfigEntries, topLevelValues } from '../core/ai/ai-guard';

/**
 * CI flaky-test quality gate: on CI a test that only passes on retry must fail the run.
 * Static part: the root config holds exactly the policy expressions. Behavioural part: an isolated
 * sub-project with the same expressions and a deterministic flaky test (no browser, no network).
 */
const ROOT_CONFIG = 'playwright.config.ts';
const GATE_CONFIG = 'framework-tests/fixtures/flaky-gate-project/playwright.config.ts';
const POLICY = ['failOnFlakyTests=isCI', 'forbidOnly=isCI', 'retries=isCI?1:0'];

interface Stats { expected: number; unexpected: number; flaky: number; skipped: number }

function runGate(ci: boolean, extraArgs: string[] = []): { status: number | null; stats: Stats; output: string } {
  const out = mkdtempSync(join(tmpdir(), 'pqf-flaky-gate-'));
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(TEST_|PW_|PLAYWRIGHT_|PQF_|CI$)/.test(k) || k === 'PLAYWRIGHT_BROWSERS_PATH'));
  const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', GATE_CONFIG, ...extraArgs], {
    env: { ...env, PQF_FLAKY_GATE_OUT: out, ...(ci ? { CI: 'true' } : {}) },
    encoding: 'utf8',
    timeout: 60_000,
  });
  const report = JSON.parse(readFileSync(join(out, 'results.json'), 'utf8')) as { stats: Stats };
  return { status: result.status, stats: report.stats, output: `${result.stdout}\n${result.stderr}` };
}

test.describe('CI flaky-test gate', () => {
  test('root config: isCI comes from the CI variable and the policy keys are literal', () => {
    const root = readFileSync(ROOT_CONFIG, 'utf8');
    expect(topLevelValues(root).get('isCI')).toBe('!!process.env.CI');
    expect(protectedConfigEntries(root)).toEqual(expect.arrayContaining(POLICY));
  });

  test('fixture project uses exactly the same policy expressions as the root config', () => {
    const gate = readFileSync(GATE_CONFIG, 'utf8');
    expect(topLevelValues(gate).get('isCI')).toBe('!!process.env.CI');
    expect(protectedConfigEntries(gate)).toEqual(expect.arrayContaining(POLICY));
  });

  test('on CI a test that passes only on retry is reported flaky and fails the run', () => {
    const run = runGate(true);
    expect(run.stats, run.output).toMatchObject({ expected: 1, unexpected: 0, flaky: 1 });
    expect(run.status, 'exit code: the run must fail because of the flaky test alone').toBe(1);
  });

  test('on CI a run without flaky tests still passes (the gate is not always red)', () => {
    const run = runGate(true, ['--grep', 'stable']);
    expect(run.stats, run.output).toMatchObject({ expected: 1, unexpected: 0, flaky: 0 });
    expect(run.status).toBe(0);
  });

  test('locally there is no retry, so the same test fails on its first attempt', () => {
    const run = runGate(false);
    expect(run.stats, run.output).toMatchObject({ expected: 1, unexpected: 1, flaky: 0 });
    expect(run.status).toBe(1);
  });
});
