// The Aurelia Museum: three night layouts (geometry, loot, doors, patrols, cameras),
// the run state built from them, and movement/collision against blocking rectangles.
// Walls, display cases, pillars, statues, hedges and closed doors all block sight and steps.

import { TOOLS } from './config.js';

const W = (x, y, w, h, kind = 'wall') => ({ x, y, w, h, kind });
const CASE = (x, y, w, h) => W(x, y, w, h, 'case');
const PILLAR = (x, y) => W(x, y, 46, 46, 'pillar');
const STATUE = (x, y) => W(x, y, 52, 52, 'statue');
const HEDGE = (x, y, w, h) => W(x, y, w, h, 'hedge');

function perimeter() {
  return [W(0, 64, 1280, 18), W(0, 690, 1280, 30), W(0, 64, 18, 656), W(1244, 64, 36, 656)];
}

export const NIGHTS = [
  {
    name: 'Night One — The Grand Hall',
    briefing: [
      'The Aurelia Museum sleeps. Take the Moonstone Brooch',
      'from its case, lift what else you can carry,',
      'and slip out the east door. Guards see in cones;',
      'shadow is cover, and a tossed coin is a distraction.',
    ],
    objective: 'Steal the Moonstone Brooch, then reach the east door',
    exitLabel: 'EAST DOOR',
    spawn: { x: 84, y: 610 },
    exit: { x: 1186, y: 330, w: 52, h: 96 },
    van: null,
    walls: [
      ...perimeter(),
      // Partition with a lockable door: the short way east, or walk around its ends.
      W(636, 82, 16, 168), W(636, 330, 16, 150), W(636, 560, 16, 130),
      CASE(206, 246, 124, 54), CASE(430, 246, 124, 54), CASE(758, 246, 124, 54), CASE(972, 246, 124, 54),
      CASE(240, 536, 134, 54), CASE(872, 536, 134, 54),
      PILLAR(322, 428), PILLAR(884, 428), STATUE(614, 420),
    ],
    carpets: [{ x: 60, y: 340, w: 1160, h: 74 }, { x: 590, y: 120, w: 100, h: 520 }],
    shadows: [
      { x: 36, y: 88, w: 168, h: 118 }, { x: 1052, y: 88, w: 168, h: 118 },
      { x: 540, y: 356, w: 200, h: 96 }, { x: 36, y: 470, w: 150, h: 190 }, { x: 1076, y: 470, w: 150, h: 190 },
    ],
    paintings: [[300, 70], [520, 70], [760, 70], [980, 70]],
    doors: [{ x: 628, y: 250, w: 32, h: 80, pickTime: 2.2, name: 'gallery door' }],
    loot: [
      { x: 268, y: 273, name: 'Pearl Mask', value: 350, pickTime: 1.2 },
      { x: 492, y: 273, name: 'Sapphire Egg', value: 500, pickTime: 1.2 },
      { x: 820, y: 273, name: 'Golden Astrolabe', value: 650, pickTime: 1.4 },
      { x: 307, y: 563, name: 'Ivory Flute', value: 300, pickTime: 1.0 },
      { x: 939, y: 563, name: 'Jade Panther', value: 450, pickTime: 1.2 },
      { x: 1034, y: 273, name: 'Moonstone Brooch', value: 900, pickTime: 2.6, main: true },
    ],
    guards: [
      { path: [[300, 170], [560, 170], [560, 470], [300, 470]], pause: 1.4 },
      { path: [[1080, 470], [760, 470], [760, 620], [1080, 620]], pause: 1.1 },
    ],
    cameras: [{ x: 596, y: 92, base: Math.PI / 2, sweep: 0.62, speed: 0.5, phase: 0 }],
  },
  {
    name: 'Night Two — The Security Wing',
    briefing: [
      'New wing, new habits: two cameras, doors that lock,',
      'and the Aurelia Crown under triple glass.',
      'Your EMP can blind a camera for ten seconds —',
      'spend it where the corridor is longest.',
    ],
    objective: 'Steal the Aurelia Crown, then reach the east door',
    exitLabel: 'EAST DOOR',
    spawn: { x: 84, y: 610 },
    exit: { x: 1186, y: 330, w: 52, h: 96 },
    van: null,
    walls: [
      ...perimeter(),
      W(420, 82, 16, 218), W(420, 384, 16, 306),
      W(846, 82, 16, 150), W(846, 316, 16, 374),
      CASE(150, 220, 118, 52), CASE(150, 470, 118, 52), CASE(560, 180, 118, 52),
      CASE(560, 520, 118, 52), CASE(1010, 200, 118, 52), CASE(1010, 500, 118, 52),
      PILLAR(250, 350), PILLAR(640, 350), PILLAR(1030, 350), STATUE(105, 120),
    ],
    carpets: [{ x: 60, y: 330, w: 1160, h: 74 }, { x: 452, y: 300, w: 376, h: 84 }],
    shadows: [
      { x: 36, y: 88, w: 150, h: 110 }, { x: 452, y: 88, w: 140, h: 100 }, { x: 880, y: 560, w: 170, h: 110 },
      { x: 452, y: 560, w: 140, h: 110 }, { x: 1076, y: 88, w: 150, h: 110 }, { x: 36, y: 540, w: 140, h: 130 },
    ],
    paintings: [[240, 70], [620, 70], [1000, 70]],
    doors: [
      { x: 412, y: 300, w: 32, h: 84, pickTime: 2.4, name: 'west door' },
      { x: 838, y: 232, w: 32, h: 84, pickTime: 2.4, name: 'east door' },
    ],
    loot: [
      { x: 209, y: 246, name: 'Silver Chalice', value: 400, pickTime: 1.2 },
      { x: 209, y: 496, name: 'Bronze Mirror', value: 350, pickTime: 1.0 },
      { x: 619, y: 206, name: 'Enamel Snuffbox', value: 550, pickTime: 1.2 },
      { x: 619, y: 546, name: 'Opal Necklace', value: 700, pickTime: 1.4 },
      { x: 1069, y: 526, name: 'Ruby Slippers', value: 600, pickTime: 1.2 },
      { x: 1069, y: 226, name: 'Aurelia Crown', value: 1500, pickTime: 3.0, main: true },
    ],
    guards: [
      { path: [[240, 150], [360, 150], [360, 610], [240, 610]], pause: 1.0 },
      { path: [[520, 610], [760, 610], [760, 150], [520, 150]], pause: 1.2 },
      { path: [[1120, 610], [940, 610], [940, 150], [1120, 150]], pause: 0.9 },
    ],
    cameras: [
      { x: 478, y: 92, base: Math.PI / 2, sweep: 0.55, speed: 0.62, phase: 0 },
      { x: 906, y: 668, base: -Math.PI / 2, sweep: 0.55, speed: 0.55, phase: 2 },
    ],
  },
  {
    name: 'Night Three — The Vault',
    briefing: [
      'The Starling Diamond waits in the vault, and every',
      'guard in the building knows the way there.',
      'Take it, and the night turns: run the garden',
      'to your van while they converge. Do not be caught.',
    ],
    objective: 'Pick the vault door and steal the Starling Diamond',
    exitLabel: 'THE VAN',
    spawn: { x: 1150, y: 616 },
    exit: { x: 56, y: 560, w: 128, h: 62 },
    van: { x: 56, y: 552, w: 128, h: 70 },
    walls: [
      ...perimeter(),
      // Vault block across the north centre; its door is the only way in.
      W(430, 82, 420, 16), W(430, 82, 16, 176), W(834, 82, 16, 176), W(430, 258, 196, 16), W(662, 258, 188, 16),
      CASE(140, 220, 118, 52), CASE(1022, 220, 118, 52), CASE(560, 470, 160, 56),
      PILLAR(300, 420), PILLAR(950, 420), STATUE(180, 380), STATUE(1050, 380),
      HEDGE(36, 470, 300, 26), HEDGE(36, 640, 300, 26), HEDGE(310, 470, 26, 196),
    ],
    carpets: [{ x: 430, y: 560, w: 700, h: 74 }, { x: 590, y: 274, w: 100, h: 360 }],
    shadows: [
      { x: 36, y: 88, w: 160, h: 120 }, { x: 1060, y: 88, w: 160, h: 120 }, { x: 880, y: 88, w: 140, h: 320 },
      { x: 452, y: 290, w: 130, h: 110 }, { x: 700, y: 290, w: 130, h: 110 }, { x: 352, y: 500, w: 150, h: 150 },
    ],
    paintings: [[240, 70], [960, 70]],
    doors: [{ x: 626, y: 250, w: 36, h: 32, pickTime: 3.5, name: 'vault door' }],
    loot: [
      { x: 199, y: 246, name: 'Sunstone Idol', value: 650, pickTime: 1.2 },
      { x: 1081, y: 246, name: 'Midnight Pearl', value: 800, pickTime: 1.4 },
      { x: 640, y: 498, name: 'Jeweled Hourglass', value: 750, pickTime: 1.4 },
      { x: 640, y: 168, name: 'Starling Diamond', value: 3000, pickTime: 3.2, main: true },
    ],
    guards: [
      { path: [[220, 150], [380, 150], [380, 330], [220, 330]], pause: 1.0 },
      { path: [[1060, 330], [900, 330], [900, 150], [1060, 150]], pause: 1.0 },
      { path: [[500, 620], [800, 620], [800, 360], [500, 360]], pause: 0.8 },
      { path: [[520, 200], [760, 200], [760, 130], [520, 130]], pause: 0.7 },
    ],
    cameras: [
      { x: 640, y: 124, base: Math.PI / 2, sweep: 0.4, speed: 0.5, phase: 0 },
      { x: 40, y: 360, base: 0, sweep: 0.5, speed: 0.45, phase: 1.5 },
      { x: 1226, y: 360, base: Math.PI, sweep: 0.5, speed: 0.58, phase: 3 },
    ],
  },
];

export function createState() {
  return {
    nightIndex: 0,
    layout: NIGHTS[0],
    time: 0,
    totalTime: 0,
    banked: 0,
    nightLoot: 0,
    seenCount: 0,
    spotted: false,        // spotted at all this night (clean bonus)
    alarmTripped: false,   // alarm fully tripped this night (ghost bonus)
    phase: 'heist',        // 'heist' | 'getaway' (night three, after the diamond)
    mainTaken: false,
    player: { x: 0, y: 0, r: 14, angle: -Math.PI / 2, moving: false, sneaking: false, noise: 0, stepT: 0 },
    pick: null,            // {kind:'loot'|'door', ref, progress}
    guards: [],
    cameras: [],
    loot: [],
    doors: [],
    noises: [],            // {x,y,t,ttl} coin clinks, visual + investigation source
    empPulse: null,        // {x,y,t}
    alarm: { value: 0, tripped: false, grace: 0, seenAtMax: 0, flash: 0 },
    lastSeen: null,
    anySeeing: false,
    tools: { coins: 0, emp: 0 },
    message: '',
    messageT: 0,
    caughtBy: '',
  };
}

export function startNight(state, index) {
  const layout = NIGHTS[index];
  state.nightIndex = index;
  state.layout = layout;
  state.time = 0;
  state.nightLoot = 0;
  state.spotted = false;
  state.alarmTripped = false;
  state.phase = 'heist';
  state.mainTaken = false;
  state.player.x = layout.spawn.x;
  state.player.y = layout.spawn.y;
  state.player.angle = -Math.PI / 2;
  state.pick = null;
  state.guards = layout.guards.map((def, i) => ({
    x: def.path[0][0], y: def.path[0][1], r: 15, angle: 0, wp: 1, pauseT: 0,
    path: def.path, pause: def.pause, speed: def.speed ?? 56,
    suspicion: 0, mode: 'patrol', target: null, modeT: 0, sweepPhase: i * 1.7, seeing: false, stingPlayed: false,
  }));
  state.cameras = layout.cameras.map((def) => ({ ...def, angle: def.base, disabled: 0, suspicion: 0, seeing: false }));
  state.loot = layout.loot.map((def) => ({ ...def, grabbed: false }));
  state.doors = layout.doors.map((def) => ({ ...def, open: false }));
  state.noises = [];
  state.empPulse = null;
  state.alarm = { value: 0, tripped: false, grace: 0, seenAtMax: 0, flash: 0 };
  state.lastSeen = null;
  state.anySeeing = false;
  state.tools = { coins: TOOLS.byNight[index][0], emp: TOOLS.byNight[index][1] };
  state.message = '';
  state.messageT = 0;
}

/** Everything that blocks steps and sight right now. */
export function blockersOf(state) {
  const out = state.layout.walls.slice();
  for (const door of state.doors) if (!door.open) out.push(door);
  return out;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

/** Move a circle by (dx,dy), sliding along blockers; mutates and returns the entity. */
export function moveCircle(state, e, dx, dy) {
  const blockers = blockersOf(state);
  e.x += dx;
  for (const r of blockers) if (circleHitsRect(e.x, e.y, e.r, r)) e.x -= dx;
  e.y += dy;
  for (const r of blockers) if (circleHitsRect(e.x, e.y, e.r, r)) e.y -= dy;
  e.x = Math.max(e.r + 2, Math.min(1280 - e.r - 2, e.x));
  e.y = Math.max(66 + e.r, Math.min(720 - e.r - 2, e.y));
  return e;
}

export function inShadow(state, x, y) {
  for (const s of state.layout.shadows) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

export function atExit(state) {
  const e = state.layout.exit;
  const p = state.player;
  return p.x > e.x - 6 && p.x < e.x + e.w + 6 && p.y > e.y - 6 && p.y < e.y + e.h + 6;
}

export function say(state, text, seconds = 3) {
  state.message = text;
  state.messageT = seconds;
}
