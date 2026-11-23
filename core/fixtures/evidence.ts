import type { BrowserContext, Request } from '@playwright/test';
import { redactText, redactUrl } from '../reporting/redact';

/**
 * Collects browser-side evidence for a test: console errors, uncaught page
 * errors, failed requests and HTTP error responses. Playwright already
 * captures screenshots, video and traces; this adds the logs a bug report needs.
 */
export interface EvidenceLog {
  consoleErrors: { text: string; url?: string }[];
  pageErrors: { message: string }[];
  failedRequests: { method: string; url: string; error: string; blockedByGuard: boolean }[];
  httpErrors: { method: string; url: string; status: number }[];
  /** Requests still in flight when the test ended (filled at teardown of a failed test). */
  pendingRequests: { method: string; url: string; resourceType: string; ageMs: number }[];
}

export interface EvidenceCollector {
  log: EvidenceLog;
  /** Snapshot of requests that started but neither finished nor failed. */
  snapshotPending(): void;
}

const LIMIT = 50;

function push<T>(list: T[], item: T): void {
  if (list.length < LIMIT) list.push(item);
}

export function collectEvidence(context: BrowserContext): EvidenceCollector {
  const log: EvidenceLog = { consoleErrors: [], pageErrors: [], failedRequests: [], httpErrors: [], pendingRequests: [] };
  const inFlight = new Map<Request, number>();
  context.on('request', (request) => inFlight.set(request, Date.now()));
  context.on('requestfinished', (request) => inFlight.delete(request));

  context.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const location = msg.location();
    push(log.consoleErrors, { text: msg.text().slice(0, 2000), ...(location.url ? { url: location.url } : {}) });
  });
  context.on('weberror', (error) => {
    push(log.pageErrors, { message: error.error().message.slice(0, 2000) });
  });
  context.on('requestfailed', (request) => {
    inFlight.delete(request);
    const error = request.failure()?.errorText ?? 'unknown';
    push(log.failedRequests, {
      method: request.method(),
      url: request.url(),
      error,
      blockedByGuard: error.includes('ERR_BLOCKED_BY_CLIENT'),
    });
  });
  context.on('response', (response) => {
    if (response.status() < 400) return;
    push(log.httpErrors, { method: response.request().method(), url: response.url(), status: response.status() });
  });

  const snapshotPending = () => {
    const now = Date.now();
    log.pendingRequests = [...inFlight.entries()]
      .slice(0, LIMIT)
      .map(([r, started]) => ({ method: r.method(), url: r.url(), resourceType: r.resourceType(), ageMs: now - started }));
  };
  return { log, snapshotPending };
}

export function hasEvidence(log: EvidenceLog): boolean {
  return log.consoleErrors.length + log.pageErrors.length + log.failedRequests.length + log.httpErrors.length + log.pendingRequests.length > 0;
}

/** Copy of the log with URLs and message text redacted (tokens, JWTs, real e-mail addresses). */
export function redactEvidence(log: EvidenceLog): EvidenceLog {
  return {
    consoleErrors: log.consoleErrors.map((c) => ({ text: redactText(c.text), ...(c.url ? { url: redactUrl(c.url) } : {}) })),
    pageErrors: log.pageErrors.map((p) => ({ message: redactText(p.message) })),
    failedRequests: log.failedRequests.map((r) => ({ ...r, url: redactUrl(r.url) })),
    httpErrors: log.httpErrors.map((r) => ({ ...r, url: redactUrl(r.url) })),
    pendingRequests: log.pendingRequests.map((r) => ({ ...r, url: redactUrl(r.url) })),
  };
}
