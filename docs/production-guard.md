# Production guard

The guard is the **first line of defence** that keeps tests from changing real data.
It is not a network firewall and does not replace a separate test environment.
ESLint rules are a review aid on top of it, not network security.

## How it works
- `core/guard/policy.ts` — data-driven decision table (`evaluateRequest`, pure function).
- `core/guard/guard.ts` — `NetworkGuard`:
  - browser: `context.route('**/*')` + `context.routeWebSocket()` + redirect-hop detection,
  - API: a proxy around `APIRequestContext` that checks every call and **every redirect hop**.
- `core/fixtures/index.ts` installs it automatically:
  - the `context`, `page`, `request` fixtures,
  - `context.request` and therefore `page.request` (replaced by the guarded proxy),
  - `browser.newContext()`, `browser.newPage()` and `playwright.request.newContext()` while a test runs.

| Rule | production | ci / staging | local |
|---|---|---|---|
| Host not in allowlist | blocked | blocked | recorded |
| Write methods (not GET/HEAD/OPTIONS) to allowed hosts | blocked | allowed | allowed |
| `*.supabase.co` (HTTP + WebSocket, all methods) | blocked | blocked | blocked |
| Google Analytics script / hits (incl. `sendBeacon`) | stubbed + `ga-disable-<id>` | same | same |
| Service workers | blocked | blocked | blocked |
| `@destructive` tests | refused before start | allowed | allowed |
| `GUARD_MODE=observe` | **refused** | relaxes unknown-host / write rules only | same |
| No policy configured | everything blocked (empty allowlist) | — | — |

A blocked write or an escaped redirect the test did not declare **fails the test** at
teardown, for every channel (browser, API, WebSocket) — even if the test swallowed the error.
Declare intended blocks with `guard.expectBlocked('<category>')`.

## Coverage — what interception does and does not see

| Channel | Covered | How it was verified (framework-tests) |
|---|---|---|
| Page/frame requests (document, fetch, XHR, assets) | **blocked** | server never receives a blocked POST |
| `request` fixture, `page.request`, `context.request` | **blocked** (throws `GuardViolationError`) | server never receives the call |
| `playwright.request.newContext()`, `browser.newContext()/newPage()` inside a test | **blocked** | server never receives the call |
| API redirects (`maxRedirects` honoured as hop limit) | **each hop checked** | second host never receives the hop |
| Browser redirect hops | **detected, NOT prevented** | the hop *does* reach the other host; the guard records `redirect-escaped` and fails the test |
| WebSockets | **blocked** for non-allowed hosts | Supabase realtime socket closed |
| `navigator.sendBeacon` | **intercepted** (Chromium) | analytics beacon stubbed |
| Service worker requests | not routable → **service workers are blocked** | `serviceWorkers: 'block'` |
| Requests outside Playwright (Node `fetch`, `chromium.launch()` in a script, other processes) | **not covered** | ESLint forbids `chromium`/`playwright` imports in `apps/` |
| Firefox/WebKit-specific routing differences | not separately verified | guard self-tests run on Chromium |

Why browser redirects cannot be blocked: Chromium does not pass redirect hops to route
handlers (observed with Playwright 1.65, `framework-tests/guard.api-bypass.spec.ts`).
In production the first hop of a write is already blocked; the residual risk is a GET
redirect to another host, or a 307/308 write redirect in ci/staging where writes are allowed.

## Using real backends safely
```ts
guard.mock({ url: /\/auth\/v1\/signup/, method: 'POST', status: 200, json: { user: { id: 'mock' } } });
```
Mocks only fulfil; they never reach the network. Every decision is attached as
`guard-report.json` (URLs redacted).

## Known limits
- The guard protects tests, not the application: a misconfigured allowlist is a wrong guard.
- `test.use()` / fixtures can still be misused by code that patches Playwright objects directly.
- The bug-draft reporter reads `<baseURL>/release-info.json` with a plain GET (read-only, outside the guard).
