import { mergeMotePalette as defaultMergeMotePalette } from '../scripts/features/towers/powderTower.js';
import { migrateTowerOfInspirationSave } from './saveCompatibility.js';

const TOWER_STATE_FIELDS = [
  'sandOffset', 'duneHeight', 'charges', 'simulatedDuneGain', 'wallGlyphsLit', 'glyphsAwarded',
  'pendingMoteDrops', 'motePalette', 'wallGapTarget', 'viewTransform',
  'alephWallTier', 'alephTierAlephValue', 'alephTierTransitionCheckpoint',
];

/** Persist only the surviving Tower of Inspiration simulation. */
export function createPowderPersistence({
  powderState,
  powderConfig,
  mergeMotePalette = defaultMergeMotePalette,
  applyMindGatePaletteToDom,
  schedulePowderBasinSave,
  getPowderSimulation,
} = {}) {
  if (!powderState || !powderConfig) throw new Error('Tower persistence requires state and configuration.');

  function getPowderBasinSnapshot() {
    const simulation = typeof getPowderSimulation === 'function' ? getPowderSimulation() : null;
    const towerSnapshot = {};
    TOWER_STATE_FIELDS.forEach((field) => {
      const value = powderState[field];
      if (field === 'motePalette') towerSnapshot[field] = mergeMotePalette(value);
      else if (Array.isArray(value)) towerSnapshot[field] = value.map((entry) => ({ ...entry }));
      else if (value && typeof value === 'object') towerSnapshot[field] = structuredClone(value);
      else towerSnapshot[field] = value;
    });
    towerSnapshot.simulationMode = 'sand';
    return {
      wellOfInspiration: towerSnapshot,
      simulation: simulation?.exportState?.() || powderState.loadedSimulationState || null,
    };
  }

  function applyPowderBasinSnapshot(snapshot) {
    const migrated = migrateTowerOfInspirationSave(snapshot);
    if (!migrated) return;
    const saved = migrated.wellOfInspiration;
    TOWER_STATE_FIELDS.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(saved, field)) return;
      const value = saved[field];
      if (field === 'motePalette' && value && typeof value === 'object') {
        powderState.motePalette = mergeMotePalette(value);
        applyMindGatePaletteToDom?.(powderState.motePalette);
      } else if (Array.isArray(value)) {
        powderState[field] = value.map((entry) => (entry && typeof entry === 'object' ? { ...entry } : entry));
      } else if (value && typeof value === 'object') {
        powderState[field] = structuredClone(value);
      } else if (Number.isFinite(value) || typeof value === 'string' || typeof value === 'boolean') {
        powderState[field] = value;
      }
    });
    powderState.simulationMode = 'sand';
    powderState.loadedSimulationState = migrated.simulation || null;
    schedulePowderBasinSave?.();
  }

  return { getPowderBasinSnapshot, applyPowderBasinSnapshot };
}
