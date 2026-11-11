// Static game configuration: operations, categories and difficulty levels.
// Names and descriptions shown to players live in src/i18n/strings.js.

export const OPERATIONS = {
  add: { id: 'add', symbol: '+' },
  sub: { id: 'sub', symbol: '−' },
  mul: { id: 'mul', symbol: '×' },
  div: { id: 'div', symbol: '÷' },
  sqrt: { id: 'sqrt', symbol: '√' },
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
 */
const ARITHMETIC_LEVELS = [
  {
    id: 1,
    sum: { max: 10, minPart: 1 },
    product: { min: 1, max: 5 },
    unknowns: [0, 0, 1],
    sqrt: { mode: 'exact', min: 1, max: 5, unknowns: [0, 1] },
  },
  {
    id: 2,
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [0, 0, 1],
    sqrt: { mode: 'exact', min: 2, max: 10, unknowns: [0, 1] },
  },
  {
    id: 3,
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [0, 0, 1],
    sqrt: { mode: 'estimate', maxRadicand: 100, choices: 'wide' },
  },
  {
    id: 4,
    sum: { max: 20, minPart: 1 },
    product: { min: 1, max: 10 },
    unknowns: [1, 1, 0.5],
    sqrt: { mode: 'exact', min: 2, max: 12, unknowns: [1, 1] },
  },
  {
    id: 5,
    sum: { max: 100, minPart: 2 },
    product: { min: 2, max: 12 },
    unknowns: [1, 1, 0.5],
    sqrt: { mode: 'estimate', maxRadicand: 150, choices: 'narrow' },
  },
]

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
  { id: 'add', symbol: '+', ops: ['add'], levels: ARITHMETIC_LEVELS },
  { id: 'sub', symbol: '−', ops: ['sub'], levels: ARITHMETIC_LEVELS },
  { id: 'mul', symbol: '×', ops: ['mul'], levels: ARITHMETIC_LEVELS },
  { id: 'div', symbol: '÷', ops: ['div'], levels: ARITHMETIC_LEVELS },
  { id: 'mix', symbol: '?', ops: ['add', 'sub', 'mul', 'div'], levels: ARITHMETIC_LEVELS },
  // Square roots are a skill of their own, so they are not part of the mix.
  { id: 'sqrt', symbol: '√', ops: ['sqrt'], levels: ARITHMETIC_LEVELS },
]

/** The level a category starts on. Every category has it. */
export const DEFAULT_LEVEL = 1

export function getCategory(id) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0]
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
