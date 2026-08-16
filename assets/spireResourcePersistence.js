/** Preserve the original truthy-object checks while giving property reads an honest boundary. */
function isObjectRecord(value) {
    return typeof value === 'object' && value !== null;
}
/** Read a property from untrusted legacy JSON without inventing validation it never had. */
function readLegacyProperty(value, key) {
    return isObjectRecord(value) ? value[key] : undefined;
}
/**
 * Persist the surviving Tower of Inspiration story state and tower upgrades.
 * Legacy snapshots may contain retired spire branches; those branches are intentionally ignored.
 */
export function createSpireResourcePersistence({ spireResourceState, getTowerUpgradeStateSnapshot, applyTowerUpgradeStateSnapshot, getAlephChainUpgrades, applyAlephChainUpgradeSnapshot, getPlayfield, getAlgebraicUpgradeStateSnapshot = () => ({}), applyAlgebraicUpgradeStateSnapshot = () => { }, getGreekVariableStateSnapshot = () => ({ alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1 }), applyGreekVariableStateSnapshot = () => ({ alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1 }), }) {
    /** Preserve the base tower snapshot while adding the Aleph-chain and algebraic-upgrade branches. */
    function getTowerUpgradeStateSnapshotWithAleph() {
        return {
            ...getTowerUpgradeStateSnapshot(),
            alephChainUpgrades: getAlephChainUpgrades(),
            algebraicUpgrades: getAlgebraicUpgradeStateSnapshot(),
            greekVariables: getGreekVariableStateSnapshot(),
        };
    }
    /** Restore base tower upgrades first, then restore the Aleph-chain and algebraic-upgrade branches. */
    function applyTowerUpgradeStateSnapshotWithAleph(snapshot) {
        if (!isObjectRecord(snapshot))
            return;
        applyTowerUpgradeStateSnapshot(snapshot);
        const alephChainUpgrades = snapshot.alephChainUpgrades;
        if (alephChainUpgrades && isObjectRecord(alephChainUpgrades)) {
            applyAlephChainUpgradeSnapshot(alephChainUpgrades, { playfield: getPlayfield() });
        }
        const algebraicUpgrades = snapshot.algebraicUpgrades;
        if (algebraicUpgrades && isObjectRecord(algebraicUpgrades)) {
            applyAlgebraicUpgradeStateSnapshot(algebraicUpgrades);
        }
        // Missing phase-one state is deliberately passed as undefined so old saves reset all variables to 1.
        applyGreekVariableStateSnapshot(snapshot.greekVariables);
    }
    /** Serialize the surviving story state. */
    function getSpireResourceStateSnapshot() {
        const towerState = spireResourceState.wellOfInspiration || spireResourceState.powder || {};
        return {
            wellOfInspiration: {
                unlocked: true,
                storySeen: Boolean(readLegacyProperty(towerState, 'storySeen')),
            },
            achievements: {
                storySeen: Boolean(spireResourceState.achievements?.storySeen),
            },
        };
    }
    /** Restore current and legacy story snapshots with the existing normalization rules. */
    function applySpireResourceStateSnapshot(snapshot) {
        if (!isObjectRecord(snapshot))
            return;
        const legacyTower = snapshot.wellOfInspiration || snapshot.powder || snapshot.alephSpire || snapshot.aleph || {};
        // The live state factory always creates this mutable branch. It is optional
        // in the dependency interface only so serialization can preserve its powder fallback.
        const liveTower = spireResourceState.wellOfInspiration;
        liveTower.storySeen = Boolean(readLegacyProperty(legacyTower, 'storySeen') || liveTower.storySeen);
        spireResourceState.achievements.storySeen = Boolean(readLegacyProperty(snapshot.achievements, 'storySeen') || spireResourceState.achievements.storySeen);
    }
    return {
        getTowerUpgradeStateSnapshotWithAleph,
        applyTowerUpgradeStateSnapshotWithAleph,
        getSpireResourceStateSnapshot,
        applySpireResourceStateSnapshot,
    };
}
