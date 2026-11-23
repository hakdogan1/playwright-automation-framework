/**
 * CLI: node scripts/ai-guard.ts [base-ref]
 *
 * Compares the working tree (tracked, staged and untracked files) with a base:
 *   explicit argument → AI_GUARD_BASE → origin/main → HEAD → empty tree (no commits yet).
 * An explicit base of HEAD~1 / HEAD^ on a root commit (no parent; CI's push base for the very first
 * commit) is compared with the empty tree, i.e. every file of the commit is inspected. Any other
 * base that does not exist is still an error (exit 2).
 *
 * node scripts/ai-guard.ts --manifest <file>
 *   Writes the deterministic finding manifest of HEAD against the empty tree (for the baseline
 *   review and the CI scan job). Informational: exit 0, or 2 when it cannot inspect.
 *
 * AI_GUARD_BASELINE=1 (CI baseline job, after GitHub environment approval)
 *   Root commit only. Verifies AI_GUARD_BASELINE_REF (exact SHA, manifest hash, finding IDs; see
 *   core/ai/baseline.ts). Prints reason codes and counts, never reference values. Any failure: exit 1.
 *
 * node scripts/ai-guard.ts --verify-environment <env.json> --branch-policies <policies.json> --reviewer <login>
 *   Checks the GitHub environment ai-guard-baseline is protected (required reviewer, no admin
 *   bypass, deployments from main only). Prints failure codes only. Any failure: exit 1.
 *
 * Exit codes: 0 PASS · 1 protected change without approval / baseline not verified · 2 could not inspect (never a PASS).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { analyzeChanges, type ChangedFile } from '../core/ai/ai-guard.ts';
import { buildManifest, manifestSha256, verifyBaseline, verifyEnvironmentProtection } from '../core/ai/baseline.ts';

const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

const args = process.argv.slice(2);
const flagValue = (flag: string) => {
  const i = args.indexOf(flag);
  return i > -1 ? (args[i + 1] ?? '') : undefined;
};
const manifestOut = flagValue('--manifest');
const referenceOut = flagValue('--reference');
const environmentFile = flagValue('--verify-environment');
const branchPoliciesFile = flagValue('--branch-policies');
const reviewer = flagValue('--reviewer');
const flagValueIndexes = new Set(['--manifest', '--reference', '--verify-environment', '--branch-policies', '--reviewer'].map((f) => args.indexOf(f)).filter((i) => i > -1).map((i) => i + 1));
/** Base ref: the first argument that is neither a flag nor a flag's value. */
const positional = args.find((a, i) => !a.startsWith('--') && !flagValueIndexes.has(i));

function git(args: string[], okCodes: number[] = [0]): string {
  const res = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (res.error || res.status === null || !okCodes.includes(res.status)) {
    const why = res.error?.message ?? (res.stderr || `exit ${String(res.status)}`).trim();
    throw new Error(`git ${args.join(' ')} failed: ${why}`);
  }
  return res.stdout;
}

const isCommit = (ref: string) => spawnSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { encoding: 'utf8' }).status === 0;

/** The parent of the checked-out commit, as CI passes it for pushes. */
const PARENT_OF_HEAD = /^HEAD(~1|\^1?)$/;
/** HEAD exists and has no parent (the first commit of the repository). */
const isRootCommit = () => isCommit('HEAD') && git(['rev-list', '--parents', '-n', '1', 'HEAD']).trim().split(' ').length === 1;

function resolveBase(): { base: string; label: string } {
  const explicit = positional ?? process.env.AI_GUARD_BASE;
  if (explicit) {
    if (isCommit(explicit)) return { base: explicit, label: explicit };
    // Not fail-open: the root commit is compared with the empty tree, so every file it contains is
    // inspected (the strictest base). Only the parent-of-HEAD form gets this, and only on a root commit.
    if (PARENT_OF_HEAD.test(explicit) && isRootCommit()) return { base: EMPTY_TREE, label: `empty tree (root commit: "${explicit}" does not exist)` };
    throw new Error(`base "${explicit}" is not a commit in this repository`);
  }
  if (isCommit('origin/main')) return { base: 'origin/main', label: 'origin/main' };
  if (isCommit('HEAD')) return { base: 'HEAD', label: 'HEAD' };
  return { base: EMPTY_TREE, label: 'empty tree (no commits yet)' };
}

const readWorkTree = (path: string): string | null => (existsSync(path) && statSync(path).isFile() ? readFileSync(path, 'utf8') : null);
const readBase = (base: string, path: string): string | null => (base === EMPTY_TREE ? null : git(['show', `${base}:${path}`]));

function changedFiles(base: string): ChangedFile[] {
  const files: ChangedFile[] = [];
  const tracked = git(['diff', '--name-status', '-M', '-z', base, '--']).split('\0').filter(Boolean);
  for (let i = 0; i < tracked.length; ) {
    const status = tracked[i++] ?? '';
    if (status.startsWith('R')) {
      const oldPath = tracked[i++] ?? '';
      const path = tracked[i++] ?? '';
      files.push({ path, oldPath, status: 'renamed', before: readBase(base, oldPath), after: readWorkTree(path) });
      continue;
    }
    const path = tracked[i++] ?? '';
    const kind = status.startsWith('A') ? 'added' : status.startsWith('D') ? 'deleted' : 'modified';
    files.push({ path, status: kind, before: kind === 'added' ? null : readBase(base, path), after: kind === 'deleted' ? null : readWorkTree(path) });
  }
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
  for (const path of untracked) files.push({ path, status: 'added', before: null, after: readWorkTree(path) });
  return files;
}

const readBytes = (path: string): Buffer | null => (existsSync(path) && statSync(path).isFile() ? readFileSync(path) : null);
const isCleanWorkTree = () => git(['status', '--porcelain', '--untracked-files=all']).trim() === '';

/** Findings of HEAD compared with the empty tree (every file of the commit), as a manifest. */
function headManifest() {
  if (!isCommit('HEAD')) throw new Error('there is no commit to describe');
  const head = git(['rev-parse', 'HEAD']).trim();
  const { findings } = analyzeChanges(changedFiles(EMPTY_TREE));
  return { head, manifest: buildManifest(head, findings, readBytes) };
}

try {
  if (git(['rev-parse', '--is-inside-work-tree']).trim() !== 'true') throw new Error('not inside a git work tree');

  if (environmentFile !== undefined) {
    if (!environmentFile || !branchPoliciesFile || !reviewer) throw new Error('--verify-environment needs --branch-policies and --reviewer');
    const result = verifyEnvironmentProtection({ environmentJson: readFileSync(environmentFile, 'utf8'), branchPoliciesJson: readFileSync(branchPoliciesFile, 'utf8'), name: 'ai-guard-baseline', reviewer });
    if (!result.ok) {
      console.error(`[ai-guard] FAIL: environment ai-guard-baseline is not protected as required (${result.failures.join(', ')}).`);
      process.exit(1);
    }
    console.log('[ai-guard] PASS: environment ai-guard-baseline requires the reviewer, forbids admin bypass and deploys from main only.');
    process.exit(0);
  }

  if (manifestOut !== undefined || referenceOut !== undefined) {
    if (manifestOut === '' || referenceOut === '') throw new Error('--manifest / --reference need a file path');
    const { head, manifest } = headManifest();
    if (manifestOut) writeFileSync(manifestOut, `${JSON.stringify(manifest, null, 2)}\n`);
    // The reference is what the owner stores as the environment secret: written to a file, never printed.
    if (referenceOut) writeFileSync(referenceOut, `${JSON.stringify({ commit: head, manifestSha256: manifestSha256(manifest), findingIds: manifest.findings.map((f) => f.id) })}\n`, { mode: 0o600 });
    console.log(`[ai-guard] manifest: findings=${manifest.findings.length} clean=${isCleanWorkTree()} root=${isRootCommit()}${manifestOut ? ` manifest-file=${manifestOut}` : ''}${referenceOut ? ` reference-file=${referenceOut}` : ''}`);
    process.exit(0);
  }

  if (process.env.AI_GUARD_BASELINE === '1') {
    const { head, manifest } = headManifest();
    const result = verifyBaseline({ head, isRoot: isRootCommit(), clean: isCleanWorkTree(), manifest, referenceRaw: process.env.AI_GUARD_BASELINE_REF });
    const c = result.counts;
    console.log(`[ai-guard] baseline mode: findings=${c.manifest} reference-findings=${c.reference} missing=${c.missing} unexpected=${c.unexpected}`);
    if (!result.ok) {
      console.error(`[ai-guard] FAIL: baseline not verified (${result.failures.join(', ')}). Reference values are never printed.`);
      process.exit(1);
    }
    for (const f of manifest.findings) console.log(`  baseline-approved ${f.rule}: ${f.file}`);
    console.log('[ai-guard] PASS: the root commit matches the approved baseline exactly.');
    process.exit(0);
  }

  const { base, label } = resolveBase();
  const files = changedFiles(base);
  const { findings, inspected } = analyzeChanges(files);
  const approved = process.env.AI_GUARD_APPROVED === '1';
  console.log(`[ai-guard] base=${label} changed=${files.length} protected-inspected=${inspected} findings=${findings.length}${approved ? ' (human-approved)' : ''}`);
  for (const f of findings) console.log(`  ${approved ? 'warning' : 'error'} ${f.rule}: ${f.file}: ${f.detail}`);
  if (findings.length > 0 && !approved) {
    console.error('[ai-guard] FAIL: test oracles changed. A reviewer must approve (label "assertion-change-approved").');
    process.exit(1);
  }
  console.log(files.length === 0 ? '[ai-guard] PASS (no changes)' : '[ai-guard] PASS');
} catch (error) {
  console.error(`[ai-guard] ERROR: ${(error as Error).message}. Nothing was verified.`);
  process.exit(2);
}
