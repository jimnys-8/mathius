/**
 * A solved fact as text, with the hidden term filled in: the key "7×?=56"
 * with answer 8 becomes "7 × 8 = 56". Counting facts show the dots,
 * equations say what x is ("3x + 1 = 10, x = 3"), and reading facts show
 * the emoji and its word ("🐈 katt").
 *
 * @param {{ key: string, op: string, answer: number|string }} fact
 *   `key` has '?' for the hidden term
 * @param {(n: number) => string} formatNumber
 */
export function formatFact({ key, op, answer }, formatNumber = String) {
  if (op === 'word' || op === 'picture') {
    return key.replace('=', ' ')
  }
  if (op === 'count') {
    // Counting: the dots and their number.
    return `${'●'.repeat(answer)} = ${formatNumber(answer)}`
  }
  if (op === 'eq') {
    // Equations: the equation, then what x is.
    return `${spaceSymbols(formatNumbers(key, formatNumber))}, x = ${formatNumber(answer)}`
  }
  return spaceSymbols(formatNumbers(key, formatNumber).replace('?', formatNumber(answer)))
}

function formatNumbers(text, formatNumber) {
  return text.replace(/\d+(\.\d+)?/g, (number) => formatNumber(Number(number)))
}

function spaceSymbols(text) {
  return text.replace(/([+−×÷=≈])/g, ' $1 ')
}
