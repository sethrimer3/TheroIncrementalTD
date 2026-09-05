// Exercise real persistence and combat functions with a small headless playfield.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

async function run() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-kills-'));
  try {
    fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
    for (const file of ['autoSave.js', 'towerKillStats.js']) {
      fs.copyFileSync(path.join(root, 'assets', file), path.join(temp, file));
    }
    const storage = new Map();
    global.window = { localStorage: { getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value) } };
    const url = pathToFileURL(path.join(temp, 'towerKillStats.js')).href;
    const stats = await import(url);
    const alpha = { id: 1, type: 'alpha' };
    const beta = { id: 2, type: 'beta' };
    assert.equal(stats.getTowerKillCount('alpha'), 0);

    // Use the production defeat handler, including its reentrancy guard and reward flow.
    const lifecycle = read('assets/playfield/systems/EnemyLifecycleSystem.js');
    const defeatSource = lifecycle.slice(lifecycle.indexOf('export function processEnemyDefeat('), lifecycle.indexOf('\n/**', lifecycle.indexOf('export function processEnemyDefeat(')));
    const defeat = new Function('recordTowerLifetimeKill', 'formatCombatNumber', 'cleanupHypernode',
      `${defeatSource.replace('export ', '')}; return processEnemyDefeat;`)(stats.recordTowerLifetimeKill, String, () => {});
    let sessionKills = 0;
    let rewards = 0;
    const field = new Proxy({ energy: 0, levelConfig: {}, combatStateManager: null, audio: null,
      dependencies: { multiplyTheroGain: (x) => x, updateStatusDisplays() {}, notifyEnemyDefeated() { rewards++; } },
      getEnergyCap: () => 100, recordKillEvent: () => sessionKills++,
      triggerPsiClusterAoE(enemy) { defeat.call(field, enemy, beta); },
    }, { get: (obj, key) => key in obj ? obj[key] : () => {} });
    field.processEnemyDefeat = (enemy, tower) => defeat.call(field, enemy, tower);
    const enemy = { id: 1, hp: 0, isPsiCluster: true };
    defeat.call(field, enemy, alpha);
    defeat.call(field, enemy, beta);
    assert.equal(sessionKills, 1);
    assert.equal(rewards, 1);
    assert.equal(stats.getTowerKillCount('alpha'), 1);
    assert.equal(stats.getTowerKillCount('beta'), 0);

    // Normal and prime-hit deaths both use the same single-credit path.
    const damageSource = read('assets/playfield/systems/CombatDamageSystem.js');
    const start = damageSource.indexOf('export function applyDamageToEnemy(');
    const end = damageSource.indexOf('\nexport ', start + 1);
    const damage = new Function('applyDerivativeShieldMitigation', 'computeEnemyDamageMultiplier',
      'projectIotaPhaseDamage', 'resolveEffectiveDamage',
      `${damageSource.slice(start, end < 0 ? undefined : end).replace('export ', '')}; return applyDamageToEnemy;`)(
      (_enemy, value) => value, () => 1, () => {}, (value, hp) => Math.min(value, hp));
    field.getEnemyTunnelState = () => ({ inTunnel: false });
    const normal = { id: 1, hp: 10 };
    damage.call(field, normal, 9, { sourceTower: alpha });
    damage.call(field, normal, 2, { sourceTower: beta });
    damage.call(field, normal, 100, { sourceTower: alpha });
    assert.equal(stats.getTowerKillCount('beta'), 1, 'Finishing blow beats highest damage');
    assert.equal(stats.getTowerKillCount('alpha'), 1);
    const prime = { hp: 10, codexId: 'prime', requiredHitCount: 2, currentHitCount: 0 };
    damage.call(field, prime, 100, { sourceTower: alpha });
    damage.call(field, prime, 100, { sourceTower: alpha });
    damage.call(field, prime, 100, { sourceTower: alpha });
    assert.equal(stats.getTowerKillCount('alpha'), 2);
    assert.equal(sessionKills, 3);

    // A fresh module represents the next session; no autosave timer is required.
    const reloaded = await import(`${url}?reload`);
    assert.equal(reloaded.getTowerKillCount('alpha'), 2);
    assert.equal(reloaded.getTowerKillCount('beta'), 1);
    reloaded.recordTowerLifetimeKill({ type: 'alpha', id: 99 });
    assert.equal(reloaded.getTowerKillCount('alpha'), 3);
    storage.set(stats.TOWER_KILLS_STORAGE_KEY, '{"alpha":-1,"beta":2.5,"gamma":4,"delta":"9"}');
    const malformed = await import(`${url}?malformed`);
    assert.equal(malformed.getTowerKillCount('alpha'), 0);
    assert.equal(malformed.getTowerKillCount('beta'), 0);
    assert.equal(malformed.getTowerKillCount('gamma'), 4);
    assert.equal(malformed.getTowerKillCount('delta'), 0);
    console.log('Tower kill attribution, duplicate protection, prime deaths, and session persistence passed.');
  } finally {
    delete global.window;
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
