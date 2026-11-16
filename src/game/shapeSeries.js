// Shape series: a row of figures (see shapes.js) that follow a pattern,
// with one of them missing. Each rule works on some of the figures'
// attributes:
//
//   repeat  a unit that repeats: AB AB, ABC ABC, AAB AAB, ABB ABB, AABB
//   turn    an arrow turns the same way each step, a quarter or an eighth
//   count   one more (or one fewer) figure each step, from 1 to 6
//
// The kinds of question, from easy to hard:
//
//   whole   the whole figure repeats (shape and color together)
//   one     one attribute repeats (shape, color, size or fill), the rest stay
//   turn    an arrow turns, its color stays
//   count   the number of figures grows or shrinks, the figure stays
//   two     two rules at once: shapes AB AB while colors ABC ABC, an arrow
//           turning while colors take turns, or counting while shapes do
//
// Every wrong choice breaks the pattern of at least one attribute, so
// there is one right answer.

import { COLORS, FILLS, MAX_COUNT, SHAPES, SIZES, figureKey, makeFigure } from './shapes.js'

function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)]
}

function shuffle(items, rng) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

/** `count` different values from `values`, in random order. */
function pickDistinct(rng, values, count) {
  return shuffle(values, rng).slice(0, count)
}

/** The attributes a repeat can vary, and the values each can take. */
const REPEATABLE = { shape: SHAPES, color: COLORS, size: SIZES, fill: FILLS }

/** How many tiles a series of a unit gets: the unit twice and a bit, at most eight tiles. */
function lengthFor(rng, period) {
  if (period >= 4) {
    return 8
  }
  return period === 3 ? randomInt(rng, 6, 7) : randomInt(rng, 5, 6)
}

/** The values of a repeat over `length` tiles: unit "AAB" with values [x, y] gives x x y x x y … */
function repeatValues(unit, values, length) {
  const letters = [...new Set(unit)]
  return Array.from({ length }, (_, index) => values[letters.indexOf(unit[index % unit.length])])
}

/** The figures for some attribute rows: [{ shape: [...] }, { color: [...] }] → one figure per tile. */
function combine(length, base, columns) {
  return Array.from({ length }, (_, index) => {
    const figure = { ...base }
    for (const [attribute, values] of Object.entries(columns)) {
      figure[attribute] = values[index]
    }
    return makeFigure(figure)
  })
}

/** Distinct letters in a unit: "AAB" has 2. */
const lettersIn = (unit) => new Set(unit).size

/** A turn of `step` degrees each tile, from a start that keeps the arrow off the diagonals for quarter turns. */
function turnValues(rng, step, length) {
  const start = randomInt(rng, 0, 360 / Math.abs(step) - 1) * Math.abs(step)
  return Array.from({ length }, (_, index) => (((start + index * step) % 360) + 360) % 360)
}

/** One more or one fewer each tile, within 1 to MAX_COUNT. */
function countValues(rng, length) {
  const start = randomInt(rng, 1, MAX_COUNT - length + 1)
  const values = Array.from({ length }, (_, index) => start + index)
  return rng() < 2 / 3 ? values : values.reverse()
}

/** A random base figure, for the attributes no rule varies. */
function baseFigure(rng, { shapes = SHAPES } = {}) {
  return { shape: pick(rng, shapes), color: pick(rng, COLORS) }
}

/**
 * Each kind makes the figures and the rules that drew them, which the
 * hint draws and the wrong choices break. A rule is
 * `{ type: 'repeat', attributes, period }`, `{ type: 'turn', step }` or
 * `{ type: 'count', step }`.
 */
const KINDS = {
  whole(rng, { units }) {
    const unit = pick(rng, units)
    const length = lengthFor(rng, unit.length)
    const letters = lettersIn(unit)
    const shapes = pickDistinct(rng, SHAPES, letters)
    const colors = pickDistinct(rng, COLORS, letters)
    const figures = combine(length, {}, { shape: repeatValues(unit, shapes, length), color: repeatValues(unit, colors, length) })
    return { figures, rules: [{ type: 'repeat', attributes: ['shape', 'color'], period: unit.length }] }
  },
  one(rng, { units }) {
    const attribute = pick(rng, Object.keys(REPEATABLE))
    const values = REPEATABLE[attribute]
    // Size and fill have two values, so their units have two letters.
    const unit = pick(
      rng,
      units.filter((item) => lettersIn(item) <= values.length),
    )
    const length = lengthFor(rng, unit.length)
    const base = baseFigure(rng)
    const figures = combine(length, base, { [attribute]: repeatValues(unit, pickDistinct(rng, values, lettersIn(unit)), length) })
    return { figures, rules: [{ type: 'repeat', attributes: [attribute], period: unit.length }] }
  },
  turn(rng, { turns }) {
    const size = pick(rng, turns)
    const step = rng() < 2 / 3 ? size : -size
    const length = randomInt(rng, 5, 6)
    const figures = combine(length, { shape: 'arrow', color: pick(rng, COLORS) }, { turn: turnValues(rng, step, length) })
    return { figures, rules: [{ type: 'turn', step }] }
  },
  count(rng) {
    const length = randomInt(rng, 5, 6)
    const counts = countValues(rng, length)
    const figures = combine(length, baseFigure(rng), { count: counts })
    return { figures, rules: [{ type: 'count', step: counts[1] - counts[0] }] }
  },
  two(rng, { turns }) {
    const which = pick(rng, ['shapeColor', 'turnColor', 'countRepeat'])
    if (which === 'shapeColor') {
      // Periods 2 and 3, either way round: each shows twice in 6 or 7 tiles.
      const [shapeUnit, colorUnit] = rng() < 0.5 ? ['AB', 'ABC'] : ['ABC', 'AB']
      const length = randomInt(rng, 6, 7)
      const figures = combine(
        length,
        {},
        {
          shape: repeatValues(shapeUnit, pickDistinct(rng, SHAPES, lettersIn(shapeUnit)), length),
          color: repeatValues(colorUnit, pickDistinct(rng, COLORS, lettersIn(colorUnit)), length),
        },
      )
      return {
        figures,
        rules: [
          { type: 'repeat', attributes: ['shape'], period: shapeUnit.length },
          { type: 'repeat', attributes: ['color'], period: colorUnit.length },
        ],
      }
    }
    if (which === 'turnColor') {
      const colorUnit = pick(rng, ['AB', 'ABC'])
      const size = pick(rng, turns)
      const step = rng() < 2 / 3 ? size : -size
      const length = randomInt(rng, 6, 7)
      const figures = combine(
        length,
        { shape: 'arrow' },
        {
          turn: turnValues(rng, step, length),
          color: repeatValues(colorUnit, pickDistinct(rng, COLORS, lettersIn(colorUnit)), length),
        },
      )
      return {
        figures,
        rules: [
          { type: 'turn', step },
          { type: 'repeat', attributes: ['color'], period: colorUnit.length },
        ],
      }
    }
    // Counting while shapes or colors take turns: 1 to 6 in five or six tiles.
    const attribute = pick(rng, ['shape', 'color'])
    const length = randomInt(rng, 5, 6)
    const counts = countValues(rng, length)
    const base = baseFigure(rng)
    const figures = combine(length, base, {
      count: counts,
      [attribute]: repeatValues('AB', pickDistinct(rng, REPEATABLE[attribute], 2), length),
    })
    return {
      figures,
      rules: [
        { type: 'count', step: counts[1] - counts[0] },
        { type: 'repeat', attributes: [attribute], period: 2 },
      ],
    }
  },
}

export const SHAPE_KINDS = Object.keys(KINDS)

/** Whether a row of values repeats a unit that shows at least twice (a constant repeats a unit of one). */
function repeats(values) {
  for (let period = 1; period * 2 <= values.length; period += 1) {
    if (values.every((value, index) => index < period || value === values[index - period])) {
      return true
    }
  }
  return false
}

/** Whether a row of values changes by the same (non-zero) step each time, `modulo` for turns. */
function steps(values, modulo) {
  const changes = values.slice(1).map((value, index) => {
    const difference = value - values[index]
    return modulo ? ((difference % modulo) + modulo) % modulo : difference
  })
  return changes[0] !== 0 && changes.every((change) => change === changes[0])
}

/**
 * Whether every attribute of a row of figures follows a pattern: it
 * repeats (or stays the same), a count goes up or down in steps, or a
 * turn turns by the same step.
 */
export function followsAPattern(figures) {
  const column = (attribute) => figures.map((figure) => figure[attribute])
  return (
    repeats(column('shape')) &&
    repeats(column('color')) &&
    repeats(column('size')) &&
    repeats(column('fill')) &&
    (repeats(column('count')) || steps(column('count'))) &&
    (repeats(column('turn')) || steps(column('turn'), 360))
  )
}

/** Where the gap goes: last, or anywhere, still last half the time. */
function pickGap(rng, length, gap) {
  if (gap === 'last' || rng() < 0.5) {
    return length - 1
  }
  return randomInt(rng, 0, length - 2)
}

/** Other values for an attribute, as a wrong choice would have them. */
function otherValues(attribute, figure, figures) {
  if (attribute === 'turn') {
    // The other ways an arrow points, quarter turns first.
    return [90, 180, 270, 45, 135, 225, 315].map((offset) => (figure.turn + offset) % 360)
  }
  if (attribute === 'count') {
    return [-1, 1, -2, 2, 3].map((offset) => figure.count + offset).filter((count) => count >= 1 && count <= MAX_COUNT)
  }
  // Values from the row first (the likely mistakes), then new ones.
  const inRow = [...new Set(figures.map((item) => item[attribute]))]
  const all = REPEATABLE[attribute]
  return [...inRow, ...all.filter((value) => !inRow.includes(value))].filter((value) => value !== figure[attribute])
}

/**
 * Three wrong figures. Mostly the answer with one attribute changed,
 * the varying ones first (another figure from the row, the arrow turned
 * too far), then one that is right where the pattern changes but wrong
 * where it stays (the right shape in another color). On the easiest
 * level (`fresh`), the others from the row and figures not in the row
 * at all, so they can be told apart by looking.
 */
function wrongChoices(rng, figures, gap, rules, { fresh = false } = {}) {
  const answer = figures[gap]
  const varying = rules.flatMap((rule) => (rule.type === 'repeat' ? rule.attributes : [rule.type]))
  // An arrow stays an arrow: other shapes would look odd turned.
  const steady = ['shape', 'color'].filter(
    (attribute) => !varying.includes(attribute) && !(attribute === 'shape' && answer.shape === 'arrow'),
  )
  const candidates = []
  if (fresh) {
    // The other figures in the row, then new shapes in new colors.
    candidates.push(...figures.filter((figure) => figureKey(figure) !== figureKey(answer)))
    const shapes = shuffle(SHAPES.filter((shape) => figures.every((figure) => figure.shape !== shape)), rng)
    const colors = shuffle(COLORS.filter((color) => figures.every((figure) => figure.color !== color)), rng)
    shapes.forEach((shape, index) => candidates.push(makeFigure({ ...answer, shape, color: colors[index % colors.length] })))
  } else {
    const changed = (attribute, values) => values.map((value) => makeFigure({ ...answer, [attribute]: value }))
    const byVarying = shuffle(varying, rng).map((attribute) => changed(attribute, otherValues(attribute, answer, figures)))
    // One from each varying attribute first, so every rule gets tested.
    for (let round = 0; round < 6; round += 1) {
      for (const options of byVarying) {
        if (options[round]) {
          candidates.push(options[round])
        }
      }
      if (round === 0) {
        for (const attribute of shuffle(steady, rng)) {
          candidates.push(...shuffle(changed(attribute, otherValues(attribute, answer, figures)), rng).slice(0, 1))
        }
      }
    }
  }
  const chosen = []
  const keys = new Set([figureKey(answer)])
  for (const candidate of candidates) {
    const key = figureKey(candidate)
    const filled = figures.map((figure, index) => (index === gap ? candidate : figure))
    if (chosen.length < 3 && !keys.has(key) && !followsAPattern(filled)) {
      keys.add(key)
      chosen.push(candidate)
    }
  }
  return chosen
}

/**
 * @param {{ kinds: string[], gap: 'last'|'any', units?: string[], turns?: number[], fresh?: boolean }} shapes
 * @param {() => number} rng
 * @returns {import('./questions.js').Question}
 */
export function createShapeSeriesQuestion(shapes, rng) {
  const options = { units: shapes.units ?? ['AB'], turns: shapes.turns ?? [90] }
  for (;;) {
    const kind = pick(rng, shapes.kinds)
    const { figures, rules } = KINDS[kind](rng, options)
    if (!followsAPattern(figures)) {
      continue
    }
    const gap = pickGap(rng, figures.length, shapes.gap)
    const wrong = wrongChoices(rng, figures, gap, rules, { fresh: shapes.fresh })
    if (wrong.length < 3) {
      continue
    }
    const keys = figures.map(figureKey)
    return {
      op: 'shapes',
      terms: keys,
      unknown: gap,
      answer: keys[gap],
      kind,
      rules,
      key: keys.map((key, index) => (index === gap ? '?' : key)).join(','),
      choices: shuffle([keys[gap], ...wrong.map(figureKey)], rng),
    }
  }
}
