// Developer-only progression estimator for comparing tower output, wave durability, and Thero budgets.

const DEFAULT_GLYPH_DAMAGE_GROWTH = 0.12;
const DEFAULT_GLYPH_RATE_GROWTH = 0.04;
const DEFAULT_ENGAGEMENT_SECONDS = 8;

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function sumWaveEnemies(wave) {
  if (Array.isArray(wave?.enemyGroups) && wave.enemyGroups.length) {
    return wave.enemyGroups.reduce((total, group) => total + Math.max(0, finite(group.count)), 0);
  }
  return Math.max(0, finite(wave?.count));
}

/**
 * Planning formula: DPS = base damage × base attacks/s × 1.12^glyphs × 1.04^glyphs.
 * This deliberately uses one consistent marginal-glyph model so unlike tower mechanics remain comparable.
 */
export function estimateTowerOutput(tower, glyphs = 0) {
  const rank = Math.max(0, Math.floor(finite(glyphs)));
  const baseDamage = Math.max(0, finite(tower?.damage));
  const baseRate = Math.max(0, finite(tower?.rate));
  const damage = baseDamage * ((1 + DEFAULT_GLYPH_DAMAGE_GROWTH) ** rank);
  const rate = baseRate * ((1 + DEFAULT_GLYPH_RATE_GROWTH) ** rank);
  return {
    damage,
    rate,
    dps: damage * rate,
    baseDps: baseDamage * baseRate,
  };
}

/** Estimate the total configured health and earned Thero in a level without simulating movement or leaks. */
export function estimateLevelEconomy(level, theroMultiplier = 1) {
  const multiplier = Math.max(0, finite(theroMultiplier, 1));
  const waves = Array.isArray(level?.waves) ? level.waves : [];
  let enemyHealth = 0;
  let rewards = 0;
  waves.forEach((wave) => {
    const count = sumWaveEnemies(wave);
    enemyHealth += count * Math.max(0, finite(wave?.hp));
    rewards += count * Math.max(0, finite(wave?.reward));
    if (wave?.boss) {
      enemyHealth += Math.max(0, finite(wave.boss.hp));
      rewards += Math.max(0, finite(wave.boss.reward));
    }
  });
  const startingThero = Math.max(0, finite(level?.startThero ?? level?.startEnergy)) * multiplier;
  return {
    startingThero,
    rewards,
    maximumThero: startingThero + rewards,
    enemyHealth,
    waveCount: waves.length,
  };
}

function format(value) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1e6) return value.toExponential(2);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function createBalanceEstimator(options = {}) {
  const { towers = [], getLevels = () => [], getTheroMultiplier = () => 1 } = options;
  let elements = {};

  function render() {
    if (!elements.output) return;
    const levels = getLevels();
    const level = levels.find((entry) => entry.id === elements.level?.value) || levels[0];
    const glyphs = Math.max(0, Math.floor(finite(elements.glyphs?.value)));
    const engagement = Math.max(0.1, finite(elements.engagement?.value, DEFAULT_ENGAGEMENT_SECONDS));
    const multiplier = Math.max(0, finite(elements.multiplier?.value, getTheroMultiplier()));
    const economy = estimateLevelEconomy(level, multiplier);
    const combatTowers = towers.filter((tower) => finite(tower.damage) > 0 && finite(tower.rate) > 0);
    const rows = combatTowers.map((tower) => ({ tower, ...estimateTowerOutput(tower, glyphs) }));
    const affordableDps = rows.reduce((best, row) => {
      const cost = Math.max(1, finite(row.tower.baseCost, 1));
      const copies = Math.floor(economy.maximumThero / cost);
      return Math.max(best, copies * row.dps);
    }, 0);
    const suggestedHp = affordableDps * engagement;

    elements.summary.innerHTML = `
      <span><b>Start þ:</b> ${format(economy.startingThero)}</span>
      <span><b>Wave income:</b> ${format(economy.rewards)}</span>
      <span><b>Max spend:</b> ${format(economy.maximumThero)}</span>
      <span><b>Enemy HP:</b> ${format(economy.enemyHealth)}</span>
      <span><b>Suggested HP budget:</b> ${format(suggestedHp)}</span>`;
    elements.output.innerHTML = rows.map((row) => {
      const cost = Math.max(1, finite(row.tower.baseCost, 1));
      const affordable = Math.floor(economy.maximumThero / cost);
      const killHp = row.dps * engagement;
      return `<tr><th scope="row">${row.tower.symbol || row.tower.name}</th><td>${format(cost)}</td><td>${format(row.damage)}</td><td>${format(row.rate)}</td><td>${format(row.dps)}</td><td>${format(killHp)}</td><td>${format(affordable)}</td></tr>`;
    }).join('');
  }

  function bind() {
    elements = {
      section: document.getElementById('developer-balance-estimator'),
      level: document.getElementById('balance-estimator-level'),
      glyphs: document.getElementById('balance-estimator-glyphs'),
      engagement: document.getElementById('balance-estimator-engagement'),
      multiplier: document.getElementById('balance-estimator-multiplier'),
      summary: document.getElementById('balance-estimator-summary'),
      output: document.getElementById('balance-estimator-output'),
    };
    const levels = getLevels();
    if (!elements.section || !elements.level) return;
    elements.level.innerHTML = levels.map((level) => `<option value="${level.id}">${level.name || level.id}</option>`).join('');
    elements.multiplier.value = String(getTheroMultiplier());
    [elements.level, elements.glyphs, elements.engagement, elements.multiplier].forEach((input) => input?.addEventListener('input', render));
    render();
  }

  function setVisible(visible) {
    if (elements.section) elements.section.hidden = !visible;
    if (visible) render();
  }

  return { bind, render, setVisible };
}
