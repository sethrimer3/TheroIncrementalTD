/** Canonical Greek tower ids in tier order, ending with the Tier 25 Infinity Tower. */
export const CANONICAL_TOWER_IDS = Object.freeze([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota',
  'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau',
  'upsilon', 'phi', 'chi', 'psi', 'omega', 'infinity',
] as const);

const CANONICAL_TOWER_ID_SET = new Set<string>(CANONICAL_TOWER_IDS);

/** Return whether a tower belongs to the canonical 25-tier unlock chain. */
export function isCanonicalTowerId(towerId: unknown): boolean {
  return typeof towerId === 'string' && CANONICAL_TOWER_ID_SET.has(towerId);
}

/**
 * Calculate the purchase/unlock cost for one canonical tower tier.
 * Formula: cost = roundToHundreds(100 * tier^2).
 */
export function calculateTowerUnlockCost(tier: unknown): number {
  if (typeof tier !== 'number' || !Number.isFinite(tier) || tier < 1) {
    return 0;
  }
  const normalizedTier = Math.floor(tier);
  return Math.round((100 * normalizedTier * normalizedTier) / 100) * 100;
}
