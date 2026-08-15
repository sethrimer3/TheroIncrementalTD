/**
 * Tokenisation helpers used to split upgrade equations into highlightable spans.
 */

/**
 * Escapes special characters so dynamically built regular expressions stay valid.
 * @param {string} value Symbol text supplied by blueprint metadata.
 * @returns {string} Regex safe symbol string.
 */
export function escapeRegExp(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

/** Characters that make up a plain multi-character math identifier. */
const IDENTIFIER_CHARACTER = /[\p{L}\p{N}_]/u;

/**
 * Parse the small TeX label subset used by tower variables without flattening
 * identifiers into individual characters. The returned parts are suitable for
 * the interactive tower-card renderer, which cannot place HTML spans inside a
 * single MathJax expression.
 * @param {string} label Authored variable label.
 * @param {(value: string) => string} toPlainText Shared TeX-to-text converter.
 * @returns {{base: string, subscript: string, superscript: string}}
 */
export function parseEquationLabel(label, toPlainText = (value) => value) {
  const source = typeof label === 'string' ? label.trim() : '';
  if (!source) {
    return { base: '', subscript: '', superscript: '' };
  }

  // Tower metadata uses simple base labels followed by optional braced scripts.
  const scriptGroup = String.raw`((?:\\text\{[^{}]*\}|[^{}])*)`;
  const match = source.match(new RegExp(
    String.raw`^(.*?)(?:_\{${scriptGroup}\}|_([^\s^]))?(?:\^\{${scriptGroup}\}|\^([^\s_]))?$`,
    'u',
  ));
  if (!match) {
    return { base: toPlainText(source), subscript: '', superscript: '' };
  }

  return {
    base: toPlainText(match[1]),
    subscript: toPlainText(match[2] || match[3] || ''),
    superscript: toPlainText(match[4] || match[5] || ''),
  };
}

/**
 * Breaks equation text into tokens so the UI can bind spans to upgrade cards.
 * @param {string} equationText Base equation pulled from the blueprint.
 * @param {Array<{key: string, symbol: string}>} variableTokens Upgradable variable metadata.
 * @returns {Array<{text: string, variableKey: string|null}>} Token list for DOM generation.
 */
export function tokenizeEquationParts(equationText, variableTokens = []) {
  if (!equationText || !variableTokens.length) {
    return [{ text: equationText, variableKey: null }];
  }

  const tokenLookup = new Map();
  const patterns = variableTokens
    .filter((token) => token && token.symbol)
    .map((token) => {
      if (!tokenLookup.has(token.symbol)) {
        tokenLookup.set(token.symbol, token.key);
      }
      return escapeRegExp(token.symbol);
    })
    // Prefer a complete identifier over a shorter symbol sharing its prefix.
    .sort((left, right) => right.length - left.length);

  if (!patterns.length) {
    return [{ text: equationText, variableKey: null }];
  }

  const regex = new RegExp(`(${patterns.join('|')})`, 'g');
  const tokens = [];
  let lastIndex = 0;

  equationText.replace(regex, (match, _token, offset) => {
    const before = offset > 0 ? equationText[offset - 1] : '';
    const afterIndex = offset + match.length;
    const after = afterIndex < equationText.length ? equationText[afterIndex] : '';
    const beginsAsIdentifier = IDENTIFIER_CHARACTER.test(match[0] || '');
    const endsAsIdentifier = IDENTIFIER_CHARACTER.test(match.at(-1) || '');

    // Do not let short variables (p, m, N, etc.) match inside names such as
    // Spd, maxChn, slice, stored, or chain. This was the source of fragmented
    // labels throughout advanced tower cards.
    if ((beginsAsIdentifier && IDENTIFIER_CHARACTER.test(before)) ||
        (endsAsIdentifier && IDENTIFIER_CHARACTER.test(after))) {
      return match;
    }
    if (offset > lastIndex) {
      tokens.push({ text: equationText.slice(lastIndex, offset), variableKey: null });
    }
    tokens.push({ text: match, variableKey: tokenLookup.get(match) || null });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < equationText.length) {
    tokens.push({ text: equationText.slice(lastIndex), variableKey: null });
  }

  return tokens;
}
