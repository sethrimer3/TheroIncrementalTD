# Alpha (α) Tower

Alpha is the tier-one foundation tower. It fires homing glyph-bullet bursts whose particles oscillate around the tower, converge, and dash toward a target. Its equation introduces the two basic combat quantities used throughout the tower chain: damage per hit and attack cadence.

**Master equation:** `α = Atk × Spd`

## Sub-equations

| Term | Equation | Function |
|---|---|---|
| `Atk` | `Atk = 5 × ℵ₁` | Damage carried by each glyph bullet. |
| `Spd` | `Spd = 0.5 × ℵ₂` | Attacks per second. |

`ℵ₁` and `ℵ₂` are the ranks of Alpha's first and second upgradeable glyph slots. Both begin at rank 1, so the initial documented equation values are `Atk = 5` and `Spd = 0.5`.

**Example:** At `ℵ₁ = 3` and `ℵ₂ = 2`, `Atk = 15`, `Spd = 1`, and `α = 15 × 1 = 15`.

## Battlefield function

Alpha is a direct-damage generalist and the first building block in the dependency chain. Raising `ℵ₁` improves every hit, while raising `ℵ₂` delivers those hits more often. Alpha connections also increase Beta's speed and range and Gamma's speed, so placing and improving Alpha towers can strengthen later towers as well as Alpha itself.

**Implementation:** `assets/towerEquations/basicTowers.js`, `scripts/features/towers/alphaTower.js`, and `assets/data/towers/alpha.js`.
