// The alarm meter: rises while anything watches Wren, decays in safety, and trips
// at full — flashing lights, converging guards, and a short fair grace to vanish.
import { ALARM, GUARD } from './config.js';
import { convergeAll } from './guards.js';

export function tripAlarm(state) {
  const a = state.alarm;
  a.value = 100;
  a.tripped = true;
  a.grace = ALARM.graceSeconds;
  a.seenAtMax = 0;
  state.alarmTripped = true;
  convergeAll(state);
}

/** Advance the alarm one step. Returns 'caught' when the night is lost. */
export function updateAlarm(state, dt) {
  const a = state.alarm;
  a.flash += dt;

  // Caught by touch while the alarm is live.
  if (a.tripped) {
    for (const guard of state.guards) {
      if (Math.hypot(guard.x - state.player.x, guard.y - state.player.y) < GUARD.catchRange) {
        state.caughtBy = 'A guard caught Wren in the open.';
        return 'caught';
      }
    }
  }

  if (state.anySeeing) {
    if (!a.tripped) {
      a.value = Math.min(100, a.value + ALARM.risePerSecond * dt);
      if (a.value >= 100) tripAlarm(state);
    } else {
      a.seenAtMax += dt;
      if (a.seenAtMax >= ALARM.maxSeenSeconds) {
        state.caughtBy = 'The alarm held its stare too long.';
        return 'caught';
      }
    }
    a.grace = ALARM.graceSeconds;
  } else {
    a.seenAtMax = 0;
    if (a.tripped) {
      a.grace -= dt;
      if (a.grace <= 0) {
        a.tripped = false;
        a.value = 52;
        for (const guard of state.guards) if (guard.mode === 'converge') guard.mode = 'patrol';
      }
    } else {
      a.value = Math.max(0, a.value - ALARM.decayPerSecond * dt);
    }
  }
  return '';
}
