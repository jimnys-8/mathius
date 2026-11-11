import { describe, expect, it } from 'vitest'
import { LEVELS } from './config.js'
import { createQuestion, isCorrect, makeQuestion } from './questions.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function check(question) {
  const [a, b, c] = question.terms
  switch (question.op) {
    case 'add':
      return a + b === c
    case 'sub':
      return a - b === c
    case 'mul':
      return a * b === c
    case 'div':
      return b !== 0 && a / b === c
    default:
      return false
  }
}

describe('createQuestion', () => {
  const rng = seededRng(42)

  for (const level of LEVELS) {
    for (const category of ['add', 'sub', 'mul', 'div', 'mix']) {
      it(`produces valid ${category} facts on level ${level.id}`, () => {
        for (let i = 0; i < 300; i += 1) {
          const question = createQuestion({ category, level: level.id, rng })
          expect(check(question)).toBe(true)
          expect(question.answer).toBe(question.terms[question.unknown])
          expect(question.terms.every((term) => Number.isInteger(term) && term >= 0)).toBe(true)

          if (question.op === 'add') {
            expect(question.terms[2]).toBeLessThanOrEqual(level.sum.max)
          }
          if (question.op === 'sub') {
            expect(question.terms[0]).toBeLessThanOrEqual(level.sum.max)
          }
          if (question.op === 'mul') {
            expect(question.terms[0]).toBeLessThanOrEqual(level.product.max)
            expect(question.terms[1]).toBeLessThanOrEqual(level.product.max)
          }
          if (question.op === 'div') {
            expect(question.terms[1]).toBeGreaterThanOrEqual(1)
            expect(question.terms[2]).toBeLessThanOrEqual(level.product.max)
          }
        }
      })
    }
  }

  it('only asks for the result on non-equation levels', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(createQuestion({ category: 'mix', level: 2, rng }).unknown).toBe(2)
    }
  })

  it('asks for missing numbers on equation levels', () => {
    const unknowns = new Set()
    for (let i = 0; i < 200; i += 1) {
      unknowns.add(createQuestion({ category: 'mix', level: 4, rng }).unknown)
    }
    expect([...unknowns].sort()).toEqual([0, 1, 2])
  })

  it('avoids the given keys when possible', () => {
    for (let i = 0; i < 100; i += 1) {
      const first = createQuestion({ category: 'add', level: 2, rng })
      const second = createQuestion({ category: 'add', level: 2, rng, avoid: [first.key] })
      expect(second.key).not.toBe(first.key)
    }
  })

  it('uses only the operations of the category', () => {
    const ops = new Set()
    for (let i = 0; i < 200; i += 1) {
      ops.add(createQuestion({ category: 'mix', level: 1, rng }).op)
    }
    expect([...ops].sort()).toEqual(['add', 'div', 'mul', 'sub'])
  })
})

describe('makeQuestion', () => {
  it('builds a readable key', () => {
    expect(makeQuestion('add', [3, 4, 7]).key).toBe('3+4=?')
    expect(makeQuestion('sub', [9, 4, 5], 1).key).toBe('9−?=5')
    expect(makeQuestion('div', [12, 3, 4], 0).key).toBe('?÷3=4')
  })
})

describe('isCorrect', () => {
  const question = makeQuestion('add', [3, 4, 7])

  it('accepts the answer with surrounding whitespace', () => {
    expect(isCorrect(question, '7')).toBe(true)
    expect(isCorrect(question, ' 7 ')).toBe(true)
  })

  it('rejects wrong, empty or malformed answers', () => {
    expect(isCorrect(question, '8')).toBe(false)
    expect(isCorrect(question, '')).toBe(false)
    expect(isCorrect(question, '7.0')).toBe(false)
    expect(isCorrect(question, '7a')).toBe(false)
  })
})
