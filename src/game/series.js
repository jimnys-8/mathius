// Number series: a row of numbers that follow a rule, with one of them
// missing. The kinds of rule, from easy to hard:
//
//   same       the same number each time (+0): 4 4 4 4 ?
//   one        +1 or −1 each time: 3 4 5 6 ?
//   skip       counting by 2, 5 or 10: 20 30 40 ?
//   any        any step from 2 to 9: 7 10 13 16 ?
//   alternate  two steps taking turns, +2 −1: 1 3 2 4 3 ?
//   growing    each step one more than the last: 1 2 4 7 11 ?
//   double     ×2: 1 2 4 8 ?      triple  ×3: 1 3 9 27 ?
//   half       ÷2: 80 40 20 10 ?  square  1 4 9 16 ?
//
// A question is only asked if exactly one number fits the gap under all
// of these rules, so a series never has a second right answer.

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

const MINUS = '−'

/**
 * How the dots level draws its dots, [per row, rows]: a 3×3 grid, on the
 * tiles and on the answer buttons alike, so a child can match them by
 * looking. Nine dots at most.
 */
export const SERIES_DOT_GRID = [3, 3]

/** A step as the hint writes it: "+2", "−1". */
function stepLabel(step) {
  return step < 0 ? `${MINUS}${-step}` : `+${step}`
}

function differences(values) {
  return values.slice(1).map((value, index) => value - values[index])
}

/** A series with a constant step, `length` long, within [min, max]. */
function stepSeries(rng, step, length, { min, max }, aligned = false) {
  const span = Math.abs(step) * (length - 1)
  let low = min
  let high = max - span
  if (high < low) {
    return null
  }
  // Counting by 5 or 10 starts on a multiple: 15 20 25, not 13 18 23.
  let start
  if (aligned) {
    low = Math.ceil(low / Math.abs(step))
    high = Math.floor(high / Math.abs(step))
    start = randomInt(rng, low, high) * Math.abs(step)
  } else {
    start = randomInt(rng, low, high)
  }
  if (step < 0) {
    start += span
  }
  return Array.from({ length }, (_, index) => start + index * step)
}

/** Up twice as often as down: counting up comes first for children. */
const upOrDown = (rng, size) => (rng() < 2 / 3 ? size : -size)

/**
 * Each kind makes a full series (or null to try again), with what the
 * hint writes between the numbers or under them.
 */
const KINDS = {
  same(rng, range) {
    return { values: stepSeries(rng, 0, 5, range) }
  },
  one(rng, range) {
    const values = stepSeries(rng, upOrDown(rng, 1), 5, range)
    return values && { values }
  },
  skip(rng, range) {
    const size = pick(rng, [2, 5, 10])
    const values = stepSeries(rng, upOrDown(rng, size), 5, range, size !== 2)
    return values && { values }
  },
  any(rng, range) {
    const values = stepSeries(rng, upOrDown(rng, randomInt(rng, 2, 9)), 5, range)
    return values && { values }
  },
  alternate(rng, { max }) {
    // One step up and one down, of different sizes, in either order.
    const up = randomInt(rng, 1, 5)
    let down = randomInt(rng, 1, 4)
    if (down >= up) {
      down += 1
    }
    const steps = rng() < 0.5 ? [up, -down] : [-down, up]
    const length = 6
    const offsets = [0]
    for (let index = 1; index < length; index += 1) {
      offsets.push(offsets[index - 1] + steps[(index - 1) % 2])
    }
    const low = -Math.min(...offsets)
    const high = Math.min(max, 50) - Math.max(...offsets)
    if (high < low) {
      return null
    }
    const start = randomInt(rng, low, high)
    return { values: offsets.map((offset) => start + offset), alternate: true }
  },
  growing(rng) {
    const start = randomInt(rng, 0, 10)
    const first = randomInt(rng, 1, 3)
    const values = [start]
    for (let index = 0; index < 5; index += 1) {
      values.push(values[index] + first + index)
    }
    return { values }
  },
  double(rng) {
    const start = randomInt(rng, 1, 6)
    return { values: [1, 2, 4, 8, 16].map((factor) => start * factor), arcs: Array(4).fill('×2') }
  },
  triple(rng) {
    const start = randomInt(rng, 1, 2)
    return { values: [1, 3, 9, 27, 81].map((factor) => start * factor), arcs: Array(4).fill('×3') }
  },
  half(rng) {
    const end = randomInt(rng, 1, 6)
    return { values: [16, 8, 4, 2, 1].map((factor) => end * factor), arcs: Array(4).fill('÷2') }
  },
  square(rng) {
    const root = randomInt(rng, 1, 6)
    const roots = Array.from({ length: 5 }, (_, index) => root + index)
    return { values: roots.map((n) => n * n), notes: roots.map((n) => `${n}×${n}`) }
  },
}

export const SERIES_KINDS = Object.keys(KINDS)

/** Whether a full series follows one of the rules above. */
export function followsARule(values) {
  const steps = differences(values)
  if (steps.every((step) => step === steps[0])) {
    return true
  }
  if (
    steps.length >= 4 &&
    Math.abs(steps[0]) !== Math.abs(steps[1]) &&
    steps.every((step, index) => step === steps[index % 2])
  ) {
    return true
  }
  if (differences(steps).every((change) => change === 1)) {
    return true
  }
  for (const [times, per] of [
    [2, 1],
    [3, 1],
    [1, 2],
  ]) {
    if (values[0] > 0 && values.every((value, index) => index === 0 || value * per === values[index - 1] * times)) {
      return true
    }
  }
  const root = Math.sqrt(values[0])
  return Number.isInteger(root) && values.every((value, index) => value === (root + index) ** 2)
}

/** Every whole number from 0 up that makes the series follow a rule with `value` in the gap. */
export function fittingAnswers(values, gap) {
  const limit = 3 * Math.max(...values) + 20
  const fitting = []
  for (let value = 0; value <= limit; value += 1) {
    const filled = values.map((known, index) => (index === gap ? value : known))
    if (followsARule(filled)) {
      fitting.push(value)
    }
  }
  return fitting
}

/** Where the gap goes: last, or (from Svår) anywhere, still last half the time. */
function pickGap(rng, length, gap) {
  if (gap === 'last' || rng() < 0.5) {
    return length - 1
  }
  return randomInt(rng, 0, length - 2)
}

/**
 * Wrong answers that come from likely mistakes: the number next to the
 * gap repeated, one step too many, treating the series as a plain step
 * (1 2 4 8 → 12), and numbers one or two off.
 */
function wrongChoices(rng, values, gap, { min, max }) {
  const answer = values[gap]
  const before = gap > 0 ? values[gap - 1] : null
  const after = gap < values.length - 1 ? values[gap + 1] : null
  const mistakes = []
  if (before !== null) {
    mistakes.push(before)
    if (gap > 1) {
      mistakes.push(before + (before - values[gap - 2]))
    }
  }
  if (after !== null) {
    mistakes.push(after)
    if (gap < values.length - 2) {
      mistakes.push(after - (values[gap + 2] - after))
    }
  }
  const step = before !== null ? answer - before : after - answer
  mistakes.push(answer + step)
  const near = [answer - 1, answer + 1, answer - 2, answer + 2]

  const ok = (value) => value !== answer && value >= min && value <= max
  const chosen = []
  const take = (candidates, count) => {
    for (const value of shuffle(candidates, rng)) {
      if (chosen.length >= count) {
        return
      }
      if (ok(value) && !chosen.includes(value)) {
        chosen.push(value)
      }
    }
  }
  take(mistakes, 2)
  take(near, 3)
  // Tight ranges (dots up to 10) may still be short: fill from the range.
  take(
    Array.from({ length: 7 }, (_, index) => answer - 3 + index),
    3,
  )
  return chosen
}

/**
 * @param {{ kinds: string[], gap: 'last'|'any', min?: number, max?: number, show?: 'dots'|'numbers', input?: 'keypad' }} series
 * @param {() => number} rng
 * @returns {import('./questions.js').Question}
 */
export function createSeriesQuestion(series, rng) {
  const range = { min: series.min ?? 0, max: series.max ?? 100 }
  for (;;) {
    const kind = pick(rng, series.kinds)
    const made = KINDS[kind](rng, range)
    if (!made) {
      continue
    }
    const { values } = made
    const gap = pickGap(rng, values.length, series.gap)
    const fitting = fittingAnswers(values, gap)
    if (fitting.length !== 1 || fitting[0] !== values[gap]) {
      continue
    }
    const answer = values[gap]
    const question = {
      op: 'series',
      terms: values,
      unknown: gap,
      answer,
      kind,
      // What 💡 writes between the numbers (or under them, for squares).
      arcs: made.notes ? null : (made.arcs ?? differences(values).map(stepLabel)),
      notes: made.notes ?? null,
      alternate: Boolean(made.alternate),
      show: series.show ?? 'numbers',
      key: values.map((value, index) => (index === gap ? '?' : value)).join(','),
    }
    if (series.input !== 'keypad') {
      // No 0 among the choices unless the series has one: 4 2 ? is not 0.
      const min = series.min ?? (Math.min(...values) > 0 ? 1 : 0)
      const choiceRange = { min, max: series.show === 'dots' ? range.max : Infinity }
      const wrong = wrongChoices(rng, values, gap, choiceRange)
      if (wrong.length < 3) {
        continue
      }
      question.choices = [answer, ...wrong].sort((a, b) => a - b)
    }
    if (series.show === 'dots') {
      question.choicesAs = 'dots'
    }
    return question
  }
}
