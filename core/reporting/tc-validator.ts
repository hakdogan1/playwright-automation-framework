/**
 * TC-ID traceability validator.
 *
 * Self-contained on purpose (node: imports only) so it runs directly with
 * `node scripts/tc-validate.ts` as well as inside Playwright.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Deliberately loose so malformed IDs are parsed and then reported, not silently skipped. */
export const TC_HEADING = /^##\s+(TC-[A-Za-z0-9]+-[0-9A-Za-z]+)\s+[—-]\s+(.+)$/;
export const TC_ID = /^TC-[A-Z]{2,8}-\d{3}$/;
const TC_REFERENCE = /\btc\(\s*['"`](TC-[A-Za-z0-9-]+)['"`]\s*\)/g;
const REQUIRED_SECTIONS = ['**Acceptance criteria**', '**Steps**', '**Expected result**'];
const REQUIRED_FIELDS = ['**Type:**', '**Priority:**'];

export interface TestCaseDoc {
  id: string;
  title: string;
  file: string;
  line: number;
  manual: boolean;
  expectedResult: string[];
  body: string;
}

export interface TraceabilityReport {
  testCases: TestCaseDoc[];
  /** TC-ID → spec files referencing it. */
  references: Map<string, string[]>;
  errors: string[];
  warnings: string[];
}

function walk(dir: string, accept: (file: string) => boolean): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of entries.sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, accept));
    else if (accept(full)) out.push(full);
  }
  return out;
}

function section(lines: string[], heading: string): string[] {
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return [];
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('**') || line.startsWith('## ')) break;
    if (line.trim()) out.push(line.trim().replace(/^[-*]\s+|^\d+\.\s+/, ''));
  }
  return out;
}

export function parseTestCaseFile(file: string, root = process.cwd()): TestCaseDoc[] {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const docs: TestCaseDoc[] = [];
  let current: { id: string; title: string; line: number; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const body = current.lines.join('\n');
    docs.push({
      id: current.id,
      title: current.title.trim(),
      file: relative(root, file),
      line: current.line,
      manual: /\*\*Automation:\*\*\s*Manual/i.test(body),
      expectedResult: section(current.lines, '**Expected result**'),
      body,
    });
  };
  lines.forEach((line, index) => {
    const match = TC_HEADING.exec(line);
    if (match) {
      flush();
      current = { id: match[1] ?? '', title: match[2] ?? '', line: index + 1, lines: [] };
    } else if (current) {
      (current as { lines: string[] }).lines.push(line);
    }
  });
  flush();
  return docs;
}

export function loadTestCases(dirs: readonly string[], root = process.cwd()): TestCaseDoc[] {
  return dirs.flatMap((dir) => walk(dir, (f) => f.endsWith('.md')).flatMap((f) => parseTestCaseFile(f, root)));
}

export function validateTraceability(options: {
  testCaseDirs: readonly string[];
  specDirs: readonly string[];
  root?: string;
}): TraceabilityReport {
  const root = options.root ?? process.cwd();
  const errors: string[] = [];
  const warnings: string[] = [];
  const testCases = loadTestCases(options.testCaseDirs, root);

  const seen = new Map<string, TestCaseDoc>();
  for (const doc of testCases) {
    const where = `${doc.file}:${doc.line}`;
    if (!TC_ID.test(doc.id)) errors.push(`${where} ${doc.id}: invalid TC-ID format (expected TC-<AREA>-<NNN>).`);
    const dup = seen.get(doc.id);
    if (dup) errors.push(`${where} ${doc.id}: duplicate, first defined at ${dup.file}:${dup.line}.`);
    else seen.set(doc.id, doc);
    for (const required of [...REQUIRED_FIELDS, ...REQUIRED_SECTIONS]) {
      if (!doc.body.includes(required)) errors.push(`${where} ${doc.id}: missing ${required.replace(/\*/g, '')}.`);
    }
    if (doc.body.includes('**Expected result**') && doc.expectedResult.length === 0) {
      errors.push(`${where} ${doc.id}: Expected result is empty.`);
    }
  }

  const references = new Map<string, string[]>();
  const specs = options.specDirs.flatMap((dir) => walk(dir, (f) => f.endsWith('.spec.ts')));
  for (const spec of specs) {
    const text = readFileSync(spec, 'utf8');
    for (const match of text.matchAll(TC_REFERENCE)) {
      const id = match[1] ?? '';
      const file = relative(root, spec);
      const list = references.get(id) ?? [];
      if (!list.includes(file)) list.push(file);
      references.set(id, list);
    }
  }

  for (const [id, files] of references) {
    if (!seen.has(id)) errors.push(`${files.join(', ')}: references ${id}, which has no test case document.`);
  }
  for (const doc of seen.values()) {
    if (!references.has(doc.id) && !doc.manual) {
      errors.push(`${doc.file}:${doc.line} ${doc.id}: not automated. Add a test with tc('${doc.id}') or mark "**Automation:** Manual".`);
    }
  }
  if (testCases.length === 0) warnings.push('No test case documents found.');

  return { testCases, references, errors, warnings };
}

// ---------- Bug-ID traceability ----------

const BUG_REFERENCE = /\bbug\(\s*['"`]([A-Za-z0-9#][\w-]*)['"`]\s*\)/g;
const BUG_REPORT_SECTIONS = ['## Description', '## Preconditions', '## Steps to reproduce', '## Expected result', '## Actual result', '## Environment', '## Automation'];

export interface BugTraceabilityReport {
  /** Bug-ID → spec files referencing it (via bug('…')). */
  references: Map<string, string[]>;
  reports: { id: string; file: string; testCaseIds: string[] }[];
  errors: string[];
}

/**
 * Every bug('BUG-…') used in a spec must have <bugReportDir>/<id>.md with the
 * required sections and at least one existing TC-ID; every report must be
 * referenced by at least one test. Only IDs starting with "BUG-" are checked
 * (tracker references like #123 or JIRA-12 live in the tracker).
 */
export function validateBugTraceability(options: { bugReportDir: string; specDirs: readonly string[]; testCaseIds: ReadonlySet<string>; root?: string }): BugTraceabilityReport {
  const root = options.root ?? process.cwd();
  const errors: string[] = [];
  const references = new Map<string, string[]>();
  for (const spec of options.specDirs.flatMap((dir) => walk(dir, (f) => f.endsWith('.spec.ts') || f.endsWith('.ts')))) {
    const text = readFileSync(spec, 'utf8');
    for (const match of text.matchAll(BUG_REFERENCE)) {
      const id = match[1] ?? '';
      if (!id.startsWith('BUG-')) continue;
      const list = references.get(id) ?? [];
      const file = relative(root, spec);
      if (!list.includes(file)) list.push(file);
      references.set(id, list);
    }
  }
  const reports = walk(options.bugReportDir, (f) => /BUG-[\w-]+\.md$/.test(f)).map((file) => {
    const text = readFileSync(file, 'utf8');
    const id = /(BUG-[\w-]+)\.md$/.exec(file)?.[1] ?? '';
    const testCaseIds = [...new Set([...text.matchAll(/\bTC-[A-Z]{2,8}-\d{3}\b/g)].map((m) => m[0]))];
    const rel = relative(root, file);
    for (const section of BUG_REPORT_SECTIONS) if (!text.includes(section)) errors.push(`${rel}: missing "${section}".`);
    if (testCaseIds.length === 0) errors.push(`${rel}: no TC-ID referenced.`);
    for (const tcId of testCaseIds) if (!options.testCaseIds.has(tcId)) errors.push(`${rel}: references ${tcId}, which has no test case document.`);
    if (!references.has(id)) errors.push(`${rel}: ${id} is not referenced by any test (bug('${id}')).`);
    return { id, file: rel, testCaseIds };
  });
  const reported = new Set(reports.map((r) => r.id));
  for (const [id, files] of references) if (!reported.has(id)) errors.push(`${files.join(', ')}: bug('${id}') has no report ${options.bugReportDir}/${id}.md.`);
  return { references, reports, errors };
}
