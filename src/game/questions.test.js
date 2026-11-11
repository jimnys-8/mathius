import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
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
    case 'sqrt':
      return question.choices ? Math.round(Math.sqrt(a) * 10) / 10 === b : b * b === a
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

  for (const { id: category, levels } of CATEGORIES) {
    for (const level of levels) {
      it(`produces valid ${category} facts on level ${level.id}`, () => {
        for (let i = 0; i < 300; i += 1) {
          const question = createQuestion({ category, level: level.id, rng })
          expect(check(question)).toBe(true)
          expect(question.answer).toBe(question.terms[question.unknown])
          if (!question.choices) {
            expect(question.terms.every((term) => Number.isInteger(term) && term >= 0)).toBe(true)
          }

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

describe('square roots', () => {
  const rng = seededRng(7)
  const many = (level) => Array.from({ length: 300 }, () => createQuestion({ category: 'sqrt', level, rng }))

  it('asks for exact roots of perfect squares on the easy levels', () => {
    for (const question of many(1)) {
      expect(question.choices).toBeUndefined()
      expect(question.unknown).toBe(1)
      expect(question.terms[1]).toBeLessThanOrEqual(5)
    }
  })

  it('asks both ways on the equation level', () => {
    const unknowns = new Set(many(4).map((question) => question.unknown))
    expect([...unknowns].sort()).toEqual([0, 1])
  })

  it('gives four sorted choices, including the answer, for estimates', () => {
    for (const level of [3, 5]) {
      for (const question of many(level)) {
        const { choices, answer, terms } = question
        expect(choices).toHaveLength(4)
        expect(new Set(choices).size).toBe(4)
        expect(choices).toContain(answer)
        expect([...choices].sort((x, y) => x - y)).toEqual(choices)
        expect(Number.isInteger(Math.sqrt(terms[0]))).toBe(false)
        expect(Number.isInteger(answer)).toBe(false)
        expect(question.key).toBe(`√${terms[0]}≈?`)
      }
    }
  })

  it('spreads choices over different whole numbers on Hard', () => {
    for (const question of many(3)) {
      const wholes = question.choices.map(Math.floor)
      expect(new Set(wholes).size).toBe(4)
    }
  })

  it('keeps choices in the same whole number, at least 0.2 apart from the answer, on Master', () => {
    for (const question of many(5)) {
      const whole = Math.floor(question.answer)
      for (const choice of question.choices) {
        expect(Math.floor(choice)).toBe(whole)
        if (choice !== question.answer) {
          expect(Math.abs(choice - question.answer)).toBeGreaterThanOrEqual(0.2 - 1e-9)
        }
      }
    }
  })
})

describe('makeQuestion', () => {
  it('builds a readable key', () => {
    expect(makeQuestion('add', [3, 4, 7]).key).toBe('3+4=?')
    expect(makeQuestion('sub', [9, 4, 5], 1).key).toBe('9−?=5')
    expect(makeQuestion('div', [12, 3, 4], 0).key).toBe('?÷3=4')
    expect(makeQuestion('sqrt', [49, 7]).key).toBe('√49=?')
    expect(makeQuestion('sqrt', [49, 7], 0).key).toBe('√?=7')
  })
})

describe('isCorrect', () => {
  const question = makeQuestion('add', [3, 4, 7])

  it('accepts the answer with surrounding whitespace', () => {
    expect(isCorrect(question, '7')).toBe(true)
    expect(isCorrect(question, ' 7 ')).toBe(true)
  })

  it('accepts decimal points and commas', () => {
    const estimate = makeQuestion('sqrt', [40, 6.3], 1, [4.5, 6.3, 7.6, 8.2])
    expect(isCorrect(estimate, '6.3')).toBe(true)
    expect(isCorrect(estimate, '6,3')).toBe(true)
    expect(isCorrect(estimate, '7.6')).toBe(false)
  })

  it('rejects wrong, empty or malformed answers', () => {
    expect(isCorrect(question, '8')).toBe(false)
    expect(isCorrect(question, '')).toBe(false)
    expect(isCorrect(question, '7.5')).toBe(false)
    expect(isCorrect(question, '7a')).toBe(false)
  })
})
