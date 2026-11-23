import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { isBinary, redactForPublication, scanText } from './privacy.ts';

/**
 * Sanitized evidence export: copies only allow-listed metadata files of one run, masks them for
 * publication, rescans them and only then moves the result into place. Raw evidence is only read.
 * Traces, screenshots, videos, error-context.md, HTML reports and results.json are never exported.
 * Nothing is uploaded anywhere.
 */

const RUN_ID = /^\d{8}T\d{6}Z-[0-9a-f]{6}$/;

/** Run-relative paths that may be exported (metadata, already partly redacted at capture). */
const ALLOWED: RegExp[] = [/^run\.json$/, /^bug-drafts\/[^/]+\.(md|json)$/, /^artifacts\/[^/]+\/(guard-report|evidence)\.json$/];

export type ExcludedKind = 'trace' | 'media' | 'error-context' | 'html-report' | 'results' | 'other';

export interface ExportResult {
  runId: string;
  outDir: string;
  files: string[];
  excluded: Record<ExcludedKind, number>;
}

export class ExportRefusedError extends Error {
  override name = 'ExportRefusedError';
}

function excludedKind(rel: string): ExcludedKind {
  if (/(^|\/)trace\.zip$|\.(trace|network)$/.test(rel)) return 'trace';
  if (/\.(png|jpe?g|webm|mp4)$/i.test(rel)) return 'media';
  if (/(^|\/)error-context\.md$/.test(rel)) return 'error-context';
  if (/^html\//.test(rel)) return 'html-report';
  if (/(^|\/)results\.json$/.test(rel)) return 'results';
  return 'other';
}

/** Files under dir, without following symbolic links. */
function walk(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = lstatSync(path);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) out.push(...walk(path, base));
    else if (st.isFile()) out.push(relative(base, path).split(sep).join('/'));
  }
  return out.sort();
}

export function exportRun(options: { runId: string; runsRoot: string; outRoot: string; repoRoot?: string }): ExportResult {
  const { runId } = options;
  if (!RUN_ID.test(runId)) throw new ExportRefusedError(`"${runId}" is not a run ID`);
  const runDir = resolve(options.runsRoot, runId);
  if (!existsSync(runDir) || !lstatSync(runDir).isDirectory()) throw new ExportRefusedError(`run ${runId} not found in ${options.runsRoot}`);
  const outRoot = resolve(options.outRoot);
  const finalDir = join(outRoot, runId);
  if (existsSync(finalDir)) throw new ExportRefusedError(`export ${runId} already exists; it is never overwritten`);

  const excluded: Record<ExcludedKind, number> = { trace: 0, media: 0, 'error-context': 0, 'html-report': 0, results: 0, other: 0 };
  const selected: string[] = [];
  for (const rel of walk(runDir)) {
    if (ALLOWED.some((rx) => rx.test(rel))) selected.push(rel);
    else excluded[excludedKind(rel)]++;
  }

  mkdirSync(outRoot, { recursive: true });
  // Same filesystem as the final folder, so the last step is an atomic rename.
  const staging = mkdtempSync(join(outRoot, `.staging-${runId}-`));
  try {
    const manifest: { path: string; sha256: string }[] = [];
    for (const rel of selected) {
      const raw = readFileSync(join(runDir, rel));
      if (isBinary(raw)) throw new ExportRefusedError(`${rel} is not text; nothing was exported`);
      const clean = redactForPublication(raw.toString('utf8'), options.repoRoot ? { repoRoot: options.repoRoot } : {});
      const target = join(staging, rel);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, clean);
      manifest.push({ path: rel, sha256: createHash('sha256').update(clean).digest('hex') });
    }

    // Fail closed: the sanitized copy must scan clean before it becomes an export.
    const residual = walk(staging).flatMap((rel) => {
      const content = readFileSync(join(staging, rel));
      if (isBinary(content)) return [`${rel}: binary`];
      return scanText(content.toString('utf8')).map((f) => `${rel}:${f.line} ${f.rule} x${f.count}`);
    });
    if (residual.length > 0) throw new ExportRefusedError(`sensitive content remained after masking; nothing was exported:\n  ${residual.join('\n  ')}`);

    writeFileSync(
      join(staging, 'EXPORT.json'),
      `${JSON.stringify({ runId, profile: 'publication', scan: 'pass', files: manifest, excluded, note: 'Sanitized metadata only. Traces, screenshots, videos, error-context and HTML reports are never exported.' }, null, 2)}\n`,
    );
    renameSync(staging, finalDir);
    return { runId, outDir: finalDir, files: selected, excluded };
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
