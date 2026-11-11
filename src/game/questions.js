import { OPERATIONS, getCategory, getLevel } from './config.js'

/**
 * A question is a fact `terms[0] op terms[1] = terms[2]` where one of the
 * terms is hidden. `unknown` is the index of the hidden term.
 *
 * Square roots have two terms, `√terms[0] = terms[1]`. Estimates
 * (`√40 ≈ 6.3`) come with `choices` to pick the answer from.
 *
 * @typedef {Object} Question
 * @property {'add'|'sub'|'mul'|'div'} op
 * @property {[number, number, number]} terms
 * @property {0|1|2} unknown
 * @property {number} answer   terms[unknown]
 * @property {string} key      stable identifier, e.g. "7+8=?"
 * @property {number[]} [choices]  possible answers, smallest first
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

export function questionKey(op, terms, unknown, { estimate = false } = {}) {
  const shown = terms.map((term, index) => (index === unknown ? '?' : String(term)))
  if (op === 'sqrt') {
    return `√${shown[0]}${estimate ? '≈' : '='}${shown[1]}`
  }
  return `${shown[0]}${OPERATIONS[op].symbol}${shown[1]}=${shown[2]}`
}

export function makeQuestion(op, terms, unknown = terms.length - 1, choices = undefined) {
  const question = {
    op,
    terms,
    unknown,
    answer: terms[unknown],
    key: questionKey(op, terms, unknown, { estimate: Boolean(choices) }),
  }
  if (choices) {
    question.choices = choices
  }
  return question
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

/**
 * Creates a random question for the given category and level.
 *
 * @param {Object} options
 * @param {string} options.category  category id ('add', 'sub', 'mul', 'div', 'mix', 'sqrt')
 * @param {number} options.level     level id
 * @param {string[]} [options.avoid] question keys to avoid (e.g. recent questions)
 * @param {() => number} [options.rng]
 * @returns {Question}
 */
export function createQuestion({ category, level, avoid = [], rng = Math.random }) {
  const { ops } = getCategory(category)
  const levelConfig = getLevel(level)
  let question = null

  // Small fact spaces (e.g. Easy multiplication) can make collisions
  // likely, so give up avoiding after a few attempts.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const op = ops[randomInt(rng, 0, ops.length - 1)]
    if (op === 'sqrt') {
      question = createSqrtQuestion(levelConfig.sqrt, rng)
    } else {
      const terms = createTerms(op, levelConfig, rng)
      question = makeQuestion(op, terms, pickWeighted(rng, levelConfig.unknowns))
    }
    if (!avoid.includes(question.key)) {
      break
    }
  }

  return question
}

/** Whether an answer is right. Accepts decimal points and commas. */
export function isCorrect(question, input) {
  const trimmed = String(input).trim().replace(',', '.')
  if (trimmed === '' || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return false
  }
  return Number(trimmed) === question.answer
}
