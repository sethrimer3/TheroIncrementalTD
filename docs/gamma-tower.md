# Gamma (γ) Tower

Gamma is the tier-three piercing tower. Its projectiles dash to a target, trace a compact star on impact, and continue through the target as a piercing ray. Gamma inherits attack power from Beta and adds explicit pierce and burst-duration terms.

**Master equation:** `γ = Atk × Spd × Rng × Prc × Brst`

## Sub-equations

| Term | Equation | Function |
|---|---|---|
| `Atk` | `Atk = β × ℵ₁` | Strike intensity inherited from Beta and multiplied by Gamma's first glyph rank. |
| `Spd` | `Spd = 0.5 + 0.25αᵧ` | Attack cadence; `αᵧ` is Gamma's number of connected Alpha towers. |
| `Rng` | `Rng = 1 + 2βᵧ` | Effective reach; `βᵧ` is Gamma's number of connected Beta towers. |
| `Prc` | `Prc = ℵ₂` | Number of targets or layers the attack can penetrate. |
| `Brst` | `Brst = 5 × (1 + ℵ)` seconds | Duration of Gamma's orbiting, star-tracing burst. |

**Example:** If `β = 24`, `ℵ₁ = 2`, `αᵧ = 2`, `βᵧ = 1`, `ℵ₂ = 2`, and the unindexed burst glyph rank is `ℵ = 1`, then `Atk = 48`, `Spd = 1`, `Rng = 3`, `Prc = 2`, and `Brst = 10`. Thus `γ = 48 × 1 × 3 × 2 × 10 = 2,880`.

## Battlefield function

Gamma rewards a mixed early-game lattice: Alpha connections raise its cadence, Beta connections extend its reach, and Beta's total equation supplies its base attack. Pierce lets a single firing line affect multiple enemies, while burst duration controls how long its impact pattern remains active. Gamma's result is later consumed by Delta and Zeta, so improvements propagate forward through the tower chain.

**Implementation:** `assets/towerEquations/basicTowers.js`, `scripts/features/towers/gammaTower.js`, and `assets/data/towers/gamma.js`.
