import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { arch, platform, release } from 'node:os';
import { join, relative } from 'node:path';
import type { FullConfig, Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import { classify, expectedActual, fingerprint, stripAnsi, type Classification } from './classifier';
import { suggestSeverity, toMarkdown, type BugDraft } from './bug-draft';
import { loadTestCases, type TestCaseDoc } from './tc-validator';
import type { EvidenceLog } from '../fixtures/evidence';
import { redactText, redactUrl } from './redact';
import { ensureRun } from './run-context';

interface Options {
  outputDir?: string;
  testCaseDirs?: string[];
  /** Path appended to baseURL to read the deployed build revision. */
  buildInfoPath?: string;
}

interface TriageEntry {
  test: string;
  file: string;
  project: string;
  testCaseIds: string[];
  category: Classification['category'];
  reason: string;
  draft?: string;
}

/**
 * Writes reports/bug-drafts/:
 *   triage.json / triage.md   every non-passing test with its classification
 *   <fingerprint>.json / .md  a BugDraft for each product-defect candidate
 * It never contacts an issue tracker.
 */
export default class BugDraftReporter implements Reporter {
  private readonly outputDir: string;
  private readonly testCaseDirs: string[];
  private readonly buildInfoPath: string;
  private config!: FullConfig;
  private readonly results = new Map<TestCase, TestResult[]>();

  constructor(options: Options = {}) {
    this.outputDir = options.outputDir ?? join(ensureRun().dir, 'bug-drafts');
    this.testCaseDirs = options.testCaseDirs ?? [];
    this.buildInfoPath = options.buildInfoPath ?? '/release-info.json';
  }

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig, _suite: Suite): void {
    this.config = config;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const list = this.results.get(test) ?? [];
    list.push(result);
    this.results.set(test, list);
  }

  async onEnd(): Promise<void> {
    // Each run has its own folder (see run-context.ts); earlier runs are never touched here.
    mkdirSync(this.outputDir, { recursive: true });

    const docs = new Map<string, TestCaseDoc>(loadTestCases(this.testCaseDirs).map((d) => [d.id, d]));
    const buildCache = new Map<string, Promise<string>>();
    const commit = frameworkCommit();
    const triage: TriageEntry[] = [];

    for (const [test, results] of this.results) {
      const outcome = test.outcome();
      if (outcome !== 'unexpected' && outcome !== 'flaky') continue;

      const attempts = results.map((r) => ({
        status: r.status,
        errors: r.errors.map((e) => ({ message: stripAnsi(e.message ?? e.value ?? ''), ...(e.location ? { file: e.location.file } : {}) })),
      }));
      const classification = classify({ outcome, attempts });
      const project = test.parent.project();
      const testCaseIds = test.annotations.filter((a) => a.type === 'tc' && a.description).map((a) => a.description as string);
      const file = relative(process.cwd(), test.location.file);
      const entry: TriageEntry = { test: test.titlePath().slice(1).join(' › '), file, project: project?.name ?? '', testCaseIds, category: classification.category, reason: classification.reason };

      if (classification.category === 'product-defect-candidate') {
        const last = results.at(-1) as TestResult;
        const baseURL = project?.use.baseURL;
        if (baseURL && !buildCache.has(baseURL)) buildCache.set(baseURL, buildRevision(baseURL, this.buildInfoPath));
        const draft = this.draft(test, last, results.length, classification, testCaseIds, docs, {
          buildRevision: baseURL ? await (buildCache.get(baseURL) as Promise<string>) : 'unknown',
          commit,
        });
        writeFileSync(join(this.outputDir, `${draft.fingerprint}.json`), `${JSON.stringify(draft, null, 2)}\n`);
        writeFileSync(join(this.outputDir, `${draft.fingerprint}.md`), toMarkdown(draft));
        entry.draft = `${draft.fingerprint}.md`;
      }
      triage.push(entry);
    }

    writeFileSync(join(this.outputDir, 'triage.json'), `${JSON.stringify(triage, null, 2)}\n`);
    writeFileSync(join(this.outputDir, 'triage.md'), triageMarkdown(triage));
  }

  private draft(
    test: TestCase,
    result: TestResult,
    attempts: number,
    classification: Classification,
    testCaseIds: string[],
    docs: Map<string, TestCaseDoc>,
    build: { buildRevision: string; commit: string },
  ): BugDraft {
    const project = test.parent.project();
    const use = (project?.use ?? {}) as Record<string, unknown>;
    const errorText = result.errors.map((e) => stripAnsi(e.message ?? '')).join('\n\n').trim();
    const { expected, actual } = expectedActual(errorText);
    const evidenceLog = readEvidence(result);
    const viewport = use.viewport as { width: number; height: number } | null | undefined;
    const file = relative(process.cwd(), test.location.file);
    const ci = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;
    const firstDoc = testCaseIds.map((id) => docs.get(id)).find((d) => d !== undefined);

    return {
      schemaVersion: 1,
      runId: ensureRun().runId,
      status: 'draft',
      fingerprint: fingerprint({ file, title: test.title, message: errorText }),
      title: firstDoc ? `${firstDoc.id}: ${firstDoc.title} — ${test.title}` : test.title,
      testCaseIds,
      linkedBugs: test.annotations.filter((a) => a.type === 'bug' && a.description).map((a) => a.description as string),
      classification,
      severity: suggestSeverity(test.tags),
      priority: 'needs-triage',
      test: { title: test.title, file, line: test.location.line, project: project?.name ?? '', tags: test.tags },
      reproductionSteps: reproductionSteps(result.steps),
      expectedResult: { fromTestCase: firstDoc?.expectedResult ?? [], ...(expected ? { fromAssertion: expected } : {}) },
      actualResult: { ...(actual ? { fromAssertion: redactText(actual) } : {}), error: redactText(errorText.slice(0, 4000)) },
      environment: {
        testEnv: typeof use.testEnv === 'string' ? use.testEnv : 'unknown',
        ...(typeof use.baseURL === 'string' ? { baseURL: use.baseURL } : {}),
        browser: [use.browserName, use.defaultBrowserType].find((v): v is string => typeof v === 'string') ?? 'chromium',
        ...(viewport ? { viewport: `${viewport.width}x${viewport.height}` } : {}),
        os: `${platform()} ${release()} ${arch()}`,
        playwright: this.config.version,
        buildRevision: build.buildRevision,
        frameworkCommit: build.commit,
        ...(ci ? { ciRunUrl: ci } : {}),
      },
      evidence: result.attachments.map((a) => ({
        name: a.name,
        ...(a.path ? { path: relative(process.cwd(), a.path) } : {}),
        contentType: a.contentType,
      })),
      consoleErrors: [...evidenceLog.consoleErrors.map((c) => redactText(c.text)), ...evidenceLog.pageErrors.map((p) => `Uncaught: ${redactText(p.message)}`)].slice(0, 20),
      networkFailures: [
        ...evidenceLog.failedRequests.map((r) => `${r.method} ${redactUrl(r.url)} — ${r.error}${r.blockedByGuard ? ' (blocked by guard)' : ''}`),
        ...evidenceLog.httpErrors.map((r) => `${r.method} ${redactUrl(r.url)} — HTTP ${r.status}`),
      ].slice(0, 20),
      attempts,
      createdAt: new Date().toISOString(),
    };
  }
}

const FAILED = '  ← failed here';

/** "Click getByRole('button', { name: 'Add' })" — Playwright ≥1.63 reports the target as a subtitle. */
function label(step: TestStep): string {
  const subtitle = (step as TestStep & { subtitle?: string }).subtitle;
  return subtitle && !step.title.includes(subtitle) ? `${step.title} ${subtitle}` : step.title;
}

function hasError(step: TestStep): boolean {
  return !!step.error || step.steps.some(hasError);
}

/**
 * Reproduction steps in execution order:
 * - setup (beforeEach / beforeAll hooks) prefixed with "[setup]",
 * - `test.step` titles as written by the author (their internals are not expanded),
 * - Playwright actions outside any `test.step`,
 * - the failing assertion.
 * Fixture internals, passing assertions and teardown are left out unless they failed.
 */
export function reproductionSteps(steps: readonly TestStep[]): string[] {
  const out: string[] = [];
  const visit = (list: readonly TestStep[], phase: 'setup' | 'test' | 'teardown') => {
    for (const step of list) {
      const prefix = phase === 'setup' ? '[setup] ' : phase === 'teardown' ? '[teardown] ' : '';
      const mark = step.error ? FAILED : '';
      switch (step.category) {
        case 'hook': {
          const next = /after/i.test(step.title) ? 'teardown' : 'setup';
          if (next === 'teardown' && !hasError(step)) break;
          visit(step.steps, next);
          break;
        }
        case 'fixture':
          if (hasError(step)) visit(step.steps, phase);
          break;
        case 'test.step':
          out.push(`${prefix}${step.title}${mark || (hasError(step) ? FAILED : '')}`);
          break;
        case 'pw:api':
          out.push(`${prefix}${label(step)}${mark}`);
          break;
        case 'expect':
          if (hasError(step)) out.push(`${prefix}${label(step)}${FAILED}`);
          break;
        case 'test.attach':
          break;
        default:
          visit(step.steps, phase);
      }
    }
  };
  visit(steps, 'test');
  return out.slice(0, 40);
}

function readEvidence(result: TestResult): EvidenceLog {
  const empty: EvidenceLog = { consoleErrors: [], pageErrors: [], failedRequests: [], httpErrors: [], pendingRequests: [] };
  const attachment = result.attachments.find((a) => a.name === 'evidence.json');
  if (!attachment) return empty;
  try {
    const text = attachment.body ? attachment.body.toString('utf8') : attachment.path ? readFileSync(attachment.path, 'utf8') : '';
    return { ...empty, ...(JSON.parse(text) as Partial<EvidenceLog>) };
  } catch {
    return empty;
  }
}

async function buildRevision(baseURL: string, path: string): Promise<string> {
  try {
    const res = await fetch(new URL(path, baseURL), { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return `unknown (HTTP ${res.status})`;
    const info = (await res.json()) as { revision?: string; timestamp?: string };
    return info.revision ? `${info.revision}${info.timestamp ? ` (${info.timestamp})` : ''}` : 'unknown';
  } catch {
    return 'unknown (unreachable)';
  }
}

function frameworkCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'uncommitted';
  }
}

function triageMarkdown(entries: TriageEntry[]): string {
  if (entries.length === 0) return '# Failure triage\n\nNo failed or flaky tests in this run.\n';
  const rows = entries
    .map((e) => `| ${e.testCaseIds.join(', ') || '—'} | ${e.test} | ${e.project} | \`${e.category}\` | ${e.draft ? `[draft](${e.draft})` : '—'} |`)
    .join('\n');
  return `# Failure triage

Only \`product-defect-candidate\` rows get a bug draft. Every row needs a human decision.

| TC-ID | Test | Project | Classification | Bug draft |
|---|---|---|---|---|
${rows}
`;
}
