// Screen-relative keyboard and pointer input; simulation and camera code consume the same vector.
export function createWalkInput({ joystick, knob, requestFrame, canMove }) {
    const keys = new Set(), listeners = [];
    let pointerId = null, thumbX = 0, thumbY = 0;
    const bindings = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
    function listen(target, name, handler, options) { target.addEventListener(name, handler, options); listeners.push(() => target.removeEventListener(name, handler, options)); }
    function resetThumb() { thumbX = thumbY = 0; knob.style.transform = 'translate(0, 0)'; joystick.classList.remove('is-active'); }
    function clear() {
        keys.clear(); if (pointerId !== null && joystick.hasPointerCapture(pointerId)) joystick.releasePointerCapture(pointerId);
        pointerId = null; resetThumb(); requestFrame();
    }
    const editing = target => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable="true"],dialog'));
    listen(document, 'keydown', event => {
        if (!bindings.has(event.code) || event.metaKey || event.ctrlKey || event.altKey || editing(event.target) || !canMove()) return;
        event.preventDefault(); keys.add(event.code); requestFrame();
    });
    listen(document, 'keyup', event => { if (keys.delete(event.code)) { event.preventDefault(); requestFrame(); } });
    function moveThumb(event) {
        const bounds = joystick.getBoundingClientRect(), radius = bounds.width * .31;
        const dx = event.clientX - bounds.left - bounds.width / 2, dy = event.clientY - bounds.top - bounds.height / 2;
        const length = Math.hypot(dx, dy), scale = Math.min(1, radius / (length || 1));
        thumbX = dx * scale / radius; thumbY = dy * scale / radius;
        if (length < 5) thumbX = thumbY = 0;
        knob.style.transform = `translate(${thumbX * radius}px, ${thumbY * radius}px)`; requestFrame();
    }
    listen(joystick, 'pointerdown', event => {
        if (!event.isPrimary || pointerId !== null || !canMove()) return;
        event.preventDefault(); pointerId = event.pointerId; joystick.setPointerCapture(pointerId); joystick.classList.add('is-active'); moveThumb(event);
    });
    listen(joystick, 'pointermove', event => { if (event.pointerId === pointerId) { event.preventDefault(); moveThumb(event); } });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(joystick, type, event => { if (event.pointerId === pointerId) clear(); });
    listen(window, 'blur', clear);
    listen(document, 'visibilitychange', () => { if (document.hidden) clear(); });
    return {
        read() {
            const x = thumbX + Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
            const y = thumbY + Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
            const length = Math.max(1, Math.hypot(x, y)); return { x: x / length, y: y / length, active: keys.size > 0 || pointerId !== null };
        },
        clear,
        dispose() { clear(); listeners.forEach(remove => remove()); },
    };
}
