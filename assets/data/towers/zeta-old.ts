/** Preserved pendulum version of Zeta, intentionally placed after the modern tower roster. */
import type { TowerDefinition } from './types.js';

export const ZETA_OLD_TOWER = Object.freeze({
  id: 'zeta-old',
  symbol: 'ζ',
  name: 'Zeta (OLD)',
  tier: 0,
  tierLabel: 'Legacy',
  baseCost: 250000,
  damage: 68,
  rate: 1.3,
  range: 0.3,
  icon: 'assets/images/tower-zeta-old.svg',
} as const satisfies TowerDefinition);

export default ZETA_OLD_TOWER;
