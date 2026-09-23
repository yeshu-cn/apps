const atlas = document.getElementById('atlas');
const image = document.getElementById('map-image');
const world = document.getElementById('map-world');
const mobile = matchMedia('(max-width: 700px), (max-aspect-ratio: 1/1)');
const panels = [...document.querySelectorAll('.paper-panel')];
const openers = [...document.querySelectorAll('[data-open-panel]')];
const focusReturns = new WeakMap();

function syncModalState() {
    const open = panels.some(panel => panel.open);
    document.body.style.overflow = open ? 'hidden' : '';
    document.dispatchEvent(new CustomEvent('atlas:modal', { detail: { open } }));
}
function openPanel(panel, opener) {
    panels.forEach(other => { if (other !== panel && other.open) other.close(); });
    if (panel.open) return;
    focusReturns.set(panel, opener || document.querySelector(`[href="#${panel.id}"]`));
    panel.showModal();
    syncModalState();
}
function clearPanelHash(panel) {
    if (location.hash === `#${panel.id}`) history.replaceState(null, '', location.pathname + location.search);
}
openers.forEach(opener => opener.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const panel = document.getElementById(opener.hash.slice(1));
    if (!panel || !panel.showModal) return;
    event.preventDefault(); openPanel(panel, opener);
}));
panels.forEach(panel => {
    panel.querySelector('[data-close-panel]').addEventListener('click', event => {
        event.preventDefault(); clearPanelHash(panel); panel.close();
    });
    panel.addEventListener('click', event => {
        if (event.target !== panel) return;
        const rect = panel.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) panel.close();
    });
    panel.addEventListener('close', () => {
        clearPanelHash(panel); syncModalState();
        focusReturns.get(panel)?.focus({ preventScroll: true });
    });
});
function openFromHash() {
    const panel = panels.find(item => `#${item.id}` === location.hash);
    if (panel && panel.showModal) openPanel(panel);
}
addEventListener('hashchange', openFromHash);
openFromHash();

const apps = [...document.querySelectorAll('.app-entry')];
const preview = document.getElementById('app-preview');
apps.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    apps.forEach(app => { if (app === link) app.setAttribute('aria-current', 'true'); else app.removeAttribute('aria-current'); });
    document.getElementById('preview-title').textContent = link.querySelector('span').textContent;
    document.getElementById('preview-status').textContent = link.dataset.status;
    document.getElementById('preview-description').textContent = link.dataset.description;
    const destination = document.getElementById('preview-link');
    destination.href = link.href;
    destination.querySelector('span').textContent = link.href.includes('apps.apple.com/') ? '前往 App Store' : '去看看';
}));
preview.hidden = false;

// Use the same image-cover calculation for the artwork and its semantic HTML entrance.
function placeLandmarks() {
    if (!image.naturalWidth) return;
    const width = atlas.clientWidth, height = atlas.clientHeight;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const artWidth = image.naturalWidth * scale, artHeight = image.naturalHeight * scale;
    const originX = (width - artWidth) / 2, originY = (height - artHeight) / 2;
    const note = mobile.matches ? [.59, .625] : [.7315, .4485];
    const cabin = mobile.matches ? [.58, .645, .27, .13] : [.659, .485, .13, .17];
    const label = document.getElementById('map-note');
    // Retain a usable label at very narrow or unusually wide aspect ratios.
    label.style.left = `${Math.max(22, Math.min(width - label.offsetWidth - 22, originX + note[0] * artWidth))}px`;
    label.style.top = `${Math.max(80, Math.min(height - 70, originY + note[1] * artHeight))}px`;
    const hit = document.getElementById('cabin-hit');
    hit.style.left = `${originX + cabin[0] * artWidth}px`;
    hit.style.top = `${originY + cabin[1] * artHeight}px`;
    hit.style.width = `${cabin[2] * artWidth}px`;
    hit.style.height = `${cabin[3] * artHeight}px`;
}
image.addEventListener('load', placeLandmarks);
new ResizeObserver(placeLandmarks).observe(atlas);
placeLandmarks();

// The raster art remains underneath the enhancement for loading, no-JS and WebGL fallback.
import('./atlas-scene.js').then(({ startAtlasScene }) => startAtlasScene({ atlas, image, world })).catch(error => {
    atlas.dataset.renderer = 'fallback';
    console.warn('Map motion is unavailable; the illustrated map and links remain usable.', error);
});
