import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { analyzeChanges, classifyPath, type ChangedFile, type Rule } from '../core/ai/ai-guard';
import { buildManifest, canonicalJson, findingId, manifestSha256, parseReference, verifyEnvironmentProtection } from '../core/ai/baseline';

const SPEC = 'apps/x/tests/a.spec.ts';
const BASE_SPEC = `import { test, expect } from '../../fixtures';

test('loads', { tag: ['@smoke'], annotation: [tc('TC-X-001')] }, async ({ page }) => {
  const expected = 'Loaded';
  await page.goto('/');
  await expect(page.getByTestId('status'))
    .toHaveText(expected);
  await expect(page.getByRole('button', { name: 'Go' })).toBeEnabled();
});
`;

const modified = (path: string, before: string, after: string): ChangedFile => ({ path, status: 'modified', before, after });
const rulesFor = (files: ChangedFile[]): Rule[] => analyzeChanges(files).findings.map((f) => f.rule);

test.describe('ai-guard analysis (AST, content based)', () => {
  test('multi-line assertion change is flagged', () => {
    expect(rulesFor([modified(SPEC, BASE_SPEC, BASE_SPEC.replace('.toHaveText(expected)', '.toContainText(expected)'))])).toEqual(['assertion-changed']);
  });

  test('a local expected value change is flagged', () => {
    expect(rulesFor([modified(SPEC, BASE_SPEC, BASE_SPEC.replace("'Loaded'", "'Loading'"))])).toEqual(['assertion-changed']);
  });

  test('wrapping an existing assertion in a condition is flagged', () => {
    const after = BASE_SPEC.replace("  await expect(page.getByRole('button', { name: 'Go' })).toBeEnabled();", "  if (process.env.CI) await expect(page.getByRole('button', { name: 'Go' })).toBeEnabled();");
    expect(rulesFor([modified(SPEC, BASE_SPEC, after)])).toEqual(['assertion-changed']);
  });

  test('an early return before assertions is flagged', () => {
    const after = BASE_SPEC.replace("  await page.goto('/');", "  await page.goto('/');\n  if (process.env.CI) return;");
    expect(rulesFor([modified(SPEC, BASE_SPEC, after)])).toEqual(['early-exit-added']);
  });

  test('slow() calls are not treated as an oracle change', () => {
    const after = BASE_SPEC.replace("  await page.goto('/');", "  test.slow();\n  await page.goto('/');");
    expect(rulesFor([modified(SPEC, BASE_SPEC, after)])).toEqual([]);
  });

  for (const call of ["test.skip(true, 'later');", "testInfo.skip(true, 'later');", "test.fixme();", "test.fail();", "test.info().skip();", "test.info().fixme('x');"]) {
    test(`${call} inside a test is flagged`, () => {
      const after = BASE_SPEC.replace("  await page.goto('/');", `  ${call}\n  await page.goto('/');`);
      expect(rulesFor([modified(SPEC, BASE_SPEC, after)])).toContain('skip-or-fail-added');
    });
  }

  test('file-level test.skip and a test.fail declaration are flagged', () => {
    const after = `${BASE_SPEC}\ntest.skip(({ browserName }) => browserName === 'webkit');\ntest.fail('known bug', async () => {});\n`;
    const { findings } = analyzeChanges([modified(SPEC, BASE_SPEC, after)]);
    expect(findings.map((f) => f.rule)).toEqual(['skip-or-fail-added']);
    expect(findings[0]?.detail).toContain('0 → 2'); // both calls counted in one file-level finding
  });

  test('guarded tags and lost TC-IDs are flagged', () => {
    const after = BASE_SPEC.replace("tag: ['@smoke'], annotation: [tc('TC-X-001')]", "tag: ['@smoke', '@quarantine'], annotation: []");
    expect(rulesFor([modified(SPEC, BASE_SPEC, after)])).toEqual(['guarded-tag-changed', 'traceability-changed']);
  });

  test('removing a test is flagged', () => {
    expect(rulesFor([modified(SPEC, BASE_SPEC, "import { test } from '../../fixtures';\n")])).toEqual(['test-removed']);
  });

  test('adding a new test or an extra assertion is NOT flagged', () => {
    const extra = BASE_SPEC.replace("toBeEnabled();\n});", "toBeEnabled();\n  await expect(page).toHaveTitle(/X/);\n});");
    const newTest = `${BASE_SPEC}\ntest('new', async ({ page }) => {\n  await expect(page).toHaveURL('/');\n});\n`;
    expect(rulesFor([modified(SPEC, BASE_SPEC, extra)])).toEqual([]);
    expect(rulesFor([modified(SPEC, BASE_SPEC, newTest)])).toEqual([]);
    expect(rulesFor([modified(SPEC, BASE_SPEC, BASE_SPEC.replace('    .toHaveText(expected)', '.toHaveText(expected)'))])).toEqual([]); // reformat only
  });

  test('data, runner config, baselines and expected results are protected', () => {
    const data = "export const TOOLS = ['Playwright', 'Cypress'] as const;\nexport const EMAIL = 'a@example.test';\n";
    const config = "export default defineConfig({ retries: 0, projects: [{ name: 'x', testDir: './t' }] });\n";
    const doc = '## TC-X-001 — t\n**Expected result**\n- Total is $19.99.\n';
    const findings = analyzeChanges([
      modified('apps/x/data/tools.data.ts', data, data.replace("'Cypress'", "'Cypres'")),
      modified('playwright.config.ts', config, config.replace("testDir: './t' }", "testDir: './t', testIgnore: '**/inputs/**', grepInvert: /@negative/ }")),
      { path: 'apps/x/tests/a.spec.ts-snapshots/home.png', status: 'added', before: null, after: 'png' },
      modified('apps/x/test-cases/TC-X.md', doc, doc.replace('$19.99', '$19.990000000000002')),
    ]).findings.map((f) => f.rule);
    expect(findings).toEqual(['test-data-changed', 'runner-config-changed', 'baseline-changed', 'expected-result-changed']);
  });

  test('a new spec with test.skip is flagged; a clean new spec is not', () => {
    const added = (after: string): ChangedFile => ({ path: SPEC, status: 'added', before: null, after });
    expect(rulesFor([added(BASE_SPEC)])).toEqual([]);
    expect(rulesFor([added(`${BASE_SPEC}\ntest.skip('later', async () => {});\n`)])).toEqual(['skip-or-fail-added']);
  });

  test('unrelated files are ignored and counted as not inspected', () => {
    const { findings, inspected } = analyzeChanges([modified('README.md', 'a', 'b'), modified('core/x.ts', 'a', 'b')]);
    expect(findings).toEqual([]);
    expect(inspected).toBe(0);
  });
});

test.describe('ai-guard: privacy allowlist protection', () => {
  const AL = 'privacy-allowlist.json';
  const entry = (path: string, rule: string, count: number, reason = 'synthetic fixture') => ({ path, rule, count, reason });
  const BASE_ENTRIES = [entry('tests/a.spec.ts', 'jwt', 1), entry('tests/b.spec.ts', 'email', 2)];
  const BASE = JSON.stringify(BASE_ENTRIES);
  const details = (before: string | null, after: string | null) =>
    analyzeChanges([{ path: AL, status: before === null ? 'added' : after === null ? 'deleted' : 'modified', before, after }]).findings.map((f) => `${f.rule}: ${f.detail}`);

  test('an added exception is reported and needs review', () => {
    const after = JSON.stringify([...BASE_ENTRIES, entry('tests/c.spec.ts', 'supabase-key', 1)]);
    expect(details(BASE, after)).toEqual(['privacy-exception-changed: added: tests/c.spec.ts rule=supabase-key count=1']);
  });

  test('a removed exception is reported', () => {
    expect(details(BASE, JSON.stringify([entry('tests/a.spec.ts', 'jwt', 1)]))).toEqual(['privacy-exception-changed: removed: tests/b.spec.ts rule=email']);
  });

  test('a changed count or reason is reported', () => {
    expect(details(BASE, JSON.stringify([entry('tests/a.spec.ts', 'jwt', 3), entry('tests/b.spec.ts', 'email', 2)]))).toEqual([
      'privacy-exception-changed: changed: tests/a.spec.ts rule=jwt (count=1 → count=3, or reason)',
    ]);
    expect(details(BASE, JSON.stringify([entry('tests/a.spec.ts', 'jwt', 1), entry('tests/b.spec.ts', 'email', 2, 'other')]))).toHaveLength(1);
  });

  test('reordering without changes is not reported', () => {
    expect(details(BASE, JSON.stringify([...BASE_ENTRIES].reverse()))).toEqual([]);
  });

  test('deleting the allowlist, a new allowlist and an unreadable allowlist are all reported', () => {
    expect(details(BASE, null)).toEqual(['protected-file-removed: privacy-allowlist deleted']);
    expect(details(null, BASE)).toHaveLength(2);
    expect(details(BASE, '{ not json')).toEqual(['privacy-exception-changed: allowlist is not a readable JSON array']);
  });
});

test.describe('ai-guard: baseline manifest and protected guard code', () => {
  const F = [
    { rule: 'skip-or-fail-added', file: 'b.spec.ts', detail: '1 call' },
    { rule: 'guard-code-changed', file: '.github/workflows/ci.yml', detail: 'added' },
  ];
  const content = (file: string) => Buffer.from(`content of ${file}`);
  const HEAD = 'a'.repeat(40);

  test('the manifest is deterministic, order-independent and holds no file content', () => {
    const one = buildManifest(HEAD, F, content);
    const two = buildManifest(HEAD, [...F].reverse(), content);
    expect(canonicalJson(one)).toBe(canonicalJson(two));
    expect(manifestSha256(one)).toBe(manifestSha256(two));
    expect(JSON.stringify(one)).not.toContain('content of');
  });

  test('a finding ID changes when the file content changes', () => {
    const before = findingId({ rule: 'r', file: 'f', detail: 'd', contentSha256: '1'.repeat(64) });
    const after = findingId({ rule: 'r', file: 'f', detail: 'd', contentSha256: '2'.repeat(64) });
    expect(before).not.toBe(after);
  });

  test('the reference is parsed strictly', () => {
    const ok = { commit: HEAD, manifestSha256: 'b'.repeat(64), findingIds: ['c'.repeat(64)] };
    expect(parseReference(JSON.stringify(ok))).toEqual(ok);
    expect(parseReference(undefined)).toBe('missing');
    expect(parseReference('  ')).toBe('missing');
    expect(parseReference('{ not json')).toBe('invalid');
    expect(parseReference(JSON.stringify({ ...ok, approved: true }))).toBe('invalid');
    expect(parseReference(JSON.stringify({ ...ok, commit: 'HEAD' }))).toBe('invalid');
    expect(parseReference(JSON.stringify({ ...ok, findingIds: [] }))).toBe('invalid');
    expect(parseReference(JSON.stringify({ ...ok, findingIds: ['c'.repeat(64), 'c'.repeat(64)] }))).toBe('invalid');
  });

  test('workflows, code owners and AI Guard code are a protected class', () => {
    for (const path of ['.github/workflows/ci.yml', '.github/workflows/x.yaml', '.github/CODEOWNERS', 'scripts/ai-guard.ts', 'core/ai/ai-guard.ts', 'core/ai/baseline.ts']) {
      expect(classifyPath(path), path).toBe('guard-code');
    }
    expect(classifyPath('core/ai/prompts/x.md')).toBe('other');
    expect(rulesFor([modified('.github/workflows/ci.yml', 'a: 1', 'a: 2')])).toEqual(['guard-code-changed']);
    expect(rulesFor([modified('scripts/ai-guard.ts', 'x', 'x')])).toEqual([]);
  });
});

test.describe('ai-guard: environment protection check', () => {
  const env = (over: Record<string, unknown> = {}) =>
    JSON.stringify({
      name: 'ai-guard-baseline',
      can_admins_bypass: false,
      protection_rules: [
        { type: 'required_reviewers', prevent_self_review: false, reviewers: [{ type: 'User', reviewer: { login: 'hakdogan1' } }] },
        { type: 'branch_policy' },
      ],
      deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
      ...over,
    });
  const MAIN_ONLY = JSON.stringify({ total_count: 1, branch_policies: [{ name: 'main', type: 'branch' }] });
  const check = (environmentJson: string, branchPoliciesJson = MAIN_ONLY) => verifyEnvironmentProtection({ environmentJson, branchPoliciesJson, name: 'ai-guard-baseline', reviewer: 'hakdogan1' });

  test('a correctly protected environment passes', () => {
    expect(check(env())).toEqual({ ok: true, failures: [] });
  });

  test('every missing protection fails', () => {
    expect(check(env({ can_admins_bypass: true })).failures).toContain('admin-bypass-allowed');
    expect(check(env({ protection_rules: [] })).failures).toContain('required-reviewer-missing');
    expect(check(env({ protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'someone-else' } }] }] })).failures).toContain('required-reviewer-missing');
    expect(check(env({ deployment_branch_policy: null })).failures).toContain('branch-policy-missing');
    expect(check(env({ deployment_branch_policy: { protected_branches: true, custom_branch_policies: false } })).failures).toContain('branch-policy-not-main-only');
    expect(check(env(), JSON.stringify({ branch_policies: [{ name: 'main' }, { name: 'dev' }] })).failures).toContain('branch-policy-not-main-only');
    expect(check(env({ name: 'other' })).failures).toContain('environment-name');
    expect(check('{ not json').failures).toEqual(['environment-unreadable']);
    // An auto-created environment (no protection at all) fails on every count.
    expect(check(JSON.stringify({ name: 'ai-guard-baseline', protection_rules: [], deployment_branch_policy: null })).failures).toEqual(['admin-bypass-allowed', 'required-reviewer-missing', 'branch-policy-missing']);
  });

  test('the CLI exits 1 for an unprotected environment and 0 for a protected one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pqf-env-'));
    const run = (environmentJson: string) => {
      writeFileSync(join(dir, 'env.json'), environmentJson);
      writeFileSync(join(dir, 'policies.json'), MAIN_ONLY);
      const r = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', resolve('scripts/ai-guard.ts'), '--verify-environment', join(dir, 'env.json'), '--branch-policies', join(dir, 'policies.json'), '--reviewer', 'hakdogan1'], { encoding: 'utf8' });
      return { code: r.status, out: `${r.stdout}${r.stderr}` };
    };
    expect(run(env()).code).toBe(0);
    const bad = run(env({ can_admins_bypass: true }));
    expect(bad.code).toBe(1);
    expect(bad.out).toContain('admin-bypass-allowed');
    rmSync(dir, { recursive: true, force: true });
  });
});

test.describe('ai-guard CLI against real git repositories', () => {
  const cli = resolve('scripts/ai-guard.ts');
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_NAME: 'selftest', GIT_AUTHOR_EMAIL: 'selftest@example.test', GIT_COMMITTER_NAME: 'selftest', GIT_COMMITTER_EMAIL: 'selftest@example.test', AI_GUARD_APPROVED: '', AI_GUARD_BASE: '' };
  let repo = '';

  const sh = (cmd: string, args: string[]) => spawnSync(cmd, args, { cwd: repo, env, encoding: 'utf8' });
  const write = (path: string, text: string) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), text);
  };
  const guard = (...args: string[]) => {
    const res = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', cli, ...args], { cwd: repo, env: { ...env, NODE_PATH: resolve('node_modules') }, encoding: 'utf8' });
    return { code: res.status, out: `${res.stdout}${res.stderr}` };
  };
  const commit = () => {
    sh('git', ['add', '-A']);
    sh('git', ['commit', '-q', '-m', 'base']);
  };

  test.beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'pqf-ai-guard-'));
    // The CLI imports `typescript`; make it resolvable from the temp repo.
    sh('ln', ['-s', resolve('node_modules'), 'node_modules']);
    write('.gitignore', 'node_modules\n');
    sh('git', ['init', '-q', '-b', 'main']);
  });

  test.afterEach(() => rmSync(repo, { recursive: true, force: true }));

  test('repo with no commits: an untracked spec with test.skip FAILS (no false "files=0 PASS")', () => {
    write(SPEC, `${BASE_SPEC}\ntest.skip('later', async () => {});\n`);
    const r = guard();
    expect(r.out).toContain('empty tree (no commits yet)');
    expect(r.out).toMatch(/protected-inspected=1/);
    expect(r.code, r.out).toBe(1);
  });

  test('repo with no commits: a clean untracked spec PASSES after real inspection', () => {
    write(SPEC, BASE_SPEC);
    const r = guard();
    expect(r.out).toMatch(/changed=\d+ protected-inspected=1 findings=0/);
    expect(r.code, r.out).toBe(0);
  });

  test('modified tracked spec with a changed assertion FAILS', () => {
    write(SPEC, BASE_SPEC);
    commit();
    write(SPEC, BASE_SPEC.replace('.toHaveText(expected)', '.toContainText(expected)'));
    const r = guard();
    expect(r.out).toContain('assertion-changed');
    expect(r.code, r.out).toBe(1);
  });

  test('new untracked file in a committed repo is inspected', () => {
    write('README.md', 'x');
    commit();
    write('apps/x/tests/b.spec.ts', "import { test } from '../../fixtures';\ntest.fixme('todo', async () => {});\n");
    const r = guard();
    expect(r.out).toContain('skip-or-fail-added');
    expect(r.code, r.out).toBe(1);
  });

  test('deleted spec FAILS', () => {
    write(SPEC, BASE_SPEC);
    commit();
    rmSync(join(repo, SPEC));
    const r = guard();
    expect(r.out).toContain('protected-file-removed');
    expect(r.code, r.out).toBe(1);
  });

  test('renamed spec FAILS', () => {
    write(SPEC, BASE_SPEC);
    commit();
    renameSync(join(repo, SPEC), join(repo, 'apps/x/tests/renamed.spec.ts'));
    sh('git', ['add', '-A']);
    const r = guard();
    expect(r.out).toContain('protected-file-renamed');
    expect(r.code, r.out).toBe(1);
  });

  test('a committed privacy allowlist: an unchanged file PASSES, an added exception FAILS', () => {
    write('privacy-allowlist.json', JSON.stringify([{ path: 'tests/a.spec.ts', rule: 'jwt', count: 1, reason: 'synthetic' }]));
    commit();
    const clean = guard();
    expect(clean.code, clean.out).toBe(0);
    write('privacy-allowlist.json', JSON.stringify([{ path: 'tests/a.spec.ts', rule: 'jwt', count: 1, reason: 'synthetic' }, { path: 'docs/x.md', rule: 'email', count: 1, reason: 'synthetic' }]));
    const r = guard();
    expect(r.code, r.out).toBe(1);
    expect(r.out).toContain('privacy-exception-changed: privacy-allowlist.json: added: docs/x.md rule=email count=1');
  });

  test('human approval turns findings into warnings', () => {
    write(SPEC, BASE_SPEC);
    commit();
    write(SPEC, BASE_SPEC.replace("'Loaded'", "'Loading'"));
    const res = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', cli], { cwd: repo, env: { ...env, AI_GUARD_APPROVED: '1' }, encoding: 'utf8' });
    expect(res.stdout).toContain('warning assertion-changed');
    expect(res.status).toBe(0);
  });

  test('root commit with base HEAD~1: the whole commit is inspected; a clean commit PASSES', () => {
    write(SPEC, BASE_SPEC);
    commit();
    const r = guard('HEAD~1');
    expect(r.out).toContain('empty tree (root commit: "HEAD~1" does not exist)');
    expect(r.out).toMatch(/protected-inspected=1/);
    expect(r.code, r.out).toBe(0);
  });

  test('root commit with base HEAD~1 or HEAD^: protected content in the commit FAILS (not fail-open)', () => {
    write(SPEC, `${BASE_SPEC}\ntest.skip('later', async () => {});\n`);
    commit();
    for (const base of ['HEAD~1', 'HEAD^']) {
      const r = guard(base);
      expect(r.out).toContain('root commit');
      expect(r.out).toContain('skip-or-fail-added');
      expect(r.code, r.out).toBe(1);
    }
  });

  test('root commit: any other missing base is still an ERROR (exit 2)', () => {
    write(SPEC, BASE_SPEC);
    commit();
    const r = guard('HEAD~2');
    expect(r.out).toContain('Nothing was verified');
    expect(r.code).toBe(2);
  });

  test('next commit with base HEAD~1: the real parent is used, a changed assertion FAILS, an unrelated change PASSES', () => {
    write(SPEC, BASE_SPEC);
    commit();
    write('README.md', 'docs only');
    commit();
    const unrelated = guard('HEAD~1');
    expect(unrelated.out).toContain('base=HEAD~1 ');
    expect(unrelated.code, unrelated.out).toBe(0);
    write(SPEC, BASE_SPEC.replace('.toHaveText(expected)', '.toContainText(expected)'));
    commit();
    const changed = guard('HEAD~1');
    expect(changed.out).toContain('assertion-changed');
    expect(changed.code, changed.out).toBe(1);
  });

  // ---------- baseline approval (root commit only) ----------
  const WORKFLOW = '.github/workflows/ci.yml';
  const baselineRepo = () => {
    write(WORKFLOW, 'name: CI\n');
    write(SPEC, `${BASE_SPEC}\ntest.skip('later', async () => {});\n`);
    commit();
  };
  const reference = (): Record<string, unknown> => {
    const file = join(repo, '..', `${repo.split('/').pop()}-ref.json`);
    const r = guard('--reference', file);
    expect(r.code, r.out).toBe(0);
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  };
  const baseline = (ref: unknown) => {
    const res = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', cli], {
      cwd: repo,
      env: { ...env, NODE_PATH: resolve('node_modules'), AI_GUARD_BASELINE: '1', AI_GUARD_BASELINE_REF: typeof ref === 'string' ? ref : JSON.stringify(ref) },
      encoding: 'utf8',
    });
    return { code: res.status, out: `${res.stdout}${res.stderr}` };
  };
  const expectNoReferenceValues = (out: string, ref: Record<string, unknown>) => {
    for (const v of [ref.commit, ref.manifestSha256, ...(ref.findingIds as string[])]) expect(out.includes(String(v)), 'a reference value appeared in the output').toBe(false);
  };

  test('baseline: root commit with the exact approved reference PASSES, without printing reference values', () => {
    baselineRepo();
    const ref = reference();
    const r = baseline(ref);
    expect(r.code, r.out).toBe(0);
    expect(r.out).toContain('PASS: the root commit matches the approved baseline exactly');
    expect(r.out).toContain('baseline-approved guard-code-changed: .github/workflows/ci.yml');
    expectNoReferenceValues(r.out, ref);
  });

  test('baseline: a missing approval reference FAILS', () => {
    baselineRepo();
    const r = baseline('');
    expect(r.code).toBe(1);
    expect(r.out).toContain('reference-missing');
  });

  test('baseline: a wrong commit SHA FAILS', () => {
    baselineRepo();
    const ref = { ...reference(), commit: 'f'.repeat(40) };
    const r = baseline(ref);
    expect(r.code).toBe(1);
    expect(r.out).toContain('sha-mismatch');
    expectNoReferenceValues(r.out, ref);
  });

  test('baseline: a missing, extra or changed finding FAILS', () => {
    baselineRepo();
    const ref = reference();
    const ids = ref.findingIds as string[];
    expect(baseline({ ...ref, findingIds: ids.slice(1) }).out).toContain('finding-set-mismatch');
    expect(baseline({ ...ref, findingIds: [...ids, 'e'.repeat(64)] }).out).toContain('finding-set-mismatch');
    // Changing the commit content (amend keeps it a root commit) changes SHA, manifest and IDs.
    write(SPEC, `${BASE_SPEC}\ntest.skip('later', async () => {});\ntest.fixme('more', async () => {});\n`);
    sh('git', ['add', '-A']);
    sh('git', ['commit', '-q', '--amend', '-m', 'base']);
    const r = baseline(ref);
    expect(r.code).toBe(1);
    expect(r.out).toContain('sha-mismatch');
    expect(r.out).toContain('manifest-mismatch');
    expect(r.out).toContain('finding-set-mismatch');
  });

  test('baseline: a broken manifest hash or a malformed reference FAILS', () => {
    baselineRepo();
    const ref = reference();
    const tampered = baseline({ ...ref, manifestSha256: '0'.repeat(64) });
    expect(tampered.code).toBe(1);
    expect(tampered.out).toContain('manifest-mismatch');
    for (const bad of ['{ not json', JSON.stringify({ ...ref, approved: true }), JSON.stringify([ref])]) {
      const r = baseline(bad);
      expect(r.code).toBe(1);
      expect(r.out).toContain('reference-invalid');
    }
  });

  test('baseline: uncommitted changes on the root commit FAIL', () => {
    baselineRepo();
    const ref = reference();
    write('README.md', 'dirty');
    const r = baseline(ref);
    expect(r.code).toBe(1);
    expect(r.out).toContain('worktree-not-clean');
  });

  test('baseline: the mode is refused on any commit after the root commit', () => {
    baselineRepo();
    write('README.md', 'second');
    commit();
    const ref = reference();
    const r = baseline(ref);
    expect(r.code).toBe(1);
    expect(r.out).toContain('not-root-commit');
  });

  test('baseline: a reference without baseline mode approves nothing (normal path)', () => {
    baselineRepo();
    const ref = reference();
    const res = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', cli, 'HEAD~1'], {
      cwd: repo,
      env: { ...env, NODE_PATH: resolve('node_modules'), AI_GUARD_BASELINE_REF: JSON.stringify(ref) },
      encoding: 'utf8',
    });
    expect(res.status).toBe(1);
    expect(`${res.stdout}${res.stderr}`).toContain('guard-code-changed');
  });

  test('the manifest file holds hashes, not file content', () => {
    write(WORKFLOW, 'name: CI\n');
    write(SPEC, `${BASE_SPEC}\n// SYNTH-MARKER-ZX81\ntest.skip('later', async () => {});\n`);
    commit();
    const file = join(repo, '..', `${repo.split('/').pop()}-manifest.json`);
    expect(guard('--manifest', file).code).toBe(0);
    const text = readFileSync(file, 'utf8');
    expect(text).toContain('contentSha256');
    expect(text).not.toContain('SYNTH-MARKER-ZX81');
  });

  test('changing a workflow or the AI Guard after the baseline FAILS on the normal path', () => {
    baselineRepo();
    write('scripts/ai-guard.ts', '// replaced\n');
    commit();
    write(WORKFLOW, 'name: CI\non: push\n');
    const r = guard('HEAD~1');
    expect(r.code, r.out).toBe(1);
    expect(r.out).toContain('guard-code-changed: .github/workflows/ci.yml: content changed');
  });

  test('invalid base ref is an ERROR (exit 2), not a PASS', () => {
    write('README.md', 'x');
    commit();
    const r = guard('no-such-ref');
    expect(r.out).toContain('Nothing was verified');
    expect(r.code).toBe(2);
  });

  test('outside a git repository is an ERROR (exit 2)', () => {
    rmSync(join(repo, '.git'), { recursive: true, force: true });
    const r = guard();
    expect(r.code).toBe(2);
    expect(r.out).toContain('ERROR');
  });
});
