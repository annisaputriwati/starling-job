// Drawing only: the night museum, vision cones, Wren, guards, cameras and loot,
// then the HUD and the current screen's panel. 1280x720 logical stage, scaled to fit.
import { CAMERA, FIELD, GUARD, PALETTE } from './config.js';
import { conePolygon } from './vision.js';
import { blockersOf } from './world.js';
import { drawBriefing, drawComplete, drawFailed, drawHud, drawPaused, drawTitle } from './hud.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_BRIEFING = 'briefing';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_FAILED = 'failed';
export const SCREEN_COMPLETE = 'complete';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0, dpr: 1 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    view.dpr = dpr;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function toLogical(offsetX, offsetY) {
    return {
      x: (offsetX * view.dpr - view.x) / view.scale,
      y: (offsetY * view.dpr - view.y) / view.scale,
    };
  }

  function poly(points, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function drawFloor(state) {
    const layout = state.layout;
    // Marble checker.
    const tile = 64;
    for (let y = 64; y < FIELD.height; y += tile) {
      for (let x = 0; x < FIELD.width; x += tile) {
        ctx.fillStyle = ((x + y) / tile) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    for (let x = 0; x <= FIELD.width; x += tile) { ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, FIELD.height); ctx.stroke(); }
    // Carpet runners with gold edging.
    for (const c of layout.carpets) {
      ctx.fillStyle = PALETTE.carpet;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = PALETTE.carpetEdge;
      ctx.strokeRect(c.x + 4.5, c.y + 4.5, c.w - 9, c.h - 9);
    }
    // Garden (night three): lawn under the hedges and around the van.
    if (layout.van) {
      ctx.fillStyle = '#1d2b1e';
      ctx.fillRect(18, 460, 330, 230);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 26; i += 1) ctx.fillRect(30 + ((i * 53) % 300), 470 + ((i * 97) % 200), 3, 8);
    }
    // Shadow zones: pools of dark where Wren is hard to see.
    for (const s of layout.shadows) {
      ctx.fillStyle = PALETTE.shadow;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(120,150,220,0.14)';
      ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
    }
    // Paintings in gold frames along the top wall.
    for (const p of layout.paintings) {
      const x = p[0];
      ctx.fillStyle = '#8a6d1f';
      ctx.fillRect(x, 66, 64, 14);
      ctx.fillStyle = ['#37506b', '#5b3750', '#37563c', '#6b5637'][(x / 40 | 0) % 4];
      ctx.fillRect(x + 4, 68, 56, 10);
    }
    // Exit glow.
    const e = layout.exit;
    const active = state.mainTaken;
    ctx.fillStyle = active ? 'rgba(80,255,150,0.30)' : 'rgba(120,140,170,0.18)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = active ? '#57e389' : '#5a6480';
    ctx.strokeRect(e.x + 0.5, e.y + 0.5, e.w - 1, e.h - 1);
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillStyle = active ? '#a9ffcb' : '#8b93a3';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(layout.exitLabel, e.x + e.w / 2, e.y + e.h / 2);
    // The getaway van.
    if (layout.van) {
      const v = layout.van;
      ctx.fillStyle = '#10131c';
      ctx.fillRect(v.x - 6, v.y - 4, v.w + 12, v.h + 10);
      ctx.fillStyle = '#3d4b66';
      ctx.fillRect(v.x, v.y, v.w, v.h);
      ctx.fillStyle = '#9fc6e8';
      ctx.fillRect(v.x + v.w - 34, v.y + 8, 24, 20);
      ctx.fillStyle = '#141824';
      ctx.fillRect(v.x + 10, v.y + 10, 52, v.h - 20);
      ctx.fillStyle = '#0b0d13';
      for (const wx of [v.x + 18, v.x + v.w - 30]) {
        ctx.beginPath(); ctx.arc(wx, v.y + v.h + 2, 10, 0, Math.PI * 2); ctx.fill();
      }
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillStyle = '#dfe7f2';
      ctx.fillText('GETAWAY', v.x + v.w / 2, v.y + v.h / 2 + 14);
    }
  }

  function drawBlocker(r, state) {
    if (r.kind === 'case') {
      ctx.fillStyle = '#20242f';
      ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
      ctx.fillStyle = PALETTE.glass;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#c9a227';
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    } else if (r.kind === 'pillar') {
      ctx.fillStyle = '#59617a';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#79839e';
      ctx.fillRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12);
      ctx.strokeStyle = '#c9a227';
      ctx.strokeRect(r.x + 2.5, r.y + 2.5, r.w - 5, r.h - 5);
    } else if (r.kind === 'statue') {
      ctx.fillStyle = '#3c4257';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#aeb6c9';
      ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 16, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2, r.y + 24);
      ctx.lineTo(r.x + r.w / 2 + 11, r.y + r.h - 6);
      ctx.lineTo(r.x + r.w / 2 - 11, r.y + r.h - 6);
      ctx.closePath(); ctx.fill();
    } else if (r.kind === 'hedge') {
      ctx.fillStyle = '#24402a';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#2f5738';
      for (let x = r.x + 6; x < r.x + r.w - 4; x += 16) {
        ctx.beginPath(); ctx.arc(x, r.y + r.h / 2, 7, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(r.x, r.y, r.w, 3);
    }
  }

  function drawLoot(state) {
    for (const item of state.loot) {
      if (item.grabbed) continue;
      const pulse = 0.6 + 0.4 * Math.sin(state.time * 3 + item.x);
      if (item.main) {
        const glow = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, 54);
        glow.addColorStop(0, `rgba(159,232,255,${0.5 * pulse})`);
        glow.addColorStop(1, 'rgba(159,232,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(item.x, item.y, 54, 0, Math.PI * 2); ctx.fill();
        // The gem itself.
        ctx.fillStyle = PALETTE.diamond;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 15);
        ctx.lineTo(item.x + 12, item.y - 3);
        ctx.lineTo(item.x, item.y + 16);
        ctx.lineTo(item.x - 12, item.y - 3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 15);
        ctx.lineTo(item.x + 6, item.y - 3);
        ctx.lineTo(item.x - 6, item.y - 3);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255,217,104,${0.85 * pulse})`;
        ctx.beginPath(); ctx.arc(item.x, item.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath(); ctx.arc(item.x, item.y, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawCones(state) {
    const blockers = blockersOf(state);
    for (const cam of state.cameras) {
      let fill;
      if (cam.disabled > 0) fill = PALETTE.coneOff + '0.13)';
      else if (cam.suspicion > 0.55) fill = 'rgba(255,83,72,0.30)';
      else fill = PALETTE.coneCamera + `${0.13 + cam.suspicion * 0.2})`;
      poly(conePolygon(cam.x, cam.y, cam.angle, CAMERA.visionHalfAngle, CAMERA.visionRange, blockers), fill);
    }
    for (const g of state.guards) {
      const fill = g.suspicion > 0.55
        ? `rgba(255,83,72,${0.22 + g.suspicion * 0.2})`
        : PALETTE.coneGuard + `${0.15 + g.suspicion * 0.22})`;
      poly(conePolygon(g.x, g.y, g.angle, GUARD.visionHalfAngle, GUARD.visionRange, blockers), fill);
    }
  }

  function drawEntities(state) {
    // Cameras: wall mounts.
    for (const cam of state.cameras) {
      ctx.fillStyle = cam.disabled > 0 ? '#565d6b' : '#1c2130';
      ctx.fillRect(cam.x - 9, cam.y - 9, 18, 18);
      ctx.fillStyle = cam.disabled > 0 ? '#8b93a3' : '#ff5348';
      ctx.beginPath(); ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2); ctx.fill();
      if (cam.disabled > 0) {
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.fillStyle = '#aab3c5';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(cam.disabled), cam.x, cam.y - 16);
      }
    }
    // Doors.
    for (const door of state.doors) {
      if (door.open) continue;
      ctx.fillStyle = '#6b4f2a';
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.strokeStyle = '#c9a227';
      ctx.strokeRect(door.x + 1.5, door.y + 1.5, door.w - 3, door.h - 3);
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath(); ctx.arc(door.x + door.w / 2, door.y + door.h / 2, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // Coin noises.
    for (const n of state.noises) {
      const age = 1 - n.t / n.ttl;
      ctx.strokeStyle = `rgba(255,217,104,${age * 0.7})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, 6 + (1 - age) * 30, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd968';
      ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    // Guards.
    for (const g of state.guards) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.arc(g.x + 3, g.y + 4, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.guardDark;
      ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.guard;
      ctx.beginPath(); ctx.arc(g.x, g.y, 8.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0e1016';
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.angle) * 16, g.y + Math.sin(g.angle) * 16);
      ctx.stroke();
      if (g.suspicion > 0.04) {
        ctx.fillStyle = '#141824';
        ctx.fillRect(g.x - 14, g.y - 30, 28, 5);
        ctx.fillStyle = g.suspicion > 0.7 ? '#ff5348' : '#ffd23d';
        ctx.fillRect(g.x - 14, g.y - 30, 28 * g.suspicion, 5);
        if (g.suspicion > 0.7) {
          ctx.font = '800 16px system-ui, sans-serif';
          ctx.fillStyle = '#ff5348';
          ctx.textAlign = 'center';
          ctx.fillText('!', g.x, g.y - 38);
        }
      }
    }
    // Wren.
    const p = state.player;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(p.x + 3, p.y + 4, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#123a3f';
    ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.thief;
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b2530';
    ctx.beginPath(); ctx.arc(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4, 4.5, 0, Math.PI * 2); ctx.fill();
    // Lockpick progress ring.
    if (state.pick) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = PALETTE.gold;
      ctx.beginPath(); ctx.arc(p.x, p.y, 22, -Math.PI / 2, -Math.PI / 2 + state.pick.progress * Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
    // EMP pulse.
    if (state.empPulse) {
      const t = state.empPulse.t;
      ctx.strokeStyle = `rgba(140,216,255,${Math.max(0, 0.8 - t * 1.4)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(state.empPulse.x, state.empPulse.y, 20 + t * 260, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
  }

  function draw(state, screen, best, breakdown) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawFloor(state);
    for (const r of state.layout.walls) drawBlocker(r, state);
    drawLoot(state);
    drawCones(state);
    drawEntities(state);
    // Tripped-alarm light wash.
    if (state.alarm.tripped && Math.floor(state.alarm.flash * 2.4) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,40,30,0.07)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    drawHud(ctx, state);
    if (screen === SCREEN_TITLE) drawTitle(ctx, best);
    else if (screen === SCREEN_BRIEFING) drawBriefing(ctx, state);
    else if (screen === SCREEN_PAUSED) drawPaused(ctx);
    else if (screen === SCREEN_FAILED) drawFailed(ctx, state);
    else if (screen === SCREEN_COMPLETE) drawComplete(ctx, state, breakdown ?? [], best);
  }

  return { draw, toLogical };
}
