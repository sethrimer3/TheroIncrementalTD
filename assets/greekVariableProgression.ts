/** Data-driven definition for one player-owned Greek progression variable. */
export interface GreekVariableDefinition {
  id: string;
  symbol: string;
  ordinal: number;
  label: string;
}

/** Alpha through Zeta form phase one's globally shared progression vocabulary. */
export const GREEK_VARIABLE_DEFINITIONS: readonly GreekVariableDefinition[] = [
  { id: 'alpha', symbol: 'α', ordinal: 1, label: 'Alpha' },
  { id: 'beta', symbol: 'β', ordinal: 2, label: 'Beta' },
  { id: 'gamma', symbol: 'γ', ordinal: 3, label: 'Gamma' },
  { id: 'delta', symbol: 'δ', ordinal: 4, label: 'Delta' },
  { id: 'epsilon', symbol: 'ε', ordinal: 5, label: 'Epsilon' },
  { id: 'zeta', symbol: 'ζ', ordinal: 6, label: 'Zeta' },
];

export type GreekVariableId = 'alpha' | 'beta' | 'gamma' | 'delta' | 'epsilon' | 'zeta';
export type GreekVariableSnapshot = Record<GreekVariableId, number>;

export interface GreekVariableProgressionHooks {
  getGlyphCurrency?: () => number;
  spendGlyphCurrency?: (amount: number) => void;
  onChange?: (snapshot: GreekVariableSnapshot) => void;
}

export interface GreekVariableUpgradeResult {
  success: boolean;
  reason?: 'invalid-variable' | 'insufficient-glyphs' | 'unconfigured-currency';
  cost?: number;
  value?: number;
}

const definitionMap = new Map(
  GREEK_VARIABLE_DEFINITIONS.map((definition) => [definition.id, definition]),
);

/** A single mutable object is the authoritative global state read by every tower. */
const greekVariableState = Object.fromEntries(
  GREEK_VARIABLE_DEFINITIONS.map((definition) => [definition.id, 1]),
) as GreekVariableSnapshot;

let hooks: GreekVariableProgressionHooks = {};

function normalizeVariableId(variable: unknown): GreekVariableId | null {
  if (typeof variable !== 'string') return null;
  const normalized = variable.trim().toLowerCase();
  return definitionMap.has(normalized) ? normalized as GreekVariableId : null;
}

function normalizeValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : 1;
}

/** Inject the existing Glyph balance and refresh/persistence hooks without owning another currency. */
export function configureGreekVariableProgression(nextHooks: GreekVariableProgressionHooks = {}): void {
  hooks = { ...hooks, ...nextHooks };
}

export function getGreekVariableDefinition(variable: unknown): GreekVariableDefinition | null {
  const id = normalizeVariableId(variable);
  return id ? definitionMap.get(id) || null : null;
}

/** Read one globally shared value; unknown ids safely return the phase-one baseline. */
export function getVariableValue(variable: unknown): number {
  const id = normalizeVariableId(variable);
  return id ? greekVariableState[id] : 1;
}

/** Flat cost equals ordinal position and never depends on the current value. */
export function getVariableUpgradeCost(variable: unknown): number {
  return getGreekVariableDefinition(variable)?.ordinal || 0;
}

export function canUpgradeVariable(variable: unknown): boolean {
  const cost = getVariableUpgradeCost(variable);
  if (cost <= 0 || typeof hooks.getGlyphCurrency !== 'function') return false;
  const balance = hooks.getGlyphCurrency();
  return Number.isFinite(balance) && balance >= cost;
}

/** Spend existing Tower Glyphs and increment exactly one global variable exactly once. */
export function upgradeVariable(variable: unknown): GreekVariableUpgradeResult {
  const id = normalizeVariableId(variable);
  if (!id) return { success: false, reason: 'invalid-variable' };
  const cost = getVariableUpgradeCost(id);
  if (typeof hooks.getGlyphCurrency !== 'function' || typeof hooks.spendGlyphCurrency !== 'function') {
    return { success: false, reason: 'unconfigured-currency', cost };
  }
  if (!canUpgradeVariable(id)) {
    return { success: false, reason: 'insufficient-glyphs', cost };
  }
  hooks.spendGlyphCurrency(cost);
  greekVariableState[id] += 1;
  const snapshot = getGreekVariableStateSnapshot();
  hooks.onChange?.(snapshot);
  return { success: true, cost, value: greekVariableState[id] };
}

export function getGreekVariableStateSnapshot(): GreekVariableSnapshot {
  return { ...greekVariableState };
}

/** Restore untrusted saves additively; absent fields and old saves safely resolve to 1. */
export function applyGreekVariableStateSnapshot(snapshot: unknown): GreekVariableSnapshot {
  const source = typeof snapshot === 'object' && snapshot !== null
    ? snapshot as Record<string, unknown>
    : {};
  GREEK_VARIABLE_DEFINITIONS.forEach((definition) => {
    greekVariableState[definition.id as GreekVariableId] = normalizeValue(source[definition.id]);
  });
  hooks.onChange?.(getGreekVariableStateSnapshot());
  return getGreekVariableStateSnapshot();
}

/** Reset is intentionally public for fresh-game initialization and deterministic tests. */
export function resetGreekVariableState(): GreekVariableSnapshot {
  return applyGreekVariableStateSnapshot({});
}
