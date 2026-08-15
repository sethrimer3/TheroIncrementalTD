/**
 * Zeta graphing tower definition: one polar and one parametric projectile.
 */
import type { TowerDefinition } from './types.js';

export const ZETA_TOWER = Object.freeze({
  id: 'zeta',
  symbol: 'ζ',
  name: 'Zeta',
  tier: 6,
  baseCost: 250000,
  damage: 68,
  rate: 1.3,
  range: 0.3,
  icon: 'assets/images/tower-zeta.svg',
  description: 'Plots two freely configurable attack curves like a graphing calculator.',
  nextTierId: 'eta',
} as const satisfies TowerDefinition);

export default ZETA_TOWER;
