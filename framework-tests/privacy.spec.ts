import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { ExportRefusedError, exportRun } from '../core/reporting/evidence-export';
import { isBinary, redactForPublication, scanText, type PrivacyRule } from '../core/reporting/privacy';
import { redactText, redactUrl } from '../core/reporting/redact';
import { decide, scanRuns, verifyRuns } from '../core/reporting/retention';

/**
 * Evidence privacy: catalogue, publication gate and sanitized export.
 * All "sensitive" values are synthetic and assembled at runtime from fragments, so this file
 * itself contains nothing the gate would flag (and needs no allowlist entry).
 */
const S = {
  email: ['jane.roe', 'corp-mail.org'].join('@'),
  jwt: ['eyJ' + 'hbGciOiJIUzI1NiJ9', 'eyJ' + 'zdWIiOiJ0ZXN0In0', 'c2lnbmF0' + 'dXJlLXRlc3Q'].join('.'),
  bearer: ['Bear', 'er ', 'q'.repeat(24)].join(''),
  key: ['sb', 'publishable', 'TESTONLY' + 'z'.repeat(16)].join('_'),
  host: 'qwertyuiop' + 'asdfghjklz' + '.supa' + 'base.co',
  path: ['', 'Users', 'synthuser', 'project', 'file.ts'].join('/'),
  cookieHeader: `{"name":"coo${'kie'}","value":"sid=${'s'.repeat(14)}"}`,
  url: `https://api.example.invalid/x?${'tok'}${'en'}=${'v'.repeat(12)}`,
};
const VALUES = [S.email, S.jwt, 'q'.repeat(24), S.key, S.host, 'synthuser', 's'.repeat(14), 'v'.repeat(12)];

const NODE = ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON'];
const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
const REPO_GITIGNORE = readFileSync('.gitignore', 'utf8');

function write(root: string, rel: string, content: string | Buffer): void {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
}

/** A throw-away Git repo (init + add only; never this repository). */
function tempRepo(files: Record<string, string | Buffer>, gitignore = REPO_GITIGNORE): string {
  const root = mkdtempSync(join(tmpdir(), 'pqf-privacy-repo-'));
  expect(spawnSync('git', ['init', '-q'], { cwd: root, env: GIT_ENV }).status).toBe(0);
  write(root, '.gitignore', gitignore);
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  return root;
}

const git = (root: string, ...args: string[]) => expect(spawnSync('git', args, { cwd: root, env: GIT_ENV }).status).toBe(0);

function gate(root: string) {
  const r = spawnSync(process.execPath, [...NODE, resolve('scripts/privacy-check.ts'), '--root', root], { encoding: 'utf8', env: GIT_ENV });
  return { status: r.status, output: `${r.stdout}\n${r.stderr}` };
}

const expectNoValues = (output: string) => {
  for (const v of VALUES) expect(output.includes(v), 'a synthetic secret value appeared in the output').toBe(false);
};

const hashTree = (dir: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const name of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, name.name);
      if (name.isDirectory()) walk(p);
      else out[relative(dir, p)] = createHash('sha256').update(readFileSync(p)).digest('hex');
    }
  };
  walk(dir);
  return out;
};

const RUN_ID = '20261123T120000Z-abc123';

/** A synthetic raw run with every artefact type, holding synthetic sensitive values. */
function syntheticRun(): { runsRoot: string; runDir: string } {
  const runsRoot = mkdtempSync(join(tmpdir(), 'pqf-privacy-runs-'));
  const runDir = join(runsRoot, RUN_ID);
  const page = `https://${S.host}/rest/v1/items?${'api'}${'key'}=${'k'.repeat(20)}`;
  write(runDir, 'run.json', JSON.stringify({ runId: RUN_ID, status: 'failed', finishedAt: Date.now(), retention: { class: 'routine' }, counts: { failed: 1 }, dir: `${S.path}/evidence` }));
  write(runDir, 'bug-drafts/b1.md', `# Draft\nReporter: ${S.email}\nError: ${S.bearer}\nUser: qa.user@example.test\n`);
  write(runDir, 'bug-drafts/triage.json', JSON.stringify([{ test: 't', category: 'flaky', file: S.path }]));
  write(runDir, 'artifacts/t1/guard-report.json', JSON.stringify({ events: [{ url: page, headers: [JSON.parse(S.cookieHeader)] }], key: S.key }));
  write(runDir, 'artifacts/t1/evidence.json', JSON.stringify({ consoleErrors: [{ text: `jwt ${S.jwt}` }], url: S.url }));
  write(runDir, 'artifacts/t1/attachments/guard-report-json-0123.json', '{}');
  write(runDir, 'artifacts/t1/trace.zip', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0]));
  write(runDir, 'artifacts/t1/video.webm', Buffer.from([0x1a, 0x45, 0, 0]));
  write(runDir, 'artifacts/t1/test-failed-1.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0]));
  write(runDir, 'artifacts/t1/error-context.md', `snapshot ${S.email}`);
  write(runDir, 'html/index.html', `<p>${S.email}</p>`);
  write(runDir, 'results.json', JSON.stringify({ stdout: S.path }));
  return { runsRoot, runDir };
}

test.describe('privacy catalogue', () => {
  const CASES: [PrivacyRule, string][] = [
    ['email', `contact ${S.email}`],
    ['jwt', `token ${S.jwt}`],
    ['bearer-basic', `Authorization: ${S.bearer}`],
    ['supabase-key', `key ${S.key}`],
    ['auth-header', S.cookieHeader],
    ['url-credentials', `see ${S.url}`],
    ['local-user-path', `at ${S.path}`],
    ['supabase-project-host', `host ${S.host}`],
  ];

  for (const [rule, text] of CASES) {
    test(`1. detects ${rule}`, () => {
      expect(scanText(text).map((f) => f.rule)).toContain(rule);
    });
  }

  test('2. clean text passes', () => {
    expect(scanText('A plain line.\nhttps://example.com/docs?page=2\nconst x = 1;')).toEqual([]);
  });

  test('3. synthetic addresses and file names are not false positives', () => {
    const text = ['qa.runner@example.test', 'a@example.com', 'b@c.test', 'jane@mailhost.invalid', 'x@host.localhost', 'frame@0a1b2c-1795379147690.jpeg'].join('\n');
    expect(scanText(text)).toEqual([]);
  });

  test('8b. publication redaction leaves nothing the scanner flags', () => {
    const all = CASES.map(([, t]) => t).join('\n');
    const clean = redactForPublication(all);
    expect(scanText(clean)).toEqual([]);
    expect(clean).toContain('[REDACTED-EMAIL]');
    expect(clean).toContain('[REDACTED-KEY]');
    expect(clean).toContain('<home>');
    expect(clean).toContain('<supabase-project>.supabase.co');
  });

  test('10. evidence redaction (BugDraft, evidence.json, guard reports) is unchanged', () => {
    // Same inputs and expectations as the existing redaction tests, built from fragments.
    const url = `https://x.test/cb?access_${'token'}=abc&api${'key'}=k1&page=2#access_${'token'}=zzz`;
    expect(redactUrl(url)).toBe('https://x.test/cb?access_token=REDACTED&apikey=REDACTED&page=2#REDACTED');
    expect(redactText(`token ${S.jwt}`)).toBe('token [REDACTED-JWT]');
    expect(redactText(`Authorization: ${S.bearer}`)).toBe('Authorization: Bearer [REDACTED]');
    expect(redactText(`mail ${['jane.doe', 'mailhost.invalid'].join('@')} and qa.user@example.test`)).toBe('mail [REDACTED-EMAIL] and qa.user@example.test');
    // Publication redaction only adds masking on top: already-redacted text is stable.
    expect(redactForPublication('mail [REDACTED-EMAIL] Bearer [REDACTED] token [REDACTED-JWT]')).toBe('mail [REDACTED-EMAIL] Bearer [REDACTED] token [REDACTED-JWT]');
  });
});

test.describe('publication gate (privacy:check)', () => {
  test('2. a clean repository passes', () => {
    const root = tempRepo({ 'src/app.ts': 'export const x = 1;\n', 'README.md': '# Demo\nqa.user@example.test\n' });
    const r = gate(root);
    expect(r.status, r.output).toBe(0);
    expect(r.output).toContain('PASS');
  });

  test('1. sensitive content in a publishable file fails, without printing the value', () => {
    const root = tempRepo({ 'notes.md': Object.values(S).join('\n') });
    const r = gate(root);
    expect(r.status).toBe(1);
    for (const rule of ['email', 'jwt', 'bearer-basic', 'supabase-key', 'auth-header', 'url-credentials', 'local-user-path', 'supabase-project-host']) {
      expect(r.output).toContain(`rule=${rule}`);
    }
    expectNoValues(r.output);
  });

  test('4. binary and unknown formats are rejected', () => {
    const root = tempRepo({ 'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0]), 'data/blob.xyz': 'abc', 'src/odd.ts': Buffer.from([0x61, 0x00, 0x62]) });
    const r = gate(root);
    expect(r.status).toBe(1);
    expect(r.output).toMatch(/binary\s+assets\/logo\.png/);
    expect(r.output).toMatch(/unknown-format\s+data\/blob\.xyz/);
    expect(r.output).toMatch(/binary\s+src\/odd\.ts/);
  });

  test('5. raw evidence forced into Git fails, even when the file looks harmless', () => {
    const root = tempRepo({ [`evidence/runs/${RUN_ID}/run.json`]: '{}', 'playwright-report/data/x.md': 'ok' });
    git(root, 'add', '-f', `evidence/runs/${RUN_ID}/run.json`, 'playwright-report/data/x.md');
    const r = gate(root);
    expect(r.status).toBe(1);
    expect(r.output).toMatch(/denied-path\s+evidence\/runs\//);
    expect(r.output).toMatch(/denied-path\s+playwright-report\//);
  });

  test('6. a staged version with sensitive content is caught even when the working copy is clean', () => {
    const root = tempRepo({ 'docs/notes.md': `key ${S.key}\n` });
    git(root, 'add', 'docs/notes.md');
    writeFileSync(join(root, 'docs/notes.md'), 'clean now\n');
    const r = gate(root);
    expect(r.status).toBe(1);
    expect(r.output).toMatch(/sensitive\s+docs\/notes\.md:1 rule=supabase-key x1 \(index\)/);
    expectNoValues(r.output);
  });

  test('missing .gitignore protection fails', () => {
    const root = tempRepo({ 'src/a.ts': 'export {};\n' }, 'node_modules/\n');
    const r = gate(root);
    expect(r.status).toBe(1);
    expect(r.output).toMatch(/gitignore\s+evidence\/runs\/probe\/trace\.zip/);
  });

  test('only exactly approved fixture exceptions are accepted', () => {
    const fixture = { 'tests/redact.spec.ts': `const t = '${S.jwt}';\n` };
    const ok = tempRepo({ ...fixture, 'privacy-allowlist.json': JSON.stringify([{ path: 'tests/redact.spec.ts', rule: 'jwt', count: 1, reason: 'synthetic' }]) });
    expect(gate(ok).status).toBe(0);
    const changed = tempRepo({ ...fixture, 'privacy-allowlist.json': JSON.stringify([{ path: 'tests/redact.spec.ts', rule: 'jwt', count: 2, reason: 'synthetic' }]) });
    const r = gate(changed);
    expect(r.status).toBe(1);
    expect(r.output).toContain('allowlist-mismatch');
  });
});

test.describe('sanitized evidence export', () => {
  test('7–9, 12. only allow-listed metadata is exported, masked, and the raw run is untouched', () => {
    const { runsRoot, runDir } = syntheticRun();
    const outRoot = mkdtempSync(join(tmpdir(), 'pqf-privacy-out-'));
    const before = hashTree(runDir);

    const r = spawnSync(process.execPath, [...NODE, resolve('scripts/evidence-export.ts'), RUN_ID, '--runs', runsRoot, '--out', outRoot], { encoding: 'utf8' });
    expect(r.status, r.stderr).toBe(0);
    expectNoValues(`${r.stdout}\n${r.stderr}`);

    const exported = Object.keys(hashTree(join(outRoot, RUN_ID))).sort();
    expect(exported).toEqual(['EXPORT.json', 'artifacts/t1/evidence.json', 'artifacts/t1/guard-report.json', 'bug-drafts/b1.md', 'bug-drafts/triage.json', 'run.json']);
    for (const rel of exported) {
      const content = readFileSync(join(outRoot, RUN_ID, rel), 'utf8');
      expect(scanText(content), `${rel} scans clean`).toEqual([]);
      for (const v of VALUES) expect(content.includes(v), `${rel} holds no synthetic secret`).toBe(false);
    }
    expect(readFileSync(join(outRoot, RUN_ID, 'bug-drafts/b1.md'), 'utf8')).toContain('qa.user@example.test');
    expect(hashTree(runDir), 'raw run unchanged').toEqual(before);
    expect(readdirSync(outRoot).filter((n) => n.startsWith('.staging-')), 'no staging left').toEqual([]);
  });

  test('an existing export is never overwritten', () => {
    const { runsRoot } = syntheticRun();
    const outRoot = mkdtempSync(join(tmpdir(), 'pqf-privacy-out-'));
    exportRun({ runId: RUN_ID, runsRoot, outRoot });
    const first = hashTree(join(outRoot, RUN_ID));
    expect(() => exportRun({ runId: RUN_ID, runsRoot, outRoot })).toThrow(ExportRefusedError);
    expect(hashTree(join(outRoot, RUN_ID))).toEqual(first);
  });

  test('a non-text file in an allow-listed slot refuses the whole export and leaves nothing behind', () => {
    const { runsRoot, runDir } = syntheticRun();
    writeFileSync(join(runDir, 'artifacts/t1/evidence.json'), Buffer.from([0x7b, 0x00, 0x7d]));
    const outRoot = mkdtempSync(join(tmpdir(), 'pqf-privacy-out-'));
    expect(() => exportRun({ runId: RUN_ID, runsRoot, outRoot })).toThrow(ExportRefusedError);
    expect(existsSync(join(outRoot, RUN_ID))).toBe(false);
    expect(readdirSync(outRoot)).toEqual([]);
  });

  test('11. retention and evidence verification see the same runs before and after an export', () => {
    const { runsRoot } = syntheticRun();
    const outRoot = mkdtempSync(join(tmpdir(), 'pqf-privacy-out-'));
    const plan = () => decide(scanRuns(runsRoot), { keepRoutinePassingRuns: 10, keepRoutinePassingDays: 14 }, '', Date.now());
    const beforePlan = plan();
    const beforeVerify = verifyRuns(runsRoot);
    exportRun({ runId: RUN_ID, runsRoot, outRoot });
    expect(plan()).toEqual(beforePlan);
    expect(verifyRuns(runsRoot)).toEqual(beforeVerify);
  });

  test('binary detection', () => {
    expect(isBinary(Buffer.from('text'))).toBe(false);
    expect(isBinary(Buffer.from([0x61, 0x00]))).toBe(true);
  });
});
