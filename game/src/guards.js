// Guards: waypoint patrols with pauses and head-turn sweeps, suspicion that builds
// inside their vision cone, coin-noise investigation, and alarm convergence.
import { GUARD, THIEF, TOOLS } from './config.js';
import { angleDelta, canSee } from './vision.js';
import { blockersOf, inShadow, moveCircle } from './world.js';

function turnToward(guard, wanted, dt, rate = 3.2) {
  const d = angleDelta(wanted, guard.angle);
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  guard.angle += step;
}

function walkTo(state, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return true;
  turnToward(guard, Math.atan2(dy, dx), dt);
  moveCircle(state, guard, (dx / dist) * speed * dt, (dy / dist) * speed * dt);
  return dist < 14;
}

/** One guard step. Detection results are written to guard.seeing / guard.suspicion;
 *  returns 'trip' when this guard's suspicion fills and the alarm must trip. */
export function updateGuard(state, guard, dt) {
  const p = state.player;
  const blockers = blockersOf(state);
  const seeing = canSee(guard.x, guard.y, guard.angle, GUARD.visionHalfAngle, GUARD.visionRange, p.x, p.y, blockers);
  guard.seeing = seeing;

  if (seeing) {
    const dist = Math.hypot(p.x - guard.x, p.y - guard.y);
    let rate = 1.35 - (dist / GUARD.visionRange) * 0.85;
    if (inShadow(state, p.x, p.y)) rate *= 0.34;
    if (p.sneaking) rate *= 0.72;
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
    state.lastSeen = { x: p.x, y: p.y };
    if (guard.mode !== 'converge' && guard.mode !== 'chase') {
      guard.mode = 'chase';
      guard.target = null;
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.22);
  }

  // Walking (not sneaking) near a guard is heard through the quiet.
  if (!seeing && p.noise > 0) {
    const dist = Math.hypot(p.x - guard.x, p.y - guard.y);
    if (dist < THIEF.noiseRadius + 26) {
      guard.mode = 'investigate';
      guard.target = { x: p.x, y: p.y };
      guard.modeT = 2.2;
      guard.suspicion = Math.min(1, guard.suspicion + dt * 1.4);
    }
  }

  // Coin clinks pull the nearest guards off their rounds.
  for (const noise of state.noises) {
    if (noise.fresh && Math.hypot(noise.x - guard.x, noise.y - guard.y) < TOOLS.coinNoiseRadius + 90) {
      guard.mode = 'investigate';
      guard.target = { x: noise.x, y: noise.y };
      guard.modeT = TOOLS.coinInvestigateSeconds;
    }
  }

  if (guard.suspicion >= 1 && !state.alarm.tripped) return 'trip';

  switch (guard.mode) {
    case 'chase': {
      if (seeing) walkTo(state, guard, p.x, p.y, GUARD.convergeSpeed, dt);
      else if (state.lastSeen && walkTo(state, guard, state.lastSeen.x, state.lastSeen.y, GUARD.investigateSpeed, dt)) {
        guard.mode = 'investigate';
        guard.target = null;
        guard.modeT = 1.6;
      }
      break;
    }
    case 'converge': {
      const t = state.lastSeen ?? { x: p.x, y: p.y };
      if (walkTo(state, guard, t.x, t.y, GUARD.convergeSpeed, dt)) {
        guard.mode = 'investigate';
        guard.modeT = 1.8;
        guard.target = null;
      }
      break;
    }
    case 'investigate': {
      guard.modeT -= dt;
      if (guard.target) {
        if (walkTo(state, guard, guard.target.x, guard.target.y, GUARD.investigateSpeed, dt)) guard.target = null;
      } else {
        guard.angle += Math.sin(state.time * 1.7 + guard.sweepPhase) * dt * 1.4;
      }
      if (guard.modeT <= 0) guard.mode = 'patrol';
      break;
    }
    default: { // patrol
      if (guard.pauseT > 0) {
        guard.pauseT -= dt;
        // Head-turn sweep while standing post: the cone breathes left and right.
        guard.angle += Math.sin(state.time * 1.15 + guard.sweepPhase) * dt * 0.9;
        break;
      }
      const [tx, ty] = guard.path[guard.wp];
      const dx = tx - guard.x;
      const dy = ty - guard.y;
      if (Math.hypot(dx, dy) < 10) {
        guard.wp = (guard.wp + 1) % guard.path.length;
        guard.pauseT = guard.pause;
      } else {
        turnToward(guard, Math.atan2(dy, dx), dt);
        const dist = Math.hypot(dx, dy);
        moveCircle(state, guard, (dx / dist) * guard.speed * dt, (dy / dist) * guard.speed * dt);
      }
    }
  }
  return '';
}

/** Send every guard at the last seen position (alarm tripped or diamond taken). */
export function convergeAll(state) {
  for (const guard of state.guards) {
    if (guard.mode !== 'chase') guard.mode = 'converge';
  }
}
