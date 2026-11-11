import {
  DOT_RADIUS,
  GROUP_GAP,
  arrayPosition,
  gridPosition,
  offset,
  rowsCenter,
  rowsFor,
  span,
  stagger,
} from './layout.js'

/**
 * A scene describes how a question is visualized as a sequence of frames:
 *
 *   frames[0]  the question as asked
 *   frames[1]  the hint: rearranged so the answer can be found by counting
 *   frames[2]  the solution: the hint plus the answer
 *
 * Each frame lists elements with stable ids. When the visualization moves
 * from one frame to the next, elements with the same id animate between
 * their states, new elements fade in and missing ones fade out.
 *
 * Tones link dots to the numbers in the equation: 'a' is the first term,
 * 'b' the second and 'c' the result.
 */

const TONE_OF_TERM = ['a', 'b', 'c']
const MOVE_SECONDS = 0.6
const ANSWER_SIZE = 1.5
const SMALL_SIZE = 0.65
const LABEL_SIZE = 0.9

function emptyFrame() {
  return { dots: [], slots: [], boxes: [], brackets: [], labels: [] }
}

function cloneFrame(frame) {
  return {
    dots: [...frame.dots],
    slots: [...frame.slots],
    boxes: [...frame.boxes],
    brackets: [...frame.brackets],
    labels: [...frame.labels],
  }
}

function dot(id, position, tone, extra = {}) {
  return { id, x: position.x, y: position.y, tone, variant: 'solid', delay: 0, ...extra }
}

/** Faint placeholders for the rest of the last row, so groups of ten are visible. */
function fillSlots(frame, count, { x = 0, y = 0, perRow = 10 } = {}) {
  const total = rowsFor(count, perRow) * perRow
  for (let index = count; index < total; index += 1) {
    const position = gridPosition(index, { x, y, perRow })
    // Position-based ids keep a slot in place between frames.
    frame.slots.push({ id: `slot-${position.x.toFixed(2)}-${position.y.toFixed(2)}`, ...position })
  }
}

function answerLabel(text, x, y, tone, anchor = 'start') {
  return { id: 'answer', text: String(text), x, y, tone, size: ANSWER_SIZE, anchor, bold: true }
}

/** x coordinate just right of a row of ten dots. */
const RIGHT_OF_ROW = span(10) + DOT_RADIUS + 0.8

// ---------------------------------------------------------------------------
// Addition: a + b = c

function additionScene([a, b, c], unknown) {
  const question = emptyFrame()
  const hint = emptyFrame()

  if (unknown === 2) {
    // Two separate groups that merge into one, filling up tens first.
    const yB = rowsFor(a) + GROUP_GAP
    for (let i = 0; i < a; i += 1) {
      const d = dot(`a-${i}`, gridPosition(i), 'a')
      question.dots.push(d)
      hint.dots.push(d)
    }
    for (let j = 0; j < b; j += 1) {
      question.dots.push(dot(`b-${j}`, gridPosition(j, { y: yB }), 'b'))
      hint.dots.push(dot(`b-${j}`, gridPosition(a + j), 'b', { delay: stagger(j, b) }))
    }
    fillSlots(question, a)
    fillSlots(question, b, { y: yB })
    fillSlots(hint, c)
    const solution = cloneFrame(hint)
    solution.labels.push(answerLabel(c, RIGHT_OF_ROW, rowsCenter(0, c), 'c'))
    return [question, hint, solution]
  }

  // One known part, and ghost dots for the missing part that fill in.
  for (let i = 0; i < c; i += 1) {
    const tone = i < a ? 'a' : 'b'
    const missing = unknown === 0 ? i < a : i >= a
    const missingIndex = unknown === 0 ? i : i - a
    const missingCount = unknown === 0 ? a : b
    const position = gridPosition(i)
    question.dots.push(dot(`d-${i}`, position, tone, { variant: missing ? 'ghost' : 'solid' }))
    hint.dots.push(
      dot(`d-${i}`, position, tone, {
        delay: missing ? stagger(missingIndex, missingCount) : 0,
      }),
    )
  }
  fillSlots(question, c)
  fillSlots(hint, c)
  const [from, to] = unknown === 0 ? [0, a] : [a, c]
  const solution = cloneFrame(hint)
  solution.labels.push(answerLabel(unknown === 0 ? a : b, RIGHT_OF_ROW, rowsCenter(from, to), TONE_OF_TERM[unknown]))
  return [question, hint, solution]
}

// ---------------------------------------------------------------------------
// Subtraction: m − s = d (the dots that stay are the first d dots)

function subtractionScene([m, s, d], unknown, { guided }) {
  const yTaken = rowsFor(m) + GROUP_GAP
  const whole = (i) => gridPosition(i)
  const split = (i) => (i < d ? gridPosition(i) : gridPosition(i - d, { y: yTaken }))

  const question = emptyFrame()
  const hint = emptyFrame()

  if (unknown === 0) {
    // What's left and what was taken are known; put them back together.
    for (let i = 0; i < m; i += 1) {
      const taken = i >= d
      question.dots.push(dot(`d-${i}`, split(i), taken ? 'b' : 'c', { variant: taken ? 'faded' : 'solid' }))
      hint.dots.push(dot(`d-${i}`, whole(i), 'a', { delay: taken ? stagger(i - d, s) : 0 }))
    }
    fillSlots(question, d)
    fillSlots(hint, m)
    const solution = cloneFrame(hint)
    solution.labels.push(answerLabel(m, RIGHT_OF_ROW, rowsCenter(0, m), 'a'))
    return [question, hint, solution]
  }

  // Take dots away from the end, starting with the last one. Guided, the
  // dots to take away are orange from the start.
  const moveEnd = stagger(s - 1, s) + MOVE_SECONDS
  const marked = guided && unknown === 2
  for (let i = 0; i < m; i += 1) {
    const taken = i >= d
    question.dots.push(dot(`d-${i}`, whole(i), marked && taken ? 'b' : 'a'))
    hint.dots.push(
      dot(`d-${i}`, split(i), taken ? 'b' : 'c', {
        variant: taken && unknown === 2 ? 'faded' : 'solid',
        delay: taken ? stagger(m - 1 - i, s) : moveEnd,
      }),
    )
  }
  fillSlots(question, m)
  fillSlots(hint, d)

  const solution = cloneFrame(hint)
  if (unknown === 2) {
    solution.labels.push(answerLabel(d, RIGHT_OF_ROW, rowsCenter(0, d), 'c'))
  } else {
    solution.labels.push(answerLabel(s, RIGHT_OF_ROW, rowsCenter(0, s, { y: yTaken }), 'b'))
  }
  return [question, hint, solution]
}

// ---------------------------------------------------------------------------
// Multiplication: a × b = c, drawn as a rows of b dots

/** Wide piles keep big division scenes from getting too tall. */
function pilePerRow(count) {
  return count > 100 ? 20 : 10
}

function rowBracket(rows, tone, withLabel) {
  const x = -DOT_RADIUS - 0.5
  const bracket = { id: 'rows', x1: x, y1: -DOT_RADIUS, x2: x, y2: span(rows) + DOT_RADIUS, tone }
  const label = withLabel
    ? { id: 'rows-label', text: String(rows), x: x - 0.45, y: span(rows) / 2, tone, size: LABEL_SIZE, anchor: 'end', bold: true }
    : null
  return { bracket, label }
}

function columnBracket(cols, tone, withLabel) {
  const y = -DOT_RADIUS - 0.5
  const bracket = { id: 'cols', x1: -DOT_RADIUS, y1: y, x2: span(cols) + DOT_RADIUS, y2: y, tone }
  const label = withLabel
    ? { id: 'cols-label', text: String(cols), x: span(cols) / 2, y: y - 0.7, tone, size: LABEL_SIZE, anchor: 'middle', bold: true }
    : null
  return { bracket, label }
}

function addBracket(frame, { bracket, label }) {
  frame.brackets.push(bracket)
  if (label) {
    frame.labels.push(label)
  }
}

/** Outlines an array row by row, with the running total after each row (skip counting). */
function addRowCounts(frame, rows, cols, tone) {
  const rowDelay = Math.min(0.45, 3 / rows)
  for (let row = 0; row < rows; row += 1) {
    const y = offset(row)
    frame.boxes.push({
      id: `row-${row}`,
      x: -DOT_RADIUS - 0.12,
      y: y - DOT_RADIUS - 0.12,
      width: span(cols) + 2 * DOT_RADIUS + 0.24,
      height: 2 * DOT_RADIUS + 0.24,
      tone,
      delay: row * rowDelay,
    })
    frame.labels.push({
      id: `count-${row}`,
      text: String((row + 1) * cols),
      x: span(cols) + DOT_RADIUS + 0.5,
      y,
      tone: 'muted',
      size: SMALL_SIZE,
      anchor: 'start',
      delay: row * rowDelay,
    })
  }
}

/** Numbers 1, 2, 3, … over the columns of an array, counting its side. */
function addColumnCounts(frame, cols) {
  for (let col = 0; col < cols; col += 1) {
    frame.labels.push({
      id: `col-${col}`,
      text: String(col + 1),
      x: offset(col),
      y: -DOT_RADIUS - 0.6,
      tone: 'muted',
      size: SMALL_SIZE,
      anchor: 'middle',
      delay: stagger(col, cols, { total: 1.2, max: 0.2 }),
    })
  }
}

function multiplicationScene([a, b, c], unknown) {
  const question = emptyFrame()
  const hint = emptyFrame()

  if (unknown === 2) {
    // The array is given; the hint counts it row by row (skip counting).
    for (let row = 0; row < a; row += 1) {
      for (let col = 0; col < b; col += 1) {
        const d = dot(`d-${row}-${col}`, arrayPosition(row, col), 'c')
        question.dots.push(d)
        hint.dots.push(d)
      }
    }
    for (const frame of [question, hint]) {
      addBracket(frame, rowBracket(a, 'a', true))
      addBracket(frame, columnBracket(b, 'b', true))
    }
    addRowCounts(hint, a, b, 'c')
    const solution = cloneFrame(hint)
    solution.labels.push(answerLabel(c, span(b) / 2, span(a) + DOT_RADIUS + 1.2, 'c', 'middle'))
    return [question, hint, solution]
  }

  // The product is given as a pile; arrange it into rows or columns.
  for (let i = 0; i < c; i += 1) {
    // Missing columns: deal one dot to each row in turn.
    // Missing rows: fill one row at a time.
    const [row, col] = unknown === 1 ? [i % a, Math.floor(i / a)] : [Math.floor(i / b), i % b]
    question.dots.push(dot(`d-${i}`, gridPosition(i), 'c'))
    hint.dots.push(dot(`d-${i}`, arrayPosition(row, col), 'c', { delay: stagger(i, c, { total: 2.2 }) }))
  }

  const solution = cloneFrame(hint)
  if (unknown === 1) {
    for (const frame of [question, hint]) {
      addBracket(frame, rowBracket(a, 'a', true))
    }
    addBracket(solution, rowBracket(a, 'a', true))
    addBracket(solution, columnBracket(b, 'b', true))
    solution.labels.find((label) => label.id === 'cols-label').size = ANSWER_SIZE
  } else {
    for (const frame of [question, hint]) {
      addBracket(frame, columnBracket(b, 'b', true))
    }
    addBracket(solution, columnBracket(b, 'b', true))
    addBracket(solution, rowBracket(a, 'a', true))
    solution.labels.find((label) => label.id === 'rows-label').size = ANSWER_SIZE
  }
  return [question, hint, solution]
}

// ---------------------------------------------------------------------------
// Division: n ÷ g = q, drawn as sharing n dots into g boxes

const BOX_PITCH = 1.7

function divisionScene([n, g, q], unknown) {
  const perRow = pilePerRow(n)
  const pileWidth = span(Math.min(n, perRow))
  const boxesWidth = (g - 1) * BOX_PITCH
  // Center the pile and the row of boxes on the same vertical axis.
  const pileX = -pileWidth / 2
  const boxesX = -boxesWidth / 2
  const boxTop = rowsFor(n, perRow) + GROUP_GAP + 0.3
  const pile = (i) => gridPosition(i, { x: pileX, y: 0, perRow })
  const inBox = (box, row) => ({ x: boxesX + box * BOX_PITCH, y: boxTop + offset(row) })
  const boxRect = (box, tone, delay = 0) => ({
    id: `box-${box}`,
    x: boxesX + box * BOX_PITCH - DOT_RADIUS - 0.22,
    y: boxTop - DOT_RADIUS - 0.22,
    width: 2 * DOT_RADIUS + 0.44,
    height: span(q) + 2 * DOT_RADIUS + 0.44,
    tone,
    delay,
  })
  const underBox = (box, text, tone, size = SMALL_SIZE) => ({
    id: `under-${box}`,
    text: String(text),
    x: boxesX + box * BOX_PITCH,
    y: boxTop + span(q) + DOT_RADIUS + 0.75,
    tone,
    size,
    anchor: 'middle',
    bold: true,
  })

  const question = emptyFrame()
  const hint = emptyFrame()
  const solution = []

  if (unknown === 2) {
    // Share: deal one dot to each box in turn.
    for (let i = 0; i < n; i += 1) {
      question.dots.push(dot(`d-${i}`, pile(i), 'a'))
      hint.dots.push(dot(`d-${i}`, inBox(i % g, Math.floor(i / g)), 'a', { delay: stagger(i, n, { total: 2.4 }) }))
    }
    for (let box = 0; box < g; box += 1) {
      question.boxes.push(boxRect(box, 'b'))
      hint.boxes.push(boxRect(box, 'b'))
    }
    const done = cloneFrame(hint)
    for (let box = 0; box < g; box += 1) {
      done.labels.push(underBox(box, q, 'c', LABEL_SIZE))
    }
    solution.push(done)
  } else if (unknown === 1) {
    // Group: fill one box at a time, then count the boxes.
    for (let i = 0; i < n; i += 1) {
      const box = Math.floor(i / q)
      question.dots.push(dot(`d-${i}`, pile(i), 'a'))
      hint.dots.push(dot(`d-${i}`, inBox(box, i % q), 'a', { delay: stagger(i, n, { total: 2.4 }) }))
    }
    for (let box = 0; box < g; box += 1) {
      hint.boxes.push(boxRect(box, 'b', stagger(box * q, n, { total: 2.4 })))
    }
    const done = cloneFrame(hint)
    for (let box = 0; box < g; box += 1) {
      done.labels.push(underBox(box, box + 1, 'b', box === g - 1 ? LABEL_SIZE : SMALL_SIZE))
    }
    solution.push(done)
  } else {
    // Boxes are full; pour them together and count the whole.
    for (let i = 0; i < n; i += 1) {
      question.dots.push(dot(`d-${i}`, inBox(i % g, Math.floor(i / g)), 'a'))
      hint.dots.push(dot(`d-${i}`, pile(i), 'a', { delay: stagger(i, n, { total: 2.4 }) }))
    }
    for (let box = 0; box < g; box += 1) {
      question.boxes.push(boxRect(box, 'b'))
      question.labels.push(underBox(box, q, 'c'))
    }
    fillSlots(hint, n, { x: pileX, perRow })
    const done = cloneFrame(hint)
    done.labels.push(answerLabel(n, pileX + span(perRow) + DOT_RADIUS + 0.8, rowsCenter(0, n, { perRow }), 'a'))
    solution.push(done)
  }

  return [question, hint, ...solution]
}

// ---------------------------------------------------------------------------
// Square roots: √n = r, drawn as n dots making a square with sides r

function squareOf(i, side) {
  return arrayPosition(Math.floor(i / side), i % side)
}

function sqrtScene([n, r], unknown, { choices, guided }) {
  if (choices) {
    return sqrtEstimateScene(n, r, guided)
  }

  const question = emptyFrame()
  const hint = emptyFrame()

  if (unknown === 1) {
    // Arrange the pile into a square and measure its side. Guided, the
    // square is already laid out and the hint counts along its side.
    for (let i = 0; i < n; i += 1) {
      const inSquare = dot(`d-${i}`, squareOf(i, r), 'a', { delay: guided ? 0 : stagger(i, n, { total: 2 }) })
      question.dots.push(guided ? { ...inSquare } : dot(`d-${i}`, gridPosition(i), 'a'))
      hint.dots.push(inSquare)
    }
    if (guided) {
      addColumnCounts(hint, r)
    }
    const solution = emptyFrame()
    solution.dots = [...hint.dots]
    addBracket(solution, columnBracket(r, 'c', true))
    addBracket(solution, rowBracket(r, 'c', true))
    solution.labels.find((label) => label.id === 'cols-label').size = ANSWER_SIZE
    return [question, hint, solution]
  }

  // The side is known; fill the square and count it. Guided, the square
  // is already filled and the hint counts it row by row.
  for (let i = 0; i < n; i += 1) {
    const firstRow = i < r
    question.dots.push(dot(`d-${i}`, squareOf(i, r), 'a', { variant: firstRow || guided ? 'solid' : 'ghost' }))
    hint.dots.push(
      dot(`d-${i}`, squareOf(i, r), 'a', { delay: firstRow || guided ? 0 : stagger(i - r, n - r, { total: 2 }) }),
    )
  }
  for (const frame of [question, hint]) {
    addBracket(frame, columnBracket(r, 'c', true))
    addBracket(frame, rowBracket(r, 'c', true))
  }
  if (guided) {
    addRowCounts(hint, r, r, 'a')
  }
  const solution = cloneFrame(hint)
  solution.labels.push(answerLabel(n, span(r) / 2, span(r) + DOT_RADIUS + 1.2, 'a', 'middle'))
  return [question, hint, solution]
}

/**
 * √n for a non-square n: the biggest square that fits (k × k), with the
 * leftover dots starting the border of the next square, (k + 1) × (k + 1).
 * How far round the border they get shows the decimals. Guided, the
 * squares are laid out from the start and the hint measures the side.
 */
function sqrtEstimateScene(n, answer, guided) {
  const k = Math.floor(Math.sqrt(n))
  const extra = n - k * k
  // Border of the next square: down the right side, then along the bottom.
  const border = []
  for (let row = 0; row < k; row += 1) {
    border.push(arrayPosition(row, k))
  }
  for (let col = 0; col <= k; col += 1) {
    border.push(arrayPosition(k, col))
  }

  const question = emptyFrame()
  const hint = emptyFrame()
  for (let i = 0; i < n; i += 1) {
    const inSquare = i < k * k
    const laidOut = dot(`d-${i}`, inSquare ? squareOf(i, k) : border[i - k * k], inSquare ? 'a' : 'b', {
      delay: guided ? 0 : stagger(i, n, { total: 2 }),
    })
    question.dots.push(guided ? { ...laidOut } : dot(`d-${i}`, gridPosition(i), 'a'))
    hint.dots.push(laidOut)
  }
  for (let j = extra; j < border.length; j += 1) {
    const slot = { id: `border-${j}`, ...border[j] }
    hint.slots.push(slot)
    if (guided) {
      question.slots.push(slot)
    }
  }
  addBracket(hint, columnBracket(k, 'muted', true))

  const solution = cloneFrame(hint)
  solution.labels.push(answerLabel(`≈ ${answer}`, span(k + 1) / 2, span(k + 1) + DOT_RADIUS + 1.2, 'c', 'middle'))
  return [question, hint, solution]
}

// ---------------------------------------------------------------------------

const BUILDERS = {
  add: additionScene,
  sub: subtractionScene,
  mul: multiplicationScene,
  div: divisionScene,
  sqrt: sqrtScene,
}

function labelBounds(label) {
  const width = label.text.length * label.size * 0.62
  const height = label.size
  const left = label.anchor === 'end' ? label.x - width : label.anchor === 'middle' ? label.x - width / 2 : label.x
  return { minX: left, maxX: left + width, minY: label.y - height / 2, maxY: label.y + height / 2 }
}

function sceneBounds(frames) {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  const include = (minX, minY, maxX, maxY) => {
    bounds.minX = Math.min(bounds.minX, minX)
    bounds.minY = Math.min(bounds.minY, minY)
    bounds.maxX = Math.max(bounds.maxX, maxX)
    bounds.maxY = Math.max(bounds.maxY, maxY)
  }
  for (const frame of frames) {
    for (const item of [...frame.dots, ...frame.slots]) {
      include(item.x - DOT_RADIUS, item.y - DOT_RADIUS, item.x + DOT_RADIUS, item.y + DOT_RADIUS)
    }
    for (const box of frame.boxes) {
      include(box.x, box.y, box.x + box.width, box.y + box.height)
    }
    for (const bracket of frame.brackets) {
      include(
        Math.min(bracket.x1, bracket.x2) - 0.2,
        Math.min(bracket.y1, bracket.y2) - 0.2,
        Math.max(bracket.x1, bracket.x2) + 0.2,
        Math.max(bracket.y1, bracket.y2) + 0.2,
      )
    }
    for (const label of frame.labels) {
      const { minX, minY, maxX, maxY } = labelBounds(label)
      include(minX, minY, maxX, maxY)
    }
  }
  if (!Number.isFinite(bounds.minX)) {
    return { x: 0, y: 0, width: 1, height: 1 }
  }
  const pad = 0.5
  return {
    x: bounds.minX - pad,
    y: bounds.minY - pad,
    width: bounds.maxX - bounds.minX + 2 * pad,
    height: bounds.maxY - bounds.minY + 2 * pad,
  }
}

/** How long (ms) a frame takes to settle after it starts. */
function frameDuration(frame) {
  let latest = 0
  for (const kind of ['dots', 'boxes', 'labels', 'brackets']) {
    for (const item of frame[kind]) {
      latest = Math.max(latest, item.delay ?? 0)
    }
  }
  return Math.round((latest + MOVE_SECONDS) * 1000)
}

/**
 * Builds the scene for a question.
 *
 * @returns {{ frames: Object[], durations: number[], viewBox: {x, y, width, height} }}
 */
export function buildScene(question) {
  const frames = BUILDERS[question.op](question.terms, question.unknown, question)
  return {
    frames,
    durations: frames.map(frameDuration),
    viewBox: sceneBounds(frames),
  }
}

export const HINT_FRAME = 1
export const SOLUTION_FRAME = 2
