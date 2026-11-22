// Vision geometry: cones, line of sight and raycasts against the museum's blocking
// rectangles (walls, display cases, pillars, closed doors). Pure maths, no state.

/** Smallest positive t at which ray (ox,oy)+t*(dx,dy) hits rect, or Infinity. */
function rayRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return Infinity;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmax < tmin) return Infinity;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return Infinity;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmax < tmin) return Infinity;
  }
  return tmin;
}

/** Distance from (x,y) along `angle` until the first blocker, capped at maxDist. */
export function rayDistance(x, y, angle, maxDist, blockers) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDist;
  for (const r of blockers) {
    const t = rayRect(x, y, dx, dy, r);
    if (t < best) best = t;
  }
  return Math.max(0, best);
}

/** True when the straight segment a->b crosses no blocker (endpoints shaved so standing
 *  against a case does not blind the watcher). */
export function lineOfSight(ax, ay, bx, by, blockers) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const ux = dx / dist;
  const uy = dy / dist;
  for (const r of blockers) {
    const t = rayRect(ax, ay, ux, uy, r);
    if (t > 2 && t < dist - 2) return false;
  }
  return true;
}

export function angleDelta(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Can a watcher at (x,y) facing `angle` see the target point right now? */
export function canSee(x, y, angle, halfAngle, range, tx, ty, blockers) {
  const dx = tx - x;
  const dy = ty - y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist > 6 && Math.abs(angleDelta(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return lineOfSight(x, y, tx, ty, blockers);
}

/** The visible cone as a polygon: fan of rays, each stopped by the first blocker. */
export function conePolygon(x, y, angle, halfAngle, range, blockers, rays = 14) {
  const points = [[x, y]];
  for (let i = 0; i <= rays; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = rayDistance(x, y, a, range, blockers);
    points.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return points;
}
