import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { createQuestion, isCorrect } from './questions.js'
import { fittingAnswers, followsARule } from './series.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const levels = CATEGORIES.find((category) => category.id === 'series').levels

describe('the rules a number series can follow', () => {
  it('knows steps, turns, growing steps, ×2, ×3, ÷2 and squares', () => {
    for (const values of [
      [3, 4, 5, 6, 7],
      [50, 40, 30, 20],
      [1, 3, 2, 4, 3, 5],
      [1, 2, 4, 7, 11],
      [3, 6, 12, 24],
      [2, 6, 18, 54],
      [80, 40, 20, 10, 5],
      [4, 9, 16, 25, 36],
    ]) {
      expect(followsARule(values), values.join(' ')).toBe(true)
    }
  })

  it('rejects series without a rule', () => {
    for (const values of [
      [1, 2, 4, 5, 8],
      [3, 3, 3, 3],
      [1, 3, 1, 3, 1],
      [2, 3, 5, 9, 17],
    ]) {
      expect(followsARule(values), values.join(' ')).toBe(false)
    }
  })

  it('finds every number that fits a gap', () => {
    expect(fittingAnswers([2, 4, 6, 8, 0], 4)).toEqual([10])
    // 1 2 4 ? is 1 2 4 7 (growing steps) or 1 2 4 8 (doubling).
    expect(fittingAnswers([1, 2, 4, 0], 3)).toEqual([7, 8])
  })
})

describe('number series questions', () => {
  for (const level of levels) {
    const { series } = level
    describe(`level ${level.id}`, () => {
      const questions = Array.from({ length: 300 }, (_, index) =>
        createQuestion({ category: 'series', level: level.id, rng: seededRng(index + 1) }),
      )

      it('has exactly one number that fits the gap', () => {
        for (const question of questions) {
          expect(fittingAnswers(question.terms, question.unknown), question.key).toEqual([question.answer])
          expect(isCorrect(question, String(question.answer))).toBe(true)
        }
      })

      it('only uses its own kinds of series', () => {
        for (const question of questions) {
          expect(series.kinds).toContain(question.kind)
        }
        expect(new Set(questions.map((question) => question.kind))).toEqual(new Set(series.kinds))
      })

      it('puts the gap last on the first levels, anywhere later on', () => {
        const last = questions.filter((question) => question.unknown === question.terms.length - 1)
        if (series.gap === 'last') {
          expect(last).toHaveLength(questions.length)
        } else {
          expect(last.length).toBeGreaterThan(questions.length / 3)
          expect(last.length).toBeLessThan(questions.length)
        }
      })

      it('keeps the numbers whole and in range', () => {
        for (const question of questions) {
          for (const value of question.terms) {
            expect(Number.isInteger(value)).toBe(true)
            expect(value).toBeGreaterThanOrEqual(series.min ?? 0)
          }
          if (series.show === 'dots') {
            expect(Math.max(...question.terms)).toBeLessThanOrEqual(series.max)
          }
        }
      })

      it('labels every step for the hint, or every number for squares', () => {
        for (const question of questions) {
          if (question.notes) {
            expect(question.notes).toHaveLength(question.terms.length)
          } else {
            expect(question.arcs).toHaveLength(question.terms.length - 1)
          }
        }
      })

      if (series.input === 'keypad') {
        it('asks for the answer to be typed', () => {
          expect(questions.every((question) => question.choices === undefined)).toBe(true)
        })
      } else {
        it('offers four different choices, smallest first, with the answer among them', () => {
          for (const question of questions) {
            expect(question.choices).toHaveLength(4)
            expect(new Set(question.choices).size).toBe(4)
            expect(question.choices).toContain(question.answer)
            expect([...question.choices].sort((a, b) => a - b)).toEqual(question.choices)
            expect(Math.min(...question.choices)).toBeGreaterThanOrEqual(series.min ?? 0)
            if (series.show === 'dots') {
              expect(Math.max(...question.choices)).toBeLessThanOrEqual(series.max)
            }
          }
        })
      }
    })
  }

  it('answers the dots level with dots', () => {
    const question = createQuestion({ category: 'series', level: 0, rng: seededRng(7) })
    expect(question.choicesAs).toBe('dots')
    expect(question.show).toBe('dots')
  })

  it('has a key with the gap, like 2,4,6,8,?', () => {
    const question = createQuestion({ category: 'series', level: 2, rng: seededRng(3) })
    const parts = question.key.split(',')
    expect(parts[question.unknown]).toBe('?')
    expect(parts.filter((part) => part !== '?').map(Number)).toEqual(question.terms.filter((_, index) => index !== question.unknown))
  })
})
