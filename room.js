const stage = document.getElementById('room-stage');
const links = [...document.querySelectorAll('.room-object')];
const panels = [...document.querySelectorAll('.paper-panel')];
const focusReturns = new WeakMap();
const details = document.getElementById('app-detail');
const browse = document.querySelector('.skip-link');
const shelfButton = document.getElementById('bookcase-marker');
let browseOpener = browse;
function setBrowse(open, opener = browse) {
    if (open) browseOpener = opener;
    shelfButton.setAttribute('aria-expanded', String(open));
    stage.dataset.showApps = String(open);
    document.dispatchEvent(new CustomEvent('room:browse', { detail: { open } }));
    if (!open) browseOpener.focus({ preventScroll: true });
}
shelfButton.addEventListener('click', () => { setBrowse(true, shelfButton); document.getElementById('close-objects').focus({ preventScroll: true }); });
document.getElementById('close-objects').addEventListener('click', () => setBrowse(false));
document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault(); setBrowse(true); links[0].focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panels.some(panel => panel.open) && stage.dataset.showApps === 'true') { setBrowse(false); }
});

function syncModalState() {
    const open = panels.some(panel => panel.open);
    document.body.style.overflow = open ? 'hidden' : '';
    document.dispatchEvent(new CustomEvent('room:modal', { detail: { open } }));
}
function openPanel(panel, opener) {
    panels.forEach(other => { if (other !== panel && other.open) other.close(); });
    if (panel.open) return;
    focusReturns.set(panel, opener); panel.showModal(); syncModalState();
}
function openApp(id, opener) {
    const app = links.find(link => link.dataset.app === id);
    if (!app || !details.showModal) return;
    document.getElementById('detail-title').textContent = app.querySelector('.object-name').textContent;
    document.getElementById('detail-description').textContent = app.dataset.description;
    document.getElementById('detail-status').textContent = app.dataset.status;
    document.getElementById('detail-icon').src = app.querySelector('img').src;
    const destination = document.getElementById('detail-link');
    destination.href = app.href;
    destination.querySelector('span').textContent = app.href.includes('apps.apple.com/') ? '前往 App Store' : '去看看';
    openPanel(details, opener || app);
}
const normalClick = event => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
links.forEach(link => link.addEventListener('click', event => {
    if (!normalClick(event) || !details.showModal) return;
    event.preventDefault(); openApp(link.dataset.app, link);
}));
document.querySelectorAll('[data-open-panel]').forEach(opener => opener.addEventListener('click', event => {
    const panel = document.getElementById(opener.hash.slice(1));
    if (!normalClick(event) || !panel?.showModal) return;
    event.preventDefault(); openPanel(panel, opener);
}));
panels.forEach(panel => {
    panel.querySelector('[data-close-panel]').addEventListener('click', event => { event.preventDefault(); panel.close(); });
    panel.addEventListener('click', event => {
        if (event.target !== panel) return;
        const rect = panel.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) panel.close();
    });
    panel.addEventListener('close', () => {
        if (location.hash === `#${panel.id}`) history.replaceState(null, '', location.pathname + location.search);
        syncModalState();
        const opener = focusReturns.get(panel);
        (opener?.getClientRects().length ? opener : browse).focus({ preventScroll: true });
    });
});
function openFromHash() {
    if (location.hash === '#about') openPanel(document.getElementById('about'), document.querySelector('[href="#about"]'));
}
addEventListener('hashchange', openFromHash); openFromHash();

import('./room-scene.js?v=dialog-default-20260923').then(({ startRoomScene }) => startRoomScene({ stage, canvas: document.getElementById('room-canvas'), links, onSelect: openApp, onBrowse: () => { setBrowse(true, shelfButton); document.getElementById('close-objects').focus({ preventScroll: true }); } })).catch(error => {
    stage.dataset.renderer = 'fallback';
    document.getElementById('room-controls').hidden = true;
    console.warn('The 3D room is unavailable; showing the reload prompt.', error);
}).finally(() => {
    clearTimeout(window.roomBootTimer);
    delete document.documentElement.dataset.sceneBoot;
});
