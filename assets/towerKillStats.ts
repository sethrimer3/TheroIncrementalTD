// Lifetime finishing-blow totals are independent of wave and placed-tower resets.
import { readStorageJson, writeStorageJson } from './autoSave.js';

export const TOWER_KILLS_STORAGE_KEY = 'glyph-defense-idle:tower-kills';
let totals: Record<string, number> | null = null;
const listeners = new Set<(type: string, count: number) => void>();

// Sanitize older or malformed saves without accepting inherited object keys.
function loadTotals(): Record<string, number> {
  if (totals) return totals;
  totals = Object.create(null);
  const saved = readStorageJson<Record<string, unknown>>(TOWER_KILLS_STORAGE_KEY);
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return totals!;
  for (const [type, count] of Object.entries(saved)) {
    if (/^[a-z][a-z0-9-]*$/.test(type) && typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) {
      totals![type] = count;
    }
  }
  return totals!;
}

// Every card starts at zero until its first credited kill.
export function getTowerKillCount(type: string) {
  return loadTotals()[type] || 0;
}

// Persist immediately so even closing the game before the next autosave retains kills.
export function recordTowerLifetimeKill(tower: { type?: string } | null) {
  const type = tower?.type;
  if (typeof type !== 'string' || !/^[a-z][a-z0-9-]*$/.test(type)) return;
  const totals = loadTotals();
  totals[type] = Math.min(Number.MAX_SAFE_INTEGER, (totals[type] || 0) + 1);
  writeStorageJson(TOWER_KILLS_STORAGE_KEY, totals);
  listeners.forEach((listener) => listener(type, totals[type]));
}

// UI subscribers update only the affected card when a total changes.
export function subscribeTowerKills(listener: (type: string, count: number) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
