import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Invariants of .github/workflows/ci.yml that keep the first push from passing without the
 * approved AI Guard baseline. GitHub itself cannot run here, so the gate script is extracted from
 * the workflow file and executed with bash for every combination of job results.
 * (Within a pull request the workflow file can be edited; the boundary for that is branch
 * protection and code-owner review in GitHub, see docs/ai-workflow.md.)
 */
const WORKFLOW = readFileSync('.github/workflows/ci.yml', 'utf8');
const lines = WORKFLOW.split('\n');

/** The lines of one job (from "  <name>:" to the next job). */
function job(name: string): string {
  const start = lines.indexOf(`  ${name}:`);
  expect(start, `job ${name}`).toBeGreaterThan(-1);
  const end = lines.findIndex((l, i) => i > start && /^ {2}[\w-]+:\s*$/.test(l));
  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

/** The `run: |` block of the step with the given name. */
function stepScript(name: string): string {
  const at = lines.findIndex((l) => l.includes(`name: ${name}`));
  expect(at, `step ${name}`).toBeGreaterThan(-1);
  const runAt = lines.findIndex((l, i) => i > at && /^\s+run: \|\s*$/.test(l));
  const indent = (lines[runAt + 1] ?? '').search(/\S/);
  const body: string[] = [];
  for (let i = runAt + 1; i < lines.length && ((lines[i] ?? '').trim() === '' || (lines[i] ?? '').search(/\S/) >= indent); i++) body.push((lines[i] ?? '').slice(indent));
  return body.join('\n');
}

test.describe('CI workflow: first push cannot skip the baseline approval', () => {
  const gate = stepScript('AI Guard gate (fail closed)');

  const RESULTS = ['success', 'failure', 'cancelled', 'skipped', ''];
  for (const scan of RESULTS) {
    for (const isRoot of ['true', 'false', '']) {
      for (const baseline of RESULTS) {
        const expected = scan === 'success' && (isRoot !== 'true' || baseline === 'success') ? 0 : 1;

        test(`gate: scan=${scan || 'none'} root=${isRoot || 'none'} baseline=${baseline || 'none'} → ${expected === 0 ? 'pass' : 'FAIL'}`, () => {
          const r = spawnSync('bash', ['-e', '-c', gate], { env: { PATH: process.env.PATH ?? '', SCAN: scan, IS_ROOT: isRoot, BASELINE: baseline }, encoding: 'utf8' });
          expect(r.status).toBe(expected);
        });
      }
    }
  }

  test('the baseline job runs only for a push of the root commit to main, in the protected environment', () => {
    const baseline = job('ai-guard-baseline');
    expect(baseline).toContain("github.event_name == 'push'");
    expect(baseline).toContain("github.ref == 'refs/heads/main'");
    expect(baseline).toContain("needs.ai-guard-scan.outputs.is_root == 'true'");
    expect(baseline).toMatch(/^ {4}environment: ai-guard-baseline$/m);
    // Environment protection is verified before the baseline itself.
    expect(baseline.indexOf('--verify-environment')).toBeGreaterThan(-1);
    expect(baseline.indexOf('--verify-environment')).toBeLessThan(baseline.indexOf("AI_GUARD_BASELINE: '1'"));
  });

  test('the reference secret is used only by the baseline job', () => {
    expect(WORKFLOW.match(/secrets\.AI_GUARD_BASELINE_REF/g)).toHaveLength(1);
    expect(job('ai-guard-baseline')).toContain('secrets.AI_GUARD_BASELINE_REF');
  });

  test('quality always runs, needs both AI Guard jobs and keeps the normal AI Guard for other commits', () => {
    const quality = job('quality');
    expect(quality).toContain('needs: [ai-guard-scan, ai-guard-baseline]');
    expect(quality).toMatch(/^ {4}if: always\(\)$/m);
    expect(quality).toContain("if: needs.ai-guard-scan.outputs.is_root != 'true'");
    expect(job('qa-practice')).toContain('needs: quality');
  });

  test('no pull_request_target trigger and read-only default permissions', () => {
    const triggers = WORKFLOW.slice(WORKFLOW.indexOf('\non:'), WORKFLOW.indexOf('\npermissions:'));
    expect(triggers).not.toContain('pull_request_target');
    expect(WORKFLOW).toMatch(/^permissions:\n {2}contents: read$/m);
  });
});
