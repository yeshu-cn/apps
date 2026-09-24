# Cottage craft experiment

Open `http://127.0.0.1:5173/experiments/cottage/` with the repository's normal static server. This visual study retains an A/B comparison between the original procedural cottage and the accepted Blender exterior. The homepage now uses a separate, segmented integration asset at `assets/cottage/cottage.glb`; this experiment preserves its original comparison and camera presets.

- A/B toggles retain the camera and lights. Both houses use the existing island environment.
- Overall, roof, window and porch camera presets show silhouette and close detail.
- Clay mode replaces materials on both houses to isolate the effect of geometry.
- Side lighting changes the same sun for both models.
- Desktop orbit/wheel and touch orbit/pinch are supported; reduced motion stops ambient animation.

## Build

The editable model is generated with Blender 5.1.2. Authoring is scripted; it is not a manually sculpted or AI-generated asset. Named source objects, procedural materials and bevels are kept in the source `.blend`; the runtime export is a separate, optimized model.

```sh
blender --background --python experiments/cottage/build_cottage.py
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform optimize output/cottage-experiment/cottage-raw.glb experiments/cottage/cottage.glb --compress meshopt --texture-compress webp --simplify-ratio 0.8 --simplify-error 0.0005 --flatten false --join false
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform validate experiments/cottage/cottage.glb
```

The source model is `output/cottage-experiment/cottage-source.blend`. The intermediate baked model and PNG textures are beside it. Geometry uses the existing 10 × 6.1 world-unit cottage footprint, with a modest projecting porch and eaves. Blender coordinates are converted to glTF Y-up on export, with the world origin retained.

The main shell has a 2048² color atlas, ambient-occlusion atlas and roughness atlas. Tiny details retain native materials to avoid subpixel bake artifacts. The GLB combines AO and roughness into supported glTF channels; AO strength is set to 0.5 in the runtime. Sunlight is dynamic and is not baked into the color texture.

Runtime asset: 2,316,076 bytes, 58,694 triangles, 10 meshes and 2 optimized materials. glTF validation reports no errors or warnings; it emits an informational note that it cannot inspect EXT_meshopt_compression. Actual compressed-asset decoding and display are verified in Chromium. This is an exterior detail study with no LODs, indoor cutaway groups or gameplay colliders; the homepage integration below supplies cutaway groups and updated porch collisions separately.

## Dependencies and validation

Three.js and GLTFLoader reuse the repository's existing vendored distribution. `vendor/meshopt_decoder.mjs` is from meshoptimizer 1.2.0 (MIT; license included), enabling local decoding with no CDN request. Build-only glTF Transform was installed outside the repository.

Browser QA uses Chromium/Playwright at 1500 × 1000 and 390 × 844. It checks model selection, all four camera views, material toggling, side-light toggling, orbit, the explanation dialog, resource loading, console health and mobile overflow. Screenshots and temporary QA scripts are outside the repository, under `/tmp/cottage-*`. Physical mobile-device performance remains unverified.


## Homepage integration

`prepare_homepage.py` recovers authored parts from the editable source and the accepted baked mesh by matching face centers within 0.0001 world units. It preserves the baked atlas, separates four facades and the roof, opens the door, and removes blocked doorway/recess geometry. No source faces are left unmatched. It writes `output/cottage-homepage/cottage-homepage.blend` and an intermediate GLB.

```sh
blender --background --python experiments/cottage/prepare_homepage.py
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform optimize output/cottage-homepage/cottage-homepage-raw.glb assets/cottage/cottage.glb --compress meshopt --texture-compress webp --simplify-ratio 0.8 --simplify-error 0.0005 --flatten false --join false --palette false
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform validate assets/cottage/cottage.glb
```

Keep `cottagePart` extras and node transforms. `room-crafted-exterior.js` attaches each part to the existing room, adjusts transparent glass and baked AO, and shares the original cutaway controller. The room still owns the furniture and floor. `room-player.js` matches the porch's deck and steps; `cabinThresholdSurface()` supplies the same shallow entrance ramp to rendering and physics so exiting cannot catch on the raised deck. The original procedural model remains selectable in this experiment.

The integrated asset is approximately 2.33 MB. Desktop and mobile viewport checks cover rendering, daylight/night/rain, room transitions, bookshelf filters and physical icon clicking. Physics checks cover continuous walking up and down the porch, door crossing both ways, shortcut landing, and the return ferry journey. There are no browser application errors; screenshot capture can emit Chromium ReadPixels performance diagnostics. Physical phone performance and public deployment are not verified by these local checks.
