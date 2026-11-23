import { BEARER, EMAIL, JWT, SAFE_EMAIL_DOMAIN, SENSITIVE_PARAM, redactText, redactUrl } from './redact.ts';

/**
 * Privacy catalogue: one place that knows what counts as sensitive in evidence and published files.
 *
 * - Detection (`scanText`) reuses the patterns of redact.ts, so detection and masking never disagree.
 * - Evidence redaction (`redactText` / `redactUrl` in redact.ts) is unchanged: bug drafts, evidence.json
 *   and guard reports keep their current, tested behaviour.
 * - Publication redaction (`redactForPublication`) calls those functions first and then masks the
 *   classes that only matter when something leaves this machine (keys, header values, local paths,
 *   the backend project host).
 *
 * Findings never carry the matched value: only rule, line and count.
 */

export type PrivacyRule =
  | 'email'
  | 'jwt'
  | 'bearer-basic'
  | 'supabase-key'
  | 'auth-header'
  | 'url-credentials'
  | 'local-user-path'
  | 'supabase-project-host';

export const PRIVACY_RULES: readonly PrivacyRule[] = ['email', 'jwt', 'bearer-basic', 'supabase-key', 'auth-header', 'url-credentials', 'local-user-path', 'supabase-project-host'];

export interface PrivacyFinding {
  rule: PrivacyRule;
  /** 1-based line number. */
  line: number;
  count: number;
}

const SUPABASE_KEY = /\bsb_(?:publishable|secret)_[\w-]{8,}/g;
const SUPABASE_HOST = /\b[a-z0-9]{20}\.supabase\.(?:co|in)\b/g;
const LOCAL_USER_PATH = /(?:\/Users|\/home)\/[A-Za-z0-9._-]+(?=\/)|\b[A-Za-z]:\\Users\\[A-Za-z0-9._-]+(?=\\)/g;
const HEADER_NAMES = 'authorization|proxy-authorization|cookie|set-cookie|x-api-key|apikey';
/** A name/value header object (name = authorization, cookie, …) as in traces and HAR files. */
const HEADER_PAIR = new RegExp(`("name"\\s*:\\s*"(?:${HEADER_NAMES})"\\s*,\\s*"value"\\s*:\\s*")((?:[^"\\\\]|\\\\.)*)(")`, 'gi');
/** A header written as a JSON property (authorization, cookie, …). */
const HEADER_PROP = new RegExp(`("(?:${HEADER_NAMES})"\\s*:\\s*")((?:[^"\\\\]|\\\\.)*)(")`, 'gi');
/** A raw header line (Authorization, Cookie, …). */
const HEADER_LINE = new RegExp(`^(\\s*(?:${HEADER_NAMES})\\s*:\\s*)(\\S.*)$`, 'gim');
const URL_IN_TEXT = /\bhttps?:\/\/[^\s"'<>`)\]]+/g;
/** "name@hash-123.jpeg" in trace resource names is a file name, not an address. */
const FILE_EXTENSION_TLD = /\.(?:jpe?g|png|gif|webp|svg|webm|mp4|zip|json|md|txt|js|mjs|cjs|css|html?|ts|map|woff2?|ttf)$/i;

const isRedacted = (value: string) => /REDACTED/.test(value) || value.trim() === '';

/**
 * Reserved domains (RFC 2606 / RFC 6761) can never be real mailboxes, so detection ignores them:
 * example.com/org/net/test (the redaction safe list) and the TLDs .test, .example, .invalid, .localhost.
 * Redaction (redactText) stays stricter and keeps masking everything outside example.*.
 */
const RESERVED_TLD = /@[\w.-]+\.(?:test|example|invalid|localhost)$/i;

export function isSyntheticEmail(address: string): boolean {
  return SAFE_EMAIL_DOMAIN.test(address) || RESERVED_TLD.test(address);
}

function realEmails(text: string): number {
  return [...text.matchAll(EMAIL)].filter((m) => !isSyntheticEmail(m[0]) && !FILE_EXTENSION_TLD.test(m[0])).length;
}

function exposedHeaders(text: string): number {
  let count = 0;
  for (const rx of [HEADER_PAIR, HEADER_PROP, HEADER_LINE]) {
    for (const m of text.matchAll(rx)) if (!isRedacted(m[2] ?? '')) count++;
  }
  return count;
}

/** URLs that still carry credentials, a sensitive query parameter or a token fragment. */
function exposedUrls(text: string): number {
  let count = 0;
  for (const m of text.matchAll(URL_IN_TEXT)) {
    let url: URL;
    try {
      url = new URL(m[0]);
    } catch {
      continue;
    }
    const params = [...url.searchParams].some(([key, value]) => SENSITIVE_PARAM.test(key) && value !== '' && !isRedacted(value));
    const fragment = /access_token|id_token|refresh_token/.test(url.hash) && !isRedacted(url.hash);
    if (url.username || url.password || params || fragment) count++;
  }
  return count;
}

const COUNTERS: Record<PrivacyRule, (line: string) => number> = {
  email: realEmails,
  jwt: (l) => (l.match(JWT) ?? []).length,
  'bearer-basic': (l) => [...l.matchAll(BEARER)].filter((m) => !isRedacted(m[0])).length,
  'supabase-key': (l) => (l.match(SUPABASE_KEY) ?? []).length,
  'auth-header': exposedHeaders,
  'url-credentials': exposedUrls,
  'local-user-path': (l) => (l.match(LOCAL_USER_PATH) ?? []).length,
  'supabase-project-host': (l) => (l.match(SUPABASE_HOST) ?? []).length,
};

/** Sensitive content per line and rule. Values are never returned. */
export function scanText(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  text.split('\n').forEach((line, i) => {
    for (const rule of PRIVACY_RULES) {
      const count = COUNTERS[rule](line);
      if (count > 0) findings.push({ rule, line: i + 1, count });
    }
  });
  return findings;
}

/** True for content that is not text (a NUL byte in the first 8 KiB). */
export function isBinary(buffer: Buffer): boolean {
  return buffer.subarray(0, 8192).includes(0);
}

/**
 * Masks text for publication. Evidence redaction first (redactUrl per URL, then redactText),
 * then the publication-only classes. Placeholders are chosen so the scanner never matches them.
 */
export function redactForPublication(text: string, options: { repoRoot?: string } = {}): string {
  let out = text.replace(URL_IN_TEXT, (url) => redactUrl(url));
  out = redactText(out);
  if (options.repoRoot) out = out.split(options.repoRoot).join('<repo>');
  return out
    .replace(SUPABASE_KEY, '[REDACTED-KEY]')
    .replace(HEADER_PAIR, (_m, a: string, v: string, z: string) => (isRedacted(v) ? `${a}${v}${z}` : `${a}[REDACTED]${z}`))
    .replace(HEADER_PROP, (_m, a: string, v: string, z: string) => (isRedacted(v) ? `${a}${v}${z}` : `${a}[REDACTED]${z}`))
    .replace(HEADER_LINE, (_m, a: string, v: string) => (isRedacted(v) ? `${a}${v}` : `${a}[REDACTED]`))
    .replace(LOCAL_USER_PATH, '<home>')
    .replace(SUPABASE_HOST, '<supabase-project>.supabase.co');
}
