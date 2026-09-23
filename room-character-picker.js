import { RESIDENT_MODELS } from './room-resident.js?v=characters-20260923';

export function createCharacterPicker({ stage, getCurrent, select }) {
    const style = document.createElement('link');
    style.rel = 'stylesheet'; style.href = new URL('./room-character-picker.css?v=20260923', import.meta.url).href;
    document.head.append(style);
    const opener = document.createElement('button');
    opener.type = 'button'; opener.id = 'choose-character'; opener.textContent = '选择人物';
    opener.setAttribute('aria-haspopup', 'dialog'); opener.setAttribute('aria-controls', 'character-picker');
    document.querySelector('.room-buttons').prepend(opener);
    const dialog = document.createElement('dialog');
    dialog.id = 'character-picker'; dialog.className = 'paper-panel character-picker';
    dialog.setAttribute('aria-labelledby', 'character-title');
    dialog.innerHTML = `<div class="panel-inner"><button class="panel-close" type="button" aria-label="关闭人物选择"><img src="assets/vendor/bootstrap-icons/x.svg" alt="" width="23" height="23"></button><p class="panel-kicker">小岛上的你</p><h2 id="character-title">选一位同行的人。</h2><p class="character-intro">换个模样，继续在小岛上走走。</p><div class="character-options"></div><p class="character-status" role="status" aria-live="polite"></p><button type="button" class="character-done">去小岛走走</button></div>`;
    document.body.append(dialog);
    const options = dialog.querySelector('.character-options'), status = dialog.querySelector('.character-status');
    const close = dialog.querySelector('.panel-close'), done = dialog.querySelector('.character-done');
    const listeners = []; let busy = false, disposed = false;
    function listen(el, type, fn) { el.addEventListener(type, fn); listeners.push(() => el.removeEventListener(type, fn)); }
    function syncModal() { const open = Boolean(document.querySelector('dialog[open]')); document.body.style.overflow = open ? 'hidden' : ''; document.dispatchEvent(new CustomEvent('room:modal', { detail: { open } })); }
    function update() {
        for (const button of options.children) {
            const selected = button.dataset.model === getCurrent();
            button.setAttribute('aria-pressed', String(selected)); button.disabled = busy;
            button.querySelector('.character-check').textContent = selected ? '使用中' : '选择';
        }
        options.setAttribute('aria-busy', String(busy));
    }
    for (const model of RESIDENT_MODELS) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'character-option'; button.dataset.model = model.id;
        button.innerHTML = `<img alt="${model.label}全身预览" width="240" height="300" loading="lazy" src="assets/models/${model.preview}"><span class="character-name">${model.label}</span><span class="character-description">${model.description}</span><span class="character-check"></span>`;
        listen(button, 'click', async () => {
            if (busy || model.id === getCurrent()) return;
            busy = true; update(); status.textContent = `正在准备${model.label}…`;
            try {
                await select(model.id);
                if (disposed) return;
                try { localStorage.setItem('yeshu-resident', model.id); } catch {}
                status.textContent = `已换成${model.label}。`;
            } catch (error) {
                if (disposed) return;
                status.textContent = '人物暂时未能加载，当前人物已保留。请再试一次。';
                console.warn('Character selection failed.', error);
            } finally { if (!disposed) { busy = false; update(); button.focus({ preventScroll: true }); } }
        });
        options.append(button);
    }
    listen(opener, 'click', () => {
        const weather = document.getElementById('island-weather'); if (weather) weather.open = false;
        update(); if (!busy) status.textContent = getCurrent() === 'fallback' ? '当前使用简约人物，可重新选择载入。' : '支持行走与挥手，选择会保存在此浏览器。';
        dialog.showModal(); syncModal();
    });
    listen(close, 'click', () => dialog.close()); listen(done, 'click', () => dialog.close());
    listen(dialog, 'close', () => { syncModal(); if (!disposed && stage.dataset.renderer === 'ready') opener.focus({ preventScroll: true }); });
    listen(dialog, 'click', event => {
        if (event.target !== dialog) return;
        const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
    return { dispose() { disposed = true; listeners.forEach(remove => remove()); if (dialog.open) dialog.close(); dialog.remove(); opener.remove(); style.remove(); syncModal(); } };
}
