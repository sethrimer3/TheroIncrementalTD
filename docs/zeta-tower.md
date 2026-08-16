# Zeta (ζ) Tower

Zeta is the tier-six graphing tower. It plots two large, freely configurable projectiles around itself: a polar rose and a Lissajous-style parametric curve. Enemies touching a trail take base damage, while enemies touching either graph head take critical damage.

**Master equation:** `ζ = Atk × Crt × Spd`

## Combat equations

| Term | Equation | Function |
|---|---|---|
| `Crt` | `Crt = ℵ₅ × ℵ₆` | Multiplier represented by direct contact with either graph head. |
| `Atk` | `Atk = γ × Crt × ℵ₁` | Critical head-contact damage inherited from Gamma. Trail damage is `Atk / Crt`. |
| `Spd` | `Spd = min(7, 0.25 + 0.25ℵ₂)` revolutions/s | Rate at which both graph parameters advance. |

Zeta retains only these attack, critical, and speed channels from its legacy pendulum blueprint. Range and projectile count are no longer upgrade terms for the live graphing tower; its graph radius is fixed at `8 m`, and it always plots two curves.

**Example:** If `γ = 100`, `ℵ₁ = 2`, `ℵ₂ = 3`, `ℵ₅ = 1.5`, and `ℵ₆ = 2`, then `Crt = 3`, `Atk = 600`, and `Spd = 1`. The displayed master result is `ζ = 600 × 3 × 1 = 1,800`; battlefield head damage is `600`, while trail damage is `600 / 3 = 200` per new contact.

## Graph equations

The polar projectile uses a rose curve converted to Cartesian coordinates:

`r(θ) = R × scale × |sin(petals × θ + phase)|`

`x(θ) = r(θ)cos(θ)`, `y(θ) = r(θ)sin(θ)`

The parametric projectile uses configurable sine and cosine components:

`x(t) = R[a sin(fₓt) + b cos(fₓt)] / N`

`y(t) = R[c sin(fᵧt + φ) + d cos(fᵧt + φ)] / N`

Here `R` is the graph radius and `N = max(1, |a| + |b|, |c| + |d|)` keeps the curve bounded. Petal count, scale, phases, frequencies, and component coefficients are free graph controls rather than glyph-powered combat terms.

## Battlefield function

Zeta is an area-denial tower whose player-authored curves sweep a large region. Each curve maintains a fading trail; entering a trail and touching a head are tracked independently for every enemy, so either event applies damage only on a new contact rather than every frame. Curve design determines where those contacts occur, while glyph upgrades determine their damage and traversal speed.

**Implementation:** `assets/towerEquations/greekTowers.js`, `scripts/features/towers/zetaTower.js`, and `assets/data/towers/zeta.js`.
