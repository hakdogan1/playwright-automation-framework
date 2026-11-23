/**
 * npm run evidence:export -- <runId> [--runs <dir>] [--out <dir>]
 * Writes a sanitized metadata-only copy of one evidence run to evidence-export/<runId>/ (git-ignored).
 * Raw evidence is only read. Nothing is uploaded. Exit 1 when the export is refused, 2 on errors.
 */
import { relative } from 'node:path';
import { ExportRefusedError, exportRun } from '../core/reporting/evidence-export.ts';

const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] ?? fallback : fallback;
};
const runId = args.find((a, i) => !a.startsWith('--') && !['--runs', '--out'].includes(args[i - 1] ?? ''));

if (!runId) {
  console.error('[export] usage: npm run evidence:export -- <runId>');
  process.exit(2);
}

try {
  const result = exportRun({ runId, runsRoot: option('--runs', 'evidence/runs'), outRoot: option('--out', 'evidence-export'), repoRoot: process.cwd() });
  const skipped = Object.entries(result.excluded).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(' ');
  console.log(`[export] ${result.runId}: ${result.files.length} sanitized file(s) → ${relative(process.cwd(), result.outDir)}`);
  console.log(`[export] not exported: ${skipped || 'nothing'}`);
  console.log('[export] PASS: rescan found no sensitive content. Nothing was uploaded.');
} catch (error) {
  const refused = error instanceof ExportRefusedError;
  console.error(`[export] ${refused ? 'REFUSED' : 'ERROR'}: ${(error as Error).message}`);
  process.exit(refused ? 1 : 2);
}
