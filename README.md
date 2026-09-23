# Yeshu · Apps

Personal homepage and app landing pages for `app.yeshu.fun`.

Run locally with `python3 -m http.server 5173 --bind 127.0.0.1`, then visit http://127.0.0.1:5173/. No install or build step is required.

## Island studio homepage

The homepage opens with a full orthographic island view. The island is 44 × 34 nominal world units around an offset center; the 10 × 6.1 studio uses the same wider footprint inside and outside. Meadow, broad beaches, a long loop trail, palms, rocks, a hammock, a garden bench and a dock surround the complete cottage. Entering the room reveals the original desk, printer, Avata 2 and snowboard, plus a single bed along the left wall and a full-size bookcase beside the desk holding small app icon models.

- `island-layout.js`: shared island dimensions, terrain mesh data, shoreline, outdoor obstacles.
- `room-island.js`, `room-sea.js`: rendered terrain, sea, paths, vegetation, furniture, dock, moored dinghy and animated shoreline foam.
- `room-weather.js`: simulated sunny/cloudy/rainy weather, local clock, full-day light/shadow/color changes and manual time preview. The clock follows the visitor device time; “回到此刻” restores it after scrubbing. Weather is explicitly simulated; no location permission or weather API is used.
- `room-layout.js`: shared cottage footprint, physical window openings and furniture positions used by rendering and collision. The original four windows stay attached to their walls: two on the entrance wall, one on each side, and none on the back wall.
- `room-model.js`, `room-exterior.js`, `room-furniture.js`, `room-atmosphere.js`: complete exterior, cutaway interior, equipment and furnishings.
- `room-player.js`: Rapier kinematic character simulation, capsule collider, walls, furniture, both islands' shore boundaries, steps, piers and football goals. Physics uses the same terrain data as rendering.
- `room-input.js`: screen-relative WASD/arrow keys and captured-pointer joystick input, normalized diagonals and release/blur/cancel cleanup.
- `room-resident.js`: the user-supplied snowboarder, loaded from a local animated GLB with Three.js GLTFLoader. Standing, walking and greeting follow the existing player simulation; `room-resident-fallback.js` keeps the small procedural character available if the model fails to load. No automatic roaming routes remain.
- `room-scene.js`: camera modes, follow view, input/simulation/render loop, ray picking and lifecycle.
- `room.js`, `index.html`, `room.css`: app links and dialogs, mobile controls, accessible fallback and responsive layout.

Use WASD or arrow keys to move in screen directions. On mobile, drag the lower-left joystick; releasing it stops movement. Mobile movement automatically starts a closer following view. “跟随人物” / “看全岛” switches between a closer following camera and the full overview. Drag the canvas to orbit through 360 degrees in either view; wheel/pinch zoom also works inside. Interior vertical orbit and zoom stay within comfortable bounds, and only the near walls are cut away. The entrance and right wall can both be inspected by rotating around the room. Foreground palm trees follow the cutaway so they cannot cover the interior. Walking through the doorway enters the close room view; walking back outside restores the island view. “走进小屋” / “回到小岛” provides a quick move to the inside/outside entry position as an alternative. The indoor reset control changes only the camera. Click the character (or the “你” marker), or press G while stationary, to wave; walking interrupts the greeting. The character lowers the hand naturally at rest, and the room’s existing snowboard remains a separate scene prop.

The capsule controller handles walls, furniture, terrain slopes, entry steps and the coast. A physical opening in the coastal boundary aligns precisely with the dock and its side barriers. The character does not automatically walk or follow a route. Opening weather settings, the accessible app tray or a dialog clears movement input; blur, hidden-page and pointer-cancel events also clear it. Reduced-motion settings disable camera damping and ambient breathing, while preserving deliberate movement input.

Click any small App icon on the bookcase to the right of the desk to open its own introduction directly; hovering reveals its name. Clicking the cabinet itself opens the complete app catalogue. It includes all 13 applications found on the public US/CN App Store developer listings on 2026-09-23, cross-checked against the account inventory, plus the existing DiveJournal prototype labelled “测试中”. The former full-width display shelves and oversized app keepsakes have been removed. Four tidy rows display the original icon artwork as freestanding rounded tiles. The furniture stays full size while individual App models stay small. There is no permanent homepage shelf button. A focusable bookcase marker and the keyboard skip link also open the catalogue; the close control and Escape restore focus. The mobile catalogue hides the joystick while open and scrolls on short screens. Hidden exterior meshes do not block individual App picking. No contact or email action is present on the homepage.

Outdoor rendering also animates the boat, shore foam, water, clouds and rain, with idle ambient frames capped at 24 fps. Interior rendering stops when input, physics, character animation and camera transitions settle. Reduced-motion mode holds ambient effects still. Hidden pages stop rendering, and closing dialogs resumes the outdoor effects. The character completes one breathing cycle after loading or stopping, then rests; greetings also finish instead of forcing a permanent render loop. Reduced-motion settings skip ambient breathing. Page visibility and WebGL context lifecycle are handled. The native app links remain usable when WebGL fails or JavaScript is disabled; About keeps its hash fallback.

Rapier 3D compatibility 0.20.0 is vendored locally in `assets/vendor/rapier/`, including its Apache-2.0 license. Its ESM build embeds WebAssembly; no build step or remote runtime service is added. Documentation: https://rapier.rs/docs/user_guides/javascript/character_controller/ . Existing generated textures and licensed Bootstrap icons are reused.

The archived `atlas-*` prototype files are not loaded by the current entry page. Existing app landing pages are separate from the room implementation.

Asset provenance and licenses are recorded in `assets/SOURCES.md` and `assets/vendor/`. Earlier browser verification is recorded in `design-qa.md`; later checks and screenshots are reported in their task replies.

## Custom snowboarder — 2026-09-22

`assets/models/snowboarder-web.glb` is the web derivative of the user-supplied, repaired Blender character: 32 bones, 59,390 triangles, three animation clips (`Idle`, `Walk`, `Wave`) and embedded 1024 px JPEG textures. The local asset is approximately 3.4 MB, compared with the 48 MiB editing/export master. The standing hand and gait were adapted for this controllable island character; the held board is excluded from the player. No model upload or third-party runtime CDN is used. The original Blender project stays outside the web repository.

## Custom snowboard prop — 2026-09-23

`assets/models/snowboard-web.glb` replaces the procedural coral board with the user's orange-and-black snowboard and its two bindings. The 3,848,040-byte web copy contains 37,500 triangles and embedded 1024 px color, normal and metallic/roughness textures. Its upright model is 1.88 world units tall and stands beside the left wall, forward of the desk so the board remains visible. The supplied 75 MiB source stays unchanged outside the repository.

`room-model.js` loads the board with the existing local GLTFLoader, adds reflected studio light for its PBR materials, and releases its textures and lighting resources on disposal. If the GLB fails to load, the former procedural board remains available and the room still opens. Desktop (1440 × 1000) and mobile (390 × 844) browser checks covered entering, leaving and re-entering the cottage, visible placement, texture loading and a simulated model-load failure.

## Island atmosphere — 2026-09-23

KeepShot uses its local iOS icon and App Store destination `6772764457` (verified via Apple lookup on 2026-09-23). It is now part of the side-bookcase catalogue described below. Sunny, cloudy and rainy presets update actual scene clouds, rain and lighting. Morning, noon, sunset and night interpolate across a 24-hour local clock, including changing sun direction and warm cottage windows. The time slider previews 00:00–23:59 without altering the device clock. The dock boat now ferries the player between the cottage island and the football island, as described below.

## Wider cottage, single bed and stable wall cutaway — 2026-09-23

The full-size bookcase measures 1.85 × 2.35 × 0.46 world units and stands against the rear wall to the right of the desk. A 1.65 × 2.85 single bed with an oak frame, pillow and sage linen occupies its former position along the left wall. The cottage width increases from 8.35 to 10 units (about 20%); its floor, walls, roof, side windows, exterior pots and walking bounds follow the new footprint. The same `BOOKCASE` definition drives its position, rotation, mesh dimensions and collider. Shared `DESK` and `WORKBENCH` layouts place the computer desk against the back wall and the rotated printer workbench against the right wall, with matching colliders. Four shelves hold 14 directly selectable 0.29-unit App icon models, with original artwork and no lift animation or shelf spotlights. The sofa, rug and low floor stool are removed; the cup sits on the desk, the chair aligns with it, and the plant, snowboard and floor lamp occupy the room edges. A small landscape print reuses `room-evening.webp` on the solid back wall.

All windows use `CABIN_WINDOWS` positions and dimensions for their actual wall openings and shared frame geometry. The two front windows stay beside the real doorway in both views; the previously added rear windows have been removed. Wall visibility follows camera direction, including wall-mounted curtains and artwork. Separate directional thresholds (`.32` to hide, `-.06` to restore) provide roughly 22° of hysteresis; a continuous 180 ms dwell rejects brief crossings. The render loop stays active until pending transitions finish, including reduced-motion mode, then returns to idle. Entering the room initializes the cutaway immediately; leaving restores the complete exterior. The room can be inspected from every side without moving its architecture or furniture.

The catalogue contains 起落, KeepShot · 流影, 潜彩, 拍尺, 衣序, 导游账本, 山海 · 旅行笔记, 问道, DailyFrame, OutTool · 户外工具, 数独, Material Color and 古诗词笔记本. Their links use a verified public storefront. Existing DiveJournal stays marked as a prototype. 照理, Little Lines, KeepShot Legacy, 一炉香, NoseCare and 庐山 were not publicly released at verification. 猜四川 has a historical ready-for-sale version in App Store Connect but returns no current public record in either checked storefront; it is not advertised as currently downloadable.

## Selectable island characters — 2026-09-23

The “选择人物” control opens a native dialog with previews for the original snowboarder and the new alpine explorer. The alpine explorer (“雪山探索者”) is the default when no valid choice has been saved; an explicit saved selection still takes precedence. Selection keeps the player position and heading, saves locally in this browser, and swaps only after loading succeeds. A failed request keeps the current character and permits retry. The dialog suspends movement and supports Escape and focus restoration. All paper dialogs initially focus their title so opening one does not highlight its close control; keyboard focus outlines remain available on interactive controls.

`room-character-picker.js` and `.css` implement the picker. `room-resident.js` defines the model catalogue and loads the selected rig. The alpine explorer is 5,010,132 bytes with 22 bones, 72,266 triangles and Idle / Walk / Wave clips. Its editable master and scripts are in `/Users/yeshu/Downloads/alpine_explorer_rigged/`; the website ships only the optimized GLB and previews. This is a body FK rig without separate facial or finger controls.

The alpine Walk clip narrows the ankle spacing by about 40% and reduces toe-out by 9 degrees, with sole orientation and pelvis height compensated for ground contact. Idle and Wave keep their original standing stance.

## Neighbouring football island — 2026-09-23

`room-football-island.js` adds a separate sandy island to the right of the cottage island, with a striped grass pitch, field markings, two netted goals, corner flags, palms, benches and a landing pier. It reuses the local sand and wood assets and draws its pitch texture locally. `island-layout.js` supplies both coastlines through the same terrain generator, plus shared ferry stops and pier dimensions. Both islands have matching terrain, shore, pier and obstacle colliders.

Desktop overview frames both islands side by side. Portrait overview rotates the camera to frame them vertically, while the follow view retains its previous character scale. The existing room view, orbit controls and character movement remain available.

Walk to the end of the cottage pier, then press E, click the boat or use the boarding button. `room-ferry.js` boards the character and follows a 14-second route around the southern and eastern coast to the football pier. The camera starts following on boarding. At arrival, choose the disembark action or press E, then walk onto the pitch. The same boat waits there for the return trip. The room shortcut is unavailable on the football island or while aboard; the sea cannot be crossed on foot. Boarding and landing have short transitions, sailing disables movement, repeated boarding is ignored, and dialogs or weather controls pause the crossing. Deliberate ferry travel still works with reduced motion; hiding the page pauses the scene as before.
