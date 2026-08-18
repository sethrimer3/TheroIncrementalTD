// Focused dependency-free checks for normalized tower contribution progression.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadContributionSystem() {
  const source = path.resolve(__dirname, '..', 'assets', 'playfield', 'systems', 'TowerContributionSystem.js');
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-contribution-test-'));
  const modulePath = path.join(tempDirectory, 'TowerContributionSystem.mjs');
  fs.copyFileSync(source, modulePath);
  return import(pathToFileURL(modulePath).href);
}

async function run() {
  const contribution = await loadContributionSystem();
  const {
    TOWER_CONTRIBUTION_BALANCE,
    addTowerContribution,
    ensureTowerContributionState,
    getTowerContributionProgress,
    getTowerVisibleRingCount,
    primeTowerContributionBudget,
    resolveEffectiveDamage,
    resolveExpectedContributionOutput,
    resolveTowerContributionLevel,
    updateTowerContributionBudget,
  } = contribution;

  assert.deepEqual(TOWER_CONTRIBUTION_BALANCE.levelThresholds, [0, 45, 120, 240, 420]);
  assert.equal(TOWER_CONTRIBUTION_BALANCE.maxContributionRate, 2);
  assert.equal(resolveEffectiveDamage(200, 40), 40);
  assert.equal(resolveEffectiveDamage(20, 40), 20);
  assert.equal(resolveEffectiveDamage(20, 0), 0);

  const standardTower = { damage: 100, rate: 1 };
  primeTowerContributionBudget(standardTower);
  assert.equal(resolveExpectedContributionOutput(standardTower), 100);
  assert.equal(addTowerContribution(standardTower, 'damage', 100), 1);
  assert.equal(standardTower.xp, 1);

  // A 10x burst cannot exceed the seeded two-XP allowance, and refills at exactly two XP/s.
  assert.equal(addTowerContribution(standardTower, 'damage', 1000), 1);
  assert.equal(addTowerContribution(standardTower, 'damage', 100), 0);
  updateTowerContributionBudget(standardTower, 0.5);
  assert.equal(addTowerContribution(standardTower, 'damage', 1000), 1);

  // Slow towers retain enough capacity for one expected attack while averaging the same one XP/s.
  const slowTower = { damage: 100, rate: 0.1 };
  primeTowerContributionBudget(slowTower);
  assert.equal(addTowerContribution(slowTower, 'damage', 100), 10);

  // Live upgrades increase expected output instead of multiplying XP speed.
  const upgradedTower = { damage: 200, rate: 2 };
  primeTowerContributionBudget(upgradedTower);
  assert.equal(resolveExpectedContributionOutput(upgradedTower), 400);
  assert.equal(addTowerContribution(upgradedTower, 'damage', 400), 1);

  assert.equal(resolveTowerContributionLevel(44.99), 1);
  assert.equal(resolveTowerContributionLevel(45), 2);
  assert.equal(resolveTowerContributionLevel(120), 3);
  assert.equal(resolveTowerContributionLevel(240), 4);
  assert.equal(resolveTowerContributionLevel(420), 5);

  const progressTower = { xp: 82.5, damage: 1, rate: 1 };
  ensureTowerContributionState(progressTower);
  assert.equal(progressTower.level, 2);
  assert.equal(getTowerContributionProgress(progressTower), 0.5);
  assert.equal(getTowerVisibleRingCount(progressTower), 2);

  const maxTower = { xp: 420, damage: 1, rate: 1 };
  primeTowerContributionBudget(maxTower);
  assert.equal(addTowerContribution(maxTower, 'damage', 1000), 0);
  assert.equal(maxTower.level, 5);
  assert.equal(maxTower.xp, 420);
  assert.equal(getTowerContributionProgress(maxTower), 1);
  assert.equal(getTowerVisibleRingCount(maxTower), 5);

  console.log('Tower contribution tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
