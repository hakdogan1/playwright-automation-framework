/**
 * ai-guard: deterministic protection of test oracles.
 *
 * Works on file CONTENT (base version vs working tree), not on diff lines, and
 * parses TypeScript with the compiler API, so multi-line assertions and moved
 * code are compared structurally. Applies to every change, whoever wrote it.
 *
 * Imports only node: modules and `typescript`, so it runs with plain `node`.
 * Limits (false positives / negatives) are documented in docs/ai-workflow.md.
 */
import ts from 'typescript';

export type ChangeStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export interface ChangedFile {
  path: string;
  oldPath?: string;
  status: ChangeStatus;
  /** Content in the base revision (null when the file did not exist). */
  before: string | null;
  /** Content in the working tree (null when deleted). */
  after: string | null;
}

export type Rule =
  | 'assertion-changed'
  | 'test-removed'
  | 'skip-or-fail-added'
  | 'early-exit-added'
  | 'guarded-tag-changed'
  | 'traceability-changed'
  | 'test-data-changed'
  | 'runner-config-changed'
  | 'baseline-changed'
  | 'expected-result-changed'
  | 'protected-file-removed'
  | 'protected-file-renamed'
  | 'privacy-exception-changed'
  | 'guard-code-changed';

export interface Finding {
  file: string;
  rule: Rule;
  detail: string;
}

export type FileKind = 'spec' | 'test-data' | 'runner-config' | 'baseline' | 'test-case-doc' | 'privacy-allowlist' | 'guard-code' | 'other';

export function classifyPath(path: string): FileKind {
  if (/-snapshots\//.test(path)) return 'baseline';
  if (/\.spec\.ts$/.test(path)) return 'spec';
  if (/(^|\/)test-cases\/.+\.md$/.test(path)) return 'test-case-doc';
  if (/(^|\/)apps\/[^/]+\/data\/.+\.ts$/.test(path)) return 'test-data';
  if (/(^|\/)playwright(\.[\w-]+)?\.config\.ts$/.test(path)) return 'runner-config';
  if (/(^|\/)privacy-allowlist\.json$/.test(path)) return 'privacy-allowlist';
  // The controls themselves: CI workflows, code owners and the AI Guard code. A change here could
  // switch the checks off, so it needs the same human approval as an oracle change.
  if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(path) || path === '.github/CODEOWNERS' || path === 'scripts/ai-guard.ts' || /^core\/ai\/[^/]+\.ts$/.test(path)) return 'guard-code';
  return 'other';
}

// ---------- spec analysis ----------

// test.slow() only extends the timeout; it does not weaken an oracle, so it is not protected.
const SKIP_METHODS = new Set(['skip', 'fixme', 'fail']);
const DECLARATION_MODIFIERS = new Set(['only', 'skip', 'fixme', 'fail', 'slow']);
const GUARDED_TAG = /@known-bug|@quarantine/g;
const TC_REF = /\btc\(\s*['"`](TC-[\w-]+)['"`]\s*\)/g;

export interface TestOracle {
  /** Assertions with their control-flow context, whitespace-normalised. */
  assertions: string[];
  /** `const` values declared in the test body (local expected values). */
  constants: string[];
  skips: number;
  earlyExits: number;
  guardedTags: string[];
  tcIds: string[];
}

export interface SpecOracles {
  tests: Map<string, TestOracle>;
  /** skip/fixme/fail calls outside test bodies (file or describe level). */
  fileLevelSkips: number;
  parseErrors: number;
}

const squash = (text: string) => text.replace(/\s+/g, '');

function isFunctionLike(node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration | ts.MethodDeclaration {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node);
}

function isExpectCall(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return callee.text === 'expect';
  return ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'expect' && ['soft', 'poll'].includes(callee.name.text);
}

/** Outermost call of an expect chain (the matcher call). */
function isAssertion(node: ts.Node): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) || (ts.isCallExpression(parent) && parent.expression === node)) return false;
  let cursor: ts.Expression = node;
  while (ts.isCallExpression(cursor) || ts.isPropertyAccessExpression(cursor)) {
    if (isExpectCall(cursor)) return cursor !== node || node.arguments.length > 0;
    cursor = cursor.expression;
  }
  return false;
}

function skipCall(node: ts.CallExpression): boolean {
  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee) || !SKIP_METHODS.has(callee.name.text)) return false;
  const target = callee.expression.getText().replace(/\s/g, '');
  return /^(test|testInfo|test\.describe|test\.info\(\)|info)$/.test(target) || /testInfo$/i.test(target);
}

/** `test('t', …)`, `test.fail('t', …)`, `test.only(...)` — a test declaration with a body. */
function testDeclaration(node: ts.CallExpression): { title: string; details?: ts.Expression; body: ts.Node } | null {
  const callee = node.expression;
  const isTest = ts.isIdentifier(callee) ? callee.text === 'test' : ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'test' && DECLARATION_MODIFIERS.has(callee.name.text);
  if (!isTest) return null;
  const [first, second] = node.arguments;
  const last = node.arguments.at(-1);
  if (!first || !last || !(ts.isStringLiteralLike(first) || ts.isTemplateExpression(first)) || !isFunctionLike(last)) return null;
  const details = node.arguments.length === 3 ? second : undefined;
  return { title: squash(first.getText()), ...(details ? { details } : {}), body: last };
}

function contextOf(node: ts.Node, body: ts.Node): string {
  const parts: string[] = [];
  for (let cursor = node.parent; cursor && cursor !== body; cursor = cursor.parent) {
    if (ts.isIfStatement(cursor) || ts.isConditionalExpression(cursor) || ts.isSwitchStatement(cursor)) parts.push('if');
    else if (ts.isTryStatement(cursor) || ts.isCatchClause(cursor)) parts.push('try');
    else if (ts.isBinaryExpression(cursor) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(cursor.operatorToken.kind)) parts.push('logic');
    else if (isFunctionLike(cursor)) {
      const call = cursor.parent;
      const isStep = ts.isCallExpression(call) && call.expression.getText().replace(/\s/g, '') === 'test.step';
      parts.push(isStep ? 'step' : 'callback');
    }
  }
  return parts.length ? `[${parts.reverse().join('>')}]` : '';
}

function oracleOf(decl: { details?: ts.Expression; body: ts.Node }): TestOracle {
  const oracle: TestOracle = { assertions: [], constants: [], skips: 0, earlyExits: 0, guardedTags: [], tcIds: [] };
  const detailsText = decl.details?.getText() ?? '';
  oracle.guardedTags = [...detailsText.matchAll(GUARDED_TAG)].map((m) => m[0]).sort();
  oracle.tcIds = [...detailsText.matchAll(TC_REF)].map((m) => m[1] ?? '').sort();
  const visit = (node: ts.Node) => {
    if (isAssertion(node)) oracle.assertions.push(`${contextOf(node, decl.body)}${squash(node.getText())}`);
    if (ts.isCallExpression(node) && skipCall(node)) oracle.skips++;
    if ((ts.isReturnStatement(node) || ts.isThrowStatement(node)) && nearestFunction(node) === decl.body) oracle.earlyExits++;
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isVariableDeclarationList(node.parent) && (node.parent.flags & ts.NodeFlags.Const) !== 0) {
      oracle.constants.push(`${node.name.getText()}=${squash(node.initializer.getText())}`);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(decl.body, visit);
  return oracle;
}

function nearestFunction(node: ts.Node): ts.Node | undefined {
  for (let cursor = node.parent; cursor; cursor = cursor.parent) if (isFunctionLike(cursor)) return cursor;
  return undefined;
}

export function extractSpecOracles(source: string, fileName = 'spec.ts'): SpecOracles {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const tests = new Map<string, TestOracle>();
  let fileLevelSkips = 0;
  const visit = (node: ts.Node, insideTest: boolean) => {
    if (ts.isCallExpression(node)) {
      const decl = testDeclaration(node);
      if (decl && !insideTest) {
        let key = decl.title;
        for (let n = 2; tests.has(key); n++) key = `${decl.title}#${n}`;
        tests.set(key, oracleOf(decl));
        const callee = node.expression;
        if (ts.isPropertyAccessExpression(callee) && SKIP_METHODS.has(callee.name.text)) fileLevelSkips++; // test.fail('t', …) declaration
        return;
      }
      if (!insideTest && skipCall(node)) fileLevelSkips++;
    }
    ts.forEachChild(node, (child) => visit(child, insideTest));
  };
  visit(file, false);
  const parseErrors = (file as unknown as { parseDiagnostics?: unknown[] }).parseDiagnostics?.length ?? 0;
  return { tests, fileLevelSkips, parseErrors };
}

function compareSpecs(path: string, before: string | null, after: string): Finding[] {
  const findings: Finding[] = [];
  const now = extractSpecOracles(after, path);
  if (now.parseErrors > 0) findings.push({ file: path, rule: 'assertion-changed', detail: 'File does not parse; cannot verify assertions.' });
  const add = (rule: Rule, detail: string) => findings.push({ file: path, rule, detail });

  if (before === null) {
    // New file: new assertions are fine; skips and guarded tags still need approval.
    if (now.fileLevelSkips > 0) add('skip-or-fail-added', `${now.fileLevelSkips} skip/fixme/fail call(s) in a new file`);
    for (const [title, o] of now.tests) {
      if (o.skips > 0) add('skip-or-fail-added', `${title}: ${o.skips} skip/fixme/fail call(s)`);
      if (o.guardedTags.length > 0) add('guarded-tag-changed', `${title}: ${o.guardedTags.join(', ')}`);
    }
    return findings;
  }

  const old = extractSpecOracles(before, path);
  if (now.fileLevelSkips > old.fileLevelSkips) add('skip-or-fail-added', `file-level skip/fixme/fail calls ${old.fileLevelSkips} → ${now.fileLevelSkips}`);
  for (const [title, o] of old.tests) {
    const n = now.tests.get(title);
    if (!n) {
      add('test-removed', `${title} (renamed titles also appear here)`);
      continue;
    }
    const missing = o.assertions.filter((a) => !n.assertions.includes(a));
    if (missing.length) add('assertion-changed', `${title}: ${missing[0]}${missing.length > 1 ? ` (+${missing.length - 1} more)` : ''}`);
    const changedConst = o.constants.filter((c) => !n.constants.includes(c));
    if (changedConst.length) add('assertion-changed', `${title}: local value ${changedConst[0]}`);
    if (n.skips > o.skips) add('skip-or-fail-added', `${title}: skip/fixme/fail calls ${o.skips} → ${n.skips}`);
    if (n.earlyExits > o.earlyExits) add('early-exit-added', `${title}: return/throw statements ${o.earlyExits} → ${n.earlyExits}`);
    if (o.guardedTags.join() !== n.guardedTags.join()) add('guarded-tag-changed', `${title}: [${o.guardedTags.join(', ')}] → [${n.guardedTags.join(', ')}]`);
    const lostTc = o.tcIds.filter((id) => !n.tcIds.includes(id));
    if (lostTc.length) add('traceability-changed', `${title}: removed ${lostTc.join(', ')}`);
  }
  for (const [title, n] of now.tests) {
    if (old.tests.has(title)) continue;
    if (n.skips > 0) add('skip-or-fail-added', `${title} (new): ${n.skips} skip/fixme/fail call(s)`);
    if (n.guardedTags.length > 0) add('guarded-tag-changed', `${title} (new): ${n.guardedTags.join(', ')}`);
  }
  return findings;
}

// ---------- test data, config, docs ----------

/** Top-level variable initialisers: name → normalised source. */
export function topLevelValues(source: string): Map<string, string> {
  const file = ts.createSourceFile('data.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const values = new Map<string, string>();
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const d of statement.declarationList.declarations) {
      if (d.initializer) values.set(d.name.getText(), squash(d.initializer.getText()));
    }
  }
  return values;
}

const PROTECTED_CONFIG_KEYS = new Set([
  'testDir', 'testMatch', 'testIgnore', 'grep', 'grepInvert', 'retries', 'failOnFlakyTests', 'forbidOnly',
  'ignoreSnapshots', 'updateSnapshots', 'expect', 'timeout', 'maxFailures', 'shard',
]);

export function protectedConfigEntries(source: string): string[] {
  const file = ts.createSourceFile('playwright.config.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const entries: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && PROTECTED_CONFIG_KEYS.has(node.name.getText().replace(/['"]/g, ''))) {
      entries.push(`${node.name.getText()}=${squash(node.initializer.getText())}`);
      return;
    }
    if (ts.isShorthandPropertyAssignment(node) && PROTECTED_CONFIG_KEYS.has(node.name.text)) entries.push(`${node.name.text}=<shorthand>`);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return entries.sort();
}

/** "**Expected result**" sections per TC-ID. */
export function expectedResults(markdown: string): Map<string, string> {
  const map = new Map<string, string>();
  let id: string | null = null;
  let inside = false;
  let lines: string[] = [];
  const flush = () => {
    if (id) map.set(id, lines.join('\n'));
  };
  for (const line of markdown.split('\n')) {
    const heading = /^##\s+(TC-[\w-]+)/.exec(line);
    if (heading) {
      flush();
      id = heading[1] ?? null;
      lines = [];
      inside = false;
      continue;
    }
    if (line.trim() === '**Expected result**') {
      inside = true;
      continue;
    }
    if (line.startsWith('**')) inside = false;
    if (inside && line.trim()) lines.push(line.trim());
  }
  flush();
  return map;
}

// ---------- privacy exceptions ----------

interface PrivacyException {
  path?: unknown;
  rule?: unknown;
  count?: unknown;
  reason?: unknown;
}

/**
 * Exceptions of the privacy gate (privacy-allowlist.json), keyed by path + rule. Returns null when
 * the file is not a JSON array: an unreadable allowlist is itself a finding (fail closed).
 */
export function privacyExceptions(source: string): Map<string, string> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const map = new Map<string, string>();
  for (const e of parsed as PrivacyException[]) {
    map.set(`${String(e.path)} rule=${String(e.rule)}`, `count=${String(e.count)} reason=${JSON.stringify(e.reason)}`);
  }
  return map;
}

/** Every added, removed or changed privacy exception is reported on its own. */
function comparePrivacyExceptions(before: string | null, after: string, add: (rule: Rule, detail: string) => void): void {
  const old = before === null ? new Map<string, string>() : privacyExceptions(before);
  const now = privacyExceptions(after);
  if (now === null || old === null) {
    add('privacy-exception-changed', 'allowlist is not a readable JSON array');
    return;
  }
  for (const [key, value] of now) {
    if (!old.has(key)) add('privacy-exception-changed', `added: ${key} ${value.split(' reason=')[0]}`);
    else if (old.get(key) !== value) add('privacy-exception-changed', `changed: ${key} (${old.get(key)?.split(' reason=')[0]} → ${value.split(' reason=')[0]}, or reason)`);
  }
  for (const key of old.keys()) if (!now.has(key)) add('privacy-exception-changed', `removed: ${key}`);
}

// ---------- entry point ----------

export function analyzeChanges(files: readonly ChangedFile[]): { findings: Finding[]; inspected: number } {
  const findings: Finding[] = [];
  let inspected = 0;
  for (const file of files) {
    const kind = classifyPath(file.path);
    const oldKind = file.oldPath ? classifyPath(file.oldPath) : kind;
    if (kind === 'other' && oldKind === 'other') continue;
    inspected++;
    const add = (rule: Rule, detail: string) => findings.push({ file: file.path, rule, detail });

    if (file.status === 'renamed') add('protected-file-renamed', `${file.oldPath} → ${file.path}`);
    if (kind === 'baseline' || oldKind === 'baseline') {
      add('baseline-changed', file.status);
      continue;
    }
    if (file.after === null) {
      add('protected-file-removed', `${kind} deleted`);
      continue;
    }
    switch (kind) {
      case 'spec':
        findings.push(...compareSpecs(file.path, file.before, file.after));
        break;
      case 'test-data': {
        if (file.before === null) break;
        const before = topLevelValues(file.before);
        const after = topLevelValues(file.after);
        for (const [name, value] of before) {
          if (after.get(name) !== value) add('test-data-changed', after.has(name) ? `${name} changed` : `${name} removed`);
        }
        break;
      }
      case 'runner-config': {
        const before = file.before === null ? [] : protectedConfigEntries(file.before);
        const after = protectedConfigEntries(file.after);
        const changed = [...before.filter((e) => !after.includes(e)), ...after.filter((e) => !before.includes(e))];
        if (changed.length) add('runner-config-changed', changed.slice(0, 5).join('; '));
        break;
      }
      case 'privacy-allowlist':
        comparePrivacyExceptions(file.before, file.after, add);
        break;
      case 'guard-code':
        if (file.before === null) add('guard-code-changed', 'added');
        else if (file.before !== file.after) add('guard-code-changed', 'content changed');
        break;
      case 'test-case-doc': {
        if (file.before === null) break;
        const before = expectedResults(file.before);
        const after = expectedResults(file.after);
        for (const [id, text] of before) {
          if (after.get(id) !== text) add('expected-result-changed', after.has(id) ? `${id} expected result changed` : `${id} removed`);
        }
        break;
      }
      default:
        break;
    }
  }
  return { findings, inspected };
}
