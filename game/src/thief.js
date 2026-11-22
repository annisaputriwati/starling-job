// Wren, the thief: movement with a sneak that trades speed for silence, and the
// hold-E lockpicking of cases and doors (moving cancels the pick).
import { THIEF } from './config.js';
import { moveCircle, say } from './world.js';

/** Advance Wren one step. Returns 'step' when a footstep should sound. */
export function updateThief(state, input, dt) {
  const p = state.player;
  const axes = input.axes();
  const len = Math.hypot(axes.x, axes.y);
  p.sneaking = input.sneaking();
  p.moving = len > 0;
  let event = '';
  if (len > 0) {
    const speed = p.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
    const dx = (axes.x / len) * speed * dt;
    const dy = (axes.y / len) * speed * dt;
    const before = { x: p.x, y: p.y };
    moveCircle(state, p, dx, dy);
    p.angle = Math.atan2(p.y - before.y || axes.y, p.x - before.x || axes.x);
    p.noise = p.sneaking ? 0 : 1;
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = p.sneaking ? 0.46 : 0.3;
      event = 'step';
    }
  } else {
    p.noise = 0;
  }
  return event;
}

/** The nearest pickable thing in range: an ungrabbed case or a locked door. */
export function pickTarget(state) {
  const p = state.player;
  let best = null;
  let bestDist = THIEF.interactRange;
  for (const item of state.loot) {
    if (item.grabbed) continue;
    const d = Math.hypot(item.x - p.x, item.y - p.y);
    if (d < bestDist) { bestDist = d; best = { kind: 'loot', ref: item }; }
  }
  for (const door of state.doors) {
    if (door.open) continue;
    const cx = door.x + door.w / 2;
    const cy = door.y + door.h / 2;
    const d = Math.hypot(cx - p.x, cy - p.y);
    if (d < bestDist + 14) { bestDist = d; best = { kind: 'door', ref: door }; }
  }
  return best;
}

/** Hold-E picking. Returns 'grab' | 'open' | 'tick' | '' for sound and scoring hooks. */
export function updatePick(state, input, dt, audio) {
  const p = state.player;
  if (p.moving || !input.interacting()) {
    state.pick = null;
    return '';
  }
  const target = pickTarget(state);
  if (!target) {
    state.pick = null;
    return '';
  }
  if (!state.pick || state.pick.ref !== target.ref) {
    state.pick = { ...target, progress: 0, tick: 0 };
  }
  const pick = state.pick;
  pick.progress += dt / target.ref.pickTime;
  pick.tick -= dt;
  let event = '';
  if (pick.tick <= 0) { pick.tick = 0.22; event = 'tick'; }
  if (pick.progress >= 1) {
    state.pick = null;
    if (target.kind === 'loot') {
      target.ref.grabbed = true;
      state.nightLoot += target.ref.value;
      if (target.ref.main) {
        state.mainTaken = true;
        return 'main';
      }
      say(state, `${target.ref.name} lifted — $${target.ref.value}`);
      return 'grab';
    }
    target.ref.open = true;
    say(state, `The ${target.ref.name} clicks open.`);
    return 'open';
  }
  return event;
}
