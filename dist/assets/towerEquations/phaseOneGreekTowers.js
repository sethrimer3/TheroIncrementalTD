/** Delta through Zeta phase-one blueprints backed exclusively by global Greek variables. */
import { formatDecimal, formatGameNumber, formatWholeNumber } from '../../scripts/core/formatting.js';
import { getVariableValue } from '../greekVariableProgression.js';

const v = (id) => getVariableValue(id);
const lines = (expression, current) => [{ expression }, { values: String.raw`\( \text{Current} = ${current} \)`, variant: 'values' }];

export const delta = {
  mathSymbol: String.raw`\delta`, baseEquation: 'δ Tower = SAtk × Hlth × Tot', variablesUsed: ['beta', 'gamma', 'delta'],
  variables: [
    { key: 'soldierAttack', symbol: 'SAtk', equationSymbol: 'SAtk', name: 'Soldier Attack', upgradable: false, variablesUsed: ['beta', 'delta'], description: 'Every cohort soldier shares this ram damage.', computeValue: () => 5 * v('beta') * v('delta'), format: formatGameNumber, getSubEquations: ({ value }) => lines(String.raw`\( \text{SAtk} = 5\beta\delta \)`, formatGameNumber(value)) },
    { key: 'health', symbol: 'Hlth', equationSymbol: 'Hlth', name: 'Soldier Health', upgradable: false, variablesUsed: ['gamma', 'delta'], description: 'Gamma multiplicity and Delta durability reinforce each soldier.', computeValue: () => 25 * v('gamma') * v('delta'), format: formatGameNumber, getSubEquations: ({ value }) => lines(String.raw`\( \text{Hlth} = 25\gamma\delta \)`, formatGameNumber(value)) },
    { key: 'training', symbol: 'Trn', equationSymbol: 'Trn', name: 'Training Interval', upgradable: false, includeInMasterEquation: false, variablesUsed: ['beta'], description: 'Beta reduces replacement time.', computeValue: () => Math.max(1, 6 - 0.25 * v('beta')), format: (x) => `${formatDecimal(x, 2)} s`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Trn} = \max(1, 6 - 0.25\beta) \)`, `${formatDecimal(value, 2)}\text{s}`) },
    { key: 'total', symbol: 'Tot', equationSymbol: 'Tot', name: 'Cohort Size', upgradable: false, variablesUsed: ['gamma'], description: 'Gamma adds soldiers at every second rank.', computeValue: () => 2 + Math.floor(v('gamma') / 2), format: formatWholeNumber, getSubEquations: ({ value }) => lines(String.raw`\( \text{Tot} = 2 + \lfloor\gamma/2\rfloor \)`, formatWholeNumber(value)) },
    { key: 'regen', symbol: 'Reg', equationSymbol: 'Reg', name: 'Regeneration', upgradable: false, includeInMasterEquation: false, variablesUsed: ['delta'], description: 'Delta restores a fraction of health each second.', computeValue: () => (25 * v('gamma') * v('delta')) * (0.02 + 0.01 * v('delta')), format: (x) => `${formatGameNumber(x)} hp/s`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Reg} = \text{Hlth}(0.02 + 0.01\delta) \)`, formatGameNumber(value)) },
    { key: 'shift', symbol: 'Sft', equationSymbol: 'Sft', name: 'Fatal Ram Shift', upgradable: false, includeInMasterEquation: false, variablesUsed: ['beta'], description: 'A destroyed soldier pushes its target backward.', computeValue: () => 0.25 * v('beta'), format: (x) => `${formatDecimal(x, 2)} m`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Sft} = 0.25\beta \)`, `${formatDecimal(value, 2)}\text{m}`) },
  ],
  computeResult: (values) => (values.soldierAttack || 0) * (values.health || 0) * (values.total || 0),
  formatBaseEquationValues: ({ values, result, formatComponent }) => `${formatComponent(result)} = ${formatComponent(values.soldierAttack || 0)} × ${formatComponent(values.health || 0)} × ${formatComponent(values.total || 0)}`,
};

export const epsilon = {
  mathSymbol: String.raw`\varepsilon`, baseEquation: String.raw`\( \text{Atk} = \text{NumHits}^{1 + 0.25\varepsilon} \)`, variablesUsed: ['beta', 'epsilon'],
  variables: [
    { key: 'exponent', symbol: 'Exp', equationSymbol: 'Exp', name: 'Accumulation Exponent', upgradable: false, variablesUsed: ['epsilon'], description: 'Epsilon determines repeated-hit scaling.', computeValue: () => 1 + 0.25 * v('epsilon'), format: (x) => formatDecimal(x, 2), getSubEquations: ({ value }) => lines(String.raw`\( \text{Exp} = 1 + 0.25\varepsilon \)`, formatDecimal(value, 2)) },
    { key: 'spd', symbol: 'Spd', equationSymbol: 'Spd', name: 'Needle Speed', upgradable: false, variablesUsed: ['beta'], description: 'Beta propagates the volley.', computeValue: () => 2 + 0.5 * v('beta'), format: (x) => `${formatDecimal(x, 2)} shots/s`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Spd} = 2 + 0.5\beta \)`, formatDecimal(value, 2)) },
    { key: 'rng', symbol: 'Rng', equationSymbol: 'Rng', name: 'Range', upgradable: false, variablesUsed: ['beta'], description: 'Beta extends acquisition range.', computeValue: () => 4 + 0.25 * v('beta'), format: (x) => `${formatDecimal(x, 2)} m`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Rng} = 4 + 0.25\beta \)`, `${formatDecimal(value, 2)}\text{m}`) },
    { key: 'spr', symbol: 'Spr', equationSymbol: 'Spr', name: 'Spread', upgradable: false, variablesUsed: ['epsilon'], description: 'Epsilon accumulation tightens the cone.', computeValue: () => Math.max(2, 18 - v('epsilon')), format: (x) => `${formatDecimal(x, 2)}°`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Spr} = \max(2, 18 - \varepsilon) \)`, `${formatDecimal(value, 2)}^\circ`) },
  ],
  computeResult: () => 0,
  formatGoldenEquation: () => String.raw`\( \text{Atk} = \text{NumHits}^{1 + 0.25\varepsilon} \)`,
};

export const zeta = {
  mathSymbol: String.raw`\zeta`, baseEquation: 'ζ Tower = Atk × Crt × Spd', variablesUsed: ['alpha', 'beta', 'gamma', 'zeta'],
  variables: [
    { key: 'atk', symbol: 'Atk', equationSymbol: 'Atk', name: 'Trail Damage', upgradable: false, variablesUsed: ['alpha', 'gamma'], description: 'Alpha and Gamma energize both graph trails.', computeValue: () => 8 * v('alpha') * v('gamma'), format: formatGameNumber, getSubEquations: ({ value }) => lines(String.raw`\( \text{Atk} = 8\alpha\gamma \)`, formatGameNumber(value)) },
    { key: 'crt', symbol: 'Crt', equationSymbol: 'Crt', name: 'Graph-Head Critical', upgradable: false, variablesUsed: ['zeta'], description: 'Zeta amplifies direct graph-head contact.', computeValue: () => 1 + 0.25 * v('zeta'), format: (x) => `×${formatDecimal(x, 2)}`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Crt} = 1 + 0.25\zeta \)`, formatDecimal(value, 2)) },
    { key: 'spd', symbol: 'Spd', equationSymbol: 'Spd', name: 'Graph Speed', upgradable: false, variablesUsed: ['beta', 'zeta'], description: 'Beta propagation and Zeta oscillation advance both curves.', computeValue: () => Math.min(7, 0.2 + 0.05 * v('beta') + 0.05 * v('zeta')), format: (x) => `${formatDecimal(x, 2)} rps`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Spd} = \min(7, 0.2 + 0.05\beta + 0.05\zeta) \)`, formatDecimal(value, 2)) },
  ],
  computeResult: (values) => (values.atk || 0) * (values.crt || 1) * (values.spd || 0),
  formatBaseEquationValues: ({ values, result, formatComponent }) => `${formatComponent(result)} = ${formatComponent(values.atk || 0)} × ${formatComponent(values.crt || 1)} × ${formatComponent(values.spd || 0)}`,
};
