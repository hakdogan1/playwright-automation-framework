/**
 * Evidence retention — preserve by default.
 *
 * A run folder is deletable ONLY when ALL of these hold:
 *   - it is a real directory directly inside the evidence root (no symlink, valid run-ID name),
 *   - it has no KEEP file,
 *   - its run.json exists and parses,
 *   - the manifest says status "passed" AND retention class "routine" (set explicitly at run time),
 *   - it is not among the newest `keepRoutinePassingRuns` routine runs, and
 *   - it is older than `keepRoutinePassingDays`.
 * Everything else — failed runs, milestone/release/security/unclassified runs, missing or
 * corrupt manifests — is kept. Nothing is deleted unless the caller passes `dryRun: false`.
 *
 * Self-contained (node: imports only) so the CLI runs with plain `node`.
 */
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';

export const RUN_CLASSES = ['routine', 'milestone', 'release', 'security', 'unclassified'] as const;
export type RunClass = (typeof RUN_CLASSES)[number];

export const RUN_ID_PATTERN = /^\d{8}T\d{6}Z-[0-9a-f]{6}$/;

export interface RetentionPolicy {
  /** Newest routine passing runs that are always kept. */
  keepRoutinePassingRuns: number;
  /** Routine passing runs younger than this are always kept. */
  keepRoutinePassingDays: number;
}

export const DEFAULT_RETENTION: RetentionPolicy = { keepRoutinePassingRuns: 10, keepRoutinePassingDays: 14 };

export function retentionFromEnv(env: Record<string, string | undefined> = process.env): RetentionPolicy {
  const num = (v: string | undefined, d: number) => (v !== undefined && /^\d+$/.test(v) ? Number(v) : d);
  return {
    keepRoutinePassingRuns: num(env.PQF_KEEP_ROUTINE_RUNS, DEFAULT_RETENTION.keepRoutinePassingRuns),
    keepRoutinePassingDays: num(env.PQF_KEEP_ROUTINE_DAYS, DEFAULT_RETENTION.keepRoutinePassingDays),
  };
}

/** Run class from the environment. Anything unknown is "unclassified" (= kept). */
export function runClassFromEnv(env: Record<string, string | undefined> = process.env): RunClass {
  const v = env.PQF_RUN_CLASS?.trim().toLowerCase();
  return (RUN_CLASSES as readonly string[]).includes(v ?? '') ? (v as RunClass) : 'unclassified';
}

export interface RunInfo {
  name: string;
  path: string;
  kind: 'run' | 'symlink' | 'not-a-run';
  pinned: boolean;
  manifest: 'ok' | 'missing' | 'corrupt';
  status?: string;
  runClass?: RunClass;
  finishedAt?: number;
}

export interface Decision {
  runId: string;
  action: 'keep' | 'delete';
  reason: string;
}

export function scanRuns(root: string): RunInfo[] {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .sort()
    .map((name): RunInfo => {
      const path = join(root, name);
      const st = lstatSync(path);
      if (st.isSymbolicLink()) return { name, path, kind: 'symlink', pinned: false, manifest: 'missing' };
      if (!st.isDirectory() || !RUN_ID_PATTERN.test(name)) return { name, path, kind: 'not-a-run', pinned: false, manifest: 'missing' };
      const pinned = existsSync(join(path, 'KEEP'));
      const manifestPath = join(path, 'run.json');
      if (!existsSync(manifestPath)) return { name, path, kind: 'run', pinned, manifest: 'missing' };
      try {
        const m = JSON.parse(readFileSync(manifestPath, 'utf8')) as { runId?: unknown; status?: unknown; finishedAt?: unknown; retention?: { class?: unknown } };
        const finishedAt = typeof m.finishedAt === 'string' ? Date.parse(m.finishedAt) : NaN;
        const cls = m.retention?.class;
        if (m.runId !== name || typeof m.status !== 'string' || Number.isNaN(finishedAt)) return { name, path, kind: 'run', pinned, manifest: 'corrupt' };
        return {
          name,
          path,
          kind: 'run',
          pinned,
          manifest: 'ok',
          status: m.status,
          runClass: (RUN_CLASSES as readonly unknown[]).includes(cls) ? (cls as RunClass) : 'unclassified',
          finishedAt,
        };
      } catch {
        return { name, path, kind: 'run', pinned, manifest: 'corrupt' };
      }
    });
}

/** Pure decision for every entry of the evidence root. */
export function decide(runs: readonly RunInfo[], policy: RetentionPolicy, currentRunId: string, now = Date.now()): Decision[] {
  const routine = runs
    .filter((r) => r.kind === 'run' && !r.pinned && r.manifest === 'ok' && r.status === 'passed' && r.runClass === 'routine' && r.name !== currentRunId)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const rank = new Map(routine.map((r, i) => [r.name, i]));
  const cutoff = now - policy.keepRoutinePassingDays * 24 * 3600 * 1000;

  return runs.map((r): Decision => {
    const keep = (reason: string): Decision => ({ runId: r.name, action: 'keep', reason });
    if (r.name === currentRunId) return keep('current run');
    if (r.kind === 'symlink') return keep('symlink: never followed or deleted');
    if (r.kind === 'not-a-run') return keep('not a run folder (name or type)');
    if (r.pinned) return keep('KEEP file');
    if (r.manifest === 'missing') return keep('manifest missing: never deleted automatically');
    if (r.manifest === 'corrupt') return keep('manifest corrupt or inconsistent: never deleted automatically');
    if (r.status !== 'passed') return keep(`status ${r.status ?? 'unknown'}: failing evidence is kept`);
    if (r.runClass !== 'routine') return keep(`class ${r.runClass ?? 'unclassified'}: only "routine" runs are deletable`);
    const i = rank.get(r.name) ?? 0;
    if (i < policy.keepRoutinePassingRuns) return keep(`routine passing run within newest ${policy.keepRoutinePassingRuns}`);
    if ((r.finishedAt ?? now) >= cutoff) return keep(`routine passing run younger than ${policy.keepRoutinePassingDays} days`);
    return { runId: r.name, action: 'delete', reason: `routine passing run older than ${policy.keepRoutinePassingDays} days and beyond newest ${policy.keepRoutinePassingRuns}` };
  });
}

/** Re-checks a deletion target right before removal: a real run directory directly inside root. */
function safeTarget(root: string, runId: string): string | null {
  if (!RUN_ID_PATTERN.test(runId)) return null;
  const realRoot = realpathSync(root);
  const target = join(realRoot, runId);
  const st = lstatSync(target, { throwIfNoEntry: false });
  if (!st || st.isSymbolicLink() || !st.isDirectory()) return null;
  const realTarget = realpathSync(target);
  return dirname(realTarget) === realRoot && realTarget.startsWith(realRoot + sep) ? realTarget : null;
}

export interface ApplyOptions {
  root: string;
  currentRunId?: string;
  policy?: RetentionPolicy;
  /** Default true: report only, delete nothing. */
  dryRun?: boolean;
  /** JSON-lines audit log; every decision is appended. */
  auditLog?: string;
  now?: number;
}

export interface ApplyResult {
  dryRun: boolean;
  decisions: Decision[];
  deleted: string[];
}

export function applyRetention(options: ApplyOptions): ApplyResult {
  const dryRun = options.dryRun ?? true;
  const root = options.root;
  if (!existsSync(root) || lstatSync(root).isSymbolicLink() || !statSync(root).isDirectory()) {
    throw new Error(`[retention] evidence root "${root}" must be an existing directory (not a symlink).`);
  }
  const decisions = decide(scanRuns(root), options.policy ?? DEFAULT_RETENTION, options.currentRunId ?? '', options.now);
  const deleted: string[] = [];
  const at = new Date(options.now ?? Date.now()).toISOString();
  const audit = (entry: object) => {
    if (!options.auditLog) return;
    mkdirSync(dirname(options.auditLog), { recursive: true });
    appendFileSync(options.auditLog, `${JSON.stringify({ at, dryRun, ...entry })}\n`);
  };
  for (const d of decisions) {
    if (d.action === 'delete' && !dryRun) {
      const target = safeTarget(root, d.runId);
      if (!target) {
        audit({ ...d, action: 'keep', reason: `refused: path check failed (${d.reason})` });
        continue;
      }
      rmSync(target, { recursive: true });
      deleted.push(d.runId);
      audit({ ...d, action: 'deleted' });
      continue;
    }
    audit(d);
  }
  return { dryRun, decisions, deleted };
}

/** Manifest consistency report for `evidence:verify`. */
export function verifyRuns(root: string): { runId: string; problems: string[] }[] {
  return scanRuns(root).map((r) => {
    const problems: string[] = [];
    if (r.kind !== 'run') problems.push(r.kind);
    if (r.manifest !== 'ok') problems.push(`manifest ${r.manifest}`);
    if (r.manifest === 'ok') {
      const m = JSON.parse(readFileSync(join(r.path, 'run.json'), 'utf8')) as { failures?: { attempts?: { attachments?: { path?: string }[] }[] }[] };
      for (const f of m.failures ?? []) {
        for (const a of (f.attempts ?? []).flatMap((x) => x.attachments ?? [])) {
          if (a.path && !existsSync(a.path)) problems.push(`missing attachment ${a.path}`);
        }
      }
    }
    return { runId: r.name, problems };
  });
}
