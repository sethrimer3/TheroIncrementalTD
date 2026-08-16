# Beta (β) Tower

Beta fires triangular homing bursts and applies a slowing tether. Its damage, propagation, slow strength, and persistence intentionally draw from four global variables.

**Master equation:** `Beta Tower = Atk × Spd × Rng × Slw`

| Stat | Equation | Purpose |
|---|---|---|
| `Atk` | `4α` | Alpha supplies direct burst power. |
| `Spd` | `0.5 + 0.15β` | Beta raises firing cadence. |
| `Rng` | `4 + 0.5β` meters | Beta extends the conduit. |
| `Slw%` | `min(60, 15 + 5γ)` | Gamma deepens movement reduction up to 60%. |
| `SlwTime` | `1 + 0.25δ` seconds | Delta makes the tether persist; not part of the master product. |

At the default value of 1 for every variable, the tower has `Atk = 4`, `Spd = 0.65`, `Rng = 4.5`, `Slw = 20%`, and `SlwTime = 1.25 s`.

**Global dependencies:** `α`, `β`, `γ`, `δ`.

**Implementation:** `assets/towerEquations/basicTowers.js`, `assets/playfield/systems/ProjectileSpawnSystem.js`, and `assets/playfield/systems/SupplyChainSystem.js`.
