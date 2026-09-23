# Player-controlled island — design QA

final result: passed

## Scope and comparison

Baseline: `/tmp/yeshu-island-life-qa/target-size.png` at 905 × 729. The user rejected the island-to-house proportion and automatic walking, asking for a substantially larger island and a directly controlled character. The baseline and current `/tmp/yeshu-player-qa/target-size.png` were opened together at the same pixel dimensions, default overview and closed panels, alongside current mobile and landscape captures.

The new island uses radii 22 × 17 and an offset center (7, 2), compared with 11.8 × 9.2 previously. The unchanged 8.35 × 6.1 house footprint is approximately 4% of the nominal island area. The cottage is offset in the composition; longer trails, wider meadow/beach, palm groups, rocks, hammock, bench and a farther dock occupy the rest. The teal roof, warm interior, seven app objects, text, palette and native typography remain recognizable. The input and follow controls intentionally replace the automatic walking pause/play control.

No unresolved P0/P1/P2 visual issues were found in the final source/current comparison.

## Environment and evidence

Local URL: http://127.0.0.1:5173/ . Static Python server, no build step. Browser work used the available CUA in-app browser, including native keypress and drag actions, DOM inspection and CDP developer evaluation. No external Playwright or separate browser was used. CDP Input.dispatchKeyEvent is not supported by this browser adapter; a native `pressKey` verified actual keyboard delivery, and sustained holds were additionally tested by dispatching KeyboardEvents to the application's real listeners across animation frames.

All current captures are under `/tmp/yeshu-player-qa/`:

- `target-size.png`: final 905 × 729 default island, player stationary.
- `manual-before.png` / `manual-after.png`: keyboard-controlled movement in the same overview. Native D changed projected X from 368.226 to 369.114; a sustained D hold then moved it to 449.071.
- `indoors.png`: walking through the doorway automatically entered the room, 905 × 729.
- `orbit.png`: changed overhead angle without a dialog opening.
- `mobile.png`: full island and joystick, 390 × 844.
- `joystick.png`: mobile follow view after a native joystick drag; knob returns to center when released.
- `mobile-projects.png`: seven-link tray with joystick hidden.
- `mobile-landscape.png`: 844 × 390 layout; document dimensions equal the viewport. This desktop adapter remains a fine-pointer device at this size; physical coarse-pointer landscape was not tested.
- `fallback.png`: actual WebGL context loss, 390 × 844.

A normal 1280 × 720 desktop viewport was also visually inspected. The initial faded mobile capture during the canvas loading transition was replaced after the scene finished appearing. Viewport overrides were reset and the live preview retained in full-island view with no open panels or movement input.

## Fixes found during implementation

1. [P1, fixed] A coarse shoreline segment gap extended beyond the dock and let the capsule escape beside it. Shore segments are now clipped at the exact two dock-edge coordinates. An eight-direction boundary run and a separate walk to the dock end pass.
2. [P2, fixed] The closer follow view put the introduction over scenery. The introduction is hidden while following, as in the close interior.
3. [P2, fixed] Switching from a zoomed follow view through the room could retain the old orthographic zoom. Camera mode changes explicitly reset zoom; mobile follow → room → island returns to full overview with following false.
4. [P1, fixed] The mobile joystick could overlap app tray links. It now hides when the tray opens, and movement input is cleared/disabled while browsing apps or a dialog.

## Verification

| Check | Result |
| --- | --- |
| Correct local page/title, meaningful rendered content | Pass |
| Blank page or framework error overlay | None |
| Browser console errors/warnings on fresh load | None |
| Desktop, portrait and landscape composition | Pass |
| Native keyboard event reaches movement controller | Pass |
| Sustained movement, release and stationary state | Pass |
| Normalized diagonal speed | Pass |
| Walking through door enters room; walking out exits | Pass |
| Follow view and return to full island | Pass |
| Native mobile-sized joystick drag and release recenter | Pass |
| All seven application titles and original links | Pass |
| Actual shelf-object ray picking after roof is hidden | Pass (ledger) |
| WebGL fallback hides movement/view controls and exposes seven links | Pass |
| JavaScript syntax and git diff whitespace checks | Pass |

The numerical integration test `/tmp/yeshu-player-qa/check-player.mjs` runs the actual Rapier-backed player controller, not a copy of its implementation. Its 22,800 samples cover stationary state, stopping after release, movement, stairs/doorway, room exit, back and side walls, eight coast directions, and diagonal speed normalization. A separate dock approach reached (8.015, 22.358), stopped at its end barrier, and retained the dock floor height. A sloping-beach stop settled by less than 0.01 world units over four seconds.

Browser integration observed actual native D movement, then held-key integration tests passed through the door (view became `room`) and back outside (view became `island`). A stationary 90-frame observation left the marker style unchanged. On the mobile viewport, a native drag on the joystick activated follow mode; release returned its transform to `translate(0px, 0px)`. All seven mobile tray entries opened correct details and destinations; Escape closed them. Clicking the real roof entered the house and clicking the actual ledger opened 导游账本. Homepage mailto count is zero.

## Implementation and limits

The existing Three.js scene now consumes separate input, physics and visual character modules. The Rapier 0.20.0 compatibility ESM build is vendored locally with its Apache-2.0 license. Physics and rendering share terrain data and shore dimensions. No automatic walking route remains. Simulation/pose/camera rendering stops when settled and pauses on hidden-page/context-loss states. Blur, cancel and panel transitions clear input.

Browser-size testing is not physical-phone acceptance. Real phone touch behavior, GPU frame rate and other browser engines were not tested. Pinch zoom is configured through OrbitControls but was not physically gesture-tested. No deployment or commit was performed, and unrelated legal-page edits were preserved.
