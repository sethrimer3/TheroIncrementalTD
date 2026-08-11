import { clamp, normalizeParticleColor } from './TowerUtils.js';

// Central trail tuning table. Adjust these presets to change every supported
// projectile/exhaust family without editing its movement or renderer code.
export const PROJECTILE_TRAIL_STYLES = Object.freeze({
  alpha: Object.freeze({ length: 8, width: 5.5, sampleDistance: 5, outerAlpha: 0.12, innerAlpha: 0.3, coreAlpha: 0.7 }),
  beta: Object.freeze({ length: 8, width: 5.5, sampleDistance: 5, outerAlpha: 0.11, innerAlpha: 0.28, coreAlpha: 0.68 }),
  gamma: Object.freeze({ length: 9, width: 4.8, sampleDistance: 5, outerAlpha: 0.12, innerAlpha: 0.3, coreAlpha: 0.72 }),
  deltaShip: Object.freeze({ length: 10, width: 8, sampleDistance: 4, outerAlpha: 0.1, innerAlpha: 0.24, coreAlpha: 0.52 }),
  omegaWave: Object.freeze({ length: 9, width: 4.2, sampleDistance: 3, outerAlpha: 0.12, innerAlpha: 0.32, coreAlpha: 0.76 }),
  omegaParticle: Object.freeze({ length: 10, width: 5, sampleDistance: 3, outerAlpha: 0.1, innerAlpha: 0.3, coreAlpha: 0.72 }),
});

// Lazily allocate a bounded pair of typed coordinate buffers on the moving owner.
export function ensureProjectileTrail(owner, style) {
  const capacity = Math.max(2, Math.min(12, Math.floor(style?.length || 8)));
  if (owner?.trailX?.length === capacity && owner?.trailY?.length === capacity) {
    return;
  }
  owner.trailX = new Float32Array(capacity);
  owner.trailY = new Float32Array(capacity);
  owner.trailCount = 0;
  owner.trailStart = 0;
}

// Record a distance-limited world-space sample while always keeping the tip live.
export function recordProjectileTrail(owner, x, y, style = owner?.trailStyle) {
  if (!owner || !style || !Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }
  ensureProjectileTrail(owner, style);
  const capacity = owner.trailX.length;
  if (owner.trailCount >= 2) {
    const lastIndex = (owner.trailStart + owner.trailCount - 1) % capacity;
    const anchorIndex = (owner.trailStart + owner.trailCount - 2) % capacity;
    const dx = x - owner.trailX[anchorIndex];
    const dy = y - owner.trailY[anchorIndex];
    const threshold = Math.max(1, style.sampleDistance || 3);
    if (dx * dx + dy * dy < threshold * threshold) {
      owner.trailX[lastIndex] = x;
      owner.trailY[lastIndex] = y;
      return;
    }
  }
  let writeIndex = (owner.trailStart + owner.trailCount) % capacity;
  if (owner.trailCount >= capacity) {
    owner.trailStart = (owner.trailStart + 1) % capacity;
    writeIndex = (owner.trailStart + owner.trailCount - 1) % capacity;
  } else {
    owner.trailCount += 1;
  }
  owner.trailX[writeIndex] = x;
  owner.trailY[writeIndex] = y;
}

// Paint one allocation-free tapered ribbon layer using smoothed neighbor tangents.
function drawRibbonLayer(ctx, owner, color, width, alpha, opacity) {
  const count = owner.trailCount || 0;
  const capacity = owner.trailX?.length || 0;
  if (count < 2 || !capacity || width <= 0 || alpha <= 0) return;
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${clamp(alpha * opacity, 0, 1)})`;
  ctx.beginPath();
  for (let index = 0; index < count; index += 1) {
    const pointIndex = (owner.trailStart + index) % capacity;
    const previousIndex = (owner.trailStart + Math.max(0, index - 1)) % capacity;
    const nextIndex = (owner.trailStart + Math.min(count - 1, index + 1)) % capacity;
    const dx = owner.trailX[nextIndex] - owner.trailX[previousIndex];
    const dy = owner.trailY[nextIndex] - owner.trailY[previousIndex];
    const distance = Math.hypot(dx, dy) || 1;
    const halfWidth = width * 0.5 * (index / (count - 1));
    const x = owner.trailX[pointIndex] - (dy / distance) * halfWidth;
    const y = owner.trailY[pointIndex] + (dx / distance) * halfWidth;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let index = count - 1; index >= 0; index -= 1) {
    const pointIndex = (owner.trailStart + index) % capacity;
    const previousIndex = (owner.trailStart + Math.max(0, index - 1)) % capacity;
    const nextIndex = (owner.trailStart + Math.min(count - 1, index + 1)) % capacity;
    const dx = owner.trailX[nextIndex] - owner.trailX[previousIndex];
    const dy = owner.trailY[nextIndex] - owner.trailY[previousIndex];
    const distance = Math.hypot(dx, dy) || 1;
    const halfWidth = width * 0.5 * (index / (count - 1));
    ctx.lineTo(owner.trailX[pointIndex] + (dy / distance) * halfWidth, owner.trailY[pointIndex] - (dx / distance) * halfWidth);
  }
  ctx.closePath();
  ctx.fill();
}

// Compose the glow from three vector ribbons. color/opacity/style may be overridden per owner.
export function drawProjectileTrail(ctx, owner, fallbackColor, fallbackStyle) {
  const style = owner?.trailStyle || fallbackStyle;
  const color = normalizeParticleColor(style?.color || owner?.trailColor || fallbackColor || owner?.color);
  if (!ctx || !style || !color || (owner.trailCount || 0) < 2) return;
  const opacity = clamp(Number.isFinite(owner.trailOpacity) ? owner.trailOpacity : (owner.opacity ?? owner.alpha ?? 1), 0, 1);
  const width = Math.max(0, style.width || 0);
  drawRibbonLayer(ctx, owner, color, width * 1.8, style.outerAlpha ?? 0.1, opacity);
  drawRibbonLayer(ctx, owner, color, width, style.innerAlpha ?? 0.28, opacity);
  drawRibbonLayer(ctx, owner, color, width * 0.32, style.coreAlpha ?? 0.7, opacity);
}
