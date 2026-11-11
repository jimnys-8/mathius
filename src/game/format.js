/**
 * A solved fact as text, with the hidden term filled in: the key "7×?=56"
 * with answer 8 becomes "7 × 8 = 56".
 *
 * @param {string} key     question key with '?' for the hidden term
 * @param {number} answer
 * @param {(n: number) => string} formatNumber
 */
export function formatFact(key, answer, formatNumber = String) {
  return key
    .replace(/\d+(\.\d+)?/g, (number) => formatNumber(Number(number)))
    .replace('?', formatNumber(answer))
    .replace(/([+−×÷=≈])/g, ' $1 ')
}
