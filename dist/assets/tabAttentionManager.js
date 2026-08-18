// Persist unseen discoveries and reuse the Proofs-tab firefly treatment across primary navigation.
import { readStorage, writeStorage } from './autoSave.js';
import { setAchievementSparkleEmitter } from './achievementsTab.js';

const ATTENTION_STORAGE_KEY = 'glyph-defense-idle:tab-attention';
const TAB_BUTTON_IDS = Object.freeze({ towers: 'tab-towers', powder: 'tab-powder', options: 'tab-options' });
const pendingTabs = new Set();
let listenersBound = false;

function savePendingTabs() {
  writeStorage(ATTENTION_STORAGE_KEY, JSON.stringify(Array.from(pendingTabs)));
}

function refreshTabAttention(tabId) {
  const button = document.getElementById(TAB_BUTTON_IDS[tabId]);
  if (!button) return;
  const pending = pendingTabs.has(tabId);
  button.classList.toggle('tab-button--new-discovery', pending);
  setAchievementSparkleEmitter(button, pending);
}

function markTabForAttention(tabId) {
  if (!TAB_BUTTON_IDS[tabId]) return;
  if (document.querySelector('.tab-button.active')?.dataset.tab === tabId) return;
  pendingTabs.add(tabId);
  savePendingTabs();
  refreshTabAttention(tabId);
}

export function clearTabAttention(tabId) {
  if (!pendingTabs.delete(tabId)) return;
  savePendingTabs();
  refreshTabAttention(tabId);
}

// Public hooks keep future palette and track progression rules independent from navigation UI.
export function notifyPaletteUnlocked() { markTabForAttention('options'); }
export function notifyTrackVisualUnlocked() { markTabForAttention('options'); }

export function initializeTabAttentionManager() {
  pendingTabs.clear();
  try {
    const stored = JSON.parse(readStorage(ATTENTION_STORAGE_KEY) || '[]');
    if (Array.isArray(stored)) {
      stored.filter((tabId) => TAB_BUTTON_IDS[tabId]).forEach((tabId) => pendingTabs.add(tabId));
    }
  } catch (_error) {
    // Ignore malformed legacy state and start with no unseen discoveries.
  }
  Object.keys(TAB_BUTTON_IDS).forEach(refreshTabAttention);
  if (listenersBound) return;
  document.addEventListener('tower-unlocked', () => markTabForAttention('towers'));
  document.addEventListener('inspiration-glyph-level-unlocked', () => markTabForAttention('powder'));
  document.addEventListener('palette-unlocked', () => notifyPaletteUnlocked());
  document.addEventListener('track-visual-unlocked', () => notifyTrackVisualUnlocked());
  listenersBound = true;
}
