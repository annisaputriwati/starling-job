// Deterministic screenshot scenes behind ?shot=cover|corridor|vault|getaway.
// Each stages the real game state directly — positions, cones, suspicion, alarm —
// so the frame is exactly what play produces, and the same seed gives the same frame.
import { SCREEN_PLAY } from './render.js';
import { startNight } from './world.js';

function guardAt(state, index, x, y, angle, suspicion = 0) {
  const g = state.guards[index];
  g.x = x; g.y = y; g.angle = angle; g.suspicion = suspicion;
  g.mode = 'patrol'; g.pauseT = 99;
  return g;
}

export function stageShot(name, state) {
  if (name === 'corridor') {
    startNight(state, 1);
    // West door mid-pick, one camera EMP-dark, one live and sweeping.
    state.player.x = 388; state.player.y = 342; state.player.angle = 0;
    const door = state.doors[0];
    state.pick = { kind: 'door', ref: door, progress: 0.55, tick: 0 };
    state.cameras[0].disabled = 7.5;
    state.cameras[0].angle = Math.PI / 2;
    state.cameras[1].angle = -Math.PI / 2 + 0.3;
    guardAt(state, 0, 250, 470, -0.6, 0.1);
    guardAt(state, 1, 660, 250, 2.6, 0);
    guardAt(state, 2, 1080, 560, -2.2, 0);
    state.alarm.value = 18;
    state.tools.coins = 3; state.tools.emp = 1;
    state.nightLoot = 750;
    state.time = 96;
    return { screen: SCREEN_PLAY };
  }

  if (name === 'vault') {
    startNight(state, 2);
    // Inside the vault, fingers on the diamond, the building waking up.
    state.player.x = 640; state.player.y = 216; state.player.angle = -Math.PI / 2;
    const diamond = state.loot.find((l) => l.main);
    state.pick = { kind: 'loot', ref: diamond, progress: 0.62, tick: 0 };
    state.doors[0].open = true;
    guardAt(state, 0, 300, 300, 0.7, 0.4);
    guardAt(state, 1, 980, 300, 2.4, 0.3);
    guardAt(state, 2, 660, 330, -1.2, 0.85);
    guardAt(state, 3, 560, 120, 2.8, 0.2);
    state.cameras[0].angle = Math.PI / 2 + 0.2;
    state.cameras[1].angle = 0.4;
    state.cameras[2].angle = Math.PI - 0.4;
    state.alarm.value = 84;
    state.nightLoot = 1450;
    state.seenCount = 2;
    state.time = 210;
    return { screen: SCREEN_PLAY };
  }

  if (name === 'getaway') {
    startNight(state, 2);
    // Diamond in the bag, garden run, the law a few steps behind.
    state.phase = 'getaway';
    state.mainTaken = true;
    state.loot.find((l) => l.main).grabbed = true;
    state.doors[0].open = true;
    state.player.x = 252; state.player.y = 596; state.player.angle = Math.PI;
    guardAt(state, 0, 430, 560, 2.9, 0.9);
    guardAt(state, 1, 520, 640, 3.0, 0.8);
    guardAt(state, 2, 700, 500, 2.2, 0.5);
    guardAt(state, 3, 620, 210, -0.8, 0.2);
    state.cameras[0].angle = Math.PI / 2;
    state.cameras[1].angle = 0.2;
    state.cameras[2].angle = Math.PI - 0.2;
    state.alarm.value = 67;
    state.nightLoot = 4450;
    state.banked = 5650;
    state.seenCount = 4;
    state.time = 260;
    return { screen: SCREEN_PLAY };
  }

  // cover (default): Night Three's Grand Hall approach — the whole game in one frame:
  // Wren mid-crossing between cases, two guard cones, a camera cone, the diamond
  // glowing in its vault case, and the alarm meter already part-filled.
  startNight(state, 2);
  state.player.x = 470; state.player.y = 420; state.player.angle = 0.5;
  guardAt(state, 0, 250, 300, 0.55, 0.35);
  guardAt(state, 1, 1010, 300, 2.5, 0.2);
  guardAt(state, 2, 830, 590, -2.4, 0);
  guardAt(state, 3, 560, 150, 1.9, 0);
  state.cameras[0].angle = Math.PI / 2 - 0.25; // vault camera sweeps the hall's north edge
  state.cameras[1].angle = 0.35;
  state.cameras[2].angle = Math.PI - 0.35;
  state.alarm.value = 38;
  state.tools.coins = 4; state.tools.emp = 2;
  state.nightLoot = 650;
  state.time = 74;
  return { screen: SCREEN_PLAY };
}
