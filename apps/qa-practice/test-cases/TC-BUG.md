# Bug Playground — seeded defect test cases

Module: `/bug-playground/` (requires sign-in; tests use the app's offline demo session, no credentials).
Automated in `apps/qa-practice/tests/bug-playground/`. Each TC has a **reproduction** test (passes while the defect exists)
and an **expected-behaviour** test declared with `test.fail()` (fails while the defect exists). Bug reports: `docs/bug-reports/`.

## TC-BUG-001 — Add to cart adds two units on a double-click
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P2 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-01 (`dup-add-cart`)
- **Preconditions:** Signed in (demo session); cart empty.

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-01.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Double-click "Add to cart" for Latency Meter Mk II.

**Expected result**
- One rapid double activation adds a single unit (quantity 1).

## TC-BUG-002 — Catalog search is case-sensitive
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P3 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-02 (`search-case-sensitive`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-02.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Type "signal splitter" in Search catalog.

**Expected result**
- Signal Splitter is listed (matching ignores letter case).

## TC-BUG-003 — Cart total renders floating-point noise (19.990000000000002)
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P2 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-03 (`cart-total-float-precision`)
- **Preconditions:** Signed in (demo session); cart empty.

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-03.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Add Latency Meter Mk II (12.34).
3. Add Signal Splitter (7.65).

**Expected result**
- Total USD reads 19.99 (two decimals).

## TC-BUG-004 — Logout in the storefront does not end the session
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P1 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-04 (`fake-logout-session`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-04.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Open the account menu ("Account · Demo").
3. Press "Logout".

**Expected result**
- The session ends: the lab offers "Sign in to lab" and the session flag is cleared.

## TC-BUG-005 — Product count does not update after a category change
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P3 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-05 (`category-count-stale`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-05.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Select category "Kits".

**Expected result**
- "Showing 1 products" (one Kits product is visible).

## TC-BUG-006 — Cart quantity can go to zero and negative
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P1 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-06 (`cart-negative-quantity`)
- **Preconditions:** Signed in (demo session); cart empty.

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-06.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Add Latency Meter Mk II.
3. Press "Decrease quantity" twice.

**Expected result**
- Quantity never goes below 1, or the line is removed.

## TC-BUG-007 — Required display name accepts whitespace only
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P2 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-07 (`profile-name-whitespace-only`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-07.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Account menu → Edit profile.
3. Enter three spaces as Display name (required) and press Save.

**Expected result**
- Save is rejected with a validation message; the dialog stays open.

## TC-BUG-008 — Shipping policy link does nothing
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P3 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-08 (`shipping-policy-dead-link`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-08.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Click "Shipping policy" in the footer.

**Expected result**
- The shipping policy opens (navigation, new tab or dialog).

## TC-BUG-009 — Empty promo code reports "Promo code applied ✓"
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P2 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-09 (`promo-empty-still-applies`)
- **Preconditions:** Signed in (demo session); promo field empty.

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-09.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Press "Apply" next to Promo without entering a code.

**Expected result**
- A validation message (or no action); no success message.

## TC-BUG-010 — Newsletter consent is pre-checked
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P2 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-10 (`newsletter-prechecked-dark-pattern`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-10.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Account menu → Edit profile.

**Expected result**
- "Send me QA tips & product updates" starts unchecked.

## TC-BUG-011 — Compare clears instead of comparing
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P3 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-11 (`compare-button-noop`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-11.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Press "Compare" for Latency Meter Mk II.

**Expected result**
- The product appears in a comparison (list, page or clear disabled state).

## TC-BUG-012 — Wishlist reports "Saved" but nothing is saved
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P3 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-12 (`wishlist-button-noop`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-12.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Press the wishlist (♡) button for Latency Meter Mk II.
3. Reload the page.

**Expected result**
- The toggle shows the item is saved (aria-pressed="true") and stays saved after reload.

## TC-BUG-013 — Sort control does not reorder products
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P2 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-13 (`sort-dropdown-ignored`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-13.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Select "Price · high → low" in Sort catalog.

**Expected result**
- Order: Traffic Sniffer Probe, Latency Meter Mk II, Signal Splitter.

## TC-BUG-014 — "Refresh prices" claims success without fetching data
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P2 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-14 (`refresh-catalog-fake-success`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-14.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Note the prices.
3. Press "Refresh prices".

**Expected result**
- Current prices are requested from the server (a catalog request is made).

## TC-BUG-015 — Chat shows "online" while all agents are offline
- **Type:** Defect reproduction + expected behaviour
- **Priority:** P3 (test priority; bug priority is a human decision)
- **Bug:** BUG-BP-15 (`chat-widget-shows-online-offline`)
- **Preconditions:** Signed in (demo session).

**Acceptance criteria**
- The reproduction test observes exactly the defective behaviour described in BUG-BP-15.
- The expected-behaviour test asserts the correct behaviour and is marked `test.fail()` until the defect is fixed.

**Steps**
1. Open /bug-playground/.
2. Open "Live chat".

**Expected result**
- The presence indicator shows offline when the panel says all agents are offline.
