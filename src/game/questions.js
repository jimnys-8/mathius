import { OPERATIONS, getCategory, getLevel } from './config.js'

/**
 * A question is a fact `terms[0] op terms[1] = terms[2]` where one of the
 * terms is hidden. `unknown` is the index of the hidden term.
 *
 * @typedef {Object} Question
 * @property {'add'|'sub'|'mul'|'div'} op
 * @property {[number, number, number]} terms
 * @property {0|1|2} unknown
 * @property {number} answer   terms[unknown]
 * @property {string} key      stable identifier, e.g. "7+8=?"
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

export function questionKey(op, terms, unknown) {
  const shown = terms.map((term, index) => (index === unknown ? '?' : String(term)))
  return `${shown[0]}${OPERATIONS[op].symbol}${shown[1]}=${shown[2]}`
}

export function makeQuestion(op, terms, unknown = 2) {
  return {
    op,
    terms,
    unknown,
    answer: terms[unknown],
    key: questionKey(op, terms, unknown),
  }
}

/**
 * Creates a random question for the given category and level.
 *
 * @param {Object} options
 * @param {string} options.category  category id ('add', 'sub', 'mul', 'div', 'mix')
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
    const terms = createTerms(op, levelConfig, rng)
    const unknown = pickWeighted(rng, levelConfig.unknowns)
    question = makeQuestion(op, terms, unknown)
    if (!avoid.includes(question.key)) {
      break
    }
  }

  return question
}

export function isCorrect(question, input) {
  const trimmed = String(input).trim()
  if (trimmed === '' || !/^-?\d+$/.test(trimmed)) {
    return false
  }
  return Number(trimmed) === question.answer
}
