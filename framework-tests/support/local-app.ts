import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test as core } from '../../core/fixtures';
import { buildPolicy, type GuardPolicy } from '../../core/guard/policy';
import type { TestEnvironment } from '../../core/config/env';

/**
 * A throwaway local "app" for guard self-tests. It records every request it
 * receives, so tests can prove that a blocked request never reached a server.
 */
export interface LocalApp {
  origin: string;
  host: string;
  hits: { method: string; path: string }[];
}

const PAGE = `<!doctype html><html><head><title>Guard self-test</title></head>
<body><h1>Guard self-test</h1><p id="out">ready</p></body></html>`;

function start(): Promise<{ server: Server; app: LocalApp }> {
  const hits: LocalApp['hits'] = [];
  const server = createServer((req, res) => {
    hits.push({ method: req.method ?? 'GET', path: req.url ?? '/' });
    const url = new URL(req.url ?? '/', 'http://local');
    if (url.pathname.startsWith('/redirect/')) {
      // /redirect/<id>?to=<absolute-url>&status=302 — used to test redirect hops.
      res.writeHead(Number(url.searchParams.get('status') ?? 302), { location: url.searchParams.get('to') ?? '/' });
      res.end();
      return;
    }
    if (req.url?.startsWith('/api/')) {
      res.writeHead(req.method === 'POST' ? 201 : 200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, method: req.method }));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(PAGE);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      const host = `127.0.0.1:${port}`;
      resolve({ server, app: { origin: `http://${host}`, host, hits } });
    });
  });
}

export const test = core.extend<{ policyEnv: TestEnvironment }, { localApp: LocalApp; foreignApp: LocalApp }>({
  localApp: [
    async ({}, use) => {
      const { server, app } = await start();
      await use(app);
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
    { scope: 'worker' },
  ],
  /** A second local server on another port: a host that is NOT in the allowlist. */
  foreignApp: [
    async ({}, use) => {
      const { server, app } = await start();
      await use(app);
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
    { scope: 'worker' },
  ],
  policyEnv: ['production', { option: true }],
  testEnv: async ({ policyEnv }, use) => use(policyEnv),
  baseURL: async ({ localApp }, use) => use(localApp.origin),
  guardPolicy: async ({ localApp, policyEnv }, use) => {
    const policy: GuardPolicy = buildPolicy({ env: policyEnv, appHosts: [localApp.host] });
    await use(policy);
  },
  analyticsIds: async ({}, use) => use(['G-SELFTEST']),
});

export { expect } from '../../core/fixtures';
