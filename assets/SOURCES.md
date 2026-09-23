# Homepage assets

- `sudoku-icon.jpg`, `sudoku-screen.jpg`: existing Sudoku App Store listing, app ID `1591771209`, retrieved through Apple's iTunes lookup API (US storefront) on 2026-09-06.
- `trip-note-icon.jpg`, `trip-note-screen.jpg`: existing Trip Note App Store listing, app ID `6465693593`, retrieved through Apple's iTunes lookup API (US storefront) on 2026-09-06.
- `guide-ledger.png`: existing project asset. Used as the app icon on the homepage.
- `favicon.svg`: homepage monogram.

Icons copied unchanged from the apps' current iOS asset catalogs on 2026-09-21:

- `divejournal-icon.png`: DiveJournal, `Assets/AppAssets.xcassets/AppIcon.appiconset/AppIcon.png`.
- `aquatrue-icon.png`: AquaTrue, `AquaTrue/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png`.
- `imagesize-icon.png`: SnapDim, `ios/ImageSizeMobile/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`.
- `yixu-icon.png`: Yixu, `Yixu/Resources/Assets.xcassets/AppIcon.appiconset/icon.png`.

The homepage's alpine/coastal miniature is original procedural geometry in `island-model.js`.
The supplied tropical-island reference informs only its low-poly art direction, not its buildings, layout or assets.
`world-fallback.jpg` is a screenshot of the actual Three.js scene, used while loading or when WebGL is unavailable.

## Private atlas redesign — 2026-09-22

- Selected visual: the third displayed design, `/Users/yeshu/.codex/generated_images/01a0c338-fe25-7963-b730-56af3efd285e/exec-4f13e2dd-34f5-45a6-b40c-62f853da2944.png`.
- `atlas-map-desktop.webp` (1586 × 992): built-in Image Gen edit of that exact visual, removing UI lettering while preserving map composition, snow ridge, single snowboarder, cabin/boat/coast and compass. Generated source: `/Users/yeshu/.codex/generated_images/01a0c72c-47cc-7782-8569-49e0ebe0ab04/exec-51ba1a13-a8e0-4027-87ba-d09e18fd3db2.png`. WebP quality 90.
- `atlas-map-mobile.webp` (1170 × 2532): built-in Image Gen portrait adaptation of the same reference, with pale top space, central snow ridge and lower coastal cabin. Generated source: `/Users/yeshu/.codex/generated_images/01a0c72c-9d99-7660-8b02-482799f638a5/exec-76e8334a-92bd-4d01-8a2d-9facad5a3680.png`. Compressed as WebP.
- Typography is native HTML using Georgia and platform Chinese Songti/serif fonts. No new font binary is distributed.
- `vendor/bootstrap-icons/{arrow-up-right,x,pause,play}.svg`: unmodified Bootstrap Icons 1.13.1 assets from https://github.com/twbs/icons/tree/v1.13.1/icons . MIT license included beside the files.
- Asset prompt set: desktop requested a faithful removal of UI text with all landscape elements preserved; mobile requested the same paper/contour/low-poly art in a portrait layout, top 30–33% free for live typography, one snowboard with no poles, cabin by the sea, no UI, labels or new buildings. Both used built-in Image Gen; UI text and functional controls are implemented separately in HTML.

## Small Three.js studio — 2026-09-22

- Selected shelf direction: `/Users/yeshu/.codex/generated_images/01a0c338-fe25-7963-b730-56af3efd285e/exec-22601899-3496-4311-8840-7d2191536aed.png`.
- Room composition reference: `/Users/yeshu/.codex/generated_images/01a0c338-fe25-7963-b730-56af3efd285e/exec-88201275-3151-4f7e-9e91-fbf739e4da7e.png`. The subsequent user request shrank app objects and added a desk, workbench, printer and DJI Avata 2; the implemented room therefore intentionally differs from this preliminary image.
- `room-oak.webp`: original 1024 × 1024 pale oak albedo, built-in Image Gen; 116,854 bytes, WebP quality 85. Source `/Users/yeshu/.codex/generated_images/01a0c72c-47cc-7782-8569-49e0ebe0ab04/exec-155e4faa-bbd9-4db9-8fde-2b2cdc239bb4.png`. Prompt requested fine horizontal grain, seamless repeat, uniform diffuse color, no light/shadow, objects, lettering or plank seams.
- `room-model.js` and `room-furniture.js`: original procedural volumetric Three.js geometry. Supplied app icons provide cover/decal textures; the monitor uses `atlas-map-desktop.webp` as its wallpaper. No product photographs are shipped for the printer or drone.
- Avata 2 model is a stylized interpretation. Product identity and integrated propeller-guard reference consulted: https://store.dji.com/nz/product/dji-avata-2 . The room makes no claim of dimensional or manufacturing accuracy.
- Three.js and OrbitControls remain the already vendored version. UI arrows/close symbols use existing licensed Bootstrap Icons. No new font binaries.

## Immersive evening studio — 2026-09-22

- Current user reference: `/var/folders/pl/5s4d03vn5cd3n8wswfjy0zrh0000gn/T/codex-clipboard-8855ce0a-580d-4bd3-9bb4-123628c313d3.png`. User requested a more immersive, warmer room; full-viewport interior framing intentionally replaces the previous white-space cutaway layout.
- `room-evening.webp`: 1024 × 1024, 75,600 bytes. Built-in Image Gen, optimized WebP quality 85. Original `/Users/yeshu/.codex/generated_images/01a0c72c-47cc-7782-8569-49e0ebe0ab04/exec-299803e8-6429-407d-911b-6f43ef47aee1.png`. Prompt: straight-on painterly miniature wooded hills at blue hour, dusky lavender sky, peach horizon, dark sage evergreens, a tiny distant lit cabin, landscape only, no frame, interior, text or UI. It represents an imagined view, not an actual location.
- `room-linen.webp`: 1024 × 1024, 266,470 bytes. Built-in Image Gen, optimized WebP. Original `/Users/yeshu/.codex/generated_images/01a0c72c-9d99-7660-8b02-482799f638a5/exec-3d268590-09ba-49a2-aec9-45ac813c1bc9.png`. Prompt: seamless off-white linen albedo, fine warm taupe woven threads, uniform diffuse lighting, low contrast, no folds, shadows, text or borders. Used as a tinted color/bump texture for actual volumetric furnishings and cloth meshes.
- `room-atmosphere.js`: original Three.js geometry for curtains, reading chair, cushion/throw, rug, paper pendant, floor/task lamps and shelf plants. No new raster logos, font binaries or external runtime requests.

## Island overview — 2026-09-22

The user requested removal of contact/email actions and a 2.5D overhead view of the room on an island. The earlier tropical-island reference informs the miniature art direction only; terrain, room layout, trees and dock are original procedural geometry. The previous evening-window image is no longer loaded: the window now looks directly onto the scene's sea.

- `island-water.webp`: 1024 × 1024, 21,064 bytes. Built-in Image Gen, optimized WebP. Source `/Users/yeshu/.codex/generated_images/01a0c72c-9d99-7660-8b02-482799f638a5/exec-890f01f1-d95a-46d1-aa95-56ea568c632f.png`. Prompt: seamless top-down calm sea-glass turquoise shallow water, very delicate low-contrast caustics and tiny ripples, even color, no horizon, land, foam, objects or text. Material tint blends the texture into the scene's subdued ocean palette.
- `island-sand.webp`: 1024 × 1024, 189,716 bytes, WebP quality 75. Built-in Image Gen. Source `/Users/yeshu/.codex/generated_images/01a0c72c-47cc-7782-8569-49e0ebe0ab04/exec-7c732a6a-15a5-4d76-9ab9-bc710ad489ee.png`. Prompt: seamless pale warm ivory beach sand albedo, fine grain and subtle mottling, uniform diffuse color, restrained miniature style, no lighting, shadows, footprints, objects or text.
- `room-island.js`: original volumetric terrain, sea surface, shoreline wave geometry, palms, vegetation, rocks, entry steps and dock. Existing app decals and licensed UI icons are retained. No new external runtime dependency.

## Larger inhabited island — 2026-09-22

The user requested more land around the room, a complete house exterior in overhead view, and a little person walking on the island and inside. `room-exterior.js` adds original procedural cottage geometry; `room-resident.js` adds an original articulated miniature and walking routes. Garden paths, meadow, bench and hammock extend `room-island.js`. The existing generated oak/sand textures and licensed Bootstrap pause/play icons are reused. No new raster asset, product claim or remote dependency was introduced.

## Player-controlled island — 2026-09-22

The user requested substantially more land around the cottage and direct control of the character. `island-layout.js` now defines a larger, offset island; `room-island.js` reuses the existing generated textures for the expanded original geometry. `room-resident.js` retains the original articulated character; `room-player.js` and `room-input.js` replace automatic routes with player input and collision simulation. The joystick is a native interactive control, not a raster illustration.

- `vendor/rapier/rapier.mjs`: unmodified @dimforge/rapier3d-compat 0.20.0 ESM compatibility build, 2,857,590 bytes, from https://registry.npmjs.org/@dimforge/rapier3d-compat/-/rapier3d-compat-0.20.0.tgz . Apache-2.0 license included as `vendor/rapier/LICENSE`. The build embeds WebAssembly. Official controller documentation: https://rapier.rs/docs/user_guides/javascript/character_controller/ .
- No new image, external runtime URL, portfolio destination or product claim was added.

## Rigged snowboarder replacement — 2026-09-22

- `models/snowboarder-web.glb`: derived from the user-supplied `8cef54d0955fd178beb9d2150927cb2b.glb` and the locally repaired `Snowboarder_Rigged.blend`. Source is user-provided; no third-party model marketplace or newly assumed license. Selects the left/main character, repairs the fused right glove, preserves the main material artwork, reduces the mesh to 59,390 triangles, and embeds three 1024 px JPEG textures. File size: 3,413,608 bytes (approximately 3.4 MB). Uses 32 bones and locally authored `Idle`, `Walk`, `Wave` clips. The carried snowboard is omitted so the character can walk freely; the existing procedural snowboard remains in the room.
- `vendor/three/addons/loaders/GLTFLoader.js` , `vendor/three/addons/utils/SkeletonUtils.js`, and `vendor/three/addons/environments/RoomEnvironment.js`: unmodified files from the same official Three.js 0.185.1 npm package as the existing runtime, verified against the registry SHA-512 integrity value. Covered by `vendor/three/LICENSE` (MIT).
- Native editable master and generation script remain in `/Users/yeshu/Downloads/character_rigged/`; the website includes only the optimized model. Original model files were not changed.

## User snowboard prop — 2026-09-23

- `models/snowboard-web.glb`: derived locally from the user's `/Users/yeshu/Downloads/3d/79b8053a75f341b54ce945720773fed3.glb`. The original remains unchanged. User-provided asset; no marketplace download, external upload or newly assumed license.
- glTF Transform 4.5.0 applies deduplication, welding, meshoptimizer simplification (`ratio: 0.025`, `error: 0.001`), pruning, and 1024 × 1024 texture resizing. Base color uses JPEG quality 90; normal and metallic/roughness maps remain PNG. Geometry stays uncompressed for the existing GLTFLoader. The source has 1,500,000 triangles and three 4096 px PNGs; the derivative has 37,500 triangles, one mesh/material, and measures 3,848,040 bytes.
- The node is normalized to an upright, 1.88-unit board, with front-facing bindings and a bottom pivot. The original orange/black graphics, two bindings and PBR material are retained. The runtime adds a small lean and a local RoomEnvironment reflection map; no new renderer dependency is introduced.
- Khronos glTF Validator reports zero errors and one tangent-space warning: the supplied mesh has no tangent attribute, so the existing Three.js material shader derives tangent space at runtime. Source/derivative visual comparison and desktop/mobile runtime renders were checked locally.

## KeepShot and island atmosphere — 2026-09-23

- `keepshot-icon.png`: resized to 256 × 256 from the user's current local iOS asset, `keepshot/keepshot-ios/KeepShot/Assets.xcassets/AppIcon.appiconset/AppIcon1024.png`. App name, description and destination `6772764457` verified using Apple's US iTunes lookup API on 2026-09-23.
- `room-sea.js`: original procedural dinghy, oars, mooring line, ripples and animated coast-following foam. Reuses the existing oak texture.
- `room-weather.js`: procedural clouds and rain, interpolated local-time lighting, and native HTML weather/time controls. Simulated conditions; no external forecast, geolocation, raster asset or runtime dependency.

## Complete published catalogue and quiet bookcase — 2026-09-23

- `snowcut-icon.jpg` (6796671573), `dao-icon.jpg` (6749299523), `dailyframe-icon.jpg` (6738989430), `outtool-icon.jpg` (6739861072), `materialcolor-icon.jpg` (1581064133), and `poetry-icon.jpg` (1535019603): the user's app artwork from Apple's public iTunes lookup response for developer 908660241, US storefront. Resized to 256 × 256 JPEGs for the catalogue and small book-spine marks.
- Public catalogue verification: `https://itunes.apple.com/lookup?id=908660241&entity=software&country=us&limit=200` and the corresponding `country=cn` response. The union contains 13 public apps. Account app inventory and version states were also read through App Store Connect on 2026-09-23. No App Store metadata was changed.
- `room-model.js`: original small bookcase/book geometry replaces the full-width app shelves. Reuses existing oak, linen, app artwork and `room-evening.webp` for the ordinary wall print. No new generated image, model marketplace asset or dependency.

## Full-size left bookcase and shared cabin windows — 2026-09-23

- Original procedural furniture and window geometry only. The normal-size cabinet replaces the former left sofa; 14 smaller freestanding tiles reuse existing App icon artwork, with direct selection. The carpet and low stool are removed.
- `room-layout.js` shares actual window positions and sizes across the wall openings and frames. Two rear apertures join the existing four windows; the same physical geometry is used outdoors and in the interior cutaway.
- No new image, third-party model, runtime dependency or remote asset was introduced.

## Alpine explorer and model picker — 2026-09-23

- `models/alpine-explorer-web.glb`: derivative of the user-supplied `39a013596f1936b25766a18b2aaed361.glb`. Blender cleanup, contact-seam separation, weighted 22-bone body FK rig and locally authored Idle / Walk / Wave animations. Satin helmet response, zipper pull and strap buckles were refined in Blender. 72,266 triangles; three 1024 px JPEG textures; 5,010,132 bytes. glTF Transform deduplicates, prunes and resamples; no external decoder or runtime service is required. Validator: zero errors and warnings.
- `models/alpine-preview.webp` and `models/snowboarder-preview.webp`: resized Blender renders of the actual supplied characters. No marketplace model or new third-party model license is assumed.
- Editable source and generation scripts: `/Users/yeshu/Downloads/alpine_explorer_rigged/`. The original supplied file is unchanged. The rig has no separate facial or finger controls.
- Walk stance refinement (`scripts/refine_walk.py` after `build_character.py`): rotate each thigh inward 6 degrees and reduce toe-out 9 degrees, preserve the foot orientation in world space, and rebake pelvis height for sole contact. Ankle spacing is 0.211–0.219 source units versus 0.364 previously. Idle and Wave retain their authored standing stance.

## Wall-aligned layout and 360-degree inspection — 2026-09-23

- Removed the added rear windows. The cottage again uses the original four actual window openings, including the two flanking the entrance. Shared wall/window geometry is cut away according to camera direction.
- Rotated the full-size bookcase against the left wall and printer workbench against the right wall; moved the computer desk against the rear wall. Existing furniture, App artwork, snowboard and character assets are retained.
- Enabled full horizontal interior orbit plus bounded wheel/pinch zoom, and culled foreground palms while inspecting the room. No new asset or dependency.
