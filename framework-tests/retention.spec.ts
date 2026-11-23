import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { applyRetention, decide, runClassFromEnv, scanRuns, verifyRuns, type RetentionPolicy } from '../core/reporting/retention';

/**
 * Evidence retention self-tests. Everything happens in a fresh temp folder;
 * the real evidence/ folder is never read or written.
 */
const DAY = 24 * 3600 * 1000;
const NOW = Date.parse('2026-11-22T12:00:00Z');
const POLICY: RetentionPolicy = { keepRoutinePassingRuns: 1, keepRoutinePassingDays: 7 };

let base = '';
let root = '';

/** Creates evidence/runs/<id> with an optional manifest. */
function run(id: string, opts: { status?: string; cls?: string; ageDays?: number; keep?: boolean; manifest?: 'ok' | 'missing' | 'corrupt' } = {}): string {
  const dir = join(root, id);
  mkdirSync(join(dir, 'artifacts'), { recursive: true });
  writeFileSync(join(dir, 'artifacts', 'trace.zip'), 'evidence');
  if (opts.keep) writeFileSync(join(dir, 'KEEP'), '');
  const manifest = opts.manifest ?? 'ok';
  if (manifest === 'ok') {
    writeFileSync(join(dir, 'run.json'), JSON.stringify({ runId: id, status: opts.status ?? 'passed', finishedAt: new Date(NOW - (opts.ageDays ?? 30) * DAY).toISOString(), retention: { class: opts.cls ?? 'routine' }, failures: [] }));
  } else if (manifest === 'corrupt') {
    writeFileSync(join(dir, 'run.json'), '{ "runId": "broken", ');
  }
  return dir;
}

const id = (n: number) => `20261101T0000${String(n).padStart(2, '0')}Z-${String(n).padStart(6, '0')}`;

test.beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'pqf-retention-'));
  root = join(base, 'evidence', 'runs');
  mkdirSync(root, { recursive: true });
});

test.afterEach(() => rmSync(base, { recursive: true, force: true }));

const decisionFor = (runId: string) => decide(scanRuns(root), POLICY, 'current', NOW).find((d) => d.runId === runId);

test.describe('retention decisions (isolated temp folder)', () => {
  test('1. a failed run is kept', () => {
    run(id(1), { status: 'failed', ageDays: 400 });
    expect(decisionFor(id(1))).toMatchObject({ action: 'keep', reason: expect.stringContaining('failing evidence') });
  });

  test('2. a KEEP-pinned run is kept', () => {
    run(id(1), { keep: true, ageDays: 400 });
    run(id(2), { ageDays: 1 });
    expect(decisionFor(id(1))).toMatchObject({ action: 'keep', reason: 'KEEP file' });
  });

  for (const cls of ['milestone', 'release', 'security', 'unclassified', 'something-else']) {
    test(`3. a "${cls}" run is kept`, () => {
      run(id(1), { cls, ageDays: 400 });
      run(id(2), { ageDays: 1 });
      expect(decisionFor(id(1))?.action).toBe('keep');
    });
  }

  test('4. a missing manifest is never deleted', () => {
    run(id(1), { manifest: 'missing' });
    expect(decisionFor(id(1))).toMatchObject({ action: 'keep', reason: expect.stringContaining('manifest missing') });
  });

  test('5. a corrupt or inconsistent manifest is never deleted', () => {
    run(id(1), { manifest: 'corrupt' });
    const wrongId = run(id(2));
    writeFileSync(join(wrongId, 'run.json'), JSON.stringify({ runId: 'other', status: 'passed', finishedAt: new Date(NOW - 400 * DAY).toISOString(), retention: { class: 'routine' } }));
    expect(decisionFor(id(1))).toMatchObject({ action: 'keep', reason: expect.stringContaining('corrupt') });
    expect(decisionFor(id(2))).toMatchObject({ action: 'keep', reason: expect.stringContaining('corrupt') });
  });

  test('6. dry-run deletes nothing, even when a run is deletable', () => {
    run(id(1), { ageDays: 1 });
    const old = run(id(2), { ageDays: 30 });
    const result = applyRetention({ root, policy: POLICY, now: NOW });
    expect(result.dryRun).toBe(true);
    expect(result.decisions.find((d) => d.runId === id(2))?.action).toBe('delete');
    expect(result.deleted).toEqual([]);
    expect(existsSync(old)).toBe(true);
  });

  test('7. an old, unpinned, passing routine run beyond the newest N is deleted with --apply', () => {
    const newest = run(id(3), { ageDays: 1 });
    const young = run(id(2), { ageDays: 3 });
    const old = run(id(1), { ageDays: 30 });
    const result = applyRetention({ root, policy: POLICY, dryRun: false, now: NOW });
    expect(result.deleted).toEqual([id(1)]);
    expect(existsSync(old)).toBe(false);
    expect(existsSync(newest)).toBe(true); // newest routine run
    expect(existsSync(young)).toBe(true); // younger than the age limit
  });

  test('8. files outside the evidence root are untouched', () => {
    const outside = join(base, 'outside.txt');
    const sibling = join(base, 'evidence', 'notes.md');
    writeFileSync(outside, 'keep me');
    writeFileSync(sibling, 'keep me');
    writeFileSync(join(root, 'README.txt'), 'not a run');
    mkdirSync(join(root, 'not-a-run-id'));
    run(id(1), { ageDays: 1 });
    run(id(2), { ageDays: 30 });
    const result = applyRetention({ root, policy: POLICY, dryRun: false, now: NOW });
    expect(result.deleted).toEqual([id(2)]);
    for (const p of [outside, sibling, join(root, 'README.txt'), join(root, 'not-a-run-id')]) expect(existsSync(p), p).toBe(true);
    expect(result.decisions.find((d) => d.runId === 'not-a-run-id')?.reason).toContain('not a run folder');
  });

  test('9. a symlinked run folder pointing outside is never followed or deleted', () => {
    const victim = join(base, 'victim');
    mkdirSync(victim);
    writeFileSync(join(victim, 'run.json'), JSON.stringify({ runId: id(9), status: 'passed', finishedAt: new Date(NOW - 400 * DAY).toISOString(), retention: { class: 'routine' } }));
    writeFileSync(join(victim, 'precious.txt'), 'outside data');
    symlinkSync(victim, join(root, id(9)));
    run(id(1), { ageDays: 1 });
    const result = applyRetention({ root, policy: { keepRoutinePassingRuns: 0, keepRoutinePassingDays: 0 }, dryRun: false, now: NOW });
    expect(result.decisions.find((d) => d.runId === id(9))).toMatchObject({ action: 'keep', reason: expect.stringContaining('symlink') });
    expect(existsSync(join(victim, 'precious.txt'))).toBe(true);
    expect(() => applyRetention({ root: join(root, id(9)) })).toThrow(/must be an existing directory \(not a symlink\)/);
  });

  test('10. every decision is written to the audit log with its reason', () => {
    run(id(1), { status: 'failed' });
    run(id(2), { keep: true });
    run(id(3), { ageDays: 1 });
    run(id(4), { ageDays: 30 });
    const log = join(base, 'evidence', 'retention-audit.jsonl');
    applyRetention({ root, policy: POLICY, dryRun: false, now: NOW, auditLog: log });
    const lines = readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { runId: string; action: string; reason: string; dryRun: boolean });
    expect(lines.map((l) => [l.runId, l.action])).toEqual([[id(1), 'keep'], [id(2), 'keep'], [id(3), 'keep'], [id(4), 'deleted']]);
    expect(lines.every((l) => l.reason.length > 0 && l.dryRun === false)).toBe(true);
  });

  test('the current run is never deleted', () => {
    run(id(1), { ageDays: 400 });
    expect(decide(scanRuns(root), { keepRoutinePassingRuns: 0, keepRoutinePassingDays: 0 }, id(1), NOW)[0]?.reason).toBe('current run');
  });

  test('the run class only comes from an explicit, valid PQF_RUN_CLASS', () => {
    expect(runClassFromEnv({})).toBe('unclassified');
    expect(runClassFromEnv({ PQF_RUN_CLASS: 'Routine' })).toBe('routine');
    expect(runClassFromEnv({ PQF_RUN_CLASS: 'delete-me' })).toBe('unclassified');
  });

  test('verify reports missing manifests and missing attachments', () => {
    run(id(1), { manifest: 'missing' });
    const dir = run(id(2));
    writeFileSync(join(dir, 'run.json'), JSON.stringify({ runId: id(2), status: 'failed', finishedAt: new Date(NOW).toISOString(), failures: [{ attempts: [{ attachments: [{ path: join(dir, 'gone.zip') }] }] }] }));
    const report = verifyRuns(root);
    expect(report.find((r) => r.runId === id(1))?.problems).toEqual(['manifest missing']);
    expect(report.find((r) => r.runId === id(2))?.problems[0]).toContain('missing attachment');
  });
});

test.describe('retention CLI (isolated temp checkout)', () => {
  const cli = resolve('scripts/evidence-retention.ts');
  const exec = (...args: string[]) => spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', cli, ...args], { cwd: base, encoding: 'utf8' });

  test('refuses to run outside the framework checkout', () => {
    run(id(1), { ageDays: 400 });
    const r = exec('--apply');
    expect(r.status).toBe(2);
    expect(existsSync(join(root, id(1)))).toBe(true);
  });

  test('defaults to a dry-run and only deletes with --apply', () => {
    writeFileSync(join(base, 'package.json'), JSON.stringify({ name: 'playwright-quality-framework' }));
    for (let n = 1; n <= 12; n++) run(id(n), { ageDays: 30 + n });
    const dry = exec();
    expect(dry.stdout).toContain('DRY-RUN: 2 run(s) would be deleted');
    expect(scanRuns(root)).toHaveLength(12);
    const applied = exec('--apply');
    expect(applied.stdout).toContain('deleted 2 run(s)');
    expect(scanRuns(root)).toHaveLength(10);
    expect(readFileSync(join(base, 'evidence', 'retention-audit.jsonl'), 'utf8')).toContain('"action":"deleted"');
  });
});
