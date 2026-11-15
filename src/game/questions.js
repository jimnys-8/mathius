import { OPERATIONS, getCategory, getLevel } from './config.js'
import { createFractionQuestion } from './fractions.js'
import { createLetterQuestion } from './letters.js'
import { createOddQuestion } from './oddOneOut.js'
import { createReadingQuestion } from './reading.js'
import { createTimeQuestion } from './time.js'
import { DEFAULT_LANGUAGE } from '../i18n/strings.js'

/**
 * A question is a fact `terms[0] op terms[1] = terms[2]` where one of the
 * terms is hidden. `unknown` is the index of the hidden term.
 *
 * Counting has one term, the number of dots (`terms[0]`), which is also
 * the answer.
 *
 * Equations have four terms, `terms[0]·x + terms[1] = terms[2]` with
 * x = terms[3] hidden. terms[1] is negative for `3x − 2 = 13`.
 *
 * Square roots have two terms, `√terms[0] = terms[1]`. Estimates
 * (`√40 ≈ 6.3`) come with `choices` to pick the answer from.
 *
 * Reading questions ('word' and 'picture', see reading.js) have a word
 * and an emoji as terms, and a string answer picked from `choices`.
 * Missing-letter questions ('letter', see letters.js) have the emoji,
 * the word with "_" for a letter, and that letter as terms. Fraction
 * questions ('fraction', see fractions.js) have the picture ("1/4+1/2")
 * and the right choice ("stacked:3/4") as terms. Odd-one-out questions
 * ('odd', see oddOneOut.js) have the group and the odd one as terms, and
 * carry the three that belong together.
 * Clock questions (see time.js) are alike, with what is shown and the
 * answer as terms, and the time itself in `time`.
 *
 * @typedef {Object} Question
 * @property {string} op  'count', 'add', 'sub', 'mul', 'div', 'sqrt', 'eq',
 *   'word', 'picture', 'letter', 'fraction', 'odd', 'clockDigital', 'clockWords', 'digitalWords' or 'digitalClock'
 * @property {Array<number|string>} terms
 * @property {0|1|2} unknown
 * @property {number|string} answer   terms[unknown]
 * @property {string} key      stable identifier, e.g. "7+8=?"
 * @property {Array<number|string>} [choices]  possible answers; numbers smallest first
 * @property {string[]} [hintRemoves]  wrong choices a hint takes away
 * @property {'upper'|'lower'} [case]  how reading questions show words
 * @property {{ hour: number, minute: number }} [time]  the time a clock question is about
 * @property {boolean} [numbers]  whether its analog clocks have numbers
 * @property {'dots'} [choicesAs]  show the choices as dots, not numerals
 * @property {boolean} [guided]  start the picture half solved
 */

function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

function pickWeighted(rng, weights) {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = rng() * total
  for (let index = 0; index < weights.length; index += 1) {
    roll -= weights[index]
    if (roll < 0) {
      return index
    }
  }
  return weights.length - 1
}

/** Picks two parts a, b >= minPart with a + b <= max, uniformly over all pairs. */
function randomSum(rng, { max, minPart }) {
  // Pick the total first, weighted by how many pairs produce it, so every
  // (a, b) pair is equally likely.
  const totals = []
  const weights = []
  for (let total = 2 * minPart; total <= max; total += 1) {
    totals.push(total)
    weights.push(total - 2 * minPart + 1)
  }
  const total = totals[pickWeighted(rng, weights)]
  const a = randomInt(rng, minPart, total - minPart)
  return [a, total - a, total]
}

function randomProduct(rng, { min, max }) {
  const a = randomInt(rng, min, max)
  const b = randomInt(rng, min, max)
  return [a, b, a * b]
}

function createTerms(op, level, rng) {
  if (op === 'add') {
    return randomSum(rng, level.sum)
  }
  if (op === 'sub') {
    const [a, b, c] = randomSum(rng, level.sum)
    return [c, a, b]
  }
  if (op === 'mul') {
    return randomProduct(rng, level.product)
  }
  const [a, b, c] = randomProduct(rng, level.product)
  return [c, a, b]
}

export function questionKey(op, terms, unknown, { estimate = false, dots = false } = {}) {
  if (op === 'count') {
    // Counting dots to name the number, or picking dots for a numeral.
    return dots ? `${terms[0]}=●?` : `●${terms[0]}=?`
  }
  if (op === 'eq') {
    // 3x+1=10, x+4=9, 2x=8, 3x−2=13
    const [a, b, c] = terms
    const constant = b > 0 ? `+${b}` : b < 0 ? `−${-b}` : ''
    return `${a === 1 ? '' : a}x${constant}=${c}`
  }
  const shown = terms.map((term, index) => (index === unknown ? '?' : String(term)))
  if (op === 'sqrt') {
    return `√${shown[0]}${estimate ? '≈' : '='}${shown[1]}`
  }
  return `${shown[0]}${OPERATIONS[op].symbol}${shown[1]}=${shown[2]}`
}

/**
 * @param {Object} [extra]  more question fields, e.g. `{ choicesAs: 'dots' }`
 *   to show the choices as dots instead of numerals
 */
export function makeQuestion(op, terms, unknown = terms.length - 1, choices = undefined, extra = {}) {
  const question = {
    op,
    terms,
    unknown,
    answer: terms[unknown],
    key: questionKey(op, terms, unknown, { estimate: Boolean(choices) && op === 'sqrt', dots: extra.choicesAs === 'dots' }),
    ...extra,
  }
  if (choices) {
    question.choices = choices
  }
  return question
}

/** Four whole numbers from 1 to `max` close to the answer, smallest first. */
export function countingChoices(rng, answer, max = 10) {
  const near = []
  for (let other = Math.max(1, answer - 3); other <= Math.min(max, answer + 3); other += 1) {
    if (other !== answer) {
      near.push(other)
    }
  }
  return [answer, ...pickDistinct(rng, near, 3)].sort((a, b) => a - b)
}

// ---------------------------------------------------------------------------
// Square roots

const roundTenth = (value) => Math.round(value * 10) / 10

function pickDistinct(rng, options, count) {
  const pool = [...options]
  const picked = []
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(randomInt(rng, 0, pool.length - 1), 1)[0])
  }
  return picked
}

/**
 * Three wrong answers for an estimated root. 'wide' ones lie between other
 * whole numbers (√40 is between 6 and 7, so 4.5 and 8.2 are clearly off);
 * 'narrow' ones share the whole number and differ by at least 0.2.
 */
function sqrtDistractors(rng, answer, spread) {
  const whole = Math.floor(answer)
  const tenths = Math.round((answer - whole) * 10)
  if (spread === 'wide') {
    const wholes = []
    for (let other = Math.max(1, whole - 3); other <= whole + 3; other += 1) {
      if (other !== whole) {
        wholes.push(other)
      }
    }
    return pickDistinct(rng, wholes, 3).map((other) => roundTenth(other + randomInt(rng, 1, 9) / 10))
  }
  const others = []
  for (let other = 1; other <= 9; other += 1) {
    if (Math.abs(other - tenths) >= 2) {
      others.push(other)
    }
  }
  return pickDistinct(rng, others, 3).map((other) => roundTenth(whole + other / 10))
}

function createSqrtQuestion(config, rng) {
  if (config.mode === 'exact') {
    const root = randomInt(rng, config.min, config.max)
    return makeQuestion('sqrt', [root * root, root], pickWeighted(rng, config.unknowns))
  }

  // A non-square whose root, to one decimal, lies strictly between two
  // whole numbers (√99 ≈ 9.95 would round to 10.0 and is skipped).
  for (;;) {
    const radicand = randomInt(rng, 2, config.maxRadicand)
    const whole = Math.floor(Math.sqrt(radicand))
    const answer = roundTenth(Math.sqrt(radicand))
    const tenths = Math.round((answer - whole) * 10)
    if (whole * whole !== radicand && tenths >= 1 && tenths <= 9) {
      const choices = [answer, ...sqrtDistractors(rng, answer, config.choices)].sort((a, b) => a - b)
      return makeQuestion('sqrt', [radicand, answer], 1, choices)
    }
  }
}

// ---------------------------------------------------------------------------
// Counting

function createCountQuestion({ max, ask }, rng) {
  const count = randomInt(rng, 1, max)
  const choices = countingChoices(rng, count, max)
  return makeQuestion('count', [count], 0, choices, ask === 'dots' ? { choicesAs: 'dots' } : {})
}

// ---------------------------------------------------------------------------
// Equations

function createEquationQuestion({ a: aRange, x: xRange, b: bRange, sign }, rng) {
  for (;;) {
    const a = randomInt(rng, ...aRange)
    const x = randomInt(rng, ...xRange)
    const size = randomInt(rng, ...bRange)
    const minus = sign === 'minus' || (sign === 'both' && rng() < 0.5)
    const b = minus ? -size : size
    const c = a * x + b
    if (c >= 1) {
      return makeQuestion('eq', [a, b, c, x], 3)
    }
  }
}

/**
 * Creates a random question for the given category and level.
 *
 * @param {Object} options
 * @param {string} options.category  category id, see CATEGORIES
 * @param {number} options.level     level id
 * @param {string[]} [options.avoid] question keys to avoid, oldest first (e.g. recent questions)
 * @param {string} [options.lang]   language of the words in reading questions
 * @param {() => number} [options.rng]
 * @returns {Question}
 */
export function createQuestion({ category, level, avoid = [], lang = DEFAULT_LANGUAGE, rng = Math.random }) {
  const levelConfig = getLevel(category, level)
  const categoryOps = getCategory(category).ops
  const ops = levelConfig.ops ? categoryOps.filter((op) => levelConfig.ops.includes(op)) : categoryOps
  // Small fact spaces (e.g. Easy square roots, with five questions) may
  // have nothing left that isn't in `avoid`. Then pick at random among
  // the older half of what came up: the last question is never asked
  // again straight away, and the questions don't settle into a fixed
  // order.
  const recent = new Map()
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let question
    const op = ops[randomInt(rng, 0, ops.length - 1)]
    if (op === 'sqrt') {
      question = createSqrtQuestion(levelConfig.sqrt, rng)
    } else if (op === 'count') {
      question = createCountQuestion(levelConfig.count, rng)
    } else if (op === 'eq') {
      question = createEquationQuestion(levelConfig.eq, rng)
    } else if (op === 'word' || op === 'picture') {
      question = createReadingQuestion(op, levelConfig.read, lang, rng)
    } else if (op === 'letter') {
      question = createLetterQuestion(levelConfig.letter, lang, rng)
    } else if (op === 'fraction') {
      question = createFractionQuestion(levelConfig.fraction, rng)
    } else if (op === 'odd') {
      question = createOddQuestion(levelConfig.odd, lang, rng, avoid)
    } else if (levelConfig.time) {
      question = createTimeQuestion(op, levelConfig.time, lang, rng)
    } else {
      const terms = createTerms(op, levelConfig, rng)
      const unknown = pickWeighted(rng, levelConfig.unknowns)
      question =
        levelConfig.choices === 'dots'
          ? makeQuestion(op, terms, unknown, countingChoices(rng, terms[unknown]), { choicesAs: 'dots' })
          : makeQuestion(op, terms, unknown)
    }
    if (levelConfig.guided?.includes(op)) {
      question.guided = true
    }
    const seen = avoid.lastIndexOf(question.key)
    if (seen === -1) {
      return question
    }
    recent.set(question.key, { question, seen })
  }

  const oldestFirst = [...recent.values()].sort((a, b) => a.seen - b.seen)
  const older = oldestFirst.slice(0, Math.ceil(oldestFirst.length / 2))
  return older[randomInt(rng, 0, older.length - 1)].question
}

/** Whether an answer is right. Accepts decimal points and commas. */
export function isCorrect(question, input) {
  if (typeof question.answer === 'string') {
    return input === question.answer
  }
  const trimmed = String(input).trim().replace(',', '.')
  if (trimmed === '' || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return false
  }
  return Number(trimmed) === question.answer
}
