# Yeshu · Apps

Personal homepage and app landing pages for `app.yeshu.fun`.

Run locally with `python3 -m http.server 5173 --bind 127.0.0.1`, then visit http://127.0.0.1:5173/. No install or build step is required.

## Island studio homepage

The homepage opens with a full orthographic island view. The island is 44 × 34 nominal world units around an offset center; the unchanged 8.35 × 6.1 studio occupies roughly 4% of that land footprint. Meadow, broad beaches, a long loop trail, palms, rocks, a hammock, a garden bench and a dock surround the complete cottage. Entering the room reveals the original desk, printer, Avata 2, snowboard and seven small app objects.

- `island-layout.js`: shared island dimensions, terrain mesh data, shoreline and outdoor obstacle positions.
- `room-island.js`: rendered terrain, sea, paths, vegetation, furniture and dock.
- `room-model.js`, `room-exterior.js`, `room-furniture.js`, `room-atmosphere.js`: complete exterior, cutaway interior, equipment and cozy furnishings.
- `room-player.js`: Rapier kinematic character simulation, capsule collider, walls, furniture, shore boundary, steps and dock. Physics uses the same terrain data as rendering.
- `room-input.js`: screen-relative WASD/arrow keys and captured-pointer joystick input, normalized diagonals and release/blur/cancel cleanup.
- `room-resident.js`: the user-supplied snowboarder, loaded from a local animated GLB with Three.js GLTFLoader. Standing, walking and greeting follow the existing player simulation; `room-resident-fallback.js` keeps the small procedural character available if the model fails to load. No automatic roaming routes remain.
- `room-scene.js`: camera modes, follow view, input/simulation/render loop, ray picking and lifecycle.
- `room.js`, `index.html`, `room.css`: app links and dialogs, mobile controls, accessible fallback and responsive layout.

Use WASD or arrow keys to move in screen directions. On mobile, drag the lower-left joystick; releasing it stops movement. Mobile movement automatically starts a closer following view. “跟随人物” / “看全岛” switches between a closer following camera and the full overview. Drag the canvas to orbit; wheel/pinch zoom is enabled outdoors. Walking through the doorway enters the close room view; walking back outside restores the island view. “走进小屋” / “回到小岛” provides a quick move to the inside/outside entry position as an alternative. The indoor reset control changes only the camera. Click the character (or the “你” marker), or press G while stationary, to wave; walking interrupts the greeting. The character lowers the hand naturally at rest, and the room’s existing snowboard remains a separate scene prop.

The capsule controller handles walls, furniture, terrain slopes, entry steps and the coast. A physical opening in the coastal boundary aligns precisely with the dock and its side barriers. The character does not automatically walk or follow a route. Opening the app tray or a dialog clears movement input; blur, hidden-page and pointer-cancel events also clear it. Reduced-motion settings disable camera damping and ambient breathing, while preserving deliberate movement input.

Seven original application destinations remain available through the shelf objects and the compact app tray. The tray also retains the newer PhotoSort and Little Lines destinations from the current published homepage. The mobile tray hides the joystick while open. Hidden exterior meshes do not block indoor object picking. App labels and existing release statuses are retained, not live-store revalidated. No contact or email action is present on the homepage.

Rendering runs while input, physics settling, camera following, character animation or hover transitions need frames and stops when settled. The character completes one breathing cycle after loading or stopping, then rests; greetings also finish instead of forcing a permanent render loop. Reduced-motion settings skip ambient breathing. Page visibility and WebGL context lifecycle are handled. The native app links remain usable when WebGL fails or JavaScript is disabled; About keeps its hash fallback.

Rapier 3D compatibility 0.20.0 is vendored locally in `assets/vendor/rapier/`, including its Apache-2.0 license. Its ESM build embeds WebAssembly; no build step or remote runtime service is added. Documentation: https://rapier.rs/docs/user_guides/javascript/character_controller/ . Existing generated textures and licensed Bootstrap icons are reused.

The earlier homepage files are not loaded by the current entry page. Existing app landing pages are separate from the room implementation.

Asset provenance and licenses are recorded in `assets/SOURCES.md` and `assets/vendor/`. The release is verified in the browser at desktop and mobile viewport sizes, including character loading, movement, greeting and app destinations.

## Custom snowboarder — 2026-09-22

`assets/models/snowboarder-web.glb` is the web derivative of the user-supplied, repaired Blender character: 32 bones, 59,390 triangles, three animation clips (`Idle`, `Walk`, `Wave`) and embedded 1024 px JPEG textures. The local asset is approximately 3.4 MB, compared with the 48 MiB editing/export master. The standing hand and gait were adapted for this controllable island character; the held board is excluded from the player. No model upload or third-party runtime CDN is used. The original Blender project stays outside the web repository.
