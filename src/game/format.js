import { fillGaps } from './letters.js'

/**
 * A solved fact as text, with the hidden term filled in: the key "7×?=56"
 * with answer 8 becomes "7 × 8 = 56". Counting facts show the dots,
 * equations say what x is ("3x + 1 = 10, x = 3"), reading facts show
 * the emoji and its word ("🐈 katt"), and clock facts the time
 * ("🕗 8:20: tjugo över åtta"). Odd-one-out facts show the three and
 * the odd one ("🐄 🐖 🐑 ≠ 🦁"), and number series the series with the
 * answer in brackets ("2 4 6 8 (10)", "7 10 (13) 16 19"). Shape series
 * are drawn where they are listed (ShapeFact); as text they name each
 * different figure by a letter ("A B A B A (B)"), and matrices likewise,
 * row by row ("A B C / B C A / C A (B)").
 *
 * @param {{ key: string, op: string, answer: number|string }} fact
 *   `key` has '?' for the hidden term
 * @param {(n: number) => string} formatNumber
 */
export function formatFact({ key, op, answer }, formatNumber = String) {
  if (op === 'word' || op === 'picture') {
    return key.replace('=', ' ')
  }
  if (op === 'fraction') {
    // "3/6=1/2": the picture's fraction, and the answer when it differs.
    const [shown, answered] = key.split('=')
    return shown === answered ? shown : spaceSymbols(key)
  }
  if (op === 'odd') {
    // "farm:🐄,🐖,🐑:🦁": the three that go together, and the odd one.
    const [, three, odd] = key.split(':')
    const shown = (value) => (/^\d+$/.test(value) ? formatNumber(Number(value)) : value)
    return `${three.split(',').map(shown).join(' ')} ≠ ${shown(odd)}`
  }
  if (op === 'series') {
    // "7,10,?,16,19": Nunito has no arrow, so the answer goes in brackets.
    const shown = (part) => (part === '?' ? `(${formatNumber(answer)})` : formatNumber(Number(part)))
    return key.split(',').map(shown).join(' ')
  }
  if (op === 'shapes' || op === 'matrix') {
    // A letter for each different figure; a matrix row by row: "A B C / B C A / C A (B)".
    const figures = key.split(',').map((part) => (part === '?' ? answer : part))
    const letters = [...new Set(figures)]
    const letter = (figure) => String.fromCharCode(65 + letters.indexOf(figure))
    const shown = key.split(',').map((part, index) => (part === '?' ? `(${letter(figures[index])})` : letter(part)))
    if (op === 'matrix') {
      return [0, 3, 6].map((start) => shown.slice(start, start + 3).join(' ')).join(' / ')
    }
    return shown.join(' ')
  }
  if (op === 'letter') {
    // "🐈=k_tt" with answer "a" (or "🐈=k_t_" with "at"): the emoji and the whole word.
    return fillGaps(key.replace('=', ' '), answer)
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
