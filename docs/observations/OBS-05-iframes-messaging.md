# [OBS-05] Iframes: the parent counts submit messages from any window, and the "nested" frame is not nested

> **Status: DRAFT — not filed.** Found while automating TC-IFR (Faz 2C.2D). No Bug-ID and no automated test; kept outside `docs/bug-reports/`. It is filed only on the owner's decision. QA Practice source was not modified. (This is the "iframes postMessage origin check" candidate mentioned in OBS-03.)

- **Type:** Security (message trust) / content
- **Severity (proposed):** Low. It is a practice lab with no data behind the counter, but it shows a pattern that is a real vulnerability in production code.
- **Module:** `/ui-elements/iframes/` (`IframesWidget`, `data.tsx`, revision 3d14d23)

## Findings
Measured identically in Chromium, Firefox and WebKit on production (build 3d14d23), run `20261123T215419Z-feb2d8`. It was a temporary observation spec, deleted afterwards; it recorded state and asserted nothing.

| # | Steps | Expected | Actual | Cause in the source |
|---|---|---|---|---|
| 1 | From the parent page itself (not a frame), run `window.postMessage({source:'validation-lab/frame-submit'}, '*')` | Ignored: only the support frame may submit | **Counted**: the counter goes up by one | The listener checks only `e.data.source`; it never checks `e.origin` or `e.source` (the sending window). The frame posts with target origin `'*'`. |
| 2 | Inspect the frame tree | The "Nested support iframe" sits inside the embedded site frame | It is a **sibling** of the site frame (both are children of the page; 3 frames in total). It reaches the parent via `parent.parent`, which is the top page because the top page's parent is itself. | Both `<iframe>`s are rendered directly in `frame-host` |
| 3 | Press "Send message" with an empty input | Not sent, or sent with a validation message | **Counted** (the value is ignored by the parent anyway) | No check on the value |

Other notes:
- Neither frame has a `sandbox` attribute, and both run scripts. They are same-origin `srcdoc` documents, so a sandbox would change nothing for this lab, but a real embed of third-party content would need one.
- Immediately after the click the counter can still show the old value (the message is delivered asynchronously); tests must wait for the text, not read it once.

## Why it matters
In real products, `postMessage` handlers that skip the origin check are a classic cross-frame injection point: any page that can frame or open the app can send "trusted" messages. For a practice lab about frames, checking `e.source === nestedFrame.contentWindow` (or the origin) would also teach the right pattern. Finding 2 matters for learners: a test written for a nested frame (`frameLocator(a).frameLocator(b)`) fails here.

## Automation
Not automated. TC-IFR-001…008 assert only the intended, source-verified behaviour. If the owner confirms these as defects, they can follow the Bug Playground pattern (reproduce + `test.fail` expected test with a Bug-ID). That needs approval and is outside Faz 2C.2D.
