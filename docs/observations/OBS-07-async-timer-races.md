# [OBS-07] Loader and Lazy Load: pending timers are never cancelled, so stale results win

> **Status: DRAFT bug report — not filed.** Found while automating TC-LDR and TC-LZY (Faz 2C.3). No Bug-ID and no automated test; kept outside `docs/bug-reports/`. It is filed only on the owner's decision. QA Practice source was not modified.

- **Type:** Functional / state (race condition)
- **Severity (proposed):** Medium for finding 1 (the UI shows an error and a successful result at the same time). Low for 2 and 3.
- **Modules:** `/ui-elements/loader/` (`LoaderWidget`, `extras.tsx`), `/ui-elements/lazy-load/` (`LazyLoadWidget`, `async.tsx`), `/ui-elements/toasts/` (`ToastsWidget`, `overlays.tsx`); revision 3d14d23

## Findings
Findings 1 and 2 were measured identically in Chromium, Firefox and WebKit on production (build 3d14d23) with the fake clock installed and paused, run `20261123T220835Z-a089f8`. It was a temporary observation spec, deleted afterwards; it recorded state and asserted nothing. Finding 3 is from reading the code only.

| # | Steps | Expected | Actual | Cause in the source |
|---|---|---|---|---|
| 1 | Loader: press "Load metrics", then "Force error" while loading, wait 1.6 s | The error stays; the cancelled load never shows a result | First the error alone (correct). **1.6 s later the metric card appears next to "Service unavailable · ledger_timeout"**: both states at once | "Force error" sets `loading=false` and the error, but the `setTimeout` of the load is not cleared; when it fires it sets the data, and the error is only cleared on a new load |
| 2 | Lazy Load: press "Mount lazy panel", press it again 600 ms later | The delay restarts (panel at 1800 ms), or the second press is ignored while loading | The button is **not disabled** while loading. The panel appears at **1200 ms** (first timer) and the button shows "Mount lazy panel" again while the second timer is still pending; that timer fires at 1800 ms | One timer per click, none cleared; `pending` is a boolean that the first timer resets |
| 3 | Toasts: fire two toasts in the same millisecond | Two independent toasts | The ID is `Date.now() + random(0…999)`: about a 1 in 1000 chance that two toasts get the **same ID**. A duplicate React key, and closing or expiring one removes both | Non-unique ID scheme |

## Why it matters
Finding 1 is the classic "late response overwrites the newer state" race of real data loading (fetch without `AbortController`, timers without `clearTimeout`): users see a success and an error together and cannot tell which one is true. Finding 2 is the same pattern on a smaller scale. For a practice lab about loaders, these are good exercises, but they should be documented as such.

## Automation
Not automated. TC-LDR-001…006 and TC-LZY-001…003 assert only the intended, source-verified behaviour and avoid these sequences. If the owner confirms these as defects, they can follow the Bug Playground pattern (reproduce + `test.fail` expected test with a Bug-ID). That needs approval and is outside this phase.
