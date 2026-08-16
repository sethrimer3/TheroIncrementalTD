/** Phase-one foundational tower blueprints driven by player-owned Greek variables. */
import { formatDecimal, formatGameNumber, formatWholeNumber } from '../../scripts/core/formatting.js';
import { getVariableValue } from '../greekVariableProgression.js';

const v = (id) => getVariableValue(id);
const lines = (expression, current) => [
  { expression },
  { values: String.raw`\( \text{Current} = ${current} \)`, variant: 'values' },
];

export const alpha = {
  mathSymbol: String.raw`\alpha`, baseEquation: 'α Tower = Atk × Spd', variablesUsed: ['alpha', 'beta'],
  variables: [
    { key: 'atk', symbol: 'Atk', equationSymbol: 'Atk', name: 'Damage', description: 'Fundamental glyph-bullet damage shared by every Alpha tower.', upgradable: false, variablesUsed: ['alpha'], computeValue: () => 5 * v('alpha'), format: (x) => `${formatGameNumber(x)} Atk`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Atk} = 5\alpha \)`, formatGameNumber(value)) },
    { key: 'speed', symbol: 'Spd', equationSymbol: 'Spd', name: 'Attack Speed', description: 'Beta propagates Alpha shots more rapidly.', upgradable: false, variablesUsed: ['beta'], computeValue: () => 0.5 + 0.1 * v('beta'), format: (x) => `${formatDecimal(x, 2)} Spd`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Spd} = 0.5 + 0.1\beta \)`, formatDecimal(value, 2)) },
  ],
  computeResult: (values) => (values.atk || 0) * (values.speed || 0),
  formatBaseEquationValues: ({ values, result, formatComponent }) => `${formatComponent(result)} = ${formatComponent(values.atk || 0)} × ${formatComponent(values.speed || 0)}`,
};

export const beta = {
  mathSymbol: String.raw`\beta`, baseEquation: 'β Tower = Atk × Spd × Rng × Slw', variablesUsed: ['alpha', 'beta', 'gamma', 'delta'],
  variables: [
    { key: 'attack', symbol: 'Atk', equationSymbol: 'Atk', name: 'Damage', description: 'Alpha supplies each triangular burst.', upgradable: false, variablesUsed: ['alpha'], computeValue: () => 4 * v('alpha'), format: (x) => `${formatGameNumber(x)} Atk`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Atk} = 4\alpha \)`, formatGameNumber(value)) },
    { key: 'speed', symbol: 'Spd', equationSymbol: 'Spd', name: 'Attack Speed', description: 'Beta controls its own propagation cadence.', upgradable: false, variablesUsed: ['beta'], computeValue: () => 0.5 + 0.15 * v('beta'), format: (x) => `${formatDecimal(x, 2)} Spd`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Spd} = 0.5 + 0.15\beta \)`, formatDecimal(value, 2)) },
    { key: 'range', symbol: 'Rng', equationSymbol: 'Rng', name: 'Range', description: 'Beta extends the tower conduit.', upgradable: false, variablesUsed: ['beta'], computeValue: () => 4 + 0.5 * v('beta'), format: (x) => `${formatDecimal(x, 2)} m`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Rng} = 4 + 0.5\beta \)`, formatDecimal(value, 2)) },
    { key: 'slw', symbol: 'Slw%', equationSymbol: 'Slw\%', masterEquationSymbol: 'Slw', name: 'Slow Field', description: 'Gamma deepens the movement reduction.', upgradable: false, variablesUsed: ['gamma'], computeValue: () => Math.min(60, 15 + 5 * v('gamma')), format: (x) => `${formatDecimal(x, 1)}% slow`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Slw\%} = \min(60, 15 + 5\gamma) \)`, `${formatDecimal(value, 1)}\%`) },
    { key: 'slwTime', symbol: 'SlwTime', equationSymbol: 'SlwTime', name: 'Slow Duration', description: 'Delta makes the tether persist.', includeInMasterEquation: false, upgradable: false, variablesUsed: ['delta'], computeValue: () => 1 + 0.25 * v('delta'), format: (x) => `${formatDecimal(x, 2)} s`, getSubEquations: ({ value }) => lines(String.raw`\( \text{SlwTime} = 1 + 0.25\delta \)`, `${formatDecimal(value, 2)}\text{s}`) },
  ],
  computeResult: (values) => (values.attack || 0) * (values.speed || 0) * (values.range || 0) * ((values.slw || 0) / 100),
  formatBaseEquationValues: ({ values, result, formatComponent }) => `${formatComponent(result)} = ${formatComponent(values.attack || 0)} × ${formatComponent(values.speed || 0)} × ${formatComponent(values.range || 0)} × ${formatComponent(values.slw || 0)}%`,
};

export const gamma = {
  mathSymbol: String.raw`\gamma`, baseEquation: 'γ Tower = Atk × Spd × Rng × Prc × Brst', variablesUsed: ['alpha', 'beta', 'gamma', 'delta'],
  variables: [
    { key: 'attack', symbol: 'Atk', equationSymbol: 'Atk', name: 'Damage', description: 'Alpha power is multiplied by Gamma penetration energy.', upgradable: false, variablesUsed: ['alpha', 'gamma'], computeValue: () => 6 * v('alpha') * v('gamma'), format: (x) => `${formatGameNumber(x)} Atk`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Atk} = 6\alpha\gamma \)`, formatGameNumber(value)) },
    { key: 'speed', symbol: 'Spd', equationSymbol: 'Spd', name: 'Attack Speed', description: 'Beta controls piercing burst cadence.', upgradable: false, variablesUsed: ['beta'], computeValue: () => 0.4 + 0.1 * v('beta'), format: (x) => `${formatDecimal(x, 2)} Spd`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Spd} = 0.4 + 0.1\beta \)`, formatDecimal(value, 2)) },
    { key: 'range', symbol: 'Rng', equationSymbol: 'Rng', name: 'Range', description: 'Beta propagation extends Gamma reach.', upgradable: false, variablesUsed: ['beta'], computeValue: () => 5 + 0.5 * v('beta'), format: (x) => `${formatDecimal(x, 2)} m`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Rng} = 5 + 0.5\beta \)`, formatDecimal(value, 2)) },
    { key: 'pierce', symbol: 'Prc', equationSymbol: 'Prc', name: 'Pierce', description: 'Gamma directly sets penetration count.', upgradable: false, variablesUsed: ['gamma'], globalVariable: 'gamma', format: (x) => `${formatWholeNumber(x)} Prc`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Prc} = \gamma \)`, formatWholeNumber(value)) },
    { key: 'brst', symbol: 'Brst', equationSymbol: 'Brst', name: 'Burst Duration', description: 'Delta sustains the star-tracing burst.', upgradable: false, variablesUsed: ['delta'], computeValue: () => 2 + 0.5 * v('delta'), format: (x) => `${formatDecimal(x, 2)} s`, getSubEquations: ({ value }) => lines(String.raw`\( \text{Brst} = 2 + 0.5\delta \)`, `${formatDecimal(value, 2)}\text{s}`) },
  ],
  computeResult: (values) => (values.attack || 0) * (values.speed || 0) * (values.range || 0) * (values.pierce || 0) * (values.brst || 0),
  formatBaseEquationValues: ({ values, result, formatComponent }) => `${formatComponent(result)} = ${formatComponent(values.attack || 0)} × ${formatComponent(values.speed || 0)} × ${formatComponent(values.range || 0)} × ${formatComponent(values.pierce || 0)} × ${formatComponent(values.brst || 0)}s`,
};
