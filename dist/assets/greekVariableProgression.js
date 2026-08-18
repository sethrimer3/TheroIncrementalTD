/** Alpha through Zeta form phase one's globally shared progression vocabulary. */
export const GREEK_VARIABLE_DEFINITIONS = [
    { id: 'alpha', symbol: 'α', ordinal: 1, label: 'Alpha' },
    { id: 'beta', symbol: 'β', ordinal: 2, label: 'Beta' },
    { id: 'gamma', symbol: 'γ', ordinal: 3, label: 'Gamma' },
    { id: 'delta', symbol: 'δ', ordinal: 4, label: 'Delta' },
    { id: 'epsilon', symbol: 'ε', ordinal: 5, label: 'Epsilon' },
    { id: 'zeta', symbol: 'ζ', ordinal: 6, label: 'Zeta' },
];
const definitionMap = new Map(GREEK_VARIABLE_DEFINITIONS.map((definition) => [definition.id, definition]));
/** A single mutable object is the authoritative global state read by every tower. */
const greekVariableState = Object.fromEntries(GREEK_VARIABLE_DEFINITIONS.map((definition) => [definition.id, 1]));
let hooks = {};
function normalizeVariableId(variable) {
    if (typeof variable !== 'string')
        return null;
    const normalized = variable.trim().toLowerCase();
    return definitionMap.has(normalized) ? normalized : null;
}
function normalizeValue(value) {
    return typeof value === 'number' && Number.isFinite(value)
        ? Math.max(1, Math.floor(value))
        : 1;
}
/** Inject the existing Glyph balance and refresh/persistence hooks without owning another currency. */
export function configureGreekVariableProgression(nextHooks = {}) {
    hooks = { ...hooks, ...nextHooks };
}
export function getGreekVariableDefinition(variable) {
    const id = normalizeVariableId(variable);
    return id ? definitionMap.get(id) || null : null;
}
/** Read one globally shared value; unknown ids safely return the phase-one baseline. */
export function getVariableValue(variable) {
    const id = normalizeVariableId(variable);
    return id ? greekVariableState[id] : 1;
}
/** Flat cost equals ordinal position and never depends on the current value. */
export function getVariableUpgradeCost(variable) {
    return getGreekVariableDefinition(variable)?.ordinal || 0;
}
export function canUpgradeVariable(variable) {
    const cost = getVariableUpgradeCost(variable);
    if (cost <= 0 || typeof hooks.getGlyphCurrency !== 'function')
        return false;
    const balance = hooks.getGlyphCurrency();
    return Number.isFinite(balance) && balance >= cost;
}
/** Spend existing Tower Glyphs and increment exactly one global variable exactly once. */
export function upgradeVariable(variable) {
    const id = normalizeVariableId(variable);
    if (!id)
        return { success: false, reason: 'invalid-variable' };
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
export function getGreekVariableStateSnapshot() {
    return { ...greekVariableState };
}
/** Restore untrusted saves additively; absent fields and old saves safely resolve to 1. */
export function applyGreekVariableStateSnapshot(snapshot) {
    const source = typeof snapshot === 'object' && snapshot !== null
        ? snapshot
        : {};
    GREEK_VARIABLE_DEFINITIONS.forEach((definition) => {
        greekVariableState[definition.id] = normalizeValue(source[definition.id]);
    });
    hooks.onChange?.(getGreekVariableStateSnapshot());
    return getGreekVariableStateSnapshot();
}
/** Reset is intentionally public for fresh-game initialization and deterministic tests. */
export function resetGreekVariableState() {
    return applyGreekVariableStateSnapshot({});
}
