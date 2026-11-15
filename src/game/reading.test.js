import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { createQuestion, isCorrect } from './questions.js'
import { showWord } from './reading.js'
import { WORDS, letterCount } from './words.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const levels = CATEGORIES.find((category) => category.id === 'word').levels
const byWord = (lang) => new Map(WORDS.map((word) => [word[lang], word]))
const byEmoji = new Map(WORDS.map((word) => [word.emoji, word]))

describe('reading questions', () => {
  const rng = seededRng(7)

  for (const lang of ['sv', 'en']) {
    for (const { id: level, read } of levels) {
      it(`picks four different words of the level's length (${lang}, level ${level})`, () => {
        for (let i = 0; i < 200; i += 1) {
          const question = createQuestion({ category: 'word', level, lang, rng })
          const [emoji, word] = question.terms
          expect(byWord(lang).get(word).emoji).toBe(emoji)
          expect(question.answer).toBe(word)
          expect(question.choices).toHaveLength(4)
          expect(new Set(question.choices).size).toBe(4)
          expect(question.choices).toContain(word)
          for (const choice of question.choices) {
            expect(byWord(lang).has(choice)).toBe(true)
            expect(letterCount(choice)).toBeLessThanOrEqual(read.maxLength ?? Infinity)
          }
          expect(question.case).toBe(read.case)
        }
      })
    }
  }

  it('gives wrong words other first letters on the first level', () => {
    for (let i = 0; i < 300; i += 1) {
      const question = createQuestion({ category: 'word', level: 1, lang: 'sv', rng })
      expect(new Set(question.choices.map((word) => word[0])).size).toBe(4)
    }
  })

  it('makes wrong words look like the answer on the last level', () => {
    let sameFirst = 0
    for (let i = 0; i < 300; i += 1) {
      const question = createQuestion({ category: 'word', level: 4, lang: 'sv', rng })
      const wrong = question.choices.filter((word) => word !== question.answer)
      sameFirst += wrong.filter((word) => word[0] === question.answer[0]).length
    }
    // On level 2 with random words, about 1 in 15 share the first letter.
    expect(sameFirst / 900).toBeGreaterThan(0.5)
  })

  it('shows a word and asks for its emoji in the picture game', () => {
    for (let i = 0; i < 200; i += 1) {
      const question = createQuestion({ category: 'picture', level: 2, lang: 'en', rng })
      const [word, emoji] = question.terms
      expect(byWord('en').get(word).emoji).toBe(emoji)
      expect(question.answer).toBe(emoji)
      expect(new Set(question.choices).size).toBe(4)
      expect(question.choices.every((choice) => byEmoji.has(choice))).toBe(true)
    }
  })

  it('lets a hint take away two wrong choices', () => {
    for (const category of ['word', 'picture']) {
      const question = createQuestion({ category, level: 3, lang: 'sv', rng })
      expect(question.hintRemoves).toHaveLength(2)
      expect(question.hintRemoves).not.toContain(question.answer)
      expect(question.hintRemoves.every((choice) => question.choices.includes(choice))).toBe(true)
    }
  })

  it('keys questions by emoji and word, different for the two games', () => {
    const word = createQuestion({ category: 'word', level: 1, lang: 'sv', rng: seededRng(1) })
    const picture = createQuestion({ category: 'picture', level: 1, lang: 'sv', rng: seededRng(1) })
    expect(word.key).toBe(`${word.terms[0]}=${word.terms[1]}`)
    expect(picture.key).toBe(`${picture.terms[0]}=${picture.terms[1]}`)
    expect(word.key).not.toBe(picture.key)
  })

  it('checks the picked word or emoji exactly', () => {
    const question = createQuestion({ category: 'word', level: 1, lang: 'sv', rng })
    expect(isCorrect(question, question.answer)).toBe(true)
    expect(isCorrect(question, question.choices.find((choice) => choice !== question.answer))).toBe(false)
  })
})

describe('showWord', () => {
  it('writes words in capitals on the capital-letter levels', () => {
    expect(showWord('räv', 'upper')).toBe('RÄV')
    expect(showWord('räv', 'lower')).toBe('räv')
  })
})
