// Boot and the one loop for The Starling Job: screens (title, briefing, play,
// paused, caught, complete), the fixed-step simulation wiring every system
// together — thief, guards, cameras, alarm, tools — and sound hooks.
//
// ?seed=N fixes the random generator. ?shot=cover|corridor|vault|getaway
// stages a deterministic scene for screenshots instead of running the loop.
import { BEST_KEY, SCORE, STEP } from './config.js';
import { createRandom } from './random.js';
import { atExit, createState, say, startNight } from './world.js';
import { ACTION_CONFIRM, ACTION_EMP, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_BRIEFING, SCREEN_COMPLETE, SCREEN_FAILED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { updateGuard, convergeAll } from './guards.js';
import { fireEmp, updateCamera } from './cameras.js';
import { tripAlarm, updateAlarm } from './alarm.js';
import { updatePick, updateThief } from './thief.js';
import { createAudio } from './audio.js';
import { clock, money } from './hud.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const state = createState();
startNight(state, 0);
// Test/debug handle: lets a headless smoke test read the simulation directly.
window.__starling = { state, startNight };
const renderer = createRenderer(canvas);
const audio = createAudio();

const run = { lootTotal: 0, ghostNights: 0, cleanNights: 0, breakdown: [] };

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private window */ }
}

function runShot(name) {
  const scene = stageShot(name, state);
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, 0, run.breakdown);
    painted += 1;
    if (painted < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let wasTripped = false;

  function announce(message) { status.textContent = message; }

  function beginRun() {
    run.lootTotal = 0;
    run.ghostNights = 0;
    run.cleanNights = 0;
    run.breakdown = [];
    state.banked = 0;
    state.totalTime = 0;
    state.seenCount = 0;
    startNight(state, 0);
    screen = SCREEN_BRIEFING;
    announce('Night one briefing.');
  }

  function finishNight() {
    audio.alarmStop();
    audio.success();
    run.lootTotal += state.nightLoot;
    let bonus = 0;
    if (!state.alarmTripped) { bonus += SCORE.ghostBonus; run.ghostNights += 1; }
    if (!state.spotted) { bonus += SCORE.cleanBonus; run.cleanNights += 1; }
    state.banked += state.nightLoot + bonus;
    state.totalTime += state.time;
    if (state.nightIndex < 2) {
      startNight(state, state.nightIndex + 1);
      screen = SCREEN_BRIEFING;
      announce(`Night complete. ${state.layout.name}.`);
    } else {
      run.breakdown = [
        ['Loot lifted across three nights', money(run.lootTotal)],
        [`Ghost bonuses — alarm never tripped ×${run.ghostNights}`, money(run.ghostNights * SCORE.ghostBonus)],
        [`Clean bonuses — never spotted ×${run.cleanNights}`, money(run.cleanNights * SCORE.cleanBonus)],
        ['Total time inside', clock(state.totalTime)],
        ['Times spotted, whole run', String(state.seenCount)],
      ];
      if (state.banked > best) { best = state.banked; saveBest(best); }
      screen = SCREEN_COMPLETE;
      announce(`Heist complete. Total take ${state.banked}.`);
    }
  }

  function failNight() {
    audio.alarmStop();
    audio.fail();
    screen = SCREEN_FAILED;
    announce(`Caught. ${state.caughtBy}`);
  }

  function retryNight() {
    startNight(state, state.nightIndex);
    screen = SCREEN_BRIEFING;
  }

  function handleClicks() {
    const clicks = input.takeClicks();
    if (!clicks.length) return;
    audio.unlock();
    if (screen !== SCREEN_PLAY) return;
    for (const click of clicks) {
      const point = renderer.toLogical(click.x, click.y);
      if (point.x < 0 || point.y < 64 || point.x > 1280 || point.y > 720) continue;
      if (state.tools.coins <= 0) { say(state, 'Out of coins.'); continue; }
      state.tools.coins -= 1;
      state.noises.push({ x: point.x, y: point.y, t: 0, ttl: 2.4, fresh: true });
      audio.coin();
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) audio.toggleMute();
    if (actions & ACTION_CONFIRM) audio.unlock();
    if (screen === SCREEN_TITLE && (actions & ACTION_CONFIRM)) beginRun();
    else if (screen === SCREEN_BRIEFING && (actions & ACTION_CONFIRM)) { screen = SCREEN_PLAY; announce(state.layout.name); }
    else if (screen === SCREEN_PLAY && (actions & ACTION_PAUSE)) { screen = SCREEN_PAUSED; audio.alarmStop(); }
    else if (screen === SCREEN_PAUSED && (actions & (ACTION_PAUSE | ACTION_CONFIRM))) screen = SCREEN_PLAY;
    else if (screen === SCREEN_FAILED && (actions & (ACTION_RESTART | ACTION_CONFIRM))) retryNight();
    else if (screen === SCREEN_COMPLETE && (actions & ACTION_CONFIRM)) beginRun();
    if (screen === SCREEN_PLAY && (actions & ACTION_EMP)) {
      if (state.tools.emp > 0) {
        state.tools.emp -= 1;
        const hit = fireEmp(state);
        audio.emp();
        say(state, hit > 0 ? `EMP fired — ${hit} camera(s) dark for 10s.` : 'EMP fired — no cameras in range.');
      } else say(state, 'No EMP charges left.');
    }
  }

  function step() {
    state.time += STEP;
    if (state.messageT > 0) state.messageT -= STEP;
    if (state.empPulse) {
      state.empPulse.t += STEP;
      if (state.empPulse.t > 0.7) state.empPulse = null;
    }
    for (const noise of state.noises) noise.t += STEP;
    state.noises = state.noises.filter((n) => n.t < n.ttl);

    const stepEvent = updateThief(state, input, STEP);
    if (stepEvent === 'step') audio.step(state.player.sneaking);

    const pickEvent = updatePick(state, input, STEP);
    if (pickEvent === 'tick') audio.tick();
    else if (pickEvent === 'grab') audio.grab();
    else if (pickEvent === 'open') audio.open();
    else if (pickEvent === 'main') {
      audio.grab();
      if (state.nightIndex === 2) {
        state.phase = 'getaway';
        state.alarm.value = Math.max(state.alarm.value, 65);
        convergeAll(state);
        say(state, 'THE STARLING DIAMOND IS YOURS — RUN FOR THE VAN!', 5);
      } else {
        say(state, 'TARGET TAKEN — get to the exit!', 4);
      }
    }

    let trip = '';
    let maxSuspicion = 0;
    for (const guard of state.guards) {
      const result = updateGuard(state, guard, STEP);
      if (result === 'trip') trip = 'trip';
      maxSuspicion = Math.max(maxSuspicion, guard.suspicion);
    }
    for (const camera of state.cameras) {
      const result = updateCamera(state, camera, STEP);
      if (result === 'trip') trip = 'trip';
    }
    for (const noise of state.noises) noise.fresh = false;

    const seeingNow = state.guards.some((g) => g.seeing) || state.cameras.some((c) => c.seeing);
    if (seeingNow && !state.anySeeing) {
      state.seenCount += 1;
      state.spotted = true;
    }
    if (maxSuspicion > 0.55 && !step.wasSting) { audio.sting(); step.wasSting = true; }
    if (maxSuspicion < 0.3) step.wasSting = false;
    state.anySeeing = seeingNow;

    if (trip && !state.alarm.tripped) {
      tripAlarm(state);
      say(state, 'ALARM TRIPPED — break line of sight!', 3.5);
    }
    if (state.alarm.tripped && !wasTripped) audio.alarmStart();
    if (!state.alarm.tripped && wasTripped) audio.alarmStop();
    wasTripped = state.alarm.tripped;

    if (updateAlarm(state, STEP) === 'caught') { failNight(); return; }

    if (state.mainTaken && atExit(state)) finishNight();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else accumulator = 0;
    renderer.draw(state, screen, best, run.breakdown);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
  });

  announce('The Starling Job. Press Space to begin.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
