import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classify, expectedActual, fingerprint, normalise } from '../core/reporting/classifier';
import { validateBugTraceability, validateTraceability } from '../core/reporting/tc-validator';
import type { BugDraft } from '../core/reporting/bug-draft';
import { redactText, redactUrl } from '../core/reporting/redact';
import { newRunId } from '../core/reporting/run-context';

interface Manifest {
  runId: string;
  status: string;
  counts: Record<string, number>;
  failures: { test: string; attempts: { attachments: { name: string; path: string }[] }[] }[];
}

test.describe('classifier', () => {
  const failed = (message: string) => ({ status: 'failed', errors: [{ message }] });

  test('assertion value mismatch, consistent across attempts → product-defect-candidate', () => {
    const msg = 'Error: expect(locator).toHaveText(expected) failed\nExpected: "$19.99"\nReceived: "$19.990000000000002"';
    expect(classify({ outcome: 'unexpected', attempts: [failed(msg), failed(msg)] })).toMatchObject({ category: 'product-defect-candidate', consistent: true });
  });

  test('assertion mismatch that differs between attempts is not a bug candidate', () => {
    const a = failed('Expected: "A"\nReceived: "B"');
    const b = failed('Expected: "A"\nReceived: "C"');
    expect(classify({ outcome: 'unexpected', attempts: [a, b] }).category).toBe('unclassified');
  });

  test('passing on retry → flaky, never a bug', () => {
    expect(classify({ outcome: 'flaky', attempts: [failed('Expected: 1\nReceived: 2'), { status: 'passed', errors: [] }] }).category).toBe('flaky');
  });

  const table: [string, string][] = [
    ['[guard] Blocked 1 unexpected write attempt(s)', 'guard-violation'],
    ['[env] TEST_ENV="prod" is not valid', 'test-infrastructure'],
    ['[traceability] "x" has no TC-ID', 'test-infrastructure'],
    ['page.goto: net::ERR_CONNECTION_REFUSED at http://x', 'environment'],
    ['TimeoutError: page.goto: Timeout 20000ms exceeded.\nCall log:\n  - navigating to "https://x.test/", waiting until "load"', 'navigation-timeout'],
    ['getaddrinfo ENOTFOUND example.invalid', 'environment'],
    ["Locator: getByRole('button')\nExpected: visible\nError: element(s) not found", 'test-maintenance'],
    ['strict mode violation: getByText resolved to 2 elements', 'test-maintenance'],
    ['Something odd happened', 'unclassified'],
  ];
  for (const [message, category] of table) {
    test(`"${message.split('\n')[0]}" → ${category}`, () => {
      expect(classify({ outcome: 'unexpected', attempts: [failed(message)] }).category).toBe(category);
    });
  }

  test('guard-blocked requests are not mistaken for an environment outage', () => {
    expect(classify({ outcome: 'unexpected', attempts: [failed('net::ERR_BLOCKED_BY_CLIENT\nExpected: 1\nReceived: 2')] }).category).toBe('product-defect-candidate');
  });

  test('normalise and fingerprint ignore volatile values', () => {
    expect(normalise('Timeout 7000ms id=1f0e2d3c-aaaa-bbbb-cccc-111122223333')).toBe('Timeout <ms> id=<uuid>');
    const a = fingerprint({ file: 'a.spec.ts', title: 't', message: 'Expected: 3\nReceived: 2 after 120ms' });
    const b = fingerprint({ file: 'a.spec.ts', title: 't', message: 'Expected: 3\nReceived: 2 after 950ms' });
    expect(a).toBe(b);
    expect(a).toHaveLength(12);
  });

  test('expectedActual reads Playwright assertion output', () => {
    expect(expectedActual('Expected string: "a"\nReceived string: "b"')).toEqual({ expected: '"a"', actual: '"b"' });
    expect(expectedActual('no values here')).toEqual({});
  });
});

test.describe('TC validator', () => {
  test('a consistent set passes, manual cases need no test', () => {
    const report = validateTraceability({ testCaseDirs: ['framework-tests/fixtures/tc-valid/cases'], specDirs: ['framework-tests/fixtures/tc-valid/tests'] });
    expect(report.errors).toEqual([]);
    expect(report.testCases.map((t) => t.id)).toEqual(['TC-DEMO-001', 'TC-DEMO-002']);
    expect(report.testCases[1]?.manual).toBe(true);
    expect(report.testCases[0]?.expectedResult).toEqual(['It worked.']);
  });

  test('every rule violation is reported', () => {
    const { errors } = validateTraceability({ testCaseDirs: ['framework-tests/fixtures/tc-invalid/cases'], specDirs: ['framework-tests/fixtures/tc-invalid/tests'] });
    const text = errors.join('\n');
    expect(text).toContain('TC-BAD-001: missing Priority:');
    expect(text).toContain('TC-BAD-001: missing Acceptance criteria');
    expect(text).toContain('TC-BAD-001: missing Expected result');
    expect(text).toMatch(/TC-BAD-002: duplicate/);
    expect(text).toContain('TC-BAD-002: Expected result is empty');
    expect(text).toContain('TC-bad-3: invalid TC-ID format');
    expect(text).toContain('references TC-GHOST-009, which has no test case document');
    expect(text).toMatch(/TC-BAD-002: not automated/);
  });

  test('the QA Practice suite is fully traceable', () => {
    const report = validateTraceability({ testCaseDirs: ['apps/qa-practice/test-cases'], specDirs: ['apps/qa-practice/tests'] });
    expect(report.errors).toEqual([]);
    expect(report.testCases.length).toBeGreaterThan(0);
  });
});

test.describe('bug-draft reporter (sub-process run)', () => {
  test('classifies sample failures and drafts only the product-defect candidate', () => {
    test.slow();
    const out = mkdtempSync(join(tmpdir(), 'pqf-reporter-'));
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(TEST_|PW_|PLAYWRIGHT_|PQF_)/.test(k) || k === 'PLAYWRIGHT_BROWSERS_PATH'));
    const runSample = () =>
      spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'framework-tests/fixtures/reporter-project/playwright.config.ts'], {
        env: { ...env, PQF_EVIDENCE_DIR: join(out, 'runs'), CI: '' },
        encoding: 'utf8',
        timeout: 90_000,
      });
    const first = runSample();
    expect(first.status, first.stderr).toBe(1); // the sample project fails on purpose
    const run = runSample();
    expect(run.status, run.stderr).toBe(1); // the sample project fails on purpose

    // Two runs → two run folders; the first run's evidence is still there.
    const runIds = readdirSync(join(out, 'runs')).sort();
    expect(runIds).toHaveLength(2);
    const [firstId, secondId] = runIds as [string, string];
    expect(readFileSync(join(out, 'latest'), 'utf8').trim()).toBe(join(out, 'runs', secondId));
    const firstManifest = JSON.parse(readFileSync(join(out, 'runs', firstId, 'run.json'), 'utf8')) as Manifest;
    for (const f of firstManifest.failures) for (const a of f.attempts.flatMap((x) => x.attachments)) expect(existsSync(a.path), a.path).toBe(true);

    const drafts = join(out, 'runs', secondId, 'bug-drafts');
    const manifest = JSON.parse(readFileSync(join(out, 'runs', secondId, 'run.json'), 'utf8')) as Manifest;
    expect(manifest).toMatchObject({ runId: secondId, status: 'failed', counts: { passed: 1, failed: 4, flaky: 1 } });

    // Guard failure: evidence is captured and secrets in URLs are redacted.
    const guardFailure = manifest.failures.find((f) => f.test.endsWith('guard blocks a write'));
    const names = guardFailure?.attempts[0]?.attachments.map((a) => a.name) ?? [];
    expect(names).toEqual(expect.arrayContaining(['evidence.json', 'guard-report.json', 'guard-failure-1.png', 'trace']));
    const evidencePath = guardFailure?.attempts[0]?.attachments.find((a) => a.name === 'evidence.json')?.path ?? '';
    const evidenceText = readFileSync(evidencePath, 'utf8');
    expect(evidenceText).toContain('token=REDACTED');
    expect(evidenceText).not.toContain('SECRET123');

    const triage = JSON.parse(readFileSync(join(drafts, 'triage.json'), 'utf8')) as { test: string; category: string; draft?: string }[];
    const byTitle: Record<string, { category: string } | undefined> = Object.fromEntries(triage.map((t) => [t.test.split(' › ').at(-1) ?? '', t]));
    expect(byTitle['assertion mismatch']?.category).toBe('product-defect-candidate');
    expect(byTitle['missing element']?.category).toBe('test-maintenance');
    expect(byTitle['environment down']?.category).toBe('environment');
    expect(byTitle['flaky once']?.category).toBe('flaky');
    expect(byTitle['guard blocks a write']?.category).toBe('guard-violation');
    expect(byTitle['passes']).toBeUndefined();

    const draftFiles = readdirSync(drafts).filter((f) => f.endsWith('.json') && f !== 'triage.json');
    expect(draftFiles).toHaveLength(1);
    const draft = JSON.parse(readFileSync(join(drafts, draftFiles[0] as string), 'utf8')) as BugDraft;
    expect(draft).toMatchObject({
      runId: secondId,
      status: 'draft',
      priority: 'needs-triage',
      testCaseIds: ['TC-RPT-001'],
      severity: { suggested: 'major' },
      expectedResult: { fromTestCase: ['The total reads $19.99.'], fromAssertion: '"$19.99"' },
      actualResult: { fromAssertion: '"$19.990000000000002"' },
      reproductionSteps: ['[setup] Set content', "Click getByRole('button', { name: 'Add' })", 'Read the cart total  ← failed here'],
      attempts: 2,
    });
    expect(draft.classification.consistent).toBe(true);
    expect(draft.environment.browser).toBe('chromium');
    expect(draft.evidence.map((e) => e.name)).toEqual(expect.arrayContaining(['screenshot', 'trace']));
    for (const e of draft.evidence.filter((x) => x.path)) expect(existsSync(e.path as string), e.path).toBe(true);
    expect(draft.evidence.every((e) => !e.path || e.path.includes(secondId))).toBe(true);
    expect(readFileSync(join(drafts, draftFiles[0]!.replace('.json', '.md')), 'utf8')).toContain('**Not filed.**');
  });
});

test.describe('Bug-ID traceability', () => {
  const sections = ['## Description', '## Preconditions', '## Steps to reproduce', '## Expected result', '## Actual result', '## Environment', '## Automation'].join('\n\n');
  function fixture(files: Record<string, string>) {
    const dir = mkdtempSync(join(tmpdir(), 'pqf-bugtrace-'));
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(dir, path, '..'), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    return dir;
  }

  test('a consistent set passes', () => {
    const dir = fixture({ 'specs/a.spec.ts': "test('x', { annotation: [tc('TC-DEMO-001'), bug('BUG-X-01')] }, f);", 'bugs/BUG-X-01.md': `TC-DEMO-001\n${sections}` });
    const r = validateBugTraceability({ bugReportDir: join(dir, 'bugs'), specDirs: [join(dir, 'specs')], testCaseIds: new Set(['TC-DEMO-001']), root: dir });
    expect(r.errors).toEqual([]);
    expect([...r.references.keys()]).toEqual(['BUG-X-01']);
  });

  test('every rule violation is reported', () => {
    const dir = fixture({
      'specs/a.spec.ts': "test('x', { annotation: [bug('BUG-X-01'), bug('BUG-NOREPORT'), bug('#42')] }, f);",
      'bugs/BUG-X-01.md': 'TC-GHOST-001\n## Description',
      'bugs/BUG-ORPHAN.md': `TC-DEMO-001\n${sections}`,
    });
    const text = validateBugTraceability({ bugReportDir: join(dir, 'bugs'), specDirs: [join(dir, 'specs')], testCaseIds: new Set(['TC-DEMO-001']), root: dir }).errors.join('\n');
    expect(text).toContain('BUG-X-01.md: missing "## Steps to reproduce"');
    expect(text).toContain('references TC-GHOST-001, which has no test case document');
    expect(text).toContain('BUG-ORPHAN is not referenced by any test');
    expect(text).toContain("bug('BUG-NOREPORT') has no report");
    expect(text).not.toContain('#42');
  });
});

test.describe('run IDs', () => {
  test('run IDs are unique and sortable', () => {
    const a = newRunId(new Date('2026-11-22T10:00:00Z'));
    const b = newRunId(new Date('2026-11-22T10:00:01Z'));
    expect(a).toMatch(/^20261122T100000Z-[0-9a-f]{6}$/);
    expect([b, a].sort()).toEqual([a, b]);
    expect(newRunId()).not.toBe(newRunId());
  });
});

test.describe('redaction', () => {
  test('sensitive query parameters, credentials and fragments are redacted', () => {
    expect(redactUrl('https://x.test/cb?access_token=abc&apikey=k1&page=2#access_token=zzz')).toBe('https://x.test/cb?access_token=REDACTED&apikey=REDACTED&page=2#REDACTED');
    expect(redactUrl('https://user:pw@x.test/')).toBe('https://x.test/');
  });

  test('JWTs, bearer tokens and real e-mail addresses are redacted; synthetic ones stay', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(redactText(`token ${jwt}`)).toBe('token [REDACTED-JWT]');
    expect(redactText('Authorization: Bearer abcdefghijklmnop')).toBe('Authorization: Bearer [REDACTED]');
    expect(redactText('mail jane.doe@mailhost.invalid and qa.user@example.test')).toBe('mail [REDACTED-EMAIL] and qa.user@example.test');
  });
});
