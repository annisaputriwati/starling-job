// Tuning for The Starling Job: a fixed 1280x720 logical stage, scaled by the renderer.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const THIEF = {
  radius: 14,
  walkSpeed: 132,
  sneakSpeed: 66,
  noiseRadius: 74,      // walking is heard this far; sneaking is silent
  interactRange: 52,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 56,
  investigateSpeed: 92,
  convergeSpeed: 112,
  visionRange: 218,
  visionHalfAngle: 0.44,
  catchRange: 30,
};

export const CAMERA = {
  visionRange: 196,
  visionHalfAngle: 0.34,
  empSeconds: 10,
  empRadius: 230,
};

export const ALARM = {
  risePerSecond: 30,    // while anything sees Wren
  decayPerSecond: 13,   // while nothing does
  graceSeconds: 3.5,    // break line of sight this long to end a tripped alarm
  maxSeenSeconds: 1.4,  // stared at this long during a tripped alarm = caught
};

export const TOOLS = {
  // per night: [coins, emp]
  byNight: [[3, 1], [4, 2], [5, 2]],
  coinNoiseRadius: 185,
  coinInvestigateSeconds: 4.5,
};

export const SCORE = {
  ghostBonus: 500,      // a night finished with the alarm never tripped
  cleanBonus: 250,      // a night finished never even spotted
};

export const PALETTE = {
  backdrop: '#07080d',
  floorA: '#2b2f3d',
  floorB: '#252935',
  carpet: '#5d1f28',
  carpetEdge: '#c9a227',
  wall: '#454c61',
  wallTrim: '#c9a227',
  shadow: 'rgba(5,7,16,0.52)',
  glass: 'rgba(150,200,235,0.20)',
  gold: '#f2c94c',
  loot: '#ffd968',
  diamond: '#9fe8ff',
  thief: '#39d0c4',
  guard: '#d8b25c',
  guardDark: '#23283a',
  coneGuard: 'rgba(255,196,64,',
  coneCamera: 'rgba(96,200,255,',
  coneOff: 'rgba(140,148,160,',
  danger: '#ff5348',
  text: '#eef1f5',
  muted: '#9aa3b5',
  panel: 'rgba(13,16,26,0.92)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'starling-job.best';
