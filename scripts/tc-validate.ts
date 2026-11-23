/**
 * CLI: node scripts/tc-validate.ts
 * Fails (exit 1) when test case documents and tests are out of sync.
 */
import { validateBugTraceability, validateTraceability } from '../core/reporting/tc-validator.ts';

const apps = [{ name: 'qa-practice', testCaseDirs: ['apps/qa-practice/test-cases'], specDirs: ['apps/qa-practice/tests'], bugReportDir: 'docs/bug-reports' }];

let failed = false;
for (const app of apps) {
  const report = validateTraceability(app);
  const automated = report.testCases.filter((t) => report.references.has(t.id)).length;
  console.log(`[tc-validate] ${app.name}: ${report.testCases.length} test cases, ${automated} automated, ${report.references.size} referenced IDs`);
  for (const w of report.warnings) console.warn(`  warning: ${w}`);
  for (const e of report.errors) console.error(`  error: ${e}`);
  if (report.errors.length > 0) failed = true;
  const bugs = validateBugTraceability({ bugReportDir: app.bugReportDir, specDirs: app.specDirs, testCaseIds: new Set(report.testCases.map((t) => t.id)) });
  console.log(`[tc-validate] ${app.name}: ${bugs.reports.length} bug reports, ${bugs.references.size} Bug-IDs referenced by tests`);
  for (const e of bugs.errors) console.error(`  error: ${e}`);
  if (bugs.errors.length > 0) failed = true;
}
if (failed) {
  console.error('[tc-validate] FAIL');
  process.exit(1);
}
console.log('[tc-validate] PASS');
