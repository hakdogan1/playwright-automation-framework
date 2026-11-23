/**
 * npm run privacy:check [-- --root <dir>]
 * Fails closed (exit 1) when the files Git would publish contain raw evidence, reports, diagnostics,
 * binaries, unknown formats or sensitive content. Exit 2 on errors. Read-only; never prints values.
 */
import { formatFinding, runGate } from '../core/reporting/privacy-gate.ts';

const rootIndex = process.argv.indexOf('--root');
const root = rootIndex > -1 ? process.argv[rootIndex + 1] ?? '.' : '.';

try {
  const report = runGate(root);
  console.log(
    `[privacy] tracked=${report.tracked} staged=${report.staged} untracked-publishable=${report.untrackedPublishable} ignored=${report.ignored} publish-set=${report.publishSet.length}`,
  );
  if (report.findings.length === 0) {
    console.log('[privacy] PASS: nothing in the publish set is raw evidence, binary, unknown or sensitive.');
    process.exit(0);
  }
  for (const f of report.findings) console.log(formatFinding(f));
  console.log(`[privacy] FAIL: ${report.findings.length} finding(s). Values are never printed; open the file locally.`);
  process.exit(1);
} catch (error) {
  console.error(`[privacy] ERROR: ${(error as Error).message}`);
  process.exit(2);
}
