# P1-7 — First-navigation timeout investigation

**Status: root cause UNKNOWN. Strong correlation found; mitigation applied.**
Hosting is *not* shown to be at fault. All measurements: one macOS machine, one network,
Playwright 1.65.1, Chromium 159, target `https://qapractice.hakdogan.com/ui-elements/buttons/`.
Read-only GET page loads only, at most 2 browsers at once, 1.5 s pause between samples.

## Symptom
`page.goto` / `waitForLoadState('load')` times out after 20 s. The document returns 200 and
DOMContentLoaded fires (~0.7 s), then ~13 JS chunks (`/_next/static/chunks/*.js`) stay pending
for the full 20 s with **no response and no error**. A reload in the same context then hangs
on the document itself. No redirects.

## Matrix (`npx playwright test --project=diagnostics`, `diagnostics/navigation.diag.ts`)
Factors: QUIC on/off (`--disable-quic`) · guard on/off (route interception) · 1 or 2 concurrent
browsers · cold (fresh browser) / warm (reload). Cell order rotated each round, round 0 starting
with QUIC off, so "first navigation of the run" is not tied to one cell.

| Evidence run | Contexts | Hung contexts |
|---|---|---|
| `20261122T170114Z-8c6e0d` (probe, 1 round) | 12 | 1 — QUIC on + guard, c1 |
| `20261122T170320Z-9dfc9c` (4 rounds, rotated) | 48 | 2 — both QUIC on + guard, c1 |
| `20261122T170808Z-a9e282` (focus: guard, c1) | 16 | 1 — QUIC on |

Combined (contexts that hung / contexts):

| | QUIC on | QUIC off |
|---|---|---|
| Route interception (guard) on | **4 / 23** | 0 / 23 |
| Route interception off | 0 / 15 | 0 / 15 |

- Concurrency: all hung contexts were single-browser (c1); c2 with QUIC + guard: 0/10. Not conclusive.
- Cold vs warm: every hang started on the cold navigation; the warm reload of a hung context also hung.
- Hung samples were not the first navigation of their run (e.g. sample 12 and 28 of 48).
- With QUIC on, ~92 % of sub-resources used `h3`; with `--disable-quic`, 0 % (all `h2`).
- `curl` (HTTP/2, no interception) baseline: all 17 resources answered in 0.16–1.3 s
  (`evidence/phase-1d/p1-7-curl-baseline.txt`). Document header `alt-svc: h3=":443"` is advertised.

## Interpretation
The failures only occurred when **Playwright route interception and HTTP/3 were both active**.
The most likely explanation is a client-side interaction (request interception while Chromium
moves requests to an HTTP/3 connection), but this was not proven: sample sizes are small
(4/23 vs 0/23, one-sided Fisher exact p ≈ 0.05), only one network was used, and no packet capture was made.
Earlier hypotheses — "shared host throttling" and "first contact after idle" — are not supported.

## Mitigation
Chromium-based projects launch with `--disable-quic` (`playwright.config.ts`). The classifier
reports such failures as `navigation-timeout` (cause unknown), never as `environment` by itself,
and failed tests store pending requests in `evidence.json`.

**Residual risk:** HTTP/3 delivery is not exercised by the Chromium projects. Firefox and WebKit
keep their defaults.

## To close it (not done)
Repeat the focused matrix from another network / CI runner; record traces with network
snapshots; test a Playwright/Chromium upgrade; optionally capture a netlog
(`--log-net-log`) for a hung context.
