// Per-tower algebraic upgrade variables, purchased with Aleph Glyphs (Well of
// Inspiration currency). These are plain stat-modifier levels distinct from the
// authored equation "variables" in assets/towerEquations/*.js (e.g. Iota's
// aleph0-3 ranks) and distinct from the retired Spire systems documented in
// docs/SPIRE_RETIREMENT.md. Never reuse the retired save keys bet/lamed/tsadi/shin/kuf here.
/** Five thematic per-tower upgrade variables. Costs scale by config, not by name. */
export const ALGEBRAIC_VARIABLES = [
    { id: 'gimel', label: 'Gimel Coefficient', baseCost: 1 },
    { id: 'dalet', label: 'Dalet Coefficient', baseCost: 2 },
    { id: 'he', label: 'He Coefficient', baseCost: 3 },
    { id: 'zayin', label: 'Zayin Coefficient', baseCost: 4 },
    { id: 'tet', label: 'Tet Coefficient', baseCost: 5 },
];
const ALGEBRAIC_VARIABLE_MAP = new Map(ALGEBRAIC_VARIABLES.map((variable) => [variable.id, variable]));
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
/** Look up one variable's static definition, or null if the id is unrecognized. */
export function getAlgebraicVariableDefinition(variableId) {
    if (!variableId)
        return null;
    return ALGEBRAIC_VARIABLE_MAP.get(variableId) || null;
}
/**
 * Cost to purchase the next level of a variable. Flat per-variable cost today;
 * `currentLevel` is accepted so future scaling curves can key off it without an
 * API change.
 */
export function getTowerVariableUpgradeCost(variableId, currentLevel) {
    void currentLevel;
    const definition = getAlgebraicVariableDefinition(variableId);
    if (!definition)
        return 1;
    return Math.max(1, Math.floor(definition.baseCost));
}
const algebraicUpgradeState = new Map();
/** Ensure every algebraic variable has a level entry (defaulting to 0) for a tower. */
export function ensureAlgebraicUpgradeState(towerId) {
    if (!towerId)
        return {};
    let record = algebraicUpgradeState.get(towerId);
    if (!record) {
        record = {};
        algebraicUpgradeState.set(towerId, record);
    }
    ALGEBRAIC_VARIABLES.forEach((variable) => {
        if (!isFiniteNumber(record[variable.id])) {
            record[variable.id] = 0;
        }
    });
    return record;
}
/** Current purchased level of one algebraic variable on one tower (0 if none purchased). */
export function getAlgebraicVariable(towerId, variableId) {
    if (!towerId || !variableId)
        return 0;
    const record = ensureAlgebraicUpgradeState(towerId);
    return isFiniteNumber(record[variableId]) ? record[variableId] : 0;
}
/**
 * Spend Aleph Glyphs to raise one tower's variable by one level. Fails cleanly
 * (no deduction, no level change) on an unknown tower/variable or insufficient
 * balance.
 */
export function purchaseAlgebraicUpgrade(towerId, variableId, { getGlyphCurrency, spendGlyphCurrency }) {
    if (!towerId) {
        return { success: false, reason: 'invalid-tower' };
    }
    const definition = getAlgebraicVariableDefinition(variableId);
    if (!definition) {
        return { success: false, reason: 'invalid-variable' };
    }
    const record = ensureAlgebraicUpgradeState(towerId);
    const currentLevel = isFiniteNumber(record[definition.id]) ? record[definition.id] : 0;
    const cost = getTowerVariableUpgradeCost(definition.id, currentLevel);
    const balance = getGlyphCurrency();
    if (!isFiniteNumber(balance) || balance < cost) {
        return { success: false, reason: 'insufficient-balance', cost };
    }
    spendGlyphCurrency(cost);
    record[definition.id] = currentLevel + 1;
    return { success: true, cost, level: record[definition.id] };
}
/** Serializable snapshot of every tower's non-zero algebraic upgrade levels. */
export function getAlgebraicUpgradeStateSnapshot() {
    const snapshot = {};
    algebraicUpgradeState.forEach((record, towerId) => {
        const entries = {};
        let hasAny = false;
        ALGEBRAIC_VARIABLES.forEach((variable) => {
            const level = record[variable.id];
            if (isFiniteNumber(level) && level > 0) {
                entries[variable.id] = Math.max(0, Math.floor(level));
                hasAny = true;
            }
        });
        if (hasAny) {
            snapshot[towerId] = entries;
        }
    });
    return snapshot;
}
/**
 * Restore algebraic upgrade levels from a saved snapshot. Unknown variable ids
 * (including any of the retired bet/lamed/tsadi/shin/kuf keys, should an old
 * or malicious payload carry them) are silently ignored rather than restored.
 */
export function applyAlgebraicUpgradeStateSnapshot(snapshot) {
    if (!isObjectLike(snapshot))
        return;
    Object.keys(snapshot).forEach((towerId) => {
        const savedRecord = snapshot[towerId];
        if (!isObjectLike(savedRecord))
            return;
        const record = ensureAlgebraicUpgradeState(towerId);
        Object.keys(savedRecord).forEach((variableId) => {
            if (!ALGEBRAIC_VARIABLE_MAP.has(variableId))
                return;
            const level = savedRecord[variableId];
            if (isFiniteNumber(level) && level > 0) {
                record[variableId] = Math.max(0, Math.floor(level));
            }
        });
    });
}
/** Reset algebraic upgrade investments for one tower, or every tower when no id is given. */
export function clearAlgebraicUpgradeState(targetTowerId = null) {
    if (typeof targetTowerId === 'string' && targetTowerId.trim()) {
        algebraicUpgradeState.delete(targetTowerId.trim());
    }
    else {
        algebraicUpgradeState.clear();
    }
}
