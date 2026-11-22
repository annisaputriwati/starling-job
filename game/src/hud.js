// The HUD (drawn on the canvas by the renderer): alarm meter, loot, objective,
// tools, night and clock across the top and bottom edges, plus every full-screen
// panel — title, briefing, pause, caught and final score.
import { FIELD, FONT, PALETTE } from './config.js';

function text(ctx, value, x, y, size, color, align = 'left', weight = '') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

export function money(n) {
  return '$' + n.toLocaleString('en-US');
}

export function clock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function drawHud(ctx, state) {
  const a = state.alarm;
  // Top bar.
  ctx.fillStyle = 'rgba(8,10,17,0.88)';
  ctx.fillRect(0, 0, FIELD.width, 58);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, 57, FIELD.width, 1);
  text(ctx, `NIGHT ${state.nightIndex + 1} / 3`, 20, 29, 19, PALETTE.text, 'left', '700');
  text(ctx, `LOOT ${money(state.banked + state.nightLoot)}`, 190, 29, 19, PALETTE.loot, 'left', '700');

  // Alarm meter: the heart of the HUD, always visible, centre-top.
  const bx = 470;
  const bw = 340;
  text(ctx, a.tripped ? 'ALARM!' : 'ALARM', bx - 12, 29, 17, a.tripped ? PALETTE.danger : PALETTE.muted, 'right', '700');
  ctx.fillStyle = '#1a1e2a';
  ctx.fillRect(bx, 17, bw, 24);
  const frac = a.value / 100;
  ctx.fillStyle = a.tripped
    ? (Math.floor(a.flash * 5) % 2 ? '#ff5348' : '#ffb0a8')
    : frac > 0.66 ? '#ff8a3d' : frac > 0.33 ? '#ffd23d' : '#7fd08a';
  ctx.fillRect(bx, 17, bw * frac, 24);
  ctx.strokeStyle = '#4a5165';
  ctx.strokeRect(bx + 0.5, 17.5, bw, 24);

  text(ctx, `SEEN ×${state.seenCount}`, 880, 29, 16, PALETTE.muted);
  text(ctx, clock(state.totalTime + state.time), 990, 29, 16, PALETTE.muted);
  text(ctx, `COINS ● ${state.tools.coins}`, 1090, 20, 15, PALETTE.loot);
  text(ctx, `EMP ⚡ ${state.tools.emp}`, 1090, 42, 15, '#8fd8ff');

  // Objective line under the bar.
  const objective = state.phase === 'getaway'
    ? 'The diamond is yours — reach THE VAN in the garden!'
    : state.mainTaken
      ? `Target taken — reach the ${state.layout.exitLabel.toLowerCase()}`
      : state.layout.objective;
  ctx.fillStyle = 'rgba(8,10,17,0.66)';
  ctx.fillRect(340, 62, 600, 26);
  text(ctx, objective, FIELD.width / 2, 76, 15, '#ffe9a8', 'center');

  // Transient message (loot lifted, door opened, warnings).
  if (state.messageT > 0) {
    text(ctx, state.message, FIELD.width / 2, 678, 19, PALETTE.text, 'center', '600');
  }
  // Bottom hint.
  text(ctx, 'WASD move · SHIFT sneak · E hold: pick · CLICK toss coin · Q EMP · M mute · P pause', 20, 700, 13, 'rgba(200,208,224,0.55)');
  if (state.player.sneaking) text(ctx, 'SNEAKING', 1262, 700, 13, PALETTE.thief, 'right', '700');
}

function panel(ctx, w, h) {
  const x = (FIELD.width - w) / 2;
  const y = (FIELD.height - h) / 2;
  ctx.fillStyle = 'rgba(4,5,9,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.lineWidth = 1;
  return { x, y, w, h };
}

export function drawTitle(ctx, best) {
  const { y } = panel(ctx, 680, 470);
  text(ctx, 'THE STARLING JOB', FIELD.width / 2, y + 74, 52, PALETTE.gold, 'center', '800');
  text(ctx, 'A stealth heist in the Aurelia Museum', FIELD.width / 2, y + 122, 20, PALETTE.text, 'center');
  const lines = [
    'You are Wren. Three nights, three wings, one diamond.',
    'Guards and cameras see in cones — cross in shadow,',
    'sneak past patrols, toss coins to pull eyes away,',
    'blind cameras with EMP, and pick the cases worth taking.',
    'Fill the alarm meter and the night turns on you.',
  ];
  lines.forEach((line, i) => text(ctx, line, FIELD.width / 2, y + 176 + i * 30, 18, PALETTE.muted, 'center'));
  if (best > 0) text(ctx, `Best take: ${money(best)}`, FIELD.width / 2, y + 348, 18, PALETTE.loot, 'center');
  text(ctx, 'Press SPACE or click to begin Night One', FIELD.width / 2, y + 408, 21, PALETTE.thief, 'center', '700');
}

export function drawBriefing(ctx, state) {
  const { y } = panel(ctx, 640, 380);
  text(ctx, state.layout.name.toUpperCase(), FIELD.width / 2, y + 62, 27, PALETTE.gold, 'center', '800');
  state.layout.briefing.forEach((line, i) => text(ctx, line, FIELD.width / 2, y + 122 + i * 30, 18, PALETTE.text, 'center'));
  text(ctx, `Tools tonight: ● ${state.tools.coins} coins · ⚡ ${state.tools.emp} EMP`, FIELD.width / 2, y + 268, 17, PALETTE.loot, 'center');
  text(ctx, 'Press SPACE to slip inside', FIELD.width / 2, y + 322, 20, PALETTE.thief, 'center', '700');
}

export function drawPaused(ctx) {
  const { y } = panel(ctx, 420, 220);
  text(ctx, 'PAUSED', FIELD.width / 2, y + 70, 36, PALETTE.text, 'center', '800');
  text(ctx, 'The museum holds its breath.', FIELD.width / 2, y + 118, 17, PALETTE.muted, 'center');
  text(ctx, 'Press P to resume', FIELD.width / 2, y + 168, 19, PALETTE.thief, 'center', '700');
}

export function drawFailed(ctx, state) {
  const { y } = panel(ctx, 620, 400);
  text(ctx, 'CAUGHT', FIELD.width / 2, y + 66, 44, PALETTE.danger, 'center', '800');
  text(ctx, state.caughtBy, FIELD.width / 2, y + 118, 18, PALETTE.text, 'center');
  text(ctx, `Grabbed before it went wrong: ${money(state.nightLoot)}`, FIELD.width / 2, y + 168, 19, PALETTE.loot, 'center');
  text(ctx, `Banked from earlier nights: ${money(state.banked)}`, FIELD.width / 2, y + 200, 17, PALETTE.muted, 'center');
  text(ctx, `Time inside: ${clock(state.time)} · Spotted ${state.seenCount} time(s) this run`, FIELD.width / 2, y + 240, 16, PALETTE.muted, 'center');
  text(ctx, 'Press R or SPACE to try the night again', FIELD.width / 2, y + 322, 20, PALETTE.thief, 'center', '700');
}

export function drawComplete(ctx, state, breakdown, best) {
  const { y } = panel(ctx, 660, 460);
  text(ctx, 'THE STARLING IS YOURS', FIELD.width / 2, y + 62, 38, PALETTE.gold, 'center', '800');
  text(ctx, 'Wren melts into the night, pockets heavy, museum poorer.', FIELD.width / 2, y + 106, 17, PALETTE.text, 'center');
  breakdown.forEach((row, i) => {
    text(ctx, row[0], FIELD.width / 2 - 190, y + 160 + i * 32, 18, PALETTE.muted);
    text(ctx, row[1], FIELD.width / 2 + 190, y + 160 + i * 32, 18, PALETTE.loot, 'right', '700');
  });
  const totalY = y + 160 + breakdown.length * 32 + 14;
  text(ctx, `TOTAL TAKE  ${money(state.banked)}`, FIELD.width / 2, totalY, 24, PALETTE.gold, 'center', '800');
  if (best > 0) text(ctx, `Best take: ${money(best)}`, FIELD.width / 2, totalY + 36, 15, PALETTE.muted, 'center');
  text(ctx, 'Press SPACE to play again', FIELD.width / 2, y + 414, 20, PALETTE.thief, 'center', '700');
}
