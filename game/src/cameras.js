// Cameras: fixed mounts with sweeping cones. They spot like guards but cannot chase;
//  an EMP charge greys them out for ten seconds.
import { CAMERA } from './config.js';
import { canSee } from './vision.js';
import { blockersOf, inShadow } from './world.js';

export function updateCamera(state, camera, dt) {
  if (camera.disabled > 0) {
    camera.disabled -= dt;
    camera.seeing = false;
    camera.suspicion = Math.max(0, camera.suspicion - dt * 0.5);
    return '';
  }
  camera.angle = camera.base + Math.sin(state.time * camera.speed + camera.phase) * camera.sweep;
  const p = state.player;
  const seeing = canSee(camera.x, camera.y, camera.angle, CAMERA.visionHalfAngle, CAMERA.visionRange, p.x, p.y, blockersOf(state));
  camera.seeing = seeing;
  if (seeing) {
    const dist = Math.hypot(p.x - camera.x, p.y - camera.y);
    let rate = 1.0 - (dist / CAMERA.visionRange) * 0.6;
    if (inShadow(state, p.x, p.y)) rate *= 0.34;
    if (p.sneaking) rate *= 0.72;
    camera.suspicion = Math.min(1, camera.suspicion + rate * dt * 0.8);
    state.lastSeen = { x: p.x, y: p.y };
    if (camera.suspicion >= 1 && !state.alarm.tripped) return 'trip';
  } else {
    camera.suspicion = Math.max(0, camera.suspicion - dt * 0.3);
  }
  return '';
}

/** Fire an EMP from Wren: cameras in radius go dark. Returns how many were hit. */
export function fireEmp(state) {
  const p = state.player;
  let hit = 0;
  for (const camera of state.cameras) {
    if (Math.hypot(camera.x - p.x, camera.y - p.y) <= CAMERA.empRadius) {
      camera.disabled = CAMERA.empSeconds;
      camera.suspicion = 0;
      camera.seeing = false;
      hit += 1;
    }
  }
  state.empPulse = { x: p.x, y: p.y, t: 0 };
  return hit;
}
