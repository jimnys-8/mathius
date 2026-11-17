// Matrices: a 3×3 grid of tiles with one missing. The tiles hold
// figures (see shapes.js), and each attribute of them follows a rule
// across the grid:
//
//   rows    the same along each row (each row its own)
//   cols    the same down each column
//   diagonal  the same along the diagonal, in the triangle above it and
//             in the one below
//   checker   the same on every other tile, like a checkerboard's colors
//   latin   one of each in every row and every column
//   step    a count or a turn that goes up by the same step along the
//           rows (and maybe down the columns): 1 2 3 / 2 3 4 / 3 4 5
//   sum     counts that add up: tile 1 + tile 2 = tile 3, along the
//           rows and down the columns
//   join    spot tiles (see shapes.js) put together: tile 3 has what
//           tiles 1 and 2 have (union), what only one of them has, so
//           what both have cancels (xor), or what both have (both);
//           along the rows and down the columns, or only one of them
//
// The kinds of question, from easy to hard:
//
//   rows      one figure per row
//   cols      one figure per column
//   diagonal  one figure on the diagonal, one above it and one below
//   checker   two figures taking turns, like a checkerboard
//   latin     three figures, one of each in every row and column
//   latinOne  the same, but only the shapes or only the colors change
//   countUp   the same figure, one more along each row: 1 2 3
//   table     the row decides one attribute, the column another
//   twoLatin  shapes one of each and colors one of each, in different orders
//   step      counting up or turning along the rows, a figure per row
//   union     spot tiles put together
//   xor       the same, but what both tiles have cancels
//   both      spot tiles that keep only what both have
//   unionLine spot tiles put together along the rows only (or the
//             columns only): each row its own
//   sum       counts that add up
//
// Every wrong choice breaks a rule, so there is one right answer.

import { COLORS, MAX_COUNT, SHAPES, SPOT_COUNT, TURNING_SHAPES, figureKey, isSpotsKey, makeFigure, parseFigure, parseSpots, spotsKey } from './shapes.js'

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

/** Tiles per row and per column. */
export const SIDE = 3

const TILES = SIDE * SIDE

const rowOf = (index) => Math.floor(index / SIDE)
const colOf = (index) => index % SIDE

/** Nine tiles from `make(row, col)`, row by row. */
function grid(make) {
  return Array.from({ length: TILES }, (_, index) => make(rowOf(index), colOf(index)))
}

/** The index of a Latin square's value at (row, col): each once per row and column. `way` 1 or 2 shifts the rows left or right. */
const latinIndex = (way, row, col) => (col + way * row) % SIDE

const COUNTS = Array.from({ length: MAX_COUNT }, (_, index) => index + 1)

/** Three different values of an attribute for rows, columns or a Latin square; counts one after another. */
function threeValues(rng, attribute) {
  if (attribute === 'count') {
    const start = randomInt(rng, 1, MAX_COUNT - SIDE + 1)
    return [start, start + 1, start + 2]
  }
  return pickDistinct(rng, attribute === 'shape' ? SHAPES : COLORS, SIDE)
}

/** Spot tiles that combine. Each spot's figure, the same wherever it shows. */
function spotFigures(rng) {
  const shapes = pickDistinct(rng, SHAPES, SPOT_COUNT)
  const colors = pickDistinct(rng, COLORS, SPOT_COUNT)
  return shapes.map((shape, index) => ({ shape, color: colors[index] }))
}

/** Two spot sets (arrays of spot indexes) where neither holds the other, so putting them together makes something new. */
const apart = (a, b) => a.some((spot) => !b.includes(spot)) && b.some((spot) => !a.includes(spot))

const SPOT_INDEXES = Array.from({ length: SPOT_COUNT }, (_, index) => index)

/** From `min` to `max` different spot indexes, leaving out `without`. */
const someSpots = (rng, min, max, without = []) =>
  pickDistinct(rng, SPOT_INDEXES.filter((spot) => !without.includes(spot)), randomInt(rng, min, max))

/** The ways to put two spot sets together. */
const JOIN = {
  union: (a, b) => [...new Set([...a, ...b])],
  xor: (a, b) => [...a.filter((spot) => !b.includes(spot)), ...b.filter((spot) => !a.includes(spot))],
  both: (a, b) => a.filter((spot) => b.includes(spot)),
}

const sameSpots = (a, b) => a.length === b.length && a.every((spot) => b.includes(spot))

/** Nine spot sets put together from the four top-left ones, along the rows and down the columns. */
function fromCorners([a, b, c, d], join) {
  return [a, b, join(a, b), c, d, join(c, d), join(a, c), join(b, d), join(join(a, b), join(c, d))]
}

/** The lines of a grid, as tile indexes: the rows and the columns. */
const LINES = {
  rows: [0, 1, 2].map((row) => [0, 1, 2].map((col) => row * SIDE + col)),
  cols: [0, 1, 2].map((col) => [0, 1, 2].map((row) => row * SIDE + col)),
}

/** Spot indexes → a spots key. */
const spotsFrom = (figures, spots) => spotsKey(figures.map((figure, index) => (spots.includes(index) ? figure : null)))

/** The counts that may start a sum grid: four of at least one that add up to at most MAX_COUNT. */
const SUM_STARTS = (() => {
  const starts = []
  for (const a of COUNTS) {
    for (const b of COUNTS) {
      for (const c of COUNTS) {
        for (const d of COUNTS) {
          if (a + b + c + d <= MAX_COUNT) {
            starts.push([a, b, c, d])
          }
        }
      }
    }
  }
  return starts
})()

/**
 * Each kind makes the tiles (keys) and the rules that drew them, which
 * the hint draws and the wrong choices break. A rule is
 * `{ type: 'rows'|'cols'|'latin', attributes }`,
 * `{ type: 'step', attribute, across, down }` (the step along a row and
 * down a column), `{ type: 'sum' }` or
 * `{ type: 'join', how: 'union'|'xor'|'both', lines: ['rows', 'cols'] }`.
 */
const KINDS = {
  rows(rng) {
    const shapes = threeValues(rng, 'shape')
    const colors = threeValues(rng, 'color')
    return {
      tiles: grid((row) => figureKey({ shape: shapes[row], color: colors[row] })),
      rules: [{ type: 'rows', attributes: ['shape', 'color'] }],
    }
  },
  cols(rng) {
    const shapes = threeValues(rng, 'shape')
    const colors = threeValues(rng, 'color')
    return {
      tiles: grid((_, col) => figureKey({ shape: shapes[col], color: colors[col] })),
      rules: [{ type: 'cols', attributes: ['shape', 'color'] }],
    }
  },
  diagonal(rng) {
    // The gap stays on the diagonal, where the line leads to it.
    const shapes = threeValues(rng, 'shape')
    const colors = threeValues(rng, 'color')
    const part = (row, col) => (col === row ? 0 : col > row ? 1 : 2)
    return {
      tiles: grid((row, col) => figureKey({ shape: shapes[part(row, col)], color: colors[part(row, col)] })),
      rules: [{ type: 'diagonal', attributes: ['shape', 'color'] }],
      gaps: [0, 4, 8],
    }
  },
  checker(rng) {
    const shapes = pickDistinct(rng, SHAPES, 2)
    const colors = pickDistinct(rng, COLORS, 2)
    return {
      tiles: grid((row, col) => figureKey({ shape: shapes[(row + col) % 2], color: colors[(row + col) % 2] })),
      rules: [{ type: 'checker', attributes: ['shape', 'color'] }],
    }
  },
  latin(rng) {
    const shapes = threeValues(rng, 'shape')
    const colors = threeValues(rng, 'color')
    const way = pick(rng, [1, 2])
    return {
      tiles: grid((row, col) => {
        const index = latinIndex(way, row, col)
        return figureKey({ shape: shapes[index], color: colors[index] })
      }),
      rules: [{ type: 'latin', attributes: ['shape', 'color'] }],
    }
  },
  latinOne(rng) {
    const attribute = pick(rng, ['shape', 'color'])
    const values = threeValues(rng, attribute)
    const base = { shape: pick(rng, SHAPES), color: pick(rng, COLORS) }
    const way = pick(rng, [1, 2])
    return {
      tiles: grid((row, col) => figureKey({ ...base, [attribute]: values[latinIndex(way, row, col)] })),
      rules: [{ type: 'latin', attributes: [attribute] }],
    }
  },
  countUp(rng) {
    const start = randomInt(rng, 1, MAX_COUNT - SIDE + 1)
    const base = { shape: pick(rng, SHAPES), color: pick(rng, COLORS) }
    return {
      tiles: grid((_, col) => figureKey({ ...base, count: start + col })),
      rules: [{ type: 'step', attribute: 'count', across: 1, down: 0 }],
    }
  },
  table(rng) {
    const [byRow, byCol] = shuffle(pick(rng, [['shape', 'color'], ['shape', 'count'], ['color', 'count']]), rng)
    const rowValues = threeValues(rng, byRow)
    const colValues = threeValues(rng, byCol)
    const base = { shape: pick(rng, SHAPES), color: pick(rng, COLORS) }
    return {
      tiles: grid((row, col) => figureKey({ ...base, [byRow]: rowValues[row], [byCol]: colValues[col] })),
      rules: [
        { type: 'rows', attributes: [byRow] },
        { type: 'cols', attributes: [byCol] },
      ],
    }
  },
  twoLatin(rng) {
    const shapes = threeValues(rng, 'shape')
    const colors = threeValues(rng, 'color')
    // Opposite ways round, so all nine tiles differ.
    const [shapeWay, colorWay] = shuffle([1, 2], rng)
    return {
      tiles: grid((row, col) =>
        figureKey({ shape: shapes[latinIndex(shapeWay, row, col)], color: colors[latinIndex(colorWay, row, col)] }),
      ),
      rules: [
        { type: 'latin', attributes: ['shape'] },
        { type: 'latin', attributes: ['color'] },
      ],
    }
  },
  step(rng, { turns }) {
    if (rng() < 0.5) {
      // Counting up (now and then down) along each row, a figure per row;
      // half the time each row starts one further on.
      const across = rng() < 0.75 ? 1 : -1
      const down = pick(rng, [0, across])
      const offsets = grid((row, col) => across * col + down * row)
      const start = randomInt(rng, 1 - Math.min(...offsets), MAX_COUNT - Math.max(...offsets))
      const shapes = threeValues(rng, 'shape')
      const colors = threeValues(rng, 'color')
      return {
        tiles: grid((row, col) =>
          figureKey({ shape: shapes[row], color: colors[row], count: start + across * col + down * row }),
        ),
        rules: [
          { type: 'step', attribute: 'count', across, down },
          { type: 'rows', attributes: ['shape', 'color'] },
        ],
      }
    }
    // An arrow or a heart turning along each row, a color per row.
    const size = pick(rng, turns)
    const across = rng() < 2 / 3 ? size : -size
    const down = pick(rng, [0, across])
    const start = randomInt(rng, 0, 360 / size - 1) * size
    const shape = pick(rng, TURNING_SHAPES)
    const colors = threeValues(rng, 'color')
    return {
      tiles: grid((row, col) =>
        figureKey({ shape, color: colors[row], turn: (((start + across * col + down * row) % 360) + 360) % 360 }),
      ),
      rules: [
        { type: 'step', attribute: 'turn', across, down },
        { type: 'rows', attributes: ['color'] },
      ],
    }
  },
  union(rng) {
    // The four top-left tiles hold one or two spots each; the rest are
    // put together from them, so it works along rows and down columns.
    const figures = spotFigures(rng)
    const some = () => pickDistinct(rng, SPOT_INDEXES, rng() < 0.7 ? 1 : 2)
    for (;;) {
      const corner = [some(), some(), some(), some()]
      const [a, b, c, d] = corner
      if (!(apart(a, b) && apart(c, d) && apart(a, c) && apart(b, d))) {
        continue
      }
      const spots = fromCorners(corner, JOIN.union)
      return { tiles: spots.map((set) => spotsFrom(figures, set)), rules: [joinRule('union')], figures }
    }
  },
  xor(rng) {
    // Like union, but the tiles share spots, which cancel: on at least
    // half the lines, and the last tile isn't simply every spot.
    const figures = spotFigures(rng)
    for (;;) {
      const corner = [0, 1, 2, 3].map(() => someSpots(rng, 1, 3))
      const spots = fromCorners(corner, JOIN.xor)
      const cancels = [...LINES.rows, ...LINES.cols].filter(([first, second]) =>
        spots[first].some((spot) => spots[second].includes(spot)),
      )
      const every = [...new Set(corner.flat())]
      if (spots.some((set) => set.length === 0) || cancels.length < 3 || sameSpots(spots[8], every)) {
        continue
      }
      return { tiles: spots.map((set) => spotsFrom(figures, set)), rules: [joinRule('xor')], figures }
    }
  },
  both(rng) {
    // One spot in all four top-left tiles, so every tile keeps something,
    // and one or two more each, so every line drops something.
    const figures = spotFigures(rng)
    for (;;) {
      const shared = pick(rng, SPOT_INDEXES)
      const corner = [0, 1, 2, 3].map(() => [shared, ...someSpots(rng, 1, 2, [shared])])
      const spots = fromCorners(corner, JOIN.both)
      const drops = [...LINES.rows, ...LINES.cols].every(([first, second]) => apart(spots[first], spots[second]))
      if (!drops) {
        continue
      }
      return { tiles: spots.map((set) => spotsFrom(figures, set)), rules: [joinRule('both')], figures }
    }
  },
  unionLine(rng) {
    // Each row puts its own two together into something of its own, and
    // the columns don't: no column puts together in any way. Half the
    // time turned, by columns.
    const figures = spotFigures(rng)
    const lines = [pick(rng, ['rows', 'cols'])]
    for (;;) {
      const rowSpots = [0, 1, 2].flatMap(() => {
        const [a, b] = [someSpots(rng, 1, 2), someSpots(rng, 1, 2)]
        return [a, b, JOIN.union(a, b)]
      })
      const pairsApart = LINES.rows.every(([first, second]) => apart(rowSpots[first], rowSpots[second]))
      const colsJoin = LINES.cols.some(([first, second, third]) =>
        Object.values(JOIN).some((join) => sameSpots(join(rowSpots[first], rowSpots[second]), rowSpots[third])),
      )
      const thirds = [2, 5, 8].map((index) => rowSpots[index])
      const thirdsDiffer = thirds.every((set, index) => thirds.slice(index + 1).every((other) => !sameSpots(set, other)))
      if (!pairsApart || colsJoin || !thirdsDiffer) {
        continue
      }
      const spots = lines[0] === 'rows' ? rowSpots : grid((row, col) => rowSpots[col * SIDE + row])
      return { tiles: spots.map((set) => spotsFrom(figures, set)), rules: [joinRule('union', lines)], figures }
    }
  },
  sum(rng) {
    const [a, b, c, d] = pick(rng, SUM_STARTS)
    const counts = [a, b, a + b, c, d, c + d, a + c, b + d, a + b + c + d]
    const base = { shape: pick(rng, SHAPES), color: pick(rng, COLORS) }
    return { tiles: counts.map((count) => figureKey({ ...base, count })), rules: [{ type: 'sum' }] }
  },
}

export const MATRIX_KINDS = Object.keys(KINDS)

/** A rule for spot tiles put together `how`, along `lines`. */
function joinRule(how, lines = ['rows', 'cols']) {
  return { type: 'join', how, lines }
}

const rows = (values) => [0, 1, 2].map((row) => values.slice(row * SIDE, row * SIDE + SIDE))
const cols = (values) => [0, 1, 2].map((col) => [0, 1, 2].map((row) => values[row * SIDE + col]))
const same = (line) => line.every((value) => value === line[0])
const distinct = (line) => new Set(line).size === line.length

/** Whether the differences along `lines` are all one step, `modulo` for turns. */
function oneStep(lines, modulo) {
  const changes = lines.flatMap((line) =>
    line.slice(1).map((value, index) => {
      const difference = value - line[index]
      return modulo ? ((difference % modulo) + modulo) % modulo : difference
    }),
  )
  return same(changes)
}

/** Whether nine values of an attribute follow one of the rules. */
function followsARule(attribute, values) {
  if (rows(values).every(same) || cols(values).every(same)) {
    return true
  }
  if (new Set(values).size === SIDE && rows(values).every(distinct) && cols(values).every(distinct)) {
    return true
  }
  // Parts of the grid that are the same throughout: the diagonal and the
  // triangles on either side, or a checkerboard's two colors. (Not any
  // slanted line: the corners off a diagonal are lines of one tile, where
  // anything would fit.)
  const partsAlike = (part) => {
    const seen = new Map()
    return values.every((value, index) => {
      const key = part(rowOf(index), colOf(index))
      return (seen.get(key) ?? value) === value && seen.set(key, value)
    })
  }
  if (partsAlike((row, col) => Math.sign(col - row)) || partsAlike((row, col) => (row + col) % 2)) {
    return true
  }
  if (attribute === 'count' || attribute === 'turn') {
    const modulo = attribute === 'turn' ? 360 : undefined
    if (oneStep(rows(values), modulo) && oneStep(cols(values), modulo)) {
      return true
    }
  }
  if (attribute === 'count') {
    const adds = (line) => line[2] === line[0] + line[1]
    return rows(values).every(adds) && cols(values).every(adds)
  }
  return false
}

/** What each spot keeps when two spot tiles are put together, by whether each has it. */
const KEEPS = {
  union: (a, b) => a ?? b,
  xor: (a, b) => (a && b ? null : (a ?? b)),
  both: (a, b) => (a && b ? a : null),
}

/** Two spot tiles put together `how`, or null if a spot holds different figures. */
function putTogether(first, second, how) {
  const spots = []
  for (let index = 0; index < SPOT_COUNT; index += 1) {
    const [a, b] = [first[index], second[index]]
    if (a && b && (a.shape !== b.shape || a.color !== b.color)) {
      return null
    }
    spots.push(KEEPS[how](a, b))
  }
  return spotsKey(spots)
}

/**
 * Whether spot tiles put together in one way, along the rows, down the
 * columns or both. Which of those counts is up to the lines without the
 * gap: where those all put together, the gap's line has to as well. So a
 * grid that puts together both ways only takes an answer that does too.
 */
function combines(keys, gap) {
  const tiles = keys.map(parseSpots)
  if (tiles.some((tile) => tile.every((spot) => !spot))) {
    return false
  }
  return Object.keys(KEEPS).some((how) => {
    const works = ([first, second, third]) => putTogether(tiles[first], tiles[second], how) === keys[third]
    const counted = Object.values(LINES).filter((lines) => lines.filter((line) => !line.includes(gap)).every(works))
    return counted.length > 0 && counted.every((lines) => lines.every(works))
  })
}

/**
 * Whether nine tiles (keys, row by row) follow a pattern: spot tiles
 * that put together, or figures where every attribute follows a rule.
 * For spot tiles, `gap` is the tile being tried, see combines.
 */
export function fitsAMatrix(keys, gap = -1) {
  if (keys.some(isSpotsKey)) {
    return keys.every(isSpotsKey) && combines(keys, gap)
  }
  const figures = keys.map(parseFigure)
  return ['shape', 'color', 'size', 'fill', 'count', 'turn'].every((attribute) =>
    followsARule(
      attribute,
      figures.map((figure) => figure[attribute]),
    ),
  )
}

/** Where the gap goes: last, or anywhere a kind allows (`gaps`), still last half the time. */
function pickGap(rng, gap, gaps) {
  if (gap === 'last' || rng() < 0.5) {
    return TILES - 1
  }
  return pick(
    rng,
    (gaps ?? grid((row, col) => row * SIDE + col)).filter((index) => index !== TILES - 1),
  )
}

/** Other values for an attribute, as a wrong choice would have them: values from the grid first. */
function otherValues(attribute, figure, figures) {
  if (attribute === 'turn') {
    return [90, 180, 270, 45, 135, 225, 315].map((offset) => (figure.turn + offset) % 360)
  }
  if (attribute === 'count') {
    return [-1, 1, -2, 2, 3].map((offset) => figure.count + offset).filter((count) => count >= 1 && count <= MAX_COUNT)
  }
  const inGrid = [...new Set(figures.map((item) => item[attribute]))]
  const all = attribute === 'shape' ? SHAPES : COLORS
  return [...inGrid, ...all.filter((value) => !inGrid.includes(value))].filter((value) => value !== figure[attribute])
}

/** The tiles in the gap's row and column, then the rest: the likely mistakes first. */
function neighbors(tiles, gap) {
  const near = tiles.filter((_, index) => index !== gap && (rowOf(index) === rowOf(gap) || colOf(index) === colOf(gap)))
  const far = tiles.filter((_, index) => rowOf(index) !== rowOf(gap) && colOf(index) !== colOf(gap))
  return [...near, ...far]
}

/**
 * Wrong figures: the answer with one varying attribute changed (one of
 * each first, so every rule gets tested), a tile from the gap's row or
 * column, and the answer in another shape or color where those stay the
 * same. On the easiest level (`fresh`), the other rows' figures and
 * figures not in the grid, so they can be told apart by looking.
 */
function figureCandidates(rng, tiles, gap, rules, fresh) {
  const answer = parseFigure(tiles[gap])
  const figures = tiles.map(parseFigure)
  if (fresh) {
    const shapes = shuffle(SHAPES.filter((shape) => figures.every((figure) => figure.shape !== shape)), rng)
    const colors = shuffle(COLORS.filter((color) => figures.every((figure) => figure.color !== color)), rng)
    return [
      ...shuffle(tiles, rng),
      ...shapes.map((shape, index) => figureKey({ ...answer, shape, color: colors[index % colors.length] })),
    ]
  }
  const varying = [
    ...new Set(rules.flatMap((rule) => (rule.type === 'step' ? [rule.attribute] : rule.type === 'sum' ? ['count'] : rule.attributes))),
  ]
  // A turning shape stays that shape: other shapes would look odd turned.
  const steady = ['shape', 'color'].filter(
    (attribute) => !varying.includes(attribute) && !(attribute === 'shape' && varying.includes('turn')),
  )
  const changed = (attribute, values) => values.map((value) => figureKey(makeFigure({ ...answer, [attribute]: value })))
  const byVarying = shuffle(varying, rng).map((attribute) => changed(attribute, otherValues(attribute, answer, figures)))
  const others = neighbors(tiles, gap)
  const candidates = []
  for (let round = 0; round < 6; round += 1) {
    for (const options of byVarying) {
      if (options[round]) {
        candidates.push(options[round])
      }
    }
    if (round === 0) {
      candidates.push(...shuffle(others.slice(0, 4), rng).slice(0, 1))
      for (const attribute of shuffle(steady, rng)) {
        candidates.push(...shuffle(changed(attribute, otherValues(attribute, answer, figures)), rng).slice(0, 1))
      }
    }
  }
  return [...candidates, ...others]
}

/** A spot tile's spot indexes. */
const heldSpots = (key) => parseSpots(key).flatMap((spot, index) => (spot ? [index] : []))

/**
 * Wrong spot tiles: the gap's tiles put together another way (all spots
 * where they cancel), the answer with a spot taken away, added or
 * swapped, and tiles from the grid.
 */
function spotCandidates(rng, tiles, gap, figures) {
  const held = heldSpots(tiles[gap])
  const empty = SPOT_INDEXES.filter((spot) => !held.includes(spot))
  const spots = (set) => spotsFrom(figures, set)
  const otherWays = [LINES.rows[rowOf(gap)], LINES.cols[colOf(gap)]]
    .filter((line) => line[2] === gap)
    .flatMap(([first, second]) => Object.values(JOIN).map((join) => spots(join(heldSpots(tiles[first]), heldSpots(tiles[second])))))
  const fewer = held.length > 1 ? held.map((spot) => spots(held.filter((other) => other !== spot))) : []
  const more = empty.map((spot) => spots([...held, spot]))
  const swapped = held.flatMap((spot) => empty.map((other) => spots([...held.filter((item) => item !== spot), other])))
  const first = [otherWays, fewer, more, neighbors(tiles, gap).slice(0, 2)].map((options) => shuffle(options, rng).slice(0, 1))
  return [...shuffle(first.flat(), rng), ...shuffle([...otherWays, ...fewer, ...more, ...swapped], rng), ...tiles].filter(
    (key) => key !== spots([]),
  )
}

/** The first three candidates that are new and break the pattern. */
function wrongChoices(tiles, gap, candidates) {
  const chosen = []
  const keys = new Set([tiles[gap]])
  for (const candidate of candidates) {
    const filled = tiles.map((tile, index) => (index === gap ? candidate : tile))
    if (chosen.length < 3 && !keys.has(candidate) && !fitsAMatrix(filled, gap)) {
      keys.add(candidate)
      chosen.push(candidate)
    }
  }
  return chosen
}

/** Whether only the answer puts together: no other set of spots fits the gap. */
function onlyAnswerCombines(tiles, gap, figures) {
  for (let mask = 1; mask < 2 ** SPOT_COUNT; mask += 1) {
    const set = figures.flatMap((_, index) => ((mask >> index) & 1 ? [index] : []))
    const key = spotsFrom(figures, set)
    if (key !== tiles[gap] && fitsAMatrix(tiles.map((tile, index) => (index === gap ? key : tile)), gap)) {
      return false
    }
  }
  return true
}

/**
 * @param {{ kinds: string[], gap: 'last'|'any', turns?: number[], fresh?: boolean }} matrix
 * @param {() => number} rng
 * @returns {import('./questions.js').Question}
 */
export function createMatrixQuestion(matrix, rng) {
  const options = { turns: matrix.turns ?? [90] }
  for (;;) {
    const kind = pick(rng, matrix.kinds)
    const { tiles, rules, figures, gaps } = KINDS[kind](rng, options)
    if (!fitsAMatrix(tiles)) {
      continue
    }
    const gap = pickGap(rng, matrix.gap, gaps)
    if (figures && !(fitsAMatrix(tiles, gap) && onlyAnswerCombines(tiles, gap, figures))) {
      continue
    }
    const candidates = figures ? spotCandidates(rng, tiles, gap, figures) : figureCandidates(rng, tiles, gap, rules, matrix.fresh)
    const wrong = wrongChoices(tiles, gap, candidates)
    if (wrong.length < 3) {
      continue
    }
    return {
      op: 'matrix',
      terms: tiles,
      unknown: gap,
      answer: tiles[gap],
      kind,
      rules,
      // Counts are drawn at one size, so 1 + 2 = 3 looks right.
      pips: rules.some((rule) => rule.type === 'sum' || rule.attribute === 'count' || rule.attributes?.includes('count')),
      key: tiles.map((tile, index) => (index === gap ? '?' : tile)).join(','),
      choices: shuffle([tiles[gap], ...wrong], rng),
    }
  }
}
