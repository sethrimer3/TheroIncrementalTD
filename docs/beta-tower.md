# Beta (β) Tower

Beta is the tier-two control tower. It fires homing triangular bursts, derives its strike power from Alpha, and applies a slowing tether to enemies. Its effectiveness grows through both glyph investment and connected Alpha lattices.

**Master equation:** `β = Atk × Spd × Rng × Slw`

## Sub-equations

| Term | Equation | Function |
|---|---|---|
| `Atk` | `Atk = α × ℵ₁` | Direct strike power inherited from Alpha and multiplied by Beta's first glyph rank. |
| `Spd` | `Spd = 0.5 + 1.5αᵦ` | Attacks per second; `αᵦ` is the number of Alpha connections in Beta's live context. |
| `Rng` | `Rng = 1 + αᵦ` | Effective reach, also increased by connected Alpha towers. |
| `Slw%` | `Slw% = min(60, 20 + 2Bet₁)` | Percentage of enemy movement speed removed by the tether. The master equation uses `Slw = Slw% / 100`. |
| `SlwTime` | `SlwTime = 0.5 + 0.1ℵ` seconds | Duration of the slowing tether; this supporting term is not multiplied into the master equation. |

**Example:** If `α = 10`, `ℵ₁ = 2`, `αᵦ = 1`, and `Bet₁ = 5`, then `Atk = 20`, `Spd = 2`, `Rng = 2`, and `Slw = 0.30`. Therefore `β = 20 × 2 × 2 × 0.30 = 24`.

## Battlefield function

Beta combines damage and crowd control. More Alpha connections simultaneously improve firing cadence and reach, while Bet-glyph investment deepens the slow from its 20% baseline toward a 60% cap. Its total equation value feeds Gamma's attack equation, making Beta another link in the early tower progression.

The separate `betaMath.js` module contains legacy exponent-oriented helpers used by other callers; the live blueprint and upgrade UI use the equations documented above.

**Implementation:** `assets/towerEquations/basicTowers.js`, `scripts/features/towers/betaTower.js`, `scripts/features/towers/betaMath.js`, and `assets/data/towers/beta.js`.
