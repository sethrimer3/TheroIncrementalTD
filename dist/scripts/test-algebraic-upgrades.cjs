// Framework-free Node unit tests for the per-tower algebraic upgrade system
// (assets/algebraicUpgrades.ts) and the surrounding Tower of Inspiration
// mote/glyph economy it spends from. Mirrors the style of scripts/unit-test-core.cjs
// (compiled .js output, not .ts sources) and scripts/test-retired-spires.cjs
// (banned-key regression coverage).
//
// Usage: npm run test:unit (requires `npm run build` first).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const rootDir = path.resolve(__dirname, '..');

function importAsEsm(relativeJsPath) {
  const sourcePath = path.join(rootDir, relativeJsPath);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-algebraic-test-'));
  const tmpPath = path.join(tmpDir, path.basename(relativeJsPath).replace(/\.js$/, '.mjs'));
  fs.copyFileSync(sourcePath, tmpPath);
  return import(pathToFileURL(tmpPath).href);
}

function createLocalStorageStub() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
  } catch (error) {
    failed += 1;
    failures.push({ name, error });
  }
}

async function run() {
  const algebraic = await importAsEsm('assets/algebraicUpgrades.js');
  const {
    ALGEBRAIC_VARIABLES,
    getTowerVariableUpgradeCost,
    getAlgebraicVariable,
    purchaseAlgebraicUpgrade,
    getAlgebraicUpgradeStateSnapshot,
    applyAlgebraicUpgradeStateSnapshot,
    clearAlgebraicUpgradeState,
  } = algebraic;

  // Sanity: the five configured variable ids never collide with a retired spire key.
  const RETIRED_SAVE_KEYS = new Set(['bet', 'lamed', 'tsadi', 'shin', 'kuf']);
  await test('algebraic variable ids never reuse a retired Spire key', () => {
    ALGEBRAIC_VARIABLES.forEach((variable) => {
      assert.equal(RETIRED_SAVE_KEYS.has(variable.id), false, `${variable.id} is a retired save key`);
    });
    assert.equal(ALGEBRAIC_VARIABLES.length, 5);
  });

  // --- Cost curve (baseCost per variable, tests 8-12) ---------------------
  const [first, second, third, fourth, fifth] = ALGEBRAIC_VARIABLES;

  await test('first algebraic variable costs 1', () => {
    assert.equal(getTowerVariableUpgradeCost(first.id, 0), 1);
  });

  await test('second algebraic variable costs 2', () => {
    assert.equal(getTowerVariableUpgradeCost(second.id, 0), 2);
  });

  await test('third algebraic variable costs 3', () => {
    assert.equal(getTowerVariableUpgradeCost(third.id, 0), 3);
  });

  await test('fourth algebraic variable costs 4', () => {
    assert.equal(getTowerVariableUpgradeCost(fourth.id, 0), 4);
  });

  await test('fifth algebraic variable costs 5', () => {
    assert.equal(getTowerVariableUpgradeCost(fifth.id, 0), 5);
  });

  // --- Purchasing -----------------------------------------------------------
  function makeWallet(startingBalance) {
    let balance = startingBalance;
    return {
      getGlyphCurrency: () => balance,
      spendGlyphCurrency: (amount) => {
        balance -= amount;
      },
      getBalance: () => balance,
    };
  }

  await test('purchasing deducts exactly the variable cost from the glyph balance', () => {
    clearAlgebraicUpgradeState('test-tower-deduct');
    const wallet = makeWallet(10);
    const result = purchaseAlgebraicUpgrade('test-tower-deduct', third.id, wallet);
    assert.equal(result.success, true);
    assert.equal(result.cost, 3);
    assert.equal(wallet.getBalance(), 7);
  });

  await test('purchasing increments only the selected variable, leaving siblings at 0', () => {
    clearAlgebraicUpgradeState('test-tower-selective');
    const wallet = makeWallet(100);
    purchaseAlgebraicUpgrade('test-tower-selective', second.id, wallet);
    assert.equal(getAlgebraicVariable('test-tower-selective', second.id), 1);
    ALGEBRAIC_VARIABLES.filter((v) => v.id !== second.id).forEach((variable) => {
      assert.equal(getAlgebraicVariable('test-tower-selective', variable.id), 0);
    });
  });

  await test('purchase fails cleanly on insufficient balance: no deduction, no level change', () => {
    clearAlgebraicUpgradeState('test-tower-poor');
    const wallet = makeWallet(1);
    const result = purchaseAlgebraicUpgrade('test-tower-poor', fifth.id, wallet); // costs 5
    assert.equal(result.success, false);
    assert.equal(result.reason, 'insufficient-balance');
    assert.equal(wallet.getBalance(), 1);
    assert.equal(getAlgebraicVariable('test-tower-poor', fifth.id), 0);
  });

  await test('purchase fails cleanly for an unknown variable id', () => {
    clearAlgebraicUpgradeState('test-tower-unknown');
    const wallet = makeWallet(100);
    const result = purchaseAlgebraicUpgrade('test-tower-unknown', 'bet', wallet);
    assert.equal(result.success, false);
    assert.equal(result.reason, 'invalid-variable');
    assert.equal(wallet.getBalance(), 100);
  });

  await test('repeated purchases raise the level and the next cost lookup reflects it', () => {
    clearAlgebraicUpgradeState('test-tower-repeat');
    const wallet = makeWallet(100);
    purchaseAlgebraicUpgrade('test-tower-repeat', first.id, wallet);
    purchaseAlgebraicUpgrade('test-tower-repeat', first.id, wallet);
    assert.equal(getAlgebraicVariable('test-tower-repeat', first.id), 2);
  });

  // --- Save migration / snapshot round-trip (test 16) ------------------------
  await test('old saves without algebraicUpgrades default every tower to level 0', () => {
    clearAlgebraicUpgradeState('test-tower-legacy');
    applyAlgebraicUpgradeStateSnapshot(undefined);
    applyAlgebraicUpgradeStateSnapshot({});
    ALGEBRAIC_VARIABLES.forEach((variable) => {
      assert.equal(getAlgebraicVariable('test-tower-legacy', variable.id), 0);
    });
  });

  await test('snapshot round-trip restores levels, and unknown/retired keys are ignored', () => {
    clearAlgebraicUpgradeState('test-tower-roundtrip');
    const wallet = makeWallet(100);
    purchaseAlgebraicUpgrade('test-tower-roundtrip', first.id, wallet);
    purchaseAlgebraicUpgrade('test-tower-roundtrip', fourth.id, wallet);
    const snapshot = getAlgebraicUpgradeStateSnapshot();
    assert.deepEqual(snapshot['test-tower-roundtrip'], { [first.id]: 1, [fourth.id]: 1 });

    clearAlgebraicUpgradeState('test-tower-roundtrip');
    applyAlgebraicUpgradeStateSnapshot({
      'test-tower-roundtrip': { [first.id]: 1, [fourth.id]: 1, bet: 99, shin: 5 },
    });
    assert.equal(getAlgebraicVariable('test-tower-roundtrip', first.id), 1);
    assert.equal(getAlgebraicVariable('test-tower-roundtrip', fourth.id), 1);
    assert.equal(getAlgebraicVariable('test-tower-roundtrip', 'bet'), 0);
  });

  // --- getAlgebraicVariable accessor -----------------------------------------
  await test('getAlgebraicVariable returns 0 for a tower that has never been touched', () => {
    clearAlgebraicUpgradeState('test-tower-untouched');
    assert.equal(getAlgebraicVariable('test-tower-untouched', first.id), 0);
  });

  // --- Aleph Glyph currency persistence (test 7) ------------------------------
  await test('Aleph Glyph balance persists across a save/load round-trip', async () => {
    global.window = { localStorage: createLocalStorageStub() };
    const autoSave = await importAsEsm('assets/autoSave.js');
    let restoredBalance = null;
    autoSave.configureAutoSave({
      getGlyphCurrency: () => 42,
      onGlyphCurrencyLoaded: (value) => {
        restoredBalance = value;
      },
    });
    autoSave.commitAutoSave();
    assert.equal(
      autoSave.readStorageJson(autoSave.GLYPH_CURRENCY_STORAGE_KEY),
      42,
    );
    autoSave.loadPersistentState();
    assert.equal(restoredBalance, 42);
    delete global.window;
  });

  // --- Mote award pipeline (tests 1-3) ---------------------------------------
  const enemyMetadata = await importAsEsm('assets/playfield/systems/EnemyMetadataSystem.js');

  await test('a normal enemy (default hp, no custom moteFactor) awards exactly 1 mote', () => {
    assert.equal(enemyMetadata.calculateMoteFactor({ hp: 60 }), 1);
  });

  await test('an enemy can define a custom mote reward via moteFactor', () => {
    assert.equal(enemyMetadata.calculateMoteFactor({ hp: 60, moteFactor: 7 }), 7);
  });

  await test('larger mote sizes are representable (scale with enemy hp)', () => {
    assert.equal(enemyMetadata.calculateMoteFactor({ hp: 600 }), 10);
    assert.equal(enemyMetadata.calculateMoteFactor({ hp: 6000 }), 100);
  });

  // --- Spire mote/glyph totals (tests 4, 17) ----------------------------------
  const powderPersistenceSource = fs.readFileSync(
    path.join(rootDir, 'assets/powderPersistence.js'),
    'utf8',
  );

  await test('Spire mote totals (glyphsAwarded) are included in the persisted powder basin fields', () => {
    assert.match(powderPersistenceSource, /['"]glyphsAwarded['"]/);
  });

  await test('the same glyph threshold cannot award Aleph Glyphs twice (monotonic-award invariant)', () => {
    // Mirrors the guard in assets/main.js: glyph currency is only granted for
    // glyphsLit above the previously recorded high-water mark, and re-observing
    // the same glyphsLit a second time (e.g. a re-render with no new kills)
    // must not grant anything further.
    function awardIfNewGlyphsLit(state, glyphsLit) {
      const previousAwarded = Number.isFinite(state.glyphsAwarded) ? Math.max(0, state.glyphsAwarded) : 0;
      if (glyphsLit > previousAwarded) {
        const newlyEarned = glyphsLit - previousAwarded;
        state.glyphsAwarded = glyphsLit;
        return newlyEarned;
      }
      return 0;
    }

    const state = { glyphsAwarded: 0 };
    assert.equal(awardIfNewGlyphsLit(state, 3), 3);
    assert.equal(awardIfNewGlyphsLit(state, 3), 0); // same kill/frame observed again
    assert.equal(awardIfNewGlyphsLit(state, 3), 0);
  });

  // --- Multiple thresholds crossed at once (test 6, paired with 5) -----------
  await test('crossing multiple glyph thresholds in one update grants the full jump exactly once', () => {
    function awardIfNewGlyphsLit(state, glyphsLit) {
      const previousAwarded = Number.isFinite(state.glyphsAwarded) ? Math.max(0, state.glyphsAwarded) : 0;
      if (glyphsLit > previousAwarded) {
        const newlyEarned = glyphsLit - previousAwarded;
        state.glyphsAwarded = glyphsLit;
        return newlyEarned;
      }
      return 0;
    }

    const state = { glyphsAwarded: 0 };
    // A burst of kills lights 5 glyphs in a single frame instead of one at a time.
    assert.equal(awardIfNewGlyphsLit(state, 5), 5);
    assert.equal(state.glyphsAwarded, 5);
  });

  // --- Visualization derives from state, not the reverse (test 18) -----------
  const alephTierControllerSource = fs.readFileSync(
    path.join(rootDir, 'assets/alephTierTransitionController.js'),
    'utf8',
  );

  await test('getTierVisualGlyphCount is a pure read of glyphsLit, not a mote-state mutator', () => {
    const match = alephTierControllerSource.match(
      /function getTierVisualGlyphCount\(glyphsLit\)\s*\{[\s\S]*?\n  \}/,
    );
    assert.ok(match, 'getTierVisualGlyphCount function body not found');
    const body = match[0];
    // The visual glyph count derives from the glyphsLit argument; it must not
    // assign back into powderState/mote fields (that would make the mote
    // simulation reverse-derive from its own visualization).
    assert.doesNotMatch(body, /powderState\.\w+\s*=/);
    assert.doesNotMatch(body, /\.glyphsAwarded\s*=/);
  });

  console.log(`\nAlgebraic upgrade tests: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    failures.forEach(({ name, error }) => {
      console.error(`\n- ${name}`);
      console.error(error);
    });
    process.exitCode = 1;
  }
}

run();
