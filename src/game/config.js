// Static game configuration: operations, categories and difficulty levels.

export const OPERATIONS = {
  add: { id: 'add', symbol: '+', label: 'Addition' },
  sub: { id: 'sub', symbol: '−', label: 'Subtraction' },
  mul: { id: 'mul', symbol: '×', label: 'Multiplication' },
  div: { id: 'div', symbol: '÷', label: 'Division' },
}

export const CATEGORIES = [
  { id: 'add', label: 'Addition', symbol: '+', ops: ['add'] },
  { id: 'sub', label: 'Subtraction', symbol: '−', ops: ['sub'] },
  { id: 'mul', label: 'Multiplication', symbol: '×', ops: ['mul'] },
  { id: 'div', label: 'Division', symbol: '÷', ops: ['div'] },
  { id: 'mix', label: 'Mix', symbol: '?', ops: ['add', 'sub', 'mul', 'div'] },
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
    name: 'Easy',
    description: 'Numbers up to 10',
    sum: { max: 10, minPart: 1 },
    product: { min: 1, max: 5 },
    unknowns: [0, 0, 1],
  },
  {
    id: 2,
    name: 'Medium',
    description: 'Numbers up to 20, tables up to 10',
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [0, 0, 1],
  },
  {
    id: 3,
    name: 'Hard',
    description: 'Numbers up to 100, tables up to 12',
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [0, 0, 1],
  },
  {
    id: 4,
    name: 'Equations',
    description: 'Find the missing number, up to 20',
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [1, 1, 0.5],
  },
  {
    id: 5,
    name: 'Master',
    description: 'Missing numbers, up to 100',
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [1, 1, 0.5],
  },
]

export const TIMER_OPTIONS = [
  { seconds: 0, label: 'Off' },
  { seconds: 30, label: '30 s' },
  { seconds: 60, label: '1 min' },
  { seconds: 120, label: '2 min' },
]

/** Number of questions in a round when the timer is off. */
export const ROUND_LENGTH = 10

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0]
}

export function getCategory(id) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0]
}
