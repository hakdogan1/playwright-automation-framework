# Keyboard Keys — test cases

Module: `/ui-elements/keyboard-keys/` · Automated in `apps/qa-practice/tests/keyboard-keys/keyboard-keys.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/phase2c.data.ts`).

## TC-KEY-001 — The playground reports typing, last key and validation
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context. "Show live keyboard details" expanded.

**Acceptance criteria**
- Metrics react to real key events.

**Steps**
1. Type "abc123456789" key by key.
2. Press Space.

**Expected result**
- Characters typed = 13; Last key pressed = Space; Validation state goes Empty → Valid.

## TC-KEY-002 — Validation stays Invalid below 12 characters or without a digit
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context.

**Acceptance criteria**
- Valid needs ≥12 characters, a letter and a digit (400 ms debounce).

**Steps**
1. Enter "abc12345678" (11 chars).
2. Enter "abcdefghijklm" (no digit).
3. Enter "abcdef123456" (exactly 12).

**Expected result**
- Invalid, Invalid, then Valid (boundary).

## TC-KEY-003 — OTP boxes auto-advance and accept digits only
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context.

**Acceptance criteria**
- A digit moves focus forward; a non-digit is dropped.

**Steps**
1. Focus box 1 and type "4a2".

**Expected result**
- Values ["4","2","","","",""]; focus on box 3.

## TC-KEY-004 — Backspace in an empty OTP box moves focus back
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context.

**Acceptance criteria**
- Backspace on an empty box focuses the previous box without clearing it.

**Steps**
1. Type "12" in box 1.
2. Press Backspace in empty box 3.

**Expected result**
- Focus on box 2; values unchanged.

## TC-KEY-005 — Search shows a spinner, then debounced results
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context. Fake clock installed and paused (only advance() moves time).

**Acceptance criteria**
- Results appear only after the 550 ms debounce.

**Steps**
1. Type "Playwright".
2. Advance 500 ms.
3. Advance 100 ms more.

**Expected result**
- Spinner visible and no results at 500 ms; at 600 ms spinner gone and the 3 expected results shown.

## TC-KEY-006 — A search without "play" reports no strong matches
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context. Fake clock installed and paused (only advance() moves time).

**Acceptance criteria**
- Non-matching queries give a single message.

**Steps**
1. Type "cypress".
2. Advance past the debounce.

**Expected result**
- One item: No strong matches for “cypress…”.

## TC-KEY-007 — Password strength scoring (data-driven: 4 rows)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context.

**Acceptance criteria**
- Score label follows the documented 0–4 scale.

**Steps**
1. Enter each of "abc", "abcdefgh", "Abc1", "Abcdefg1!".

**Expected result**
- Weak 1/4, Fair 2/4, Strong 3/4, Excellent 4/4, each with "(challenge needs ≥3)".

## TC-KEY-008 — Phone mask formats digits, strips letters and stops at 10 digits
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context.

**Acceptance criteria**
- Mask (XXX) XXX-XXXX; letters ignored; max 10 digits.

**Steps**
1. Type "555abc123456789" key by key.

**Expected result**
- Value "(555) 123-4567"; "Digits captured: 10/10".

## TC-KEY-009 — The disabled input cannot be edited
- **Type:** Negative
- **Priority:** P3
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context.

**Acceptance criteria**
- Disabled field keeps its seeded value.

**Steps**
1. Inspect the disabled input.

**Expected result**
- Disabled, not editable, value "Read-only release 2026-Q2".

## TC-KEY-010 — Completing all inputs passes the challenge
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/keyboard-keys/` is open; fresh browser context.

**Acceptance criteria**
- Challenge banner appears only when OTP, search, password ≥3 and phone are complete.

**Steps**
1. Check no banner.
2. Type 6 OTP digits, search "Playwright", password "Abcdefg1!", phone "5551234567".

**Expected result**
- No banner initially; then "SUCCESS — all QA inputs passed".
