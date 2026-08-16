# Zeta (ζ) Tower

Zeta plots a polar rose and a configurable Lissajous-style curve. Trail contact deals `Atk`; direct graph-head contact deals `Atk × Crt`.

**Master equation:** `Zeta Tower = Atk × Crt × Spd`

| Stat | Equation | Purpose |
|---|---|---|
| `Atk` | `8αγ` | Damage carried by either graph trail. |
| `Crt` | `1 + 0.25ζ` | Multiplier for graph-head contact. |
| `Spd` | `min(7, 0.2 + 0.05β + 0.05ζ)` rps | Shared curve traversal rate. |
| Radius | `8 m` | Constant graph identity. |
| Curves | `2` | One polar and one parametric projectile. |

At `α = β = γ = ζ = 1`, `Atk = 8`, `Crt = 1.25`, `Spd = 0.3 rps`, trail damage is `8`, and head damage is `10`.

The polar curve is `r(θ) = R × scale × |sin(petals × θ + phase)|`. The parametric curve uses configurable sine/cosine components normalized to remain within `R`.

**Global dependencies:** `α`, `β`, `γ`, `ζ`.

**Implementation:** `assets/towerEquations/phaseOneGreekTowers.js` and `scripts/features/towers/zetaTower.js`.
