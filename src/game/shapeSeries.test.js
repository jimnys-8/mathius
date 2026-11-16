import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { createQuestion, isCorrect } from './questions.js'
import { followsAPattern } from './shapeSeries.js'
import { figureKey, isFigureKey, makeFigure, parseFigure } from './shapes.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const levels = CATEGORIES.find((category) => category.id === 'shapes').levels

const row = (...figures) => figures.map(makeFigure)
const red = { shape: 'circle', color: 'red' }
const blue = { shape: 'square', color: 'blue' }
const green = { shape: 'star', color: 'green' }

describe('figure keys', () => {
  it('round-trip every attribute', () => {
    const figure = makeFigure({ shape: 'arrow', color: 'purple', size: 'small', fill: 'outline', count: 3, turn: 270 })
    expect(figureKey(figure)).toBe('arrow.purple.small.outline.3.270')
    expect(parseFigure(figureKey(figure))).toEqual(figure)
    expect(isFigureKey(figureKey(figure))).toBe(true)
    expect(isFigureKey('7')).toBe(false)
  })
})

describe('the patterns a shape series can follow', () => {
  it('knows repeats, turns and counts', () => {
    for (const figures of [
      row(red, blue, red, blue, red, blue),
      row(red, blue, green, red, blue, green),
      row(red, red, blue, red, red, blue),
      ...[90, -90, 45].map((step) => row(...[0, 1, 2, 3, 4].map((index) => ({ shape: 'arrow', turn: (360 + index * step) % 360 })))),
      row(...[1, 2, 3, 4, 5].map((count) => ({ ...red, count }))),
      row(...[6, 5, 4, 3, 2].map((count) => ({ ...red, count }))),
      // Shapes AB AB while colors ABC ABC.
      row(
        { shape: 'circle', color: 'red' },
        { shape: 'star', color: 'blue' },
        { shape: 'circle', color: 'green' },
        { shape: 'star', color: 'red' },
        { shape: 'circle', color: 'blue' },
        { shape: 'star', color: 'green' },
      ),
    ]) {
      expect(followsAPattern(figures), figures.map(figureKey).join(' ')).toBe(true)
    }
  })

  it('rejects rows without a pattern', () => {
    for (const figures of [
      row(red, blue, red, blue, blue),
      row(red, blue, green, red, blue, red),
      row(red, red, red, red, { ...red, color: 'blue' }),
      row(...[0, 90, 180, 180, 0].map((turn) => ({ shape: 'arrow', turn }))),
      row(...[1, 2, 3, 5, 6].map((count) => ({ ...red, count }))),
    ]) {
      expect(followsAPattern(figures), figures.map(figureKey).join(' ')).toBe(false)
    }
  })
})

describe('shape series questions', () => {
  for (const level of levels) {
    const { shapes } = level
    describe(`level ${level.id}`, () => {
      const questions = Array.from({ length: 300 }, (_, index) =>
        createQuestion({ category: 'shapes', level: level.id, rng: seededRng(index + 1) }),
      )

      it('follows a pattern with the answer, and with no wrong choice', () => {
        for (const question of questions) {
          const fill = (choice) => question.terms.map((key, index) => parseFigure(index === question.unknown ? choice : key))
          expect(followsAPattern(fill(question.answer)), question.key).toBe(true)
          for (const choice of question.choices.filter((item) => item !== question.answer)) {
            expect(followsAPattern(fill(choice)), `${question.key} with ${choice}`).toBe(false)
          }
          expect(isCorrect(question, question.answer)).toBe(true)
        }
      })

      it('offers four different figures, the answer among them', () => {
        for (const question of questions) {
          expect(question.choices).toHaveLength(4)
          expect(new Set(question.choices).size).toBe(4)
          expect(question.choices).toContain(question.answer)
          expect(question.choices.every(isFigureKey)).toBe(true)
        }
      })

      it('only uses its own kinds of series', () => {
        expect(new Set(questions.map((question) => question.kind))).toEqual(new Set(shapes.kinds))
      })

      it('puts the gap last on the first levels, anywhere later on', () => {
        const last = questions.filter((question) => question.unknown === question.terms.length - 1)
        if (shapes.gap === 'last') {
          expect(last).toHaveLength(questions.length)
        } else {
          expect(last.length).toBeGreaterThan(questions.length / 3)
          expect(last.length).toBeLessThan(questions.length)
        }
      })

      it('fits a phone: five to eight tiles', () => {
        for (const question of questions) {
          expect(question.terms.length).toBeGreaterThanOrEqual(5)
          expect(question.terms.length).toBeLessThanOrEqual(8)
        }
      })

      it('says which rules drew it, for the hint', () => {
        for (const question of questions) {
          expect(question.rules.length).toBe(question.kind === 'two' ? 2 : 1)
        }
      })
    })
  }

  it('makes the easiest wrong choices the other figure or figures not in the row', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const question = createQuestion({ category: 'shapes', level: 0, rng: seededRng(seed) })
      const inRow = new Set(question.terms)
      expect(inRow.size).toBe(2)
      const wrong = question.choices.filter((choice) => choice !== question.answer)
      expect(wrong.filter((choice) => inRow.has(choice))).toHaveLength(1)
      for (const choice of wrong.filter((item) => !inRow.has(item))) {
        const { shape, color } = parseFigure(choice)
        expect(question.terms.some((key) => parseFigure(key).shape === shape || parseFigure(key).color === color)).toBe(false)
      }
    }
  })

  it('has a key with the gap', () => {
    const question = createQuestion({ category: 'shapes', level: 2, rng: seededRng(3) })
    const parts = question.key.split(',')
    expect(parts[question.unknown]).toBe('?')
    expect(parts.filter((part) => part !== '?')).toEqual(question.terms.filter((_, index) => index !== question.unknown))
  })
})
