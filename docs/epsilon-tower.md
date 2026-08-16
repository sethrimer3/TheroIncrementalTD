# Epsilon (ε) Tower

Epsilon is the tier-five precision tower. It fires a rapid stream of homing needles and records consecutive hits separately for each enemy. Damage ramps quadratically as more needles land on the same target.

**Attack equation:** `Atk = NumHits²`

Epsilon intentionally does not reduce its behavior to a multiplicative master-equation total; its blueprint returns zero for that aggregate to avoid presenting a misleading score.

## Sub-equations

| Quantity | Equation | Function |
|---|---|---|
| `Atk` | `Atk = NumHits²` | Damage determined by the consecutive-hit count stored for the current enemy. |
| `Spd` | `Spd = max(0.2, 10 × ln(ℵ₁ + 1))` shots/s | Needle cadence. The `0.2` floor is applied by combat code. |
| `Rng` | `Rng = 5 × ln(ℵ₂ + 2)` meters | Homing acquisition range. |
| `Spr` | `Spr = 2 × (10 - ℵ₃ × ln(ℵ₃))` degrees | Symmetric angular spread applied around the aim direction. Combat code clamps `ℵ₃` to a small positive value before taking the logarithm. |

**Example:** After five consecutive hits on one enemy, the attack value is `5² = 25`. At `ℵ₁ = 1`, cadence is `10 × ln(2) ≈ 6.93 shots/s`; at `ℵ₂ = 1`, range is `5 × ln(3) ≈ 5.49 m`; and at `ℵ₃ = 2`, spread is approximately `17.23°`.

## Battlefield function

Epsilon specializes in sustained focus fire. Each enemy has its own hit counter, so staying on one durable target produces much more damage than repeatedly changing targets. Its needles home after launch, and range influences projectile speed within the combat system's limits. Speed accelerates stack building; range makes it easier to preserve a stack; spread changes how tightly the volley follows its intended line.

**Implementation:** `assets/towerEquations/greekTowers.js`, `scripts/features/towers/epsilonTower.js`, and `assets/data/towers/epsilon.js`.
