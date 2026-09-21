# Yeshu · Apps

Static portfolio and app landing pages for `app.yeshu.fun`.

Run locally with `python3 -m http.server 5173 --bind 127.0.0.1`, then visit http://127.0.0.1:5173/.
No package installation or build step is required.

The homepage uses locally vendored Three.js:

- `island-model.js` builds the original mountain, studio, campsite and bay, and names the seven app locations.
- `island-home.js` controls the scene, app selection, camera, animation and WebGL fallback.
- `island-home.css` handles the desktop and mobile layout; `styles.css` also supports existing pages.
- App destinations and initial HTML live in `index.html`; keep its entries consistent with `appData` in `island-home.js`.

Drag the scene to rotate it, or select an app through a scene marker or the bottom icon dock. The detail link opens its existing app page. Reduced-motion preferences pause animation, hidden pages stop drawing, and navigation remains available without WebGL or JavaScript.

Asset provenance is listed in `assets/SOURCES.md`; the Three.js license and version are in `assets/vendor/three/`.
