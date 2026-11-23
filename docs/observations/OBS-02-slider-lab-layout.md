# [OBS-02] Slider Interaction Lab: metric cards, labels and feedback collapse at desktop widths

> **Status: DRAFT bug report — not filed.** This is an observation found while automating TC-SLD-007. It is not one of the seeded Bug Playground defects, has no Bug-ID and no automated test, and is kept outside `docs/bug-reports/` on purpose (that folder is validated against `bug('…')` references). It is filed only on the owner's decision. QA Practice source was not modified.

- **Type:** UI / layout (responsive)
- **Severity (proposed):** Medium. The lab still works, but the values a tester must compare (current, percentage, last interaction, submitted) are unreadable at common laptop width. That is the module's main purpose.
- **Priority (proposed):** P2
- **Module:** `/ui-elements/slider/` (Slider Interaction Lab)

## Description
In the lab's left column ("Test slider"), the range input, the direct input, the feedback box and the four metric cards are squeezed into a very narrow column on desktop viewports.

- **At 1280×720:** the four metric cards overlap each other. Their labels have no visible width, the values collide, the direct input is too narrow to show its value, and the feedback text overflows its container.
- **At 1920×1080:** the cards no longer overlap, but the labels are still clipped and collide.

## Preconditions
- Desktop browser; Chromium, Firefox and WebKit are all affected.
- Viewport 1280×720 (most visible) or 1920×1080.
- No sign-in needed.

## Steps to reproduce
1. Open `/ui-elements/slider/` at a 1280×720 viewport.
2. Scroll to "Live test area" → "Slider Interaction Lab".
3. Look at the "Test slider" column: the slider, Direct input, the feedback box and the four metric cards.

## Expected result
- Each metric card shows its label and value fully, without overlapping another card.
- Direct input shows its value.
- The feedback message stays inside its box.
- The range track is wide enough for precise pointer interaction.

## Actual result
All numbers below were measured from the DOM in all three engines with identical results. Runs: Firefox `20261123T070846Z-1a7c40`, Chromium `20261123T070849Z-8ac241`, WebKit `20261123T070852Z-5c94b3`; `measurements.json` is attached to each test.

| Measurement | 1280×720 | 1920×1080 |
|---|---|---|
| "Test slider" column width | 73 px | 172 px |
| Range track width | **39 px** | 138 px |
| Metric card width | 26 px each | 28 px each |
| Metric card pairs overlapping (of 6) | **5** | 0 |
| Card label visible width vs. width it needs | **0 px** vs. 55–79 px | **2 px** vs. 55–79 px |
| Feedback box overflows its parent | **yes** (content 69 px, box 24 px) | no; text wraps inside (content 69 px, box 61 px) |

The seeded "display off by one" value ("26 / 100" for 25) is visible in the screenshots. That value is an intentional lab bug and not part of this observation.

## Severity rationale
- The lab is meant for comparing displayed, visual and submitted values. At 1280 px those values overlap and cannot be read, so manual testing is effectively blocked at that width.
- Automated testing is affected too: at 39 px one CSS pixel equals about 5 slider units, which makes pointer-based tests coarse and engine-sensitive (see TC-SLD-007).
- No data loss and no functional failure, hence Medium rather than High.

## Environment
- QA Practice production revision 3d14d23. Measured on the identical local build (`out/`, build d856264, served read-only at 127.0.0.1:4173). Originally seen on production in Firefox.
- Playwright 1.65.1: Chromium, Firefox, WebKit; desktop device profiles; viewport set per test.

## Evidence
- **Original Firefox production screenshot (1280×720):** `evidence/runs/20261122T211653Z-9f6d59/artifacts/slider-slider-Slider-Inter-9da90-only-when-drag-stale-is-off-qa-practice-firefox/test-failed-1.png`. Overlapping card labels and the feedback box overflowing are visible.
- **Lab screenshots, Chromium, 1280×720 and 1920×1080:** HTML report of run `20261123T070927Z-9cb8a4`, also embedded in `html/data/` of that run. The capture waited until the app's splash overlay no longer covered the slider.
- **Invalid screenshots:** the screenshots in runs `…070846Z-1a7c40`, `…070849Z-8ac241` and `…070852Z-5c94b3` show the app's splash overlay instead of the lab. The DOM measurements from those runs are valid.
- All runs above are kept (milestone class).
- The measurement and capture specs were temporary, read-only (no clicks besides navigation), and deleted after the runs.

## Likely cause (source reading; not confirmed by changing the code)
Source: QA Practice 3d14d23, `src/components/practice/widgets/extras.tsx`.

- **Line 1166:** the lab body is `grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]`. The second track (event log, line 1265) has a 280 px minimum and the first track (slider section, line 1167) may shrink to 0. The lab itself is only one column of the page layout: 411 px wide at 1280, 510 px at 1920. After the 280 px minimum, the gap and the padding, the slider section keeps about 73 px (1280) or 172 px (1920), which matches the measurements.
- **Lines 1213 and 1242:** inside that section, `sm:grid-cols-2` (direct input and feedback) and `sm:grid-cols-4` (metric cards) switch on the *viewport* breakpoint, not on the section's width. So four card columns are forced into 73 px.

This explains every measured symptom, but the fix was not tried. For example, the section could stack below `lg` container width, or use container queries for the inner grids.

## Automation
None yet. A regression check could assert that no two metric cards overlap and that each label's visible width is at least its content width, at 1280 and 1920. Adding it is outside Faz 2C.1 scope and needs the owner's approval.
