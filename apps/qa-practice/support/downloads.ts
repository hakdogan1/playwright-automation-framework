import { readFileSync } from 'node:fs';
import type { Download, Page } from '@playwright/test';

/** What the page passed to URL.createObjectURL (type and size of the Blob behind a download). */
export interface ObjectUrlRecord {
  url: string;
  type: string;
  size: number;
}

interface ObjectUrlLog {
  created: ObjectUrlRecord[];
  revoked: string[];
}

declare global {
  interface Window {
    __pqfObjectUrls?: ObjectUrlLog;
  }
}

/**
 * Records every Blob turned into an object URL and every revoked URL, so a test can check the
 * MIME type of a client-side download (Playwright's Download object does not expose it).
 * Observation only: the original functions are called unchanged. Call before navigating.
 */
export async function recordObjectUrls(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const log: ObjectUrlLog = { created: [], revoked: [] };
    window.__pqfObjectUrls = log;
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      const url = create(object);
      if (object instanceof Blob) log.created.push({ url, type: object.type, size: object.size });
      return url;
    };
    URL.revokeObjectURL = (url: string) => {
      log.revoked.push(url);
      revoke(url);
    };
  });
}

export async function objectUrlLog(page: Page): Promise<ObjectUrlLog> {
  return page.evaluate(() => window.__pqfObjectUrls ?? { created: [], revoked: [] });
}

export interface CapturedDownload {
  download: Download;
  name: string;
  /** The file content. Kept in memory only; never attach it to evidence (it may hold personal data). */
  bytes: Buffer;
}

/**
 * Runs `trigger` and returns the download it starts. Playwright saves the file when the download
 * starts, so reading it later is safe even after the page revokes the blob: URL.
 */
export async function captureDownload(page: Page, trigger: () => Promise<void>): Promise<CapturedDownload> {
  const [download] = await Promise.all([page.waitForEvent('download'), trigger()]);
  const failure = await download.failure();
  if (failure) throw new Error(`Download of "${download.suggestedFilename()}" failed: ${failure}`);
  return { download, name: download.suggestedFilename(), bytes: readFileSync(await download.path()) };
}
