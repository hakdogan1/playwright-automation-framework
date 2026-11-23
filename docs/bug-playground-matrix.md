# Bug Playground — defect traceability matrix

Source of truth: QA Practice source at the deployed revision `3d14d23`
(`src/data/bug-playground-discovery-registry.ts`, `src/components/bug-playground/buggy-demo-app.tsx`).
All **15** seeded defects were verified in the source and automated.

Each defect has:
- a **reproduction** test (`@bug-repro`) — PASS means the defect was reproduced,
- an **expected-behaviour** test (`@known-bug`, `test.fail()`) — an *expected failure* while the defect exists;
  if the defect is fixed the test passes and Playwright reports it red, so the catalog gets updated by a human,
- for #7, #9 and #13 a **control** test (`@control`) proving the non-defective path works.

Results (×3 = Chromium, Firefox, WebKit; production, guard active):
Chromium `evidence/runs/20261122T203512Z-be6b68` · Firefox + WebKit `evidence/runs/20261122T203901Z-89f84e` ·
isolated local build `evidence/runs/20261122T203431Z-873667`.

| Bug-ID | TC-ID | Defect | Area | Severity | Spec | Reproduction | Expected behaviour | Determinism |
|---|---|---|---|---|---|---|---|---|
| [BUG-BP-01](bug-reports/BUG-BP-01.md) | TC-BUG-001 | Add to cart adds two units on a double-click | Cart · Add to cart | Major | `cart.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-02](bug-reports/BUG-BP-02.md) | TC-BUG-002 | Catalog search is case-sensitive | Catalog · Search | Minor | `catalog.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-03](bug-reports/BUG-BP-03.md) | TC-BUG-003 | Cart total renders floating-point noise (19.990000000000002) | Cart · Total | Major | `cart.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-04](bug-reports/BUG-BP-04.md) | TC-BUG-004 | Logout in the storefront does not end the session | Account · Logout | Critical | `account.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-05](bug-reports/BUG-BP-05.md) | TC-BUG-005 | Product count does not update after a category change | Catalog · Product count | Minor | `catalog.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-06](bug-reports/BUG-BP-06.md) | TC-BUG-006 | Cart quantity can go to zero and negative | Cart · Quantity | Critical | `cart.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-07](bug-reports/BUG-BP-07.md) | TC-BUG-007 | Required display name accepts whitespace only | Profile · Display name | Major | `account.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-08](bug-reports/BUG-BP-08.md) | TC-BUG-008 | Shipping policy link does nothing | Footer · Shipping policy | Minor | `feedback.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-09](bug-reports/BUG-BP-09.md) | TC-BUG-009 | Empty promo code reports "Promo code applied ✓" | Checkout · Promo code | Major | `feedback.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-10](bug-reports/BUG-BP-10.md) | TC-BUG-010 | Newsletter consent is pre-checked | Profile · Marketing consent | Major | `account.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-11](bug-reports/BUG-BP-11.md) | TC-BUG-011 | Compare clears instead of comparing | Catalog · Compare | Minor | `feedback.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-12](bug-reports/BUG-BP-12.md) | TC-BUG-012 | Wishlist reports "Saved" but nothing is saved | Catalog · Wishlist | Minor | `feedback.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-13](bug-reports/BUG-BP-13.md) | TC-BUG-013 | Sort control does not reorder products | Catalog · Sort | Major | `catalog.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-14](bug-reports/BUG-BP-14.md) | TC-BUG-014 | "Refresh prices" claims success without fetching data | Catalog · Refresh prices | Major | `catalog.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |
| [BUG-BP-15](bug-reports/BUG-BP-15.md) | TC-BUG-015 | Chat shows "online" while all agents are offline | Support · Live chat | Minor | `feedback.bugs.spec.ts` | PASS ×3 | expected-fail ×3 | Deterministic |

Every expected-behaviour failure was checked to fail at its own assertion (not at navigation or readiness): 45/45.

## Notes
- **Sign-in:** the playground requires sign-in. Tests set the app's own offline demo-session flag
  (`vl-lab-demo-session`) — no credentials, no Supabase sign-in.
- **Timers:** #4, #7, #9, #11, #12 read a toast that lives 420 ms; those tests freeze timers with `page.clock`.
- **OBS-01 (not a seeded defect):** with a session, the app queries Supabase `rest/v1/bug_progress` for the
  synthetic demo user and attempts an upsert when a defect is discovered. In production runs the guard blocked
  344 such GET requests (Chromium 114, Firefox + WebKit 230); no write was attempted because the blocked read
  makes the app stop. See `bug-reports/BUG-BP-04.md`.
- **Severity** is the application's own registry value; **priority** is left to a human.
- Bug reports are issue-ready Markdown; nothing is filed automatically.
