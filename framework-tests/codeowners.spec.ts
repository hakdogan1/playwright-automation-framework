import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { classifyPath } from '../core/ai/ai-guard';

/**
 * .github/CODEOWNERS: syntax, coverage of the safety controls, and consistency with AI Guard.
 * GitHub's own validation only happens on github.com, so this test accepts only the subset this
 * repository uses (anchored paths, a trailing "/" for directories, no wildcards) and rejects the rest.
 */
const OWNER = '@hakdogan1';
const FILE = '.github/CODEOWNERS';

interface Rule {
  pattern: string;
  owners: string[];
}

function parse(text: string): Rule[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => {
      const [pattern = '', ...owners] = line.split(/\s+/);
      return { pattern, owners };
    });
}

function matches(pattern: string, path: string): boolean {
  if (!pattern.startsWith('/') || /[*?[\]!\\]/.test(pattern)) throw new Error(`unsupported pattern ${pattern}`);
  const p = pattern.slice(1);
  return p.endsWith('/') ? path.startsWith(p) : path === p;
}

/** CODEOWNERS semantics: the last matching rule wins. */
const ownersOf = (rules: Rule[], path: string) => rules.filter((r) => matches(r.pattern, path)).at(-1)?.owners ?? [];

const rules = parse(readFileSync(FILE, 'utf8'));
const repoFiles = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).stdout.split('\0').filter(Boolean);

test.describe('CODEOWNERS', () => {
  test('the matcher follows CODEOWNERS semantics for the patterns used here', () => {
    const sample = parse('/core/ai/ @a\n/core/ai/x.ts @b\n/file.json @c\n');
    expect(ownersOf(sample, 'core/ai/y.ts')).toEqual(['@a']);
    expect(ownersOf(sample, 'core/ai/x.ts')).toEqual(['@b']);
    expect(ownersOf(sample, 'core/aix/y.ts')).toEqual([]);
    expect(ownersOf(sample, 'file.json')).toEqual(['@c']);
    expect(ownersOf(sample, 'sub/file.json')).toEqual([]);
    expect(() => matches('*.ts', 'a.ts')).toThrow();
  });

  test('every rule is anchored, wildcard-free, unique and owned by the owner only', () => {
    expect(rules.length).toBeGreaterThan(0);
    for (const r of rules) {
      expect(() => matches(r.pattern, ''), r.pattern).not.toThrow();
      expect(r.owners, r.pattern).toEqual([OWNER]);
    }
    expect(OWNER).toMatch(/^@[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/);
    expect(new Set(rules.map((r) => r.pattern)).size).toBe(rules.length);
  });

  test('every rule matches at least one file (no dead rules)', () => {
    for (const r of rules) expect(repoFiles.some((f) => matches(r.pattern, f)), r.pattern).toBe(true);
  });

  test('the safety controls are owned', () => {
    for (const path of ['.github/CODEOWNERS', '.github/workflows/ci.yml', 'scripts/ai-guard.ts', 'core/ai/ai-guard.ts', 'core/ai/baseline.ts', 'privacy-allowlist.json']) {
      expect(ownersOf(rules, path), path).toEqual([OWNER]);
    }
  });

  test('everything AI Guard protects as guard code or privacy exceptions is owned', () => {
    const controls = repoFiles.filter((f) => ['guard-code', 'privacy-allowlist'].includes(classifyPath(f)));
    expect(controls.length).toBeGreaterThanOrEqual(6);
    for (const f of controls) expect(ownersOf(rules, f), f).toEqual([OWNER]);
  });

  test('ownership stays limited to the controls', () => {
    const owned = repoFiles.filter((f) => ownersOf(rules, f).length > 0);
    const notControls = owned.filter((f) => !['guard-code', 'privacy-allowlist'].includes(classifyPath(f)));
    // core/ai/ also holds the prompt texts; owned by the same directory rule, not protected by AI Guard.
    expect(notControls.every((f) => f.startsWith('core/ai/prompts/')), notControls.join(', ')).toBe(true);
    expect(ownersOf(rules, 'apps/qa-practice/fixtures.ts')).toEqual([]);
  });
});
