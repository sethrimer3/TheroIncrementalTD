# Delta (δ) Tower

Delta trains orbiting soldiers that pursue and ram enemies. Every placed Delta cohort reads the same global variables.

**Master equation:** `Delta Tower = SAtk × Hlth × Tot`

| Stat | Equation | Purpose |
|---|---|---|
| `SAtk` | `5βδ` | Damage dealt by a soldier ram. |
| `Hlth` | `25γδ` | Maximum soldier health. |
| `Tot` | `2 + floor(γ / 2)` | Maximum cohort size. |
| `Trn` | `max(1, 6 - 0.25β)` seconds | Replacement interval; not in the master product. |
| `Reg` | `Hlth × (0.02 + 0.01δ)` hp/s | Soldier regeneration; not in the master product. |
| `Sft` | `0.25β` meters | Backward shift when a soldier dies during a ram. |

At `β = γ = δ = 1`, soldiers have `SAtk = 5`, `Hlth = 25`, `Tot = 2`, `Trn = 5.75 s`, `Reg = 0.75 hp/s`, and `Sft = 0.25 m`.

**Global dependencies:** `β`, `γ`, `δ`.

**Implementation:** `assets/towerEquations/phaseOneGreekTowers.js` and `scripts/features/towers/deltaTower.js`.
