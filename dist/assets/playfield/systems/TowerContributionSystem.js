// Tower contribution progression keeps combat attribution separate from rendering and tower mechanics.

export const TOWER_CONTRIBUTION_BALANCE = Object.freeze({
  maxLevel: 5,
  // Formula: productive combat at the 1 XP/s baseline reaches levels 2–5 after 45, 120, 240, and 420 seconds.
  levelThresholds: Object.freeze([0, 45, 120, 240, 420]),
  // Formula: normalized contribution may award at most 2 XP per second over sustained combat.
  maxContributionRate: 2,
});

const DEFAULT_CONTRIBUTION_TYPE = 'damage';

function clampFinite(value, minimum, maximum) {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Return useful resolved damage, excluding overkill and invalid hit values.
 * Formula: effectiveDamage = min(max(resolvedDamage, 0), max(hpBefore, 0)).
 */
export function resolveEffectiveDamage(resolvedDamage, hpBefore) {
  const availableHealth = Number.isFinite(hpBefore) ? Math.max(0, hpBefore) : 0;
  const resolved = Number.isFinite(resolvedDamage) ? Math.max(0, resolvedDamage) : 0;
  return Math.min(resolved, availableHealth);
}

/**
 * Derive the live expected damage output so permanent damage/rate upgrades also raise the XP baseline.
 * Formula: expectedDamagePerSecond = currentDamage * currentAttacksPerSecond.
 */
export function resolveExpectedContributionOutput(tower, context = {}) {
  if (Number.isFinite(context.expectedOutput) && context.expectedOutput > 0) {
    return context.expectedOutput;
  }
  if (!tower) {
    return 0;
  }
  const damage = Number.isFinite(tower.damage) ? Math.max(0, tower.damage) : 0;
  const rate = Number.isFinite(tower.rate) ? Math.max(0, tower.rate) : 0;
  const liveOutput = damage * rate;
  if (liveOutput > 0) {
    return liveOutput;
  }
  const definitionDamage = Number.isFinite(tower.definition?.damage)
    ? Math.max(0, tower.definition.damage)
    : 0;
  const definitionRate = Number.isFinite(tower.definition?.rate)
    ? Math.max(0, tower.definition.rate)
    : 0;
  return definitionDamage * definitionRate;
}

/**
 * Calculate a tower level directly from total XP using the centralized thresholds.
 */
export function resolveTowerContributionLevel(xp) {
  const thresholds = TOWER_CONTRIBUTION_BALANCE.levelThresholds;
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  let level = 1;
  for (let index = 1; index < thresholds.length; index += 1) {
    if (safeXp < thresholds[index]) {
      break;
    }
    level = index + 1;
  }
  return Math.min(TOWER_CONTRIBUTION_BALANCE.maxLevel, level);
}

/**
 * Ensure old saves and newly created towers have a valid, internally consistent contribution state.
 */
export function ensureTowerContributionState(tower) {
  if (!tower) {
    return null;
  }
  const thresholds = TOWER_CONTRIBUTION_BALANCE.levelThresholds;
  const maxXp = thresholds[thresholds.length - 1];
  tower.xp = clampFinite(tower.xp, 0, maxXp);
  tower.level = resolveTowerContributionLevel(tower.xp);
  if (!tower.contributionState || typeof tower.contributionState !== 'object') {
    tower.contributionState = { budget: 0 };
  }
  const capacity = resolveContributionBudgetCapacity(tower);
  tower.contributionState.budget = clampFinite(tower.contributionState.budget, 0, capacity);
  return tower.contributionState;
}

/**
 * Preserve enough burst capacity for one normal slow attack while limiting sustained AoE to the rate cap.
 */
export function resolveContributionBudgetCapacity(tower) {
  const rate = Number.isFinite(tower?.rate) ? Math.max(0, tower.rate) : 0;
  const normalShotContribution = rate > 0 ? 1 / rate : 0;
  return Math.max(TOWER_CONTRIBUTION_BALANCE.maxContributionRate, normalShotContribution);
}

/**
 * Refill a tower's contribution budget using elapsed combat time, independent of frame rate.
 */
export function updateTowerContributionBudget(tower, deltaSeconds) {
  const state = ensureTowerContributionState(tower);
  if (!state) {
    return 0;
  }
  const step = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
  const capacity = resolveContributionBudgetCapacity(tower);
  state.budget = Math.min(
    capacity,
    state.budget + step * TOWER_CONTRIBUTION_BALANCE.maxContributionRate,
  );
  return state.budget;
}

/**
 * Seed a new/restored tower with one full burst allowance without granting XP.
 */
export function primeTowerContributionBudget(tower) {
  const state = ensureTowerContributionState(tower);
  if (!state) {
    return 0;
  }
  state.budget = resolveContributionBudgetCapacity(tower);
  return state.budget;
}

/**
 * Add any supported contribution source through one normalization and progression path.
 * Formula: normalizedContribution = rawAmount * weight / expectedOutput.
 */
export function addTowerContribution(tower, type = DEFAULT_CONTRIBUTION_TYPE, rawAmount = 0, context = {}) {
  const state = ensureTowerContributionState(tower);
  if (!state || tower.level >= TOWER_CONTRIBUTION_BALANCE.maxLevel) {
    return 0;
  }
  const amount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;
  const expectedOutput = resolveExpectedContributionOutput(tower, context);
  const weight = Number.isFinite(context.weight) ? Math.max(0, context.weight) : 1;
  if (!type || amount <= 0 || expectedOutput <= 0 || weight <= 0) {
    return 0;
  }
  const normalizedContribution = (amount * weight) / expectedOutput;
  const grantedXp = Math.min(normalizedContribution, state.budget);
  if (grantedXp <= 0) {
    return 0;
  }
  const thresholds = TOWER_CONTRIBUTION_BALANCE.levelThresholds;
  const maxXp = thresholds[thresholds.length - 1];
  state.budget = Math.max(0, state.budget - grantedXp);
  tower.xp = Math.min(maxXp, tower.xp + grantedXp);
  tower.level = resolveTowerContributionLevel(tower.xp);
  return grantedXp;
}

/**
 * Resolve progress inside the current level for the canvas XP meter.
 */
export function getTowerContributionProgress(tower) {
  ensureTowerContributionState(tower);
  const thresholds = TOWER_CONTRIBUTION_BALANCE.levelThresholds;
  const level = tower?.level || 1;
  if (level >= TOWER_CONTRIBUTION_BALANCE.maxLevel) {
    return 1;
  }
  const currentThreshold = thresholds[level - 1];
  const nextThreshold = thresholds[level];
  return clampFinite((tower.xp - currentThreshold) / (nextThreshold - currentThreshold), 0, 1);
}

/**
 * Map contribution level directly to the count of existing ring sprites that should render.
 */
export function getTowerVisibleRingCount(tower) {
  ensureTowerContributionState(tower);
  return clampFinite(tower?.level, 1, TOWER_CONTRIBUTION_BALANCE.maxLevel);
}
