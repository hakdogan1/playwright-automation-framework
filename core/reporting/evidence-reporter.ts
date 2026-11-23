import { mkdirSync, writeFileSync } from 'node:fs';
import { arch, platform, release } from 'node:os';
import { dirname, join, relative } from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { ensureRun } from './run-context';
import { runClassFromEnv } from './retention';

/**
 * Writes evidence/runs/<runId>/run.json (manifest linking every failing test
 * to its attachments) and updates evidence/latest.
 * It never deletes anything: cleanup is a separate, explicit command
 * (`npm run evidence:plan` / `evidence:prune`, see docs/evidence-retention.md).
 */
export default class EvidenceReporter implements Reporter {
  private readonly run = ensureRun();
  private readonly startedAt = new Date();
  private config!: FullConfig;
  private readonly results = new Map<TestCase, TestResult[]>();

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig, _suite: Suite): void {
    this.config = config;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const list = this.results.get(test) ?? [];
    list.push(result);
    this.results.set(test, list);
  }

  onEnd(result: FullResult): void {
    const counts = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
    const failures: unknown[] = [];
    for (const [test, results] of this.results) {
      const outcome = test.outcome();
      if (outcome === 'expected') counts.passed++;
      else if (outcome === 'skipped') counts.skipped++;
      else if (outcome === 'flaky') counts.flaky++;
      else counts.failed++;
      if (outcome !== 'unexpected' && outcome !== 'flaky') continue;
      failures.push({
        test: test.titlePath().slice(1).join(' › '),
        file: relative(process.cwd(), test.location.file),
        outcome,
        testCaseIds: test.annotations.filter((a) => a.type === 'tc').map((a) => a.description),
        attempts: results.map((r) => ({
          retry: r.retry,
          status: r.status,
          durationMs: r.duration,
          attachments: r.attachments.filter((a) => a.path).map((a) => ({ name: a.name, path: relative(process.cwd(), a.path as string) })),
        })),
      });
    }

    mkdirSync(this.run.dir, { recursive: true });
    const projects = this.config.projects.map((p) => ({ name: p.name, baseURL: p.use.baseURL, testEnv: (p.use as Record<string, unknown>).testEnv }));
    const manifest = {
      runId: this.run.runId,
      status: result.status === 'passed' ? 'passed' : 'failed',
      startedAt: this.startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Math.round(result.duration),
      counts,
      projects,
      runtime: { playwright: this.config.version, node: process.version, os: `${platform()} ${release()} ${arch()}`, ci: !!process.env.CI },
      failures,
      // Only runs explicitly classified "routine" (PQF_RUN_CLASS=routine) can ever become deletable.
      retention: { class: runClassFromEnv() },
    };
    writeFileSync(join(this.run.dir, 'run.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    const latest = join(dirname(this.run.root), 'latest');
    writeFileSync(latest, `${this.run.dir}\n`);
  }
}
