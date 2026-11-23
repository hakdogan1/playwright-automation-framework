import { test } from '@playwright/test';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser, BrowserContext, Request } from '@playwright/test';
import { NetworkGuard } from '../core/guard/guard';
import { buildPolicy } from '../core/guard/policy';
import { ensureRun } from '../core/reporting/run-context';

/**
 * P1-7 navigation diagnostics against production — read-only and gentle:
 * at most 2 browsers at once, a pause between samples, GET page loads only,
 * analytics always stubbed. Run: npx playwright test --project=diagnostics
 *
 * Factors: guard on/off · 1 or 2 concurrent cold browsers · QUIC on/off ·
 * cold (fresh browser) vs warm (reload in the same context).
 * Per sample: commit → DOMContentLoaded → load timings, pending requests at
 * timeout, protocols (nextHopProtocol), document headers, failed requests.
 */
const BASE = 'https://qapractice.hakdogan.com';
const PATH = '/ui-elements/buttons/';
const SAMPLES = Number(process.env.DIAG_SAMPLES ?? 4);
const LOAD_TIMEOUT = 20_000;
const PAUSE_MS = 1500;
const HEADERS = ['server', 'via', 'alt-svc', 'cache-control', 'age', 'x-cache', 'x-litespeed-cache', 'cf-cache-status', 'x-served-by', 'content-encoding'];

interface Sample {
  id: string;
  guard: boolean;
  concurrency: 1 | 2;
  quic: boolean;
  phase: 'cold' | 'warm';
  startedAt: string;
  commitMs?: number;
  dclMs?: number;
  loadMs?: number;
  loadTimedOut: boolean;
  error?: string;
  status?: number;
  redirects: number;
  headers: Record<string, string>;
  protocols: Record<string, number>;
  resources: number;
  failed: { url: string; error: string }[];
  pending: { url: string; type: string; ageMs: number }[];
  trace?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let progressFile = '';
const log = (line: string) => appendFileSync(progressFile, `${new Date().toISOString()} ${line}\n`);

/** Every step is bounded, so a hang is recorded where it happens instead of stalling the run. */
async function bounded<T>(label: string, ms: number, work: Promise<T>): Promise<T | 'TIMEOUT'> {
  log(`start ${label}`);
  let timer: NodeJS.Timeout | undefined;
  const result = await Promise.race([work, new Promise<'TIMEOUT'>((r) => (timer = setTimeout(() => r('TIMEOUT'), ms)))]);
  clearTimeout(timer);
  log(`${result === 'TIMEOUT' ? 'TIMEOUT' : 'done'} ${label}`);
  return result;
}

async function prepare(context: BrowserContext, guard: boolean): Promise<void> {
  if (guard) {
    await new NetworkGuard(buildPolicy({ env: 'production', appHosts: [new URL(BASE).host] }), 'enforce', BASE).installOn(context, ['G-L3VW7MVS0V']);
  } else {
    // "Guard off" still never sends analytics hits and never writes: only GETs to the site, GA stubbed.
    await context.route(/googletagmanager\.com|google-analytics\.com/, (r) => r.fulfill({ status: 200, body: '' }));
  }
}

async function measure(context: BrowserContext, base: Omit<Sample, 'loadTimedOut' | 'redirects' | 'headers' | 'protocols' | 'resources' | 'failed' | 'pending'>, outDir: string, reload: boolean): Promise<Sample> {
  const page = context.pages()[0] ?? (await context.newPage());
  const inFlight = new Map<Request, number>();
  const failed: Sample['failed'] = [];
  const onRequest = (r: Request) => inFlight.set(r, Date.now());
  const onDone = (r: Request) => inFlight.delete(r);
  const onFailed = (r: Request) => {
    inFlight.delete(r);
    failed.push({ url: r.url(), error: r.failure()?.errorText ?? '?' });
  };
  page.on('request', onRequest);
  page.on('requestfinished', onDone);
  page.on('requestfailed', onFailed);
  const sample: Sample = { ...base, loadTimedOut: false, redirects: 0, headers: {}, protocols: {}, resources: 0, failed, pending: [] };
  const t0 = Date.now();
  log(`navigate ${base.id}`);
  try {
    const response = reload ? await page.reload({ waitUntil: 'commit', timeout: LOAD_TIMEOUT }) : await page.goto(`${BASE}${PATH}?diag=${base.id}`, { waitUntil: 'commit', timeout: LOAD_TIMEOUT });
    sample.commitMs = Date.now() - t0;
    if (response) {
      sample.status = response.status();
      const h = await response.allHeaders();
      for (const k of HEADERS) if (h[k]) sample.headers[k] = h[k];
      for (let r = response.request().redirectedFrom(); r; r = r.redirectedFrom()) sample.redirects++;
    }
    await page.waitForLoadState('domcontentloaded', { timeout: LOAD_TIMEOUT });
    sample.dclMs = Date.now() - t0;
    await page.waitForLoadState('load', { timeout: LOAD_TIMEOUT });
    sample.loadMs = Date.now() - t0;
  } catch (e) {
    sample.error = (e as Error).message.split('\n')[0] ?? 'error';
    sample.loadTimedOut = /Timeout/i.test(sample.error);
    const now = Date.now();
    sample.pending = [...inFlight.entries()].map(([r, s]) => ({ url: r.url(), type: r.resourceType(), ageMs: now - s }));
  }
  const perf = await bounded(`${base.id} performance entries`, 5_000, page
    .evaluate(() => ({
      res: performance.getEntriesByType('resource').map((e) => (e as PerformanceResourceTiming).nextHopProtocol || 'unknown'),
      nav: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.nextHopProtocol ?? 'unknown',
    }))
    .catch(() => null));
  if (perf && perf !== 'TIMEOUT') {
    sample.resources = perf.res.length;
    for (const p of [`doc:${perf.nav}`, ...perf.res]) sample.protocols[p] = (sample.protocols[p] ?? 0) + 1;
  } else if (perf === 'TIMEOUT') sample.error = `${sample.error ?? ''} | performance.evaluate hung`;
  page.off('request', onRequest);
  page.off('requestfinished', onDone);
  page.off('requestfailed', onFailed);
  if (sample.loadTimedOut) sample.trace = join(outDir, `${base.id}-trace.zip`);
  return sample;
}

async function coldAndWarm(browser: Browser, cfg: { guard: boolean; quic: boolean; concurrency: 1 | 2 }, id: string, outDir: string): Promise<Sample[]> {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await prepare(context, cfg.guard);
  await context.tracing.start({ screenshots: false, snapshots: false });
  log(`context ready ${id}`);
  const common = { guard: cfg.guard, quic: cfg.quic, concurrency: cfg.concurrency, startedAt: new Date().toISOString() };
  const cold = await measure(context, { ...common, id: `${id}-cold`, phase: 'cold' }, outDir, false);
  const warm = await measure(context, { ...common, id: `${id}-warm`, phase: 'warm', startedAt: new Date().toISOString() }, outDir, true);
  const anyTimeout = cold.loadTimedOut || warm.loadTimedOut;
  await bounded(`${id} tracing.stop`, 20_000, context.tracing.stop(anyTimeout ? { path: join(outDir, `${id}-trace.zip`) } : {}).catch(() => undefined));
  if (cold.loadTimedOut) cold.trace = join(outDir, `${id}-trace.zip`);
  if (warm.loadTimedOut) warm.trace = join(outDir, `${id}-trace.zip`);
  await bounded(`${id} context.close`, 10_000, context.close().catch(() => undefined));
  return [cold, warm];
}

test('navigation timing matrix (production, read-only)', async ({ playwright }) => {
  test.setTimeout(30 * 60_000);
  const outDir = join(ensureRun().dir, 'diagnostics');
  mkdirSync(outDir, { recursive: true });
  progressFile = join(outDir, 'progress.log');
  const samples: Sample[] = [];
  let n = 0;
  // Rotate the order every round so "first navigation of the run" is not always the same cell.
  // Round 0 starts with QUIC disabled to separate a QUIC effect from a first-contact effect.
  const cells: { quic: boolean; guard: boolean; concurrency: 1 | 2 }[] = [];
  for (const quic of [false, true]) for (const guard of [true, false]) for (const concurrency of [1, 2] as const) cells.push({ quic, guard, concurrency });
  // DIAG_FOCUS=guard-c1 limits the matrix to guard on + 1 browser (QUIC on/off alternating).
  if (process.env.DIAG_FOCUS === 'guard-c1') cells.splice(0, cells.length, ...cells.filter((c) => c.guard && c.concurrency === 1));
  for (let i = 0; i < SAMPLES; i++) {
    const order = [...cells.slice((i * 3) % cells.length), ...cells.slice(0, (i * 3) % cells.length)];
    for (const { quic, guard, concurrency } of order) {
      {
        {
          const launches = Array.from({ length: concurrency }, async (_, k) => {
            const browser = await playwright.chromium.launch({ args: quic ? [] : ['--disable-quic'], timeout: 30_000 });
            try {
              return await coldAndWarm(browser, { guard, quic, concurrency }, `s${String(++n).padStart(3, '0')}-${quic ? 'quic' : 'noquic'}-${guard ? 'guard' : 'noguard'}-c${concurrency}-${i}${k ? 'b' : 'a'}`, outDir);
            } finally {
              await bounded('browser.close', 10_000, browser.close().catch(() => undefined));
            }
          });
          for (const pair of await Promise.all(launches)) samples.push(...pair);
          writeFileSync(join(outDir, 'navigation.json'), JSON.stringify(samples, null, 2));
          await sleep(PAUSE_MS);
        }
      }
    }
  }

  const groups = new Map<string, Sample[]>();
  for (const s of samples) {
    const key = `${s.quic ? 'quic' : 'no-quic'} | ${s.guard ? 'guard' : 'no-guard'} | c${s.concurrency} | ${s.phase}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : undefined);
  const rows = [...groups.entries()].map(([key, list]) => {
    const timeouts = list.filter((s) => s.loadTimedOut).length;
    return `| ${key} | ${list.length} | ${timeouts} | ${median(list.flatMap((s) => (s.dclMs ? [s.dclMs] : []))) ?? '—'} | ${median(list.flatMap((s) => (s.loadMs ? [s.loadMs] : []))) ?? '—'} |`;
  });
  const protocols = samples.reduce<Record<string, number>>((acc, s) => {
    for (const [p, c] of Object.entries(s.protocols)) acc[p] = (acc[p] ?? 0) + c;
    return acc;
  }, {});
  const timeouts = samples.filter((s) => s.loadTimedOut);
  writeFileSync(
    join(outDir, 'summary.md'),
    `# Navigation diagnostics ${ensureRun().runId}\n\nTarget: ${BASE}${PATH} · samples per cell: ${SAMPLES}\n\n| QUIC | Guard | Concurrency | Phase | n | load timeouts | median DCL ms | median load ms |\n|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\nProtocols seen: ${JSON.stringify(protocols)}\n\nDocument headers (first sample): ${JSON.stringify(samples[0]?.headers ?? {})}\n\nTimeouts: ${timeouts.length}\n${timeouts.map((s) => `- ${s.id}: ${s.error} · pending ${s.pending.length} (${s.pending.slice(0, 5).map((p) => `${p.type} ${new URL(p.url).pathname}`).join(', ')}) · trace ${s.trace ?? '—'}`).join('\n')}\n`,
  );
});
