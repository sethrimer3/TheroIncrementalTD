# Gamma (γ) Tower

Gamma fires star-tracing bursts that continue through targets. Global Gamma controls both damage multiplicity and penetration, while Beta and Delta shape delivery.

**Master equation:** `Gamma Tower = Atk × Spd × Rng × Prc × Brst`

| Stat | Equation | Purpose |
|---|---|---|
| `Atk` | `6αγ` | Alpha base power multiplied by Gamma energy. |
| `Spd` | `0.4 + 0.1β` | Beta raises burst cadence. |
| `Rng` | `5 + 0.5β` meters | Beta extends reach. |
| `Prc` | `γ` | Global Gamma directly sets penetration count. |
| `Brst` | `2 + 0.5δ` seconds | Delta sustains the impact-star burst. |

At `α = β = γ = δ = 1`, the values are `Atk = 6`, `Spd = 0.5`, `Rng = 5.5`, `Prc = 1`, and `Brst = 2.5 s`.

**Global dependencies:** `α`, `β`, `γ`, `δ`.

**Implementation:** `assets/towerEquations/basicTowers.js`, `scripts/features/towers/gammaTower.js`, and `assets/playfield/systems/ProjectileSpawnSystem.js`.
