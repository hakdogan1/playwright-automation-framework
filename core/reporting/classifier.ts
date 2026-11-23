import { createHash } from 'node:crypto';

/**
 * Deterministic failure classification. Only `product-defect-candidate`
 * produces a bug draft; everything else is a triage note. A human decides.
 */
export type FailureCategory =
  | 'product-defect-candidate'
  | 'test-maintenance'
  | 'environment'
  /** Navigation did not finish in time. Cause unknown until the trace / pending requests are reviewed. */
  | 'navigation-timeout'
  | 'test-infrastructure'
  | 'guard-violation'
  | 'flaky'
  | 'unclassified';

export interface AttemptFacts {
  status: string;
  errors: { message: string; file?: string }[];
}

export interface FailureFacts {
  /** Playwright test outcome: 'unexpected' | 'flaky'. */
  outcome: string;
  attempts: AttemptFacts[];
}

export interface Classification {
  category: FailureCategory;
  reason: string;
  /** Every attempt failed with the same normalised signature. */
  consistent: boolean;
}

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '');
}

/** Removes volatile parts so the same failure produces the same signature. */
export function normalise(message: string): string {
  return stripAnsi(message)
    .split('\n')
    .slice(0, 6)
    .join('\n')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
    .replace(/0x[0-9a-f]+/gi, '<hex>')
    .replace(/\d+(\.\d+)?ms/g, '<ms>')
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fingerprint(parts: { file: string; title: string; message: string }): string {
  return createHash('sha1').update(`${parts.file}\n${parts.title}\n${normalise(parts.message)}`).digest('hex').slice(0, 12);
}

const RULES: { category: FailureCategory; test: RegExp; reason: string }[] = [
  { category: 'guard-violation', test: /\[guard\]/, reason: 'The production guard blocked or refused an action.' },
  { category: 'test-infrastructure', test: /\[env\]|\[traceability\]|browserType\.launch|Executable doesn't exist|fixture .* (timeout|failed)|Test timeout of \d+ms exceeded while (setting up|tearing down)/i, reason: 'Configuration, fixture or tooling problem, not the application.' },
  // Only explicit network errors count as environment problems.
  { category: 'environment', test: /net::ERR_(?!BLOCKED_BY_CLIENT)|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|socket hang up|status (5\d\d)\b|HTTP 5\d\d/i, reason: 'An explicit network error or 5xx response was recorded.' },
  // A timeout alone is not evidence of a hosting problem.
  { category: 'navigation-timeout', test: /(page|frame)\.(goto|reload|waitForURL|waitForNavigation|waitForLoadState): Timeout/i, reason: 'Navigation did not finish in time. Cause unknown: review pending requests (evidence.json) and the trace before blaming the environment.' },
  { category: 'test-maintenance', test: /element\(s\) not found|resolved to 0 elements|strict mode violation|waiting for (get|locator)\S*.*\n?.*Timeout|locator\.\w+: Timeout/i, reason: 'A locator did not match. The UI changed or the locator is wrong; check before filing a bug.' },
  { category: 'product-defect-candidate', test: /\bExpected\b[^\n]*:[\s\S]*\bReceived\b[^\n]*:/, reason: 'An assertion compared values and the application returned a different one.' },
];

export function classify(facts: FailureFacts): Classification {
  if (facts.outcome === 'flaky') {
    return { category: 'flaky', reason: 'Failed, then passed on retry. Tracked as flaky, not as a product bug.', consistent: false };
  }
  const failed = facts.attempts.filter((a) => a.status !== 'passed' && a.status !== 'skipped');
  const signatures = new Set(failed.map((a) => normalise(a.errors[0]?.message ?? '')));
  const consistent = failed.length > 0 && signatures.size === 1;
  const message = stripAnsi(failed.at(-1)?.errors.map((e) => e.message).join('\n') ?? '');

  if (!message) return { category: 'unclassified', reason: 'No error message was recorded.', consistent };

  for (const rule of RULES) {
    if (!rule.test.test(message)) continue;
    if (rule.category === 'product-defect-candidate' && !consistent) {
      return { category: 'unclassified', reason: 'Assertion failures differed between attempts; investigate stability first.', consistent };
    }
    return { category: rule.category, reason: rule.reason, consistent };
  }
  return { category: 'unclassified', reason: 'No rule matched. Needs manual triage.', consistent };
}

/** Pulls "Expected:" / "Received:" values out of a Playwright assertion message. */
export function expectedActual(message: string): { expected?: string; actual?: string } {
  const text = stripAnsi(message);
  const expected = /^\s*Expected(?: [a-z ]+)?:\s*(.+)$/im.exec(text)?.[1]?.trim();
  const actual = /^\s*Received(?: [a-z ]+)?:\s*(.+)$/im.exec(text)?.[1]?.trim();
  return { ...(expected ? { expected } : {}), ...(actual ? { actual } : {}) };
}
