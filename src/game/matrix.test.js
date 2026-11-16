import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { fitsAMatrix } from './matrix.js'
import { createQuestion, isCorrect } from './questions.js'
import { figureKey, isFigureKey, isSpotsKey, parseFigure, parseSpots, spotsKey } from './shapes.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const levels = CATEGORIES.find((category) => category.id === 'matrix').levels

const fig = (shape, color, more = {}) => figureKey({ shape, color, ...more })
const [x, y, z] = [fig('circle', 'red'), fig('square', 'blue'), fig('star', 'green')]

/** Spot tiles from letters: "ab" holds spots 0 and 1, each with its own figure. */
const SPOT_FIGURES = [
  { shape: 'circle', color: 'red' },
  { shape: 'square', color: 'blue' },
  { shape: 'star', color: 'green' },
  { shape: 'heart', color: 'yellow' },
  { shape: 'diamond', color: 'purple' },
]
const spots = (letters) =>
  spotsKey(SPOT_FIGURES.map((figure, index) => (letters.includes('abcde'[index]) ? figure : null)))

describe('spot keys', () => {
  it('round-trip', () => {
    const key = spots('ae')
    expect(key).toBe('spots:circle.red|-|-|-|diamond.purple')
    expect(isSpotsKey(key)).toBe(true)
    expect(isFigureKey(key)).toBe(false)
    expect(spotsKey(parseSpots(key))).toBe(key)
  })
})

describe('the patterns a matrix can follow', () => {
  it('knows rows, columns, diagonals, one of each, steps, sums and putting together', () => {
    for (const tiles of [
      [x, x, x, y, y, y, z, z, z],
      [x, y, z, x, y, z, x, y, z],
      [x, y, y, z, x, y, z, z, x],
      [x, y, x, y, x, y, x, y, x],
      [x, y, z, y, z, x, z, x, y],
      [x, y, z, z, x, y, y, z, x],
      // Colors by row, shapes by column.
      [fig('circle', 'red'), fig('star', 'red'), fig('heart', 'red'), fig('circle', 'blue'), fig('star', 'blue'), fig('heart', 'blue'), fig('circle', 'green'), fig('star', 'green'), fig('heart', 'green')],
      // Counting up along the rows, one further on each row.
      [1, 2, 3, 2, 3, 4, 3, 4, 5].map((count) => fig('star', 'red', { count })),
      // Turning a quarter along the rows.
      [0, 90, 180, 0, 90, 180, 0, 90, 180].map((turn) => fig('arrow', 'red', { turn })),
      [270, 0, 90, 0, 90, 180, 90, 180, 270].map((turn) => fig('arrow', 'red', { turn })),
      // Counts that add up.
      [1, 2, 3, 1, 1, 2, 2, 3, 5].map((count) => fig('circle', 'red', { count })),
      ['a', 'b', 'ab', 'c', 'd', 'cd', 'ac', 'bd', 'abcd'].map(spots),
      ['a', 'b', 'ab', 'b', 'c', 'bc', 'ab', 'bc', 'abc'].map(spots),
    ]) {
      expect(fitsAMatrix(tiles), tiles.join(' ')).toBe(true)
    }
  })

  it('rejects grids without a pattern', () => {
    for (const tiles of [
      [x, x, x, y, y, y, z, z, y],
      [x, y, z, y, z, x, z, x, x],
      [x, y, z, y, z, x, z, x, fig('star', 'red')],
      [x, y, y, z, x, y, z, z, y],
      [x, y, x, y, x, y, x, y, y],
      [1, 2, 3, 2, 3, 4, 3, 4, 6].map((count) => fig('star', 'red', { count })),
      [1, 2, 3, 1, 1, 2, 2, 3, 4].map((count) => fig('circle', 'red', { count })),
      ['a', 'b', 'ab', 'c', 'd', 'cd', 'ac', 'bd', 'abc'].map(spots),
      ['a', 'b', 'ab', 'c', 'd', 'cd', 'ac', 'bd', 'abcde'].map(spots),
      // Spots and figures don't mix.
      ['a', 'b', 'ab', 'c', 'd', 'cd', 'ac', 'bd'].map(spots).concat(x),
    ]) {
      expect(fitsAMatrix(tiles), tiles.join(' ')).toBe(false)
    }
  })
})

describe('matrix questions', () => {
  for (const level of levels) {
    const { matrix } = level
    describe(`level ${level.id}`, () => {
      const questions = Array.from({ length: 300 }, (_, index) =>
        createQuestion({ category: 'matrix', level: level.id, rng: seededRng(index + 1) }),
      )

      it('fits a pattern with the answer, and with no wrong choice', () => {
        for (const question of questions) {
          const fill = (choice) => question.terms.map((key, index) => (index === question.unknown ? choice : key))
          expect(fitsAMatrix(fill(question.answer)), question.key).toBe(true)
          for (const choice of question.choices.filter((item) => item !== question.answer)) {
            expect(fitsAMatrix(fill(choice)), `${question.key} with ${choice}`).toBe(false)
          }
          expect(isCorrect(question, question.answer)).toBe(true)
        }
      })

      it('offers four different tiles of the same sort, the answer among them', () => {
        for (const question of questions) {
          expect(question.choices).toHaveLength(4)
          expect(new Set(question.choices).size).toBe(4)
          expect(question.choices).toContain(question.answer)
          const sort = isSpotsKey(question.answer) ? isSpotsKey : isFigureKey
          expect(question.choices.every(sort)).toBe(true)
          expect(question.terms.every(sort)).toBe(true)
        }
      })

      it('only uses its own kinds, all of them', () => {
        expect(new Set(questions.map((question) => question.kind))).toEqual(new Set(matrix.kinds))
      })

      it('puts the gap last on the first levels, anywhere later on', () => {
        const last = questions.filter((question) => question.unknown === 8)
        if (matrix.gap === 'last') {
          expect(last).toHaveLength(questions.length)
        } else {
          expect(last.length).toBeGreaterThan(questions.length / 3)
          expect(last.length).toBeLessThan(questions.length)
        }
      })

      it('keeps counts from 1 to 6, and turns to the level', () => {
        for (const question of questions) {
          for (const tile of question.terms.filter(isFigureKey)) {
            const { count, turn } = parseFigure(tile)
            expect(count).toBeGreaterThanOrEqual(1)
            expect(count).toBeLessThanOrEqual(6)
            expect(turn % (Math.min(...(matrix.turns ?? [90])))).toBe(0)
          }
        }
      })

      it('draws counts at one size when counts vary', () => {
        for (const question of questions.filter((item) => item.terms.every(isFigureKey))) {
          const counts = new Set(question.terms.map((tile) => parseFigure(tile).count))
          expect(question.pips, question.key).toBe(counts.size > 1)
        }
      })
    })
  }

  it('makes the easiest wrong choices other figures in the grid or figures not in it', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const question = createQuestion({ category: 'matrix', level: 0, rng: seededRng(seed) })
      const inGrid = new Set(question.terms)
      expect(inGrid.size).toBe(question.kind === 'checker' ? 2 : 3)
      for (const choice of question.choices.filter((item) => item !== question.answer && !inGrid.has(item))) {
        const { shape, color } = parseFigure(choice)
        expect(question.terms.some((key) => parseFigure(key).shape === shape || parseFigure(key).color === color)).toBe(false)
      }
    }
  })

  it('keeps the gap on the diagonal', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const question = createQuestion({ category: 'matrix', level: 0, rng: seededRng(seed) })
      if (question.kind === 'diagonal') {
        expect([0, 4, 8]).toContain(question.unknown)
      }
    }
  })

  it('turns the one of each square both ways', () => {
    const firstRows = new Set()
    for (let seed = 1; seed <= 100; seed += 1) {
      const { terms } = createQuestion({ category: 'matrix', level: 1, rng: seededRng(seed) })
      // Whether the second row starts with the first row's second or third figure.
      firstRows.add(terms[3] === terms[1] ? 'left' : 'right')
    }
    expect(firstRows).toEqual(new Set(['left', 'right']))
  })

  it('has only one set of spots that fits the gap', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const question = createQuestion({ category: 'matrix', level: 4, rng: seededRng(seed) })
      // Each spot's figure, from wherever it shows.
      const figures = [0, 1, 2, 3, 4].map((spot) => question.terms.map(parseSpots).find((tile) => tile[spot])?.[spot] ?? null)
      const fitting = new Set()
      for (let mask = 1; mask < 32; mask += 1) {
        const key = spotsKey(figures.map((figure, spot) => ((mask >> spot) & 1 ? figure : null)))
        if (fitsAMatrix(question.terms.map((tile, index) => (index === question.unknown ? key : tile)))) {
          fitting.add(key)
        }
      }
      expect([...fitting], question.key).toEqual([question.answer])
    }
  })

  it('has a key with the gap', () => {
    const question = createQuestion({ category: 'matrix', level: 2, rng: seededRng(3) })
    const parts = question.key.split(',')
    expect(parts).toHaveLength(9)
    expect(parts[question.unknown]).toBe('?')
    expect(parts.filter((part) => part !== '?')).toEqual(question.terms.filter((_, index) => index !== question.unknown))
  })
})
