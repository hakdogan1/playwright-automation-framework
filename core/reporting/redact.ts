/**
 * Redaction for evidence that may be shared (bug drafts, JSON logs).
 * Traces and videos cannot be scrubbed; they stay in the local, git-ignored
 * evidence store (see docs/evidence-retention.md).
 */
// Shared with the privacy scanner (privacy.ts), so detection and masking never disagree.
export const SENSITIVE_PARAM = /token|key|secret|pass(word|wd)?|session|auth|code|sig(nature)?|jwt|cookie|credential/i;
export const JWT = /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}\b/g;
export const BEARER = /\b(Bearer|Basic)\s+[\w.~+/=-]{8,}/gi;
export const EMAIL = /\b[\w.+-]+@([\w-]+\.)+[a-z]{2,}\b/gi;
export const SAFE_EMAIL_DOMAIN = /@example\.(test|com|org|net)$/i;

export function redactUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return redactText(raw);
  }
  // Credentials in the URL are dropped entirely.
  url.username = '';
  url.password = '';
  for (const key of [...url.searchParams.keys()]) {
    if (SENSITIVE_PARAM.test(key)) url.searchParams.set(key, 'REDACTED');
  }
  if (url.hash && /access_token|id_token|refresh_token/.test(url.hash)) url.hash = '#REDACTED';
  return redactText(url.toString());
}

export function redactText(text: string): string {
  return text
    .replace(JWT, '[REDACTED-JWT]')
    .replace(BEARER, '$1 [REDACTED]')
    .replace(EMAIL, (m) => (SAFE_EMAIL_DOMAIN.test(m) ? m : '[REDACTED-EMAIL]'));
}
