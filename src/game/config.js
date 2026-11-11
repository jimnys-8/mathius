// Static game configuration: operations, categories and difficulty levels.
// Names and descriptions shown to players live in src/i18n/strings.js.

export const OPERATIONS = {
  count: { id: 'count', symbol: '●' },
  add: { id: 'add', symbol: '+' },
  sub: { id: 'sub', symbol: '−' },
  mul: { id: 'mul', symbol: '×' },
  div: { id: 'div', symbol: '÷' },
  sqrt: { id: 'sqrt', symbol: '√' },
  eq: { id: 'eq', symbol: 'x' },
}

/**
 * Difficulty levels for the arithmetic categories.
 *
 * - `sum`: addition/subtraction use facts a + b = c with c <= sum.max and
 *   each part >= sum.minPart.
 * - `product`: multiplication/division use facts a × b = c with both
 *   factors in [product.min, product.max].
 * - `unknowns`: weights for which slot of `a op b = c` is hidden.
 *   Index 2 (the result) is a regular question; 0 and 1 are "missing
 *   number" equations like `? + 4 = 9`.
 * - `sqrt`: square roots, either
 *   - exact: √(r²) = r with r in [min, max]; `unknowns` weighs asking for
 *     the radicand (√? = 7) against asking for the root (√49 = ?), or
 *   - estimate: √n for a non-square n <= maxRadicand, answered to one
 *     decimal by picking from four choices. 'wide' choices lie between
 *     different whole numbers; 'narrow' ones share the whole number and
 *     differ only in the decimal.
 * - `ops` (optional): only these operations, even in the mix.
 * - `choices` (optional): 'dots' to answer by picking one of four buttons
 *   showing dots, for players who can count but don't know numerals yet.
 * - `guided`: operations whose picture starts half solved: subtraction
 *   with the dots to take away already orange, square roots with the
 *   square already laid out.
 */
const ARITHMETIC_LEVELS = [
  {
    id: 0,
    ops: ['add', 'sub'],
    sum: { max: 10, minPart: 1 },
    unknowns: [0, 0, 1],
    choices: 'dots',
    guided: ['sub'],
  },
  {
    id: 1,
    sum: { max: 10, minPart: 1 },
    product: { min: 1, max: 5 },
    unknowns: [0, 0, 1],
    sqrt: { mode: 'exact', min: 1, max: 5, unknowns: [0, 1] },
    guided: ['sub', 'sqrt'],
  },
  {
    id: 2,
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [0, 0, 1],
    sqrt: { mode: 'exact', min: 2, max: 10, unknowns: [0, 1] },
    guided: ['sub', 'sqrt'],
  },
  {
    id: 3,
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [0, 0, 1],
    sqrt: { mode: 'estimate', maxRadicand: 100, choices: 'wide' },
    guided: ['sqrt'],
  },
  {
    id: 4,
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [1, 1, 0.5],
    sqrt: { mode: 'exact', min: 2, max: 12, unknowns: [1, 1] },
    guided: ['sqrt'],
  },
  {
    id: 5,
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [1, 1, 0.5],
    sqrt: { mode: 'estimate', maxRadicand: 150, choices: 'narrow' },
    guided: [],
  },
]

/**
 * Levels for learning the numbers by counting. `count.ask` is 'number'
 * to count dots and pick the numeral, or 'dots' to read a numeral and
 * pick the button with that many dots.
 */
const COUNT_LEVELS = [
  { id: 1, count: { max: 5, ask: 'number' } },
  { id: 2, count: { max: 10, ask: 'number' } },
  { id: 3, count: { max: 10, ask: 'dots' } },
]

/**
 * Levels for equations with a variable, `a·x + b = c` (or `a·x − b = c`).
 * `a`, `x` and `b` are [min, max] ranges and `sign` is 'plus', 'minus'
 * or 'both'. x stays at most 10, so the picture's bags can hold it.
 */
const EQUATION_LEVELS = [
  { id: 1, eq: { a: [1, 1], x: [1, 10], b: [1, 9], sign: 'plus' } },
  { id: 2, eq: { a: [2, 5], x: [1, 10], b: [0, 0], sign: 'plus' } },
  { id: 3, eq: { a: [2, 5], x: [1, 10], b: [1, 9], sign: 'plus' } },
  { id: 4, eq: { a: [2, 5], x: [2, 10], b: [1, 9], sign: 'both' } },
]

/** Multiplication, division and roots start at level 1: counting up to ten is too little for them. */
const TABLE_LEVELS = ARITHMETIC_LEVELS.filter((level) => level.id > 0)

/** Timer choices in seconds; 0 means no timer. */
export const TIMER_OPTIONS = [0, 30, 60, 120]

/** Number of questions in a round when the timer is off. */
export const ROUND_LENGTH = 10

/**
 * What can be practiced. Each category has its own ladder of levels, so
 * every list stays short and only holds levels that make sense for it.
 * Level ids stay the same when levels are added, since saved settings and
 * results refer to them.
 */
export const CATEGORIES = [
  { id: 'count', symbol: '123', ops: ['count'], levels: COUNT_LEVELS },
  { id: 'add', symbol: '+', ops: ['add'], levels: ARITHMETIC_LEVELS },
  { id: 'sub', symbol: '−', ops: ['sub'], levels: ARITHMETIC_LEVELS },
  { id: 'mul', symbol: '×', ops: ['mul'], levels: TABLE_LEVELS },
  { id: 'div', symbol: '÷', ops: ['div'], levels: TABLE_LEVELS },
  { id: 'mix', symbol: '?', ops: ['add', 'sub', 'mul', 'div'], levels: ARITHMETIC_LEVELS },
  // Square roots are a skill of their own, so they are not part of the mix.
  { id: 'sqrt', symbol: '√', ops: ['sqrt'], levels: TABLE_LEVELS },
  { id: 'eq', symbol: 'x', ops: ['eq'], levels: EQUATION_LEVELS },
]

/** The level a category starts on. Every category has it. */
export const DEFAULT_LEVEL = 1

/** The category new players start with. */
export const DEFAULT_CATEGORY = 'add'

export function getCategory(id) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES.find((category) => category.id === DEFAULT_CATEGORY)
}

/** A level of a category, falling back to the default level. */
export function getLevel(categoryId, levelId) {
  const { levels } = getCategory(categoryId)
  return levels.find((level) => level.id === levelId) ?? levels.find((level) => level.id === DEFAULT_LEVEL)
}

/**
 * Settings with a known category and a level that belongs to it.
 * `levels` remembers the level last picked in each category.
 */
export function normalizeSettings(settings) {
  const category = getCategory(settings.category)
  const level = getLevel(category.id, settings.level)
  return { ...settings, category: category.id, level: level.id, levels: settings.levels ?? {} }
}

/** Settings for switching to another category, on the level last used there. */
export function switchCategory(settings, categoryId) {
  const levels = { ...settings.levels, [settings.category]: settings.level }
  return normalizeSettings({ ...settings, category: categoryId, level: levels[categoryId] ?? DEFAULT_LEVEL, levels })
}

/** Settings for picking another level in the current category. */
export function switchLevel(settings, levelId) {
  return normalizeSettings({ ...settings, level: levelId, levels: { ...settings.levels, [settings.category]: levelId } })
}
