# [OBS-08] Image Handling Lab: statuses miss image events before hydration, "Reset images" gets stuck, and the New Tab destination has the wrong title

> **Status: DRAFT bug report — not filed.** Found while automating TC-IMG and TC-NWT (Faz 2C.4). No Bug-ID and no automated test; kept outside `docs/bug-reports/`. It is filed only on the owner's decision. QA Practice source was not modified. These findings are **not** the lab's four intentional bug switches; they also occur with every switch off.

- **Type:** Functional / state (hydration race), content
- **Severity (proposed):** Medium for findings 1 and 2 (the lab reports a state that is not the real one, which is exactly what it is meant to teach testers to catch). Low for 3 and 4.
- **Modules:** `/ui-elements/broken-images/` (`ImageHandlingLabWidget`, `extras.tsx`), `/ui-elements/new-tab/destination/` (`app/practice/new-tab/destination/page.tsx`); revision 3d14d23

## Findings
Measured on production (build 3d14d23) in Chromium, Firefox and WebKit, runs `20261123T221917Z-ac5672` (Firefox, WebKit, New Tab in all three) and `20261123T222039Z-6d47d2` (Chromium image lab). It was a temporary observation spec, deleted afterwards; it recorded state and asserted nothing.

| # | Steps | Expected | Actual | Cause in the source |
|---|---|---|---|---|
| 1 | Open the Image Handling Lab and wait 2.5 s | Each card settles: working → loaded, 404/403/corrupted → error (the slow card stays loading while "infinite spinner" is on) | Depends on the browser and on timing. **Chromium: all five stay "loading"** ("Failed images: 0", "Loading images: 5"). Firefox: working loaded, corrupted stuck in "loading". WebKit: working and corrupted stuck in "loading" | The page is statically pre-rendered: the `<img>` elements start loading before React hydrates and attaches `onLoad`/`onError`. Events that fire earlier are lost, so the status stays at its initial "loading". The data-URL image fails immediately and is always missed. |
| 2 | Press "Reset images" (with or without bug switches) and wait 2.5 s | Every card loads again and settles | **Every card stays "loading"**, and the working image's Retry button is enabled | Reset sets all statuses to "loading" and the attempts back to 1. If they were already 1, the `key`s do not change, no image is remounted and no load/error event follows. |
| 3 | Inspect the "Unauthorized image" request | The case says "Expected: 403 Forbidden" | The server answers **404** for `/private/restricted-avatar.png`, the same as the "404" case. The UI shows the 403-specific fallback anyway. | The case is simulated by a missing file; the status is not checked |
| 4 | Open the New Tab destination | Document title "New Tab destination" (the page's metadata) | The title is the site default **"QA Practice \| Interactive QA Practice Platform"** in all three engines | The page's `metadata.title` is not applied (likely overridden by the layout or template; not investigated further) |

"Retry load" works correctly: it changes the key, React mounts a new image after hydration, and the real result is reported. The automated cases therefore retry first (TC-IMG.md).

## Why it matters
Findings 1 and 2 are the classic hydration race: what the page reports depends on how fast the image was, and the "loading" state can be permanent without any spinner bug switched on. A tester who trusts the status chips gets different results per browser. The usual fix is to check `img.complete` / `naturalWidth` in an effect after hydration, or to give the reset a new key. Finding 3 is a lab-content mismatch: a test that checks the response status would fail. Finding 4 affects tab titles, history and accessibility (a screen reader announces the generic title).

## Automation
Not automated. TC-IMG-001…009 and TC-NWT-001…004 assert only the intended, source-verified behaviour and avoid these states. If the owner confirms these as defects, they can follow the Bug Playground pattern (reproduce + `test.fail` expected test with a Bug-ID). That needs approval and is outside this phase.
