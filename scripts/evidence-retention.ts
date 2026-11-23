/**
 * CLI: node scripts/evidence-retention.ts [--apply] [--verify]
 *
 *   (default)  dry-run: print every decision, delete nothing
 *   --apply    delete only runs the policy marks "delete" (routine, passing, old, unpinned)
 *   --verify   manifest consistency report (exit 1 on problems), no deletion
 *
 * Works only inside this framework checkout: the evidence root is fixed to
 * <checkout>/evidence/runs and the audit log to <checkout>/evidence/retention-audit.jsonl.
 */
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, sep } from 'node:path';
import { applyRetention, retentionFromEnv, verifyRuns } from '../core/reporting/retention.ts';

const cwd = realpathSync(process.cwd());
const pkgPath = join(cwd, 'package.json');
const pkg = existsSync(pkgPath) ? (JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string }) : {};
if (pkg.name !== 'playwright-quality-framework') {
  console.error('[retention] ERROR: run from the playwright-quality-framework checkout. Nothing was changed.');
  process.exit(2);
}
const root = join(cwd, 'evidence', 'runs');
if (!existsSync(root)) {
  console.log('[retention] no evidence/runs folder; nothing to do.');
  process.exit(0);
}
if (!realpathSync(root).startsWith(cwd + sep)) {
  console.error('[retention] ERROR: evidence/runs resolves outside the checkout (symlink?). Nothing was changed.');
  process.exit(2);
}

const args = new Set(process.argv.slice(2));
if (args.has('--verify')) {
  const report = verifyRuns(root);
  let problems = 0;
  for (const r of report) {
    console.log(`  ${r.problems.length ? 'WARN' : 'ok  '} ${r.runId}${r.problems.length ? `: ${r.problems.join('; ')}` : ''}`);
    problems += r.problems.length;
  }
  console.log(`[retention] verify: ${report.length} entries, ${problems} problem(s)`);
  process.exit(problems > 0 ? 1 : 0);
}

const dryRun = !args.has('--apply');
const result = applyRetention({ root, policy: retentionFromEnv(), dryRun, auditLog: join(cwd, 'evidence', 'retention-audit.jsonl') });
for (const d of result.decisions) console.log(`  ${d.action.padEnd(6)} ${d.runId}  — ${d.reason}`);
const toDelete = result.decisions.filter((d) => d.action === 'delete').length;
console.log(dryRun ? `[retention] DRY-RUN: ${toDelete} run(s) would be deleted, ${result.decisions.length - toDelete} kept. Use --apply to delete.` : `[retention] deleted ${result.deleted.length} run(s): ${result.deleted.join(', ') || '—'}`);
