# Alpha (α) Tower

Alpha is the foundational homing projectile tower. It reads the same player-owned variables as every other tower; placed Alpha towers do not own upgrade ranks.

**Master equation:** `Alpha Tower = Atk × Spd`

| Stat | Equation | Purpose |
|---|---|---|
| `Atk` | `5α` | Fundamental damage per glyph bullet. |
| `Spd` | `0.5 + 0.1β` | Beta propagation raises attacks per second. |
| Range | `0.24` normalized playfield units | Constant tower identity from its data definition. |

At the default `α = β = 1`, `Atk = 5`, `Spd = 0.6`, and the equation result is `3`.

**Global dependencies:** `α`, `β`.

**Implementation:** `assets/towerEquations/basicTowers.js` and `scripts/features/towers/alphaTower.js`.
