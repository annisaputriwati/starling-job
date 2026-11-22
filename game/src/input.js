// Keyboard and pointer input: held state for movement/sneak/interact, one-shot action flags
// for confirm/pause/mute/EMP/restart, and a queue of clicks (coin tosses while playing).
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_EMP = 8;
export const ACTION_RESTART = 16;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HELD = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyE', 'ShiftLeft', 'ShiftRight',
]);

export function createInput(target) {
  const held = new Set();
  let actions = 0;
  const clicks = [];

  window.addEventListener('keydown', (event) => {
    if (HELD.has(event.code)) held.add(event.code);
    else if (CONFIRM.has(event.code)) { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (event.code === 'KeyM') { if (!event.repeat) actions |= ACTION_MUTE; }
    else if (event.code === 'KeyQ') { if (!event.repeat) actions |= ACTION_EMP; }
    else if (event.code === 'KeyR') { if (!event.repeat) actions |= ACTION_RESTART; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  target.addEventListener('pointerdown', (event) => {
    clicks.push({ x: event.offsetX, y: event.offsetY });
  });

  return {
    /** Movement axes, each -1, 0 or 1. */
    axes() {
      const x = (held.has('ArrowRight') || held.has('KeyD') ? 1 : 0) - (held.has('ArrowLeft') || held.has('KeyA') ? 1 : 0);
      const y = (held.has('ArrowDown') || held.has('KeyS') ? 1 : 0) - (held.has('ArrowUp') || held.has('KeyW') ? 1 : 0);
      return { x, y };
    },
    sneaking() { return held.has('ShiftLeft') || held.has('ShiftRight'); },
    interacting() { return held.has('KeyE'); },
    takeActions() { const taken = actions; actions = 0; return taken; },
    takeClicks() { const taken = clicks.slice(); clicks.length = 0; return taken; },
  };
}
