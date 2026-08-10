import { codexState, getEnemyCodexEntry } from '../codex.js';
import type { TowerEquationBlueprint } from '../towerBlueprintPresenter.js';

/** Minimal Codex entry surface read by the Shadow Gate's dynamic label. */
interface ShadowGateCodexEntry {
  symbol?: unknown;
}

/** Keep the JavaScript-owned Codex dependency narrow at this equation boundary. */
const encounteredEnemies: ReadonlySet<string> = codexState.encounteredEnemies;
const resolveEnemyEntry: (id: string) => ShadowGateCodexEntry | null | undefined =
  getEnemyCodexEntry;

/** Resolve the math symbols for every enemy the player has encountered so far. */
function resolveEncounteredEnemySymbols(): string {
  const ids = Array.from(encounteredEnemies);
  const symbols = ids.map((id) => resolveEnemyEntry(id)?.symbol).filter(Boolean);
  return symbols.join(', ');
}

/** Format a purchased curse level as a negative percentage, e.g. level 12 -> "-12%". */
function formatCursePercent(value: number): string {
  return `-${Math.round(Number.isFinite(value) ? value : 0)}%`;
}

/** Passive Shadow Gate blueprint whose display name tracks the live enemy Codex. */
export const shadowGate = {
  mathSymbol: String.raw`\wp`,
  baseEquation: String.raw`\( \wp = x \)`,
  // The gate's curses below are real gameplay multipliers (read by CombatStateManager),
  // not decorative filler, so the generic five-slot Algebraic Upgrades list is redundant here.
  hideAlgebraicUpgrades: true,
  variables: [
    {
      key: 'enemies',
      symbol: 'x',
      /** Dynamically surface the math symbols of all encountered enemy types. */
      get name() {
        return resolveEncounteredEnemySymbols();
      },
      upgradable: false,
    },
    {
      key: 'enemyHpReduction',
      symbol: 'h',
      name: 'Enemy Health Reduction',
      description: 'Weakens every foe crossing the rift, lowering their health by 1% per glyph, up to 50%.',
      upgradable: true,
      maxLevel: 50,
      cost: 1,
      getBase: () => 0,
      step: 1,
      format: formatCursePercent,
    },
    {
      key: 'enemySpeedReduction',
      symbol: 'v',
      name: 'Enemy Speed Reduction',
      description: 'Binds the void rift, slowing every foe that emerges by 1% per glyph, up to 50%.',
      upgradable: true,
      maxLevel: 50,
      cost: 1,
      getBase: () => 0,
      step: 1,
      format: formatCursePercent,
    },
    {
      key: 'enemyDamageReduction',
      symbol: 'd',
      name: 'Enemy Damage Reduction',
      description: 'Dulls the breach strike every foe delivers to the gate by 10% per glyph, up to 90%.',
      upgradable: true,
      maxLevel: 9,
      cost: 5,
      getBase: () => 0,
      step: 10,
      format: formatCursePercent,
    },
  ],
  computeResult() {
    /** The Shadow Gate is a passive nexus with no numerical output. */
    return 0;
  },
  formatGoldenEquation() {
    /** The gate maps the known enemy set onto x as a purely symbolic equation. */
    return String.raw`\( \wp = x \)`;
  },
} satisfies TowerEquationBlueprint;
