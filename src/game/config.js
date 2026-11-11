// Static game configuration: operations, categories and difficulty levels.
// Names and descriptions shown to players live in src/i18n/strings.js.

export const OPERATIONS = {
  add: { id: 'add', symbol: '+' },
  sub: { id: 'sub', symbol: '−' },
  mul: { id: 'mul', symbol: '×' },
  div: { id: 'div', symbol: '÷' },
}

export const CATEGORIES = [
  { id: 'add', symbol: '+', ops: ['add'] },
  { id: 'sub', symbol: '−', ops: ['sub'] },
  { id: 'mul', symbol: '×', ops: ['mul'] },
  { id: 'div', symbol: '÷', ops: ['div'] },
  { id: 'mix', symbol: '?', ops: ['add', 'sub', 'mul', 'div'] },
]

/**
 * Difficulty levels.
 *
 * - `sum`: addition/subtraction use facts a + b = c with c <= sum.max and
 *   each part >= sum.minPart.
 * - `product`: multiplication/division use facts a × b = c with both
 *   factors in [product.min, product.max].
 * - `unknowns`: weights for which slot of `a op b = c` is hidden.
 *   Index 2 (the result) is a regular question; 0 and 1 are "missing
 *   number" equations like `? + 4 = 9`.
 */
export const LEVELS = [
  {
    id: 1,
    sum: { max: 10, minPart: 1 },
    product: { min: 1, max: 5 },
    unknowns: [0, 0, 1],
  },
  {
    id: 2,
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [0, 0, 1],
  },
  {
    id: 3,
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [0, 0, 1],
  },
  {
    id: 4,
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [1, 1, 0.5],
  },
  {
    id: 5,
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [1, 1, 0.5],
  },
]

/** Timer choices in seconds; 0 means no timer. */
export const TIMER_OPTIONS = [0, 30, 60, 120]

/** Number of questions in a round when the timer is off. */
export const ROUND_LENGTH = 10

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0]
}

export function getCategory(id) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0]
}
