/**
 * A solved fact as text, with the hidden term filled in: the key "7×?=56"
 * with answer 8 becomes "7 × 8 = 56". Counting facts show the dots,
 * equations say what x is ("3x + 1 = 10, x = 3"), reading facts show
 * the emoji and its word ("🐈 katt"), and clock facts the time
 * ("🕗 8:20: tjugo över åtta").
 *
 * @param {{ key: string, op: string, answer: number|string }} fact
 *   `key` has '?' for the hidden term
 * @param {(n: number) => string} formatNumber
 */
export function formatFact({ key, op, answer }, formatNumber = String) {
  if (op === 'word' || op === 'picture') {
    return key.replace('=', ' ')
  }
  if (op in CLOCK_FACTS) {
    // Keys are "op:shown=answer", e.g. "clockWords:8:20=tjugo över åtta".
    const [shown, said] = key.slice(op.length + 1).split('=')
    return CLOCK_FACTS[op](shown, said)
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

// Clock facts: the clock (🕗 and its time) or digital time, and the answer.
const CLOCK_FACTS = {
  clockDigital: (clock, digital) => `🕗 ${clock} = ${digital}`,
  clockWords: (clock, words) => `🕗 ${clock}: ${words}`,
  digitalWords: (digital, words) => `${digital}: ${words}`,
  digitalClock: (digital) => `${digital} = 🕗`,
}

function formatNumbers(text, formatNumber) {
  return text.replace(/\d+(\.\d+)?/g, (number) => formatNumber(Number(number)))
}

function spaceSymbols(text) {
  return text.replace(/([+−×÷=≈])/g, ' $1 ')
}
