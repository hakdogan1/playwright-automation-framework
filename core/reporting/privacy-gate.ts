import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { isBinary, scanText, type PrivacyRule } from './privacy.ts';

/**
 * Publication gate: fails closed when the set of files Git would publish contains raw evidence,
 * reports, diagnostics, binaries, unknown formats or sensitive content. Read-only: it only runs
 * `git ls-files`, `git diff --cached --name-only`, `git check-ignore` and `git show :<path>`.
 * Output never contains matched values.
 */

export type GateKind = 'denied-path' | 'binary' | 'unknown-format' | 'sensitive' | 'gitignore' | 'allowlist-mismatch' | 'unreadable';

export interface GateFinding {
  kind: GateKind;
  path: string;
  rule?: PrivacyRule | 'binary' | 'unknown-format';
  line?: number;
  count?: number;
  /** For sensitive content: which version was scanned. */
  source?: 'worktree' | 'index';
  reason?: string;
}

/** An approved exception for a synthetic fixture. The count pins it: any change needs re-approval. */
export interface AllowEntry {
  path: string;
  rule: PrivacyRule | 'binary' | 'unknown-format';
  count: number;
  reason: string;
}

export interface GateReport {
  tracked: number;
  staged: number;
  untrackedPublishable: number;
  ignored: number;
  publishSet: string[];
  findings: GateFinding[];
}

/** Directories that hold raw evidence, reports or exports: never published through Git. */
const DENIED_DIRS = /(^|\/)(evidence|evidence-export|test-results|playwright-report|blob-report|reports)\//;
/** Playwright and framework artefacts, wherever they are. */
const DENIED_FILES = /(^|\/)(trace\.zip|error-context\.md|\.last-run\.json|results\.json|run\.json|retention-audit\.jsonl)$|\.(trace|network|har|webm|mp4|log)$/i;
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json', '.jsonc', '.md', '.yml', '.yaml', '.txt', '.example']);
const TEXT_DOTFILES = new Set(['.gitignore', '.gitattributes', '.editorconfig', '.npmrc', '.nvmrc', '.prettierrc', '.prettierignore']);
const TEXT_PLAIN_NAMES = new Set(['LICENSE', 'CODEOWNERS', 'Dockerfile']);
/** Paths that must be ignored by .gitignore (probed with git check-ignore). */
export const REQUIRED_IGNORED = [
  'evidence/runs/probe/trace.zip',
  'evidence-export/probe/EXPORT.json',
  'test-results/probe/trace.zip',
  'playwright-report/index.html',
  'blob-report/probe.zip',
  '.env',
];

function git(root: string, args: string[]): Buffer {
  const result = spawnSync('git', args, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr.toString().trim()}`);
  return result.stdout;
}

const zList = (out: Buffer) => out.toString('utf8').split('\0').filter(Boolean);

function formatOf(path: string): 'text' | 'binary' | 'unknown-format' {
  const name = basename(path);
  if (TEXT_DOTFILES.has(name) || TEXT_PLAIN_NAMES.has(name) || TEXT_EXTENSIONS.has(extname(name).toLowerCase())) return 'text';
  if (/\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|gz|tgz|webm|mp4|woff2?|ttf|otf|eot|bin|exe|dll|so|dylib)$/i.test(name)) return 'binary';
  return 'unknown-format';
}

export function loadAllowlist(root: string, file = 'privacy-allowlist.json'): AllowEntry[] {
  const path = join(root, file);
  if (!existsSync(path)) return [];
  const entries = JSON.parse(readFileSync(path, 'utf8')) as AllowEntry[];
  for (const e of entries) if (!e.path || !e.rule || typeof e.count !== 'number' || !e.reason) throw new Error(`Invalid allowlist entry in ${file}`);
  return entries;
}

export function runGate(root: string, allowlist: AllowEntry[] = loadAllowlist(root)): GateReport {
  const tracked = zList(git(root, ['ls-files', '-z']));
  const staged = zList(git(root, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']));
  const untracked = zList(git(root, ['ls-files', '-z', '--others', '--exclude-standard']));
  const ignored = zList(git(root, ['ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--directory']));
  const publishSet = [...new Set([...tracked, ...staged, ...untracked])].sort();
  const stagedSet = new Set(staged);
  const findings: GateFinding[] = [];
  const used = new Set<AllowEntry>();
  const allowed = (path: string, rule: AllowEntry['rule'], count: number) => {
    const entry = allowlist.find((e) => e.path === path && e.rule === rule);
    if (!entry) return false;
    used.add(entry);
    if (entry.count !== count) {
      findings.push({ kind: 'allowlist-mismatch', path, rule, count, reason: `approved count ${entry.count}, found ${count}` });
    }
    return true;
  };

  for (const path of publishSet) {
    if (DENIED_DIRS.test(path) || DENIED_FILES.test(path)) {
      findings.push({ kind: 'denied-path', path, reason: 'raw evidence, report or diagnostic file' });
      continue;
    }
    const format = formatOf(path);
    if (format !== 'text') {
      if (!allowed(path, format, 1)) findings.push({ kind: format, path, rule: format });
      continue;
    }
    const versions: { source: 'worktree' | 'index'; content: Buffer | null }[] = [];
    const abs = join(root, path);
    versions.push({ source: 'worktree', content: existsSync(abs) && lstatSync(abs).isFile() ? readFileSync(abs) : null });
    if (stagedSet.has(path)) versions.push({ source: 'index', content: git(root, ['show', `:${path}`]) });
    for (const { source, content } of versions) {
      if (content === null) continue;
      if (isBinary(content)) {
        if (!allowed(path, 'binary', 1)) findings.push({ kind: 'binary', path, rule: 'binary', source });
        continue;
      }
      const perRule = new Map<PrivacyRule, { count: number; line: number }>();
      for (const f of scanText(content.toString('utf8'))) {
        const cur = perRule.get(f.rule);
        perRule.set(f.rule, { count: (cur?.count ?? 0) + f.count, line: cur?.line ?? f.line });
      }
      for (const [rule, { count, line }] of perRule) {
        if (!allowed(path, rule, count)) findings.push({ kind: 'sensitive', path, rule, line, count, source });
      }
    }
  }

  const notIgnored = REQUIRED_IGNORED.filter((p) => spawnSync('git', ['check-ignore', '-q', '--no-index', p], { cwd: root }).status !== 0);
  for (const p of notIgnored) findings.push({ kind: 'gitignore', path: p, reason: 'must be ignored by .gitignore' });
  for (const e of allowlist) {
    if (!used.has(e)) findings.push({ kind: 'allowlist-mismatch', path: e.path, rule: e.rule, reason: 'approved exception no longer matches anything (remove it)' });
  }

  return { tracked: tracked.length, staged: staged.length, untrackedPublishable: untracked.length, ignored: ignored.length, publishSet, findings };
}

/** One line per finding; never includes the matched value. */
export function formatFinding(f: GateFinding): string {
  const where = f.line ? `${f.path}:${f.line}` : f.path;
  return [`  ${f.kind.padEnd(18)} ${where}`, f.rule ? `rule=${f.rule}` : '', f.count ? `x${f.count}` : '', f.source ? `(${f.source})` : '', f.reason ? `— ${f.reason}` : '']
    .filter(Boolean)
    .join(' ');
}
