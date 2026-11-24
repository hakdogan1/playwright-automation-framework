# Iframes — test cases

Module: `/ui-elements/iframes/` · Automated in `apps/qa-practice/tests/iframes/iframes.spec.ts`
Source of expected values: QA Practice `IframesWidget` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/iframes.data.ts`.

> **Frame sources.** Both frames are inline `srcdoc` documents (`about:srcdoc`, no `src`), so nothing is loaded from another origin and the Production Guard allowlist needs no frame host. TC-IFR-007 asserts this.

> **Message recorder.** TC-IFR-004/005/006/008 add a second `message` listener in the parent (`IframesPage.recordMessages()`, observation only) to see the value each submission carries. The app's own listener and counter are unchanged. Messages from one frame arrive in order, which TC-IFR-006 relies on.

> **Not asserted here (see `docs/observations/OBS-05-iframes-messaging.md`).** Measured in Chromium, Firefox and WebKit: the parent counts a submit message from any window (no origin or source check), the "nested" support frame is a sibling of the site frame, and an empty message is counted.

## TC-IFR-001 — Both frames render their documents and the parent counter starts at 0
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context.

**Acceptance criteria**
- The embedded site frame and the support form frame are present, titled and rendered; the parent shows the submission counter.

**Steps**
1. Check the frame titles, the site heading inside its frame, the support form controls and the counter.

**Expected result**
- Titles "HSNAKD QA page" and "Nested support form"; heading "Practical QA for better software." inside the site frame; intro "Nested support widget", an editable "Message" input and an enabled "Send message" button inside the support frame; counter "Nested frame submissions received by parent: 0".

## TC-IFR-002 — Frame content is reachable only through its frame
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context.

**Acceptance criteria**
- The frame boundary is real: frame elements are not part of the parent document, and parent elements are not part of a frame.

**Steps**
1. Look up the site heading, the support input and the send button from the parent document.
2. Look up the parent counter from inside the support frame, and the support input from inside the site frame.

**Expected result**
- Each element is found exactly once through its own frame and 0 times from any other document.

## TC-IFR-003 — The embedded site shows its navigation, practice areas and call to action
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context.

**Acceptance criteria**
- The site frame renders the full mock page.

**Steps**
1. Check the navigation, the section heading, the cards and the call to action inside the site frame.

**Expected result**
- Navigation "About", "QA Practice", "Resources"; heading "QA practice areas"; cards "UI testing", "Test automation", "Bug investigation" in this order; "Explore QA resources →".

## TC-IFR-004 — Sending a message from the support frame increments the parent counter
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context; message recorder active.

**Acceptance criteria**
- A submission inside the frame reaches the parent window, which updates its counter.

**Steps**
1. Check the input placeholder.
2. Type "Checkout page shows a blank total" and press "Send message".

**Expected result**
- Placeholder "Type a message"; counter "… received by parent: 1"; the input keeps the text; the parent received exactly one message carrying that text.

## TC-IFR-005 — Each submission is counted once
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context; message recorder active.

**Acceptance criteria**
- The counter equals the number of submissions; no submission is lost or counted twice.

**Steps**
1. Send three different messages, one after another.

**Expected result**
- The counter shows 1, 2 and 3 after each send; the parent received the three texts in order.

## TC-IFR-006 — Typing or pressing Enter does not send; only the button does
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context; message recorder active.

**Acceptance criteria**
- The support form has no `<form>`; only the button sends.

**Steps**
1. Type "typed only" and press Enter.
2. Replace the text with "sent" and press "Send message".

**Expected result**
- The parent received only "sent" (an Enter message would have arrived before it); counter 1.

## TC-IFR-007 — Both frames are inline documents and load nothing over the network
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context; request listener attached before a reload.

**Acceptance criteria**
- The frames are self-contained: no `src`, an inline `srcdoc`, and no request from either frame.

**Steps**
1. Reload the page with a request listener and send one message.
2. Check both frame elements and the frame tree.

**Expected result**
- No `src` attribute; `srcdoc` starts with `<!doctype html>`; frame URL `about:srcdoc`; 3 frames in total (main + 2); 0 requests made by the child frames; counter 1.

## TC-IFR-008 — Markup and special characters are sent as plain text
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/iframes/` is open; fresh browser context; message recorder active.

**Acceptance criteria**
- Input text crosses the frame boundary unchanged and is never rendered as HTML.

**Steps**
1. Send `<b id="injected">bold</b> & "quotes" — ünïcødé ✓`.

**Expected result**
- Counter 1; the parent received exactly that string; the input keeps it; no element `#injected` exists in the parent or in either frame.
