# Epsilon (ε) Tower

Epsilon fires homing needles and accumulates a separate consecutive-hit count for each enemy. Its attack remains stateful rather than being reduced to a static master-product score.

**Attack equation:** `Atk = NumHits^(1 + 0.25ε)`

| Stat | Equation | Purpose |
|---|---|---|
| `Exp` | `1 + 0.25ε` | Exponent applied to the target's hit count. |
| `Spd` | `2 + 0.5β` shots/s | Beta accelerates stack building. |
| `Rng` | `4 + 0.25β` meters | Beta extends needle acquisition range. |
| `Spr` | `max(2, 18 - ε)` degrees | Epsilon tightens spread toward a 2° floor. |

At `β = ε = 1`, `Exp = 1.25`, `Spd = 2.5`, `Rng = 4.25 m`, and `Spr = 17°`. The fifth consecutive hit deals `5^1.25 ≈ 7.48` damage.

**Global dependencies:** `β`, `ε`.

**Implementation:** `assets/towerEquations/phaseOneGreekTowers.js`, `scripts/features/towers/epsilonTower.js`, and `assets/playfield/systems/ProjectileUpdateSystem.js`.
