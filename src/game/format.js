/**
 * A solved fact as text, with the hidden term filled in: the key "7×?=56"
 * with answer 8 becomes "7 × 8 = 56". Counting facts show the dots, and
 * equations say what x is: "3x + 1 = 10, x = 3".
 *
 * @param {string} key     question key with '?' for the hidden term
 * @param {number} answer
 * @param {(n: number) => string} formatNumber
 */
export function formatFact(key, answer, formatNumber = String) {
  if (key.includes('●')) {
    // Counting: the dots and their number.
    return `${'●'.repeat(answer)} = ${formatNumber(answer)}`
  }
  if (key.includes('x')) {
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
