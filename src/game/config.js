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
  word: { id: 'word', symbol: 'Abc' },
  picture: { id: 'picture', symbol: '🐈' },
  letter: { id: 'letter', symbol: 'A_C' },
  wrongLetter: { id: 'wrongLetter', symbol: 'ADC' },
  translate: { id: 'translate', symbol: 'Aa' },
  fraction: { id: 'fraction', symbol: '½' },
  clockDigital: { id: 'clockDigital', symbol: '🕗' },
  clockWords: { id: 'clockWords', symbol: '🕗' },
  digitalWords: { id: 'digitalWords', symbol: '8:00' },
  digitalClock: { id: 'digitalClock', symbol: '8:00' },
  odd: { id: 'odd', symbol: '🧩' },
  series: { id: 'series', symbol: '246' },
  shapes: { id: 'shapes', symbol: '🔷' },
  matrix: { id: 'matrix', symbol: '🔳' },
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

/**
 * Levels for the reading games (see src/game/reading.js): longer words,
 * then lowercase letters, then wrong options that look like the answer.
 * `maxLength` counts letters.
 */
/**
 * Missing letter: first the first letter of short words, then any letter,
 * then lowercase, then all words with wrong letters that look or sound
 * like the right one, then two letters left out.
 */
const LETTER_LEVELS = [
  { id: 1, letter: { maxLength: 4, position: 'first', case: 'upper', distractors: 'far' } },
  { id: 2, letter: { maxLength: 5, position: 'any', case: 'upper', distractors: 'far' } },
  { id: 3, letter: { maxLength: 6, position: 'any', case: 'lower', distractors: 'far' } },
  { id: 4, letter: { position: 'any', case: 'lower', distractors: 'near' } },
  { id: 5, letter: { minLength: 4, gaps: 2, position: 'any', case: 'lower', distractors: 'near' } },
]

/**
 * Wrong letter: short words in capitals with easy-to-spot wrong letters,
 * then all words in small letters, then wrong letters that look or sound
 * like the right one (see src/game/misspellings.js).
 */
const WRONG_LETTER_LEVELS = [
  { id: 1, wrongLetter: { maxLength: 4, list: 'far', case: 'upper', distractors: 'far' } },
  { id: 2, wrongLetter: { list: 'far', case: 'lower', distractors: 'far' } },
  { id: 3, wrongLetter: { list: 'near', case: 'lower', distractors: 'near' } },
]

/**
 * English words (see src/game/translate.js): hear and read an English
 * word and pick its picture, then pick its Swedish word, then pick it
 * among words for the same kind of thing (dog, cat, horse, cow).
 */
const TRANSLATE_LEVELS = [
  { id: 1, translate: { answer: 'emoji', distractors: 'any', case: 'upper' } },
  { id: 2, translate: { answer: 'word', distractors: 'any', case: 'lower' } },
  { id: 3, translate: { answer: 'word', distractors: 'kind', case: 'lower' } },
]

const READING_LEVELS = [
  { id: 1, read: { maxLength: 4, case: 'upper', distractors: 'distinct' } },
  { id: 2, read: { maxLength: 6, case: 'upper', distractors: 'any' } },
  { id: 3, read: { maxLength: 6, case: 'lower', distractors: 'any' } },
  { id: 4, read: { case: 'lower', distractors: 'alike' } },
]

/**
 * Levels for telling the time (see src/game/time.js). `minutes` lists
 * the minutes a level uses: whole hours, then halves, quarters and every
 * five minutes. Higher up, digital times can use a 24-hour clock
 * (`hour24`) and analog clocks can lose their numbers (`numbers: false`).
 */
const FIVE_MINUTES = Array.from({ length: 12 }, (_, index) => index * 5)
const TIME_BASICS = [
  { id: 1, time: { minutes: [0] } },
  { id: 2, time: { minutes: [0, 30] } },
  { id: 3, time: { minutes: [0, 15, 30, 45] } },
  { id: 4, time: { minutes: FIVE_MINUTES } },
]
const TIME_24 = { minutes: FIVE_MINUTES, hour24: true }
const TIME_NO_NUMBERS = { minutes: FIVE_MINUTES, numbers: false }

/** Multiplication, division and roots start at level 1: counting up to ten is too little for them. */
const TABLE_LEVELS = ARITHMETIC_LEVELS.filter((level) => level.id > 0)

/**
 * Fractions: read a circle, then read it in lowest terms, then add two
 * circles. From Svår on, the options are written in different ways
 * (stacked, 1/3, in words) within the same question.
 */
const MIXED_FORMS = ['stacked', 'stacked', 'inline', 'words']
const FRACTION_LEVELS = [
  { id: 1, fraction: { kind: 'read', dens: [2, 3, 4], maxDen: 4, forms: ['stacked'] } },
  { id: 2, fraction: { kind: 'read', dens: [2, 3, 4, 5, 6], maxDen: 6, forms: ['stacked'] } },
  { id: 3, fraction: { kind: 'simplify', dens: [4, 6, 8, 9, 10], maxDen: 10, forms: MIXED_FORMS } },
  {
    id: 4,
    fraction: { kind: 'add', pairs: [[3, 3], [4, 4], [5, 5], [6, 6], [8, 8]], maxDen: 8, forms: MIXED_FORMS },
  },
  {
    id: 5,
    fraction: {
      kind: 'add',
      pairs: [[2, 4], [2, 6], [3, 6], [2, 8], [4, 8]],
      whole: true,
      maxDen: 8,
      forms: MIXED_FORMS,
    },
  },
]

/**
 * Odd one out (see src/game/oddOneOut.js and groups.js): three things
 * that belong together and one that doesn't. First different kinds of
 * things, then things of the same kind, then traits like color, then the
 * same with words to read, then numbers.
 */
const ODD_LEVELS = [
  { id: 1, odd: { levels: ['far'], show: 'emoji' } },
  { id: 2, odd: { levels: ['close'], show: 'emoji' } },
  { id: 3, odd: { levels: ['trait'], show: 'emoji' } },
  { id: 4, odd: { levels: ['far', 'close'], show: 'words', case: 'upper' } },
  { id: 5, odd: { numbers: 30 } },
]

/**
 * Number series (see src/game/series.js): find the missing number. First
 * dots (up to nine, in a 3×3 grid) that grow by one or stay the same,
 * then +1 or +0, counting by 2, 5 and 10, any step with
 * the gap anywhere, two steps taking turns and growing steps, then
 * doubling, halving and square numbers. Expert mixes the last three
 * levels and the answer is typed, not picked.
 */
// The same number each time (+0) is one in five on the easiest levels:
// a kind is picked at random from the list, so 'one' is listed four times.
const SAME_OR_ONE = ['same', 'one', 'one', 'one', 'one']
const HARD_SERIES = ['any', 'alternate', 'growing', 'double', 'triple', 'half', 'square']
const SERIES_LEVELS = [
  { id: 0, series: { kinds: SAME_OR_ONE, gap: 'last', min: 1, max: 9, show: 'dots' } },
  { id: 1, series: { kinds: SAME_OR_ONE, gap: 'last', max: 20 } },
  { id: 2, series: { kinds: ['skip'], gap: 'last', max: 100 } },
  { id: 3, series: { kinds: ['any'], gap: 'any', max: 100 } },
  { id: 4, series: { kinds: ['alternate', 'growing'], gap: 'any' } },
  { id: 5, series: { kinds: ['double', 'triple', 'half', 'square'], gap: 'any' } },
  { id: 6, series: { kinds: HARD_SERIES, gap: 'any', max: 100, input: 'keypad' } },
]

/**
 * Shape series (see src/game/shapeSeries.js): find the missing figure.
 * First two figures taking turns, told apart by shape and color, with
 * wrong choices that look nothing alike; then units of three; then one
 * attribute that repeats while the rest stay (only the colors change);
 * then an arrow or a heart that turns a quarter and figures that grow in
 * number; then two rules at once, with eighth turns too. Mästare mixes
 * the last three, with AABB.
 */
const REPEAT_UNITS = ['AB', 'ABC', 'AAB', 'ABB']
const SHAPE_LEVELS = [
  { id: 0, shapes: { kinds: ['whole'], gap: 'last', units: ['AB'], fresh: true } },
  { id: 1, shapes: { kinds: ['whole'], gap: 'last', units: ['ABC', 'AAB', 'ABB'] } },
  { id: 2, shapes: { kinds: ['one'], gap: 'any', units: REPEAT_UNITS } },
  { id: 3, shapes: { kinds: ['turn', 'count'], gap: 'any' } },
  { id: 4, shapes: { kinds: ['two'], gap: 'any', turns: [90, 45] } },
  { id: 5, shapes: { kinds: ['one', 'turn', 'count', 'two'], gap: 'any', units: [...REPEAT_UNITS, 'AABB'], turns: [90, 45] } },
]

/**
 * Matrices (see src/game/matrix.js): find the missing tile in a 3×3
 * grid. First a figure per row or column, along a diagonal or taking
 * turns like a checkerboard; then three figures (or only their shapes or
 * colors), one of each in every row and column, or counting up along the
 * rows; then a table, where the row decides one thing and the
 * column another; then shapes and colors each one of each, or counts and
 * turns that step along the rows; then spot tiles put together. Mästare
 * mixes the last ones, with counts that add up.
 */
const MATRIX_LEVELS = [
  { id: 0, matrix: { kinds: ['rows', 'cols', 'diagonal', 'checker'], gap: 'any', fresh: true } },
  { id: 1, matrix: { kinds: ['latin', 'latinOne', 'countUp'], gap: 'any' } },
  { id: 2, matrix: { kinds: ['table'], gap: 'any' } },
  { id: 3, matrix: { kinds: ['twoLatin', 'step'], gap: 'any' } },
  { id: 4, matrix: { kinds: ['union', 'xor', 'both', 'unionLine'], gap: 'any' } },
  { id: 5, matrix: { kinds: ['twoLatin', 'step', 'xor', 'both', 'unionLine', 'sum'], gap: 'any', turns: [90, 45] } },
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
  { id: 'count', symbol: '123', ops: ['count'], levels: COUNT_LEVELS },
  { id: 'add', symbol: '+', ops: ['add'], levels: ARITHMETIC_LEVELS },
  { id: 'sub', symbol: '−', ops: ['sub'], levels: ARITHMETIC_LEVELS },
  { id: 'mul', symbol: '×', ops: ['mul'], levels: TABLE_LEVELS },
  { id: 'div', symbol: '÷', ops: ['div'], levels: TABLE_LEVELS },
  { id: 'mix', symbol: '?', ops: ['add', 'sub', 'mul', 'div'], levels: ARITHMETIC_LEVELS },
  // Square roots are a skill of their own, so they are not part of the mix.
  { id: 'sqrt', symbol: '√', ops: ['sqrt'], levels: TABLE_LEVELS },
  { id: 'eq', symbol: 'x', ops: ['eq'], levels: EQUATION_LEVELS },
  { id: 'fraction', symbol: '½', ops: ['fraction'], levels: FRACTION_LEVELS },
  // Reading: pick the word for a picture, or the picture for a word.
  { id: 'word', symbol: 'Abc', ops: ['word'], levels: READING_LEVELS },
  { id: 'picture', symbol: '🐈', ops: ['picture'], levels: READING_LEVELS },
  { id: 'letter', symbol: 'A_C', ops: ['letter'], levels: LETTER_LEVELS },
  { id: 'wrongLetter', symbol: 'ADC', ops: ['wrongLetter'], levels: WRONG_LETTER_LEVELS },
  { id: 'translate', symbol: 'Aa', ops: ['translate'], levels: TRANSLATE_LEVELS },
  // Telling the time, from an analog clock or from a digital one.
  {
    id: 'clockDigital',
    symbol: '🕗',
    ops: ['clockDigital'],
    levels: [...TIME_BASICS, { id: 5, time: TIME_24 }, { id: 6, time: TIME_NO_NUMBERS }],
  },
  { id: 'clockWords', symbol: '🕗', ops: ['clockWords'], levels: [...TIME_BASICS, { id: 5, time: TIME_NO_NUMBERS }] },
  { id: 'digitalWords', symbol: '8:00', ops: ['digitalWords'], levels: [...TIME_BASICS, { id: 5, time: TIME_24 }] },
  { id: 'digitalClock', symbol: '8:00', ops: ['digitalClock'], levels: [...TIME_BASICS, { id: 5, time: TIME_24 }] },
  // Patterns: which one doesn't fit, and which number, shape or tile is missing?
  { id: 'odd', symbol: '🧩', ops: ['odd'], levels: ODD_LEVELS },
  { id: 'series', symbol: '246', ops: ['series'], levels: SERIES_LEVELS },
  { id: 'shapes', symbol: '🔷', ops: ['shapes'], levels: SHAPE_LEVELS },
  { id: 'matrix', symbol: '🔳', ops: ['matrix'], levels: MATRIX_LEVELS },
]

/**
 * The categories grouped into areas, which the setup screen shows as
 * tabs: math, reading, telling the time and patterns.
 */
export const AREAS = [
  { id: 'math', categories: ['count', 'add', 'sub', 'mul', 'div', 'mix', 'sqrt', 'eq', 'fraction'] },
  { id: 'reading', categories: ['word', 'picture', 'letter', 'wrongLetter', 'translate'] },
  { id: 'time', categories: ['clockDigital', 'clockWords', 'digitalWords', 'digitalClock'] },
  { id: 'patterns', categories: ['odd', 'series', 'shapes', 'matrix'] },
]

/** The area a category belongs to. */
export function areaOf(categoryId) {
  return AREAS.find((area) => area.categories.includes(categoryId)) ?? AREAS[0]
}

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
 * `levels` remembers the level last picked in each category, and
 * `games` the category last picked in each area.
 */
export function normalizeSettings(settings) {
  const category = getCategory(settings.category)
  const level = getLevel(category.id, settings.level)
  return { ...settings, category: category.id, level: level.id, levels: settings.levels ?? {}, games: settings.games ?? {} }
}

/** Settings for switching to another category, on the level last used there. */
export function switchCategory(settings, categoryId) {
  const levels = { ...settings.levels, [settings.category]: settings.level }
  // Remember the game being left as well as the one picked.
  const games = { ...settings.games, [areaOf(settings.category).id]: settings.category, [areaOf(categoryId).id]: categoryId }
  return normalizeSettings({ ...settings, category: categoryId, level: levels[categoryId] ?? DEFAULT_LEVEL, levels, games })
}

/** Settings for switching to another area, on the game last played there. */
export function switchArea(settings, areaId) {
  const area = AREAS.find((item) => item.id === areaId) ?? AREAS[0]
  if (area.categories.includes(settings.category)) {
    return settings
  }
  return switchCategory(settings, settings.games?.[area.id] ?? area.categories[0])
}

/** Settings for picking another level in the current category. */
export function switchLevel(settings, levelId) {
  return normalizeSettings({ ...settings, level: levelId, levels: { ...settings.levels, [settings.category]: levelId } })
}
