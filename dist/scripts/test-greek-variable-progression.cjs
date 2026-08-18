// Framework-free characterization tests for global Greek-variable progression.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const rootDir = path.resolve(__dirname, '..');

function copyFile(tempDir, relativePath) {
  const target = path.join(tempDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(rootDir, relativePath), target);
}

async function createHarness() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-greek-variables-'));
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'module' }));
  [
    'assets/greekVariableProgression.js',
    'assets/spireResourcePersistence.js',
    'assets/towerEquations/basicTowers.js',
    'assets/towerEquations/phaseOneGreekTowers.js',
    'scripts/core/formatting.js',
  ].forEach((file) => copyFile(tempDir, file));
  const importModule = (relativePath) => import(pathToFileURL(path.join(tempDir, relativePath)).href);
  return {
    progression: await importModule('assets/greekVariableProgression.js'),
    persistence: await importModule('assets/spireResourcePersistence.js'),
    basic: await importModule('assets/towerEquations/basicTowers.js'),
    greek: await importModule('assets/towerEquations/phaseOneGreekTowers.js'),
  };
}

async function run() {
  const { progression, persistence, basic, greek } = await createHarness();
  let passed = 0;
  const test = async (name, fn) => {
    await fn();
    passed += 1;
    process.stdout.write(`✓ ${name}\n`);
  };

  await test('fresh state initializes alpha through zeta to 1', () => {
    progression.resetGreekVariableState();
    assert.deepEqual(progression.getGreekVariableStateSnapshot(), {
      alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1,
    });
  });

  await test('ordinal costs are flat from alpha=1 through zeta=6', () => {
    assert.equal(progression.getVariableUpgradeCost('alpha'), 1);
    assert.equal(progression.getVariableUpgradeCost('beta'), 2);
    assert.equal(progression.getVariableUpgradeCost('gamma'), 3);
    assert.equal(progression.getVariableUpgradeCost('zeta'), 6);
    progression.applyGreekVariableStateSnapshot({ gamma: 20 });
    assert.equal(progression.getVariableUpgradeCost('gamma'), 3);
  });

  await test('a successful upgrade deducts once and increments exactly once', () => {
    let glyphs = 10;
    progression.resetGreekVariableState();
    progression.configureGreekVariableProgression({
      getGlyphCurrency: () => glyphs,
      spendGlyphCurrency: (cost) => { glyphs -= cost; },
    });
    assert.deepEqual(progression.upgradeVariable('beta'), { success: true, cost: 2, value: 2 });
    assert.equal(glyphs, 8);
    assert.equal(progression.getVariableValue('beta'), 2);
  });

  await test('insufficient Glyphs prevent deduction and progression', () => {
    let glyphs = 5;
    progression.resetGreekVariableState();
    progression.configureGreekVariableProgression({
      getGlyphCurrency: () => glyphs,
      spendGlyphCurrency: (cost) => { glyphs -= cost; },
    });
    assert.equal(progression.canUpgradeVariable('zeta'), false);
    assert.deepEqual(progression.upgradeVariable('zeta'), { success: false, reason: 'insufficient-glyphs', cost: 6 });
    assert.equal(glyphs, 5);
    assert.equal(progression.getVariableValue('zeta'), 1);
  });

  await test('save snapshots round-trip and old saves default every variable to 1', () => {
    const saved = { alpha: 3, beta: 2, gamma: 8, delta: 4, epsilon: 5, zeta: 6 };
    progression.applyGreekVariableStateSnapshot(saved);
    assert.deepEqual(progression.getGreekVariableStateSnapshot(), saved);
    progression.applyGreekVariableStateSnapshot(undefined);
    assert.deepEqual(progression.getGreekVariableStateSnapshot(), {
      alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1,
    });
  });

  await test('persistence envelope stores and restores the global snapshot', () => {
    progression.applyGreekVariableStateSnapshot({ alpha: 2, zeta: 4 });
    const controller = persistence.createSpireResourcePersistence({
      spireResourceState: { wellOfInspiration: { storySeen: false }, achievements: { storySeen: false } },
      getTowerUpgradeStateSnapshot: () => ({}),
      applyTowerUpgradeStateSnapshot: () => {},
      getAlephChainUpgrades: () => ({ x: 1, y: 1, z: 3 }),
      applyAlephChainUpgradeSnapshot: () => ({ x: 1, y: 1, z: 3 }),
      getPlayfield: () => null,
      getGreekVariableStateSnapshot: progression.getGreekVariableStateSnapshot,
      applyGreekVariableStateSnapshot: progression.applyGreekVariableStateSnapshot,
    });
    const snapshot = controller.getTowerUpgradeStateSnapshotWithAleph();
    assert.equal(snapshot.greekVariables.alpha, 2);
    assert.equal(snapshot.greekVariables.zeta, 4);
    progression.resetGreekVariableState();
    controller.applyTowerUpgradeStateSnapshotWithAleph(snapshot);
    assert.equal(progression.getVariableValue('alpha'), 2);
    assert.equal(progression.getVariableValue('zeta'), 4);
  });

  await test('one global beta value changes every consuming tower equation', () => {
    progression.applyGreekVariableStateSnapshot({ beta: 1 });
    const alphaBefore = basic.alpha.variables.find((entry) => entry.key === 'speed').computeValue();
    const betaBefore = basic.beta.variables.find((entry) => entry.key === 'range').computeValue();
    const deltaBefore = greek.delta.variables.find((entry) => entry.key === 'soldierAttack').computeValue();
    progression.applyGreekVariableStateSnapshot({ beta: 4 });
    assert.notEqual(basic.alpha.variables.find((entry) => entry.key === 'speed').computeValue(), alphaBefore);
    assert.notEqual(basic.beta.variables.find((entry) => entry.key === 'range').computeValue(), betaBefore);
    assert.notEqual(greek.delta.variables.find((entry) => entry.key === 'soldierAttack').computeValue(), deltaBefore);
  });

  await test('two tower instances read the same player-owned value', () => {
    progression.applyGreekVariableStateSnapshot({ alpha: 7 });
    const readForInstance = () => basic.alpha.variables.find((entry) => entry.key === 'atk').computeValue();
    assert.equal(readForInstance({ id: 'alpha-a' }), 35);
    assert.equal(readForInstance({ id: 'alpha-b' }), 35);
  });

  process.stdout.write(`Greek-variable progression tests passed: ${passed}/${passed}\n`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
