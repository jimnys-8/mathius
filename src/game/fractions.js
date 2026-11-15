import { shuffle } from './reading.js'

/**
 * Fractions: circles cut in equal slices, some colored, and four
 * fractions to pick the right one from.
 *
 * `level.fraction.kind`:
 * - 'read': one circle; the answer is what it shows (3/4, also 2/4)
 * - 'simplify': one circle not in lowest terms (3/6); the answer is in
 *   lowest terms (1/2), and so are all the options
 * - 'add': two circles to add (1/4 + 1/2); the answer is in lowest terms
 *
 * Questions have the picture and the right choice as terms. The picture
 * is "3/4", or "1/4+1/2" for a sum. A choice is a fraction and how it is
 * written: "stacked:3/4" (with a fraction bar), "inline:3/4" or
 * "words:3/4" (three fourths), and "…:1/1" is one whole. No two choices
 * have the same value, so only one is right whichever way it is written.
 */

const CHOICES = 4

/** @typedef {[number, number]} Fraction  numerator and denominator */

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

export function reduce([n, d]) {
  const divisor = gcd(n, d)
  return [n / divisor, d / divisor]
}

export function parseFraction(text) {
  const [n, d] = text.split('/').map(Number)
  return [n, d]
}

export const showFraction = ([n, d]) => `${n}/${d}`

/** A picture's fractions: one, or two to add. */
export function pictureFractions(picture) {
  return picture.split('+').map(parseFraction)
}

/** A choice's form and fraction: "words:3/4" → { form: 'words', fraction: [3, 4] }. */
export function parseChoice(choice) {
  const [form, fraction] = choice.split(':')
  return { form, fraction: parseFraction(fraction) }
}

const value = ([n, d]) => n / d
const sameValue = (a, b) => a[0] * b[1] === b[0] * a[1]

function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)]
}

/** The proper fractions (0 < n < d) with a denominator in `dens`. */
function properFractions(dens, { reducible } = {}) {
  return dens.flatMap((d) =>
    Array.from({ length: d - 1 }, (_, index) => [index + 1, d]).filter(
      ([n]) => reducible === undefined || (gcd(n, d) > 1) === reducible,
    ),
  )
}

/** Sums the level can ask: pairs of fractions whose total is at most `max`. */
function sums(fraction) {
  const pairs = []
  for (const [d1, d2] of fraction.pairs) {
    for (const a of properFractions([d1])) {
      for (const b of properFractions([d2])) {
        const total = value(a) + value(b)
        if (total < 1 || (fraction.whole && total === 1)) {
          pairs.push([a, b])
        }
      }
    }
  }
  return pairs
}

function addFractions([a, b], [c, d]) {
  return reduce([a * d + c * b, b * d])
}

/**
 * Wrong answers a child is likely to give, then near neighbors. For a
 * picture: counting the white slices, or comparing colored to white.
 * For a sum: adding tops and bottoms (1/4 + 1/2 = 2/6).
 */
function likelyMistakes(kind, terms, answer) {
  const [n, d] = answer
  const near = [
    [n + 1, d],
    [n - 1, d],
    [n, d + 1],
    [n, d - 1],
    [n + 1, d + 1],
    [n, d + 2],
  ]
  if (kind === 'add') {
    const [[a, b], [c, e]] = terms
    return [[a + c, b + e], [a + c, Math.max(b, e)], [a + c, Math.min(b, e)], ...near]
  }
  const [[pn, pd]] = terms
  return [[pd - pn, pd], [pn, pd - pn], [pd - pn, pn], ...near]
}

function pickWrong(kind, terms, answer, maxDen, rng) {
  const lowest = kind !== 'read'
  const picked = []
  const add = ([n, d]) => {
    if (picked.length === CHOICES - 1 || n < 1 || n >= d) {
      return
    }
    // The answer is in lowest terms on the harder levels, so the wrong
    // options are too: otherwise "not simplified" gives them away.
    const fraction = lowest ? reduce([n, d]) : [n, d]
    if (fraction[1] <= maxDen && !sameValue(fraction, answer) && !picked.some((other) => sameValue(other, fraction))) {
      picked.push(fraction)
    }
  }
  const [likely, ...rest] = likelyMistakes(kind, terms, answer)
  // The likeliest mistake when it fits, then the others in random order,
  // then any fractions.
  add(likely)
  shuffle(rest, rng).forEach(add)
  shuffle(properFractions(Array.from({ length: maxDen - 1 }, (_, index) => index + 2)), rng).forEach(add)
  return picked
}

const choiceText = (form, fraction) => `${form}:${showFraction(fraction)}`

/**
 * @param {Object} fraction  the level's settings
 * @param {'read'|'simplify'|'add'} fraction.kind
 * @param {number[]} [fraction.dens]  denominators of the circle ('read', 'simplify')
 * @param {number[][]} [fraction.pairs]  denominators of the two circles ('add')
 * @param {boolean} [fraction.whole]  sums may make one whole ('add')
 * @param {number} fraction.maxDen  the largest denominator among the options
 * @param {string[]} fraction.forms  how options are written: 'stacked', 'inline', 'words'
 * @param {() => number} rng
 */
export function createFractionQuestion(fraction, rng) {
  let terms
  let answer
  if (fraction.kind === 'add') {
    terms = pick(rng, sums(fraction))
    // Either circle may come first.
    if (rng() < 0.5) {
      terms = [terms[1], terms[0]]
    }
    answer = addFractions(...terms)
  } else {
    const shown = pick(rng, properFractions(fraction.dens, { reducible: fraction.kind === 'simplify' ? true : undefined }))
    terms = [shown]
    answer = fraction.kind === 'simplify' ? reduce(shown) : shown
  }

  const wrong = pickWrong(fraction.kind, terms, answer, fraction.maxDen, rng)
  const form = () => fraction.forms[randomInt(rng, 0, fraction.forms.length - 1)]
  const answerChoice = choiceText(form(), answer)
  const wrongChoices = wrong.map((item) => choiceText(form(), item))
  const picture = terms.map(showFraction).join('+')

  return {
    op: 'fraction',
    terms: [picture, answerChoice],
    unknown: 1,
    answer: answerChoice,
    choices: shuffle([answerChoice, ...wrongChoices], rng),
    hintRemoves: shuffle(wrongChoices, rng).slice(0, 2),
    kind: fraction.kind,
    key: `${picture}=${showFraction(answer)}`,
  }
}

/** The smallest denominator both fractions can be written with. */
export function commonDenominator(a, b) {
  return (a * b) / gcd(a, b)
}

// Words for fractions, by language: the numerator as a number word, and
// the denominator's name in singular and plural.
const NUMBER_WORDS = {
  sv: ['', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva'],
  en: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'],
}

const PART_WORDS = {
  sv: {
    2: ['halv', 'halvor'],
    3: ['tredjedel', 'tredjedelar'],
    4: ['fjärdedel', 'fjärdedelar'],
    5: ['femtedel', 'femtedelar'],
    6: ['sjättedel', 'sjättedelar'],
    7: ['sjundedel', 'sjundedelar'],
    8: ['åttondel', 'åttondelar'],
    9: ['niondel', 'niondelar'],
    10: ['tiondel', 'tiondelar'],
    11: ['elftedel', 'elftedelar'],
    12: ['tolftedel', 'tolftedelar'],
  },
  en: {
    2: ['half', 'halves'],
    3: ['third', 'thirds'],
    4: ['fourth', 'fourths'],
    5: ['fifth', 'fifths'],
    6: ['sixth', 'sixths'],
    7: ['seventh', 'sevenths'],
    8: ['eighth', 'eighths'],
    9: ['ninth', 'ninths'],
    10: ['tenth', 'tenths'],
    11: ['eleventh', 'elevenths'],
    12: ['twelfth', 'twelfths'],
  },
}

const WHOLE = { sv: 'en hel', en: 'one whole' }

/** A fraction in words: "tre fjärdedelar", "one half", "en hel". */
export function fractionWords([n, d], lang) {
  if (n === d) {
    return WHOLE[lang]
  }
  const [one, many] = PART_WORDS[lang][d]
  return `${NUMBER_WORDS[lang][n]} ${n === 1 ? one : many}`
}
