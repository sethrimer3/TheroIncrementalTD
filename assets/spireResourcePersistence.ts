import type {
  AlephChainUpgradeApplyOptions,
  AlephChainUpgradePlayfield,
  AlephChainUpgradeSnapshot,
} from './alephUpgradeState.js';
import type {
  SerializedTowerUpgradeState,
  TowerUpgradeStateSnapshot,
  TowerUpgradeStateSnapshotInput,
} from './towerBlueprintPresenter.js';
import type { AlgebraicUpgradeStateSnapshot } from './algebraicUpgrades.js';
import type { GreekVariableSnapshot } from './greekVariableProgression.js';

/** Mutable story flag owned by the surviving Tower and Achievements state branches. */
export interface MutableStoryState {
  storySeen: boolean;
}

/** Story-state shape read from compatibility aliases during serialization or restoration. */
export interface StoryStateSource {
  storySeen?: unknown;
}

/** Minimal live state surface this persistence adapter reads and mutates. */
export interface SpireResourcePersistenceState {
  wellOfInspiration?: MutableStoryState | null;
  powder?: StoryStateSource | null;
  achievements: MutableStoryState;
}

/** Exact serialized Tower story branch emitted by this module. */
export interface SerializedTowerStoryState {
  unlocked: true;
  storySeen: boolean;
}

/** Exact serialized Achievements story branch emitted by this module. */
export interface SerializedAchievementStoryState {
  storySeen: boolean;
}

/** Complete Spire-resource snapshot currently owned by the post-retirement module. */
export interface SpireResourceStateSnapshot {
  wellOfInspiration: SerializedTowerStoryState;
  achievements: SerializedAchievementStoryState;
}

/**
 * Legacy/untrusted save envelope accepted by restoration. Retired branches are
 * intentionally not modeled because this module ignores them; the named fields
 * below are the only compatibility aliases it still reads.
 */
export interface LegacySpireResourceStateSnapshot {
  wellOfInspiration?: unknown;
  powder?: unknown;
  alephSpire?: unknown;
  aleph?: unknown;
  achievements?: unknown;
  [key: string]: unknown;
}

/** Autosave input accepted by the current and legacy Spire-resource restore path. */
export type SpireResourceStateSnapshotInput =
  | SpireResourceStateSnapshot
  | LegacySpireResourceStateSnapshot;

/** Exact persistence-owned wrapper emitted after adding Aleph state to base tower entries. */
export interface TowerUpgradeSnapshotWithAleph {
  [towerId: string]: SerializedTowerUpgradeState | AlephChainUpgradeSnapshot | AlgebraicUpgradeStateSnapshot | GreekVariableSnapshot;
  alephChainUpgrades: AlephChainUpgradeSnapshot;
  algebraicUpgrades: AlgebraicUpgradeStateSnapshot;
  greekVariables: GreekVariableSnapshot;
}

/** Autosave tower-upgrade input, including historical snapshots without Aleph data. */
export type TowerUpgradeSnapshotInput = TowerUpgradeStateSnapshotInput;

/** Dependencies injected by `assets/main.js` into the persistence adapter. */
export interface SpireResourcePersistenceDependencies {
  spireResourceState: SpireResourcePersistenceState;
  getTowerUpgradeStateSnapshot: () => TowerUpgradeStateSnapshot;
  applyTowerUpgradeStateSnapshot: (snapshot: TowerUpgradeStateSnapshotInput) => void;
  getAlephChainUpgrades: () => AlephChainUpgradeSnapshot;
  applyAlephChainUpgradeSnapshot: (
    snapshot: unknown,
    options: AlephChainUpgradeApplyOptions,
  ) => AlephChainUpgradeSnapshot;
  getPlayfield: () => AlephChainUpgradePlayfield | null;
  getAlgebraicUpgradeStateSnapshot?: () => AlgebraicUpgradeStateSnapshot;
  applyAlgebraicUpgradeStateSnapshot?: (snapshot: unknown) => void;
  getGreekVariableStateSnapshot?: () => GreekVariableSnapshot;
  applyGreekVariableStateSnapshot?: (snapshot: unknown) => GreekVariableSnapshot;
}

/** Public controller returned to the bootstrap and then wired into autosave. */
export interface SpireResourcePersistenceController {
  getTowerUpgradeStateSnapshotWithAleph: () => TowerUpgradeSnapshotWithAleph;
  applyTowerUpgradeStateSnapshotWithAleph: (snapshot: unknown) => void;
  getSpireResourceStateSnapshot: () => SpireResourceStateSnapshot;
  applySpireResourceStateSnapshot: (snapshot: unknown) => void;
}

/** Preserve the original truthy-object checks while giving property reads an honest boundary. */
function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Read a property from untrusted legacy JSON without inventing validation it never had. */
function readLegacyProperty(value: unknown, key: string): unknown {
  return isObjectRecord(value) ? value[key] : undefined;
}

/**
 * Persist the surviving Tower of Inspiration story state and tower upgrades.
 * Legacy snapshots may contain retired spire branches; those branches are intentionally ignored.
 */
export function createSpireResourcePersistence({
  spireResourceState,
  getTowerUpgradeStateSnapshot,
  applyTowerUpgradeStateSnapshot,
  getAlephChainUpgrades,
  applyAlephChainUpgradeSnapshot,
  getPlayfield,
  getAlgebraicUpgradeStateSnapshot = () => ({}),
  applyAlgebraicUpgradeStateSnapshot = () => {},
  getGreekVariableStateSnapshot = () => ({ alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1 }),
  applyGreekVariableStateSnapshot = () => ({ alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1 }),
}: SpireResourcePersistenceDependencies): SpireResourcePersistenceController {
  /** Preserve the base tower snapshot while adding the Aleph-chain and algebraic-upgrade branches. */
  function getTowerUpgradeStateSnapshotWithAleph(): TowerUpgradeSnapshotWithAleph {
    return {
      ...getTowerUpgradeStateSnapshot(),
      alephChainUpgrades: getAlephChainUpgrades(),
      algebraicUpgrades: getAlgebraicUpgradeStateSnapshot(),
      greekVariables: getGreekVariableStateSnapshot(),
    };
  }

  /** Restore base tower upgrades first, then restore the Aleph-chain and algebraic-upgrade branches. */
  function applyTowerUpgradeStateSnapshotWithAleph(snapshot: unknown): void {
    if (!isObjectRecord(snapshot)) return;
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
  function getSpireResourceStateSnapshot(): SpireResourceStateSnapshot {
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
  function applySpireResourceStateSnapshot(snapshot: unknown): void {
    if (!isObjectRecord(snapshot)) return;
    const legacyTower =
      snapshot.wellOfInspiration || snapshot.powder || snapshot.alephSpire || snapshot.aleph || {};

    // The live state factory always creates this mutable branch. It is optional
    // in the dependency interface only so serialization can preserve its powder fallback.
    const liveTower = spireResourceState.wellOfInspiration as MutableStoryState;
    liveTower.storySeen = Boolean(readLegacyProperty(legacyTower, 'storySeen') || liveTower.storySeen);
    spireResourceState.achievements.storySeen = Boolean(
      readLegacyProperty(snapshot.achievements, 'storySeen') || spireResourceState.achievements.storySeen,
    );

  }

  return {
    getTowerUpgradeStateSnapshotWithAleph,
    applyTowerUpgradeStateSnapshotWithAleph,
    getSpireResourceStateSnapshot,
    applySpireResourceStateSnapshot,
  };
}
