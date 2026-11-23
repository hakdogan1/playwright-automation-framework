import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

/**
 * One evidence folder per test run. The run ID is created once in the main
 * Playwright process (config load) and inherited by workers via the environment,
 * so artifacts, reports, logs and bug drafts of a run share it.
 *
 *   evidence/runs/<runId>/artifacts     screenshots, traces, videos (Playwright outputDir)
 *   evidence/runs/<runId>/html          HTML report
 *   evidence/runs/<runId>/results.json  JSON report
 *   evidence/runs/<runId>/bug-drafts    triage + BugDrafts
 *   evidence/runs/<runId>/run.json      manifest (written at the end of the run)
 */
export interface RunContext {
  runId: string;
  root: string;
  dir: string;
}

export function newRunId(now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return `${stamp}-${randomBytes(3).toString('hex')}`;
}

export function ensureRun(env: Record<string, string | undefined> = process.env): RunContext {
  if (!env.PQF_RUN_ID) env.PQF_RUN_ID = newRunId();
  const root = env.PQF_EVIDENCE_DIR ?? join('evidence', 'runs');
  return { runId: env.PQF_RUN_ID, root, dir: join(root, env.PQF_RUN_ID) };
}
