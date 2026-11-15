import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { formatFact } from './format.js'
import { createQuestion, isCorrect } from './questions.js'
import { WORDS, letterCount } from './words.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const levels = CATEGORIES.find((category) => category.id === 'letter').levels

describe('missing-letter questions', () => {
  const rng = seededRng(11)

  for (const lang of ['sv', 'en']) {
    const byEmoji = new Map(WORDS.map((word) => [word.emoji, word[lang]]))

    for (const { id: level, letter } of levels) {
      it(`leaves out one letter of a word of the level (${lang}, level ${level})`, () => {
        for (let i = 0; i < 300; i += 1) {
          const question = createQuestion({ category: 'letter', level, lang, rng })
          const [emoji, gapped] = question.terms
          const index = [...gapped].indexOf('_')
          const word = gapped.replace('_', question.answer)
          expect(byEmoji.get(emoji)).toBe(word)
          expect(letterCount(word)).toBeLessThanOrEqual(letter.maxLength ?? Infinity)
          expect([...word][index]).toBe(question.answer)
          expect(question.answer).toMatch(/^\p{L}$/u)
          if (letter.position === 'first') {
            expect(index).toBe(0)
          }
          expect(question.choices).toHaveLength(4)
          expect(new Set(question.choices).size).toBe(4)
          expect(question.choices).toContain(question.answer)
          expect(question.hintRemoves).toHaveLength(2)
          expect(question.hintRemoves).not.toContain(question.answer)
          expect(question.case).toBe(letter.case)
          expect(isCorrect(question, question.answer)).toBe(true)
        }
      })
    }
  }

  it('leaves out letters from all over the word on the harder levels', () => {
    const indexes = new Set()
    for (let i = 0; i < 300; i += 1) {
      indexes.add([...createQuestion({ category: 'letter', level: 3, lang: 'sv', rng }).terms[1]].indexOf('_'))
    }
    expect(indexes.size).toBeGreaterThan(3)
  })

  it('offers letters that look or sound alike on the hardest level', () => {
    let alike = 0
    for (let i = 0; i < 300; i += 1) {
      const question = createQuestion({ category: 'letter', level: 4, lang: 'sv', rng })
      if (question.answer === 'b') {
        alike += question.choices.filter((choice) => 'dpq'.includes(choice)).length
      }
    }
    expect(alike).toBeGreaterThan(0)
  })

  it('shows the whole word in the list of results', () => {
    expect(formatFact({ op: 'letter', key: '🐈=k_tt', answer: 'a' })).toBe('🐈 katt')
  })
})
