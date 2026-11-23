# Slider Interaction Lab — test cases

Module: `/ui-elements/slider/` · Automated in `apps/qa-practice/tests/slider/slider.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/phase2c.data.ts`).

## TC-SLD-001 — Defaults: value 25, all bug switches on, display off by one
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context (all four bug switches ON by default).

**Acceptance criteria**
- The seeded off-by-one bug is visible on load.

**Steps**
1. Open the page.

**Expected result**
- Slider value 25, aria-valuetext "25 of 100"; 4 switches checked; display "26 / 100"; feedback data-state=error.

## TC-SLD-002 — With all bug switches off the values are consistent
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context (all four bug switches ON by default).

**Acceptance criteria**
- Display, percentage and submitted value agree.

**Steps**
1. Turn every bug switch off.

**Expected result**
- "25 / 100", "25%", submitted 25, feedback data-state=success.

## TC-SLD-003 — Direct input commits the value
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context (all four bug switches ON by default). Bugs off.

**Acceptance criteria**
- Direct input updates thumb, display, submitted value and log.

**Steps**
1. Enter 60 in Direct input.

**Expected result**
- Slider 60; "60 / 100"; submitted 60; last interaction "direct input"; change event "value 60 · direct input".

## TC-SLD-004 — Direct input is clamped to 0–100 (data-driven: 4 rows)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context (all four bug switches ON by default). Bugs off.

**Acceptance criteria**
- Out-of-range input is clamped; boundaries are accepted.

**Steps**
1. Enter 150, -5, 100, 0.

**Expected result**
- 100, 0, 100, 0 for slider and submitted value.

## TC-SLD-005 — Arrow keys move the value when keyboard input is allowed
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context (all four bug switches ON by default). Bugs off.

**Acceptance criteria**
- Each arrow press is ±1.

**Steps**
1. Focus the slider; ArrowRight ×3, ArrowLeft ×1.

**Expected result**
- Value 27; submitted 27; last interaction "keyboard".

## TC-SLD-006 — The "keyboard blocked" switch stops arrow keys
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context (all four bug switches ON by default). Only keyboardBlocked ON.

**Acceptance criteria**
- Blocked keys do not change the value and are logged.

**Steps**
1. Focus the slider; press ArrowRight.

**Expected result**
- Value stays 25; latest input event "keyboard blocked".

## TC-SLD-007 — A mouse drag updates the submitted value only when "drag stale" is off
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context. Only dragStale ON first. Slider set to 50 via Direct input.

**Acceptance criteria**
- Pressing at the track centre may change the value only by pointer rounding: `|press − 50| ≤ floor(100 / trackWidth + 0.5)`, which is 3 for the 39 px track.
- With dragStale ON, pointer movement never commits: the submitted value stays at the press value.
- With dragStale OFF, the submitted value follows the thumb.

**Steps**
1. Set 50 via Direct input; press the mouse at the track centre, drag to the right end, release.
2. Reset, turn dragStale off, set 50 and drag again.

**Expected result**
- Each step: press value within the tolerance; thumb right of the press value; last interaction "drag".
- Step 1: a "mousemove · dragging" event; submitted = press value; feedback error.
- Step 2: submitted = thumb value; feedback success.

**Why a tolerance and not "press = 50"**
- The tolerance is half a CSS pixel of pointer rounding converted to value units, plus half a step. It assumes the thumb is at most half the track. It was derived from the geometry, not fitted to the observed 47.
- Observed Firefox deviation is 3, exactly at the bound for 39 px. If the layout changes, both scale together.
- Mutation check (2026-11-23, local isolated build, temporary spec deleted afterwards): with `clickOffset` ON, the Firefox press value is 54. The previous oracle (`submitted = press value`) would have passed it; the bound fails it.
- Chromium and WebKit do not fire `input` on the press, so that mutation does not reach them (press value 50).
- Mutation runs: Firefox `20261123T070747Z-d50e44`, Chromium `20261123T070752Z-1c7aa0`, WebKit `20261123T070756Z-3e4eb7`. These runs only log the measured values; they do not assert. The failing runs `20261123T070659Z-7fcf6c`, `…070712Z-5dcc35` and `…070723Z-375e00` are invalid attempts: the temporary spec did not open the page first. They are kept as evidence.

**Browser difference (2026-11-23)**

| Statement | Status | Evidence |
|---|---|---|
| The range track is 39 px wide at 1280×720 in Chromium, Firefox and WebKit | Proven | `boundingBox()` and `getBoundingClientRect()` in a diagnostic run, logged to the console (the runs used `--reporter=line`, so no manifest; see `docs/evidence-retention.md`) |
| Firefox fires `input` on mousedown, before any pointer movement | Proven | Event log of the diagnostic: `pointerdown:25 → mousedown:25 → input:0` before any `mousemove` |
| Chromium/WebKit fire no `input` on mousedown on the thumb | Proven | Same diagnostic; press value 50 in 5/5 runs each |
| The app records an `input` that arrives while the mouse is down and has not moved as a "click" and commits it, even with dragStale ON | Proven | Source `handleRangeInput` (QA Practice 3d14d23, `extras.tsx`), plus Firefox submitted = press value |
| Firefox press at the centre gives 47 | Observed, deterministic | 5/5 local + production runs |
| *Why* it is 47 (pointer rounded from 366.5 to 366 px; thumb width ≈ 20 px) | **Inference, not proven** | Consistent with integer `clientX` values seen in Firefox; thumb width not measured |
| A real Firefox user dragging this slider commits the press value | **Plausible, not tested** | Follows from native mousedown behaviour, but only automated input was observed |

- The original helper pressed at "25 % of the box". That spot is not on the thumb for value 25, so Firefox jumped to 0 and the end value differed by engine (Chromium 92, Firefox/WebKit 100). Evidence of the original failure: `evidence/runs/20261122T211653Z-9f6d59`.
- Each run records the press value, track width and tolerance as the `drag-press-value` annotation.
- The squeezed layout is reported separately as a draft: `docs/observations/OBS-02-slider-lab-layout.md`.

## TC-SLD-008 — Reset lab restores the initial value and clears the event log
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/slider/` is open; fresh browser context (all four bug switches ON by default). Bugs off.

**Acceptance criteria**
- Reset returns to the initial state.

**Steps**
1. Enter 80.
2. Press Reset lab.

**Expected result**
- Slider 25, submitted 25, last interaction "none", "No slider events yet."
