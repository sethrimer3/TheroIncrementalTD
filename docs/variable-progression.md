# Global Greek-Variable Progression

## Ownership and dependency direction

Greek variables are player-owned global progression values. There is exactly one value for each variable, regardless of how many towers are placed:

`Global variables → tower equations → combat stats`

Tower output never feeds back into the value of a global variable. A tower may use several variables, and one variable may affect several tower families. Blueprints declare these relationships with `variablesUsed` metadata so future UI can show every affected equation without parsing display text.

## Phase-one variables and costs

| Variable | Starting value | Increase per purchase | Flat cost |
|---|---:|---:|---:|
| `α` | 1 | +1 | 1 Glyph |
| `β` | 1 | +1 | 2 Glyphs |
| `γ` | 1 | +1 | 3 Glyphs |
| `δ` | 1 | +1 | 4 Glyphs |
| `ε` | 1 | +1 | 5 Glyphs |
| `ζ` | 1 | +1 | 6 Glyphs |

Costs equal ordinal position and do not scale with level. The definitions live in `assets/greekVariableProgression.ts`, so later variables can be appended as data rather than added through tower-specific purchase logic.

## Currency and transactions

Purchases spend the existing Tower Glyph currency earned through the Tower of Inspiration. The central API is:

- `getVariableValue(variable)`
- `getVariableUpgradeCost(variable)`
- `canUpgradeVariable(variable)`
- `upgradeVariable(variable)`

`upgradeVariable` validates the id and balance, deducts the flat cost, increments exactly once, invalidates tower equation results, refreshes the active upgrade panel, and invokes normal autosave.

## Persistence and compatibility

The tower-upgrade save envelope contains a `greekVariables` snapshot. Loading clamps each recognized value to an integer of at least 1. Older saves with no `greekVariables` branch initialize `α` through `ζ` to 1; legacy per-tower ranks are not guessed or migrated.

Alpha–Zeta no longer expose or evaluate per-tower `ℵ`, `ℵ₁`, or similar purchase slots. Later towers still use legacy authored slots during this foundation phase and should be converted incrementally.

## Constants

Not every combat characteristic needs a variable. Constants preserve clear tower identity where progression would add noise—for example, Zeta keeps an 8-meter graph radius and exactly two curves. Variable use should communicate a meaningful cross-tower dependency rather than exist merely to make every number upgradeable.
