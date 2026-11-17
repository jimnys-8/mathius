import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { formatFact } from './format.js'
import { fillGaps } from './letters.js'
import { createQuestion, isCorrect } from './questions.js'
import { createSession, sessionReducer } from './session.js'
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
      it(`leaves out letters of a word of the level (${lang}, level ${level})`, () => {
        const gaps = letter.gaps ?? 1
        for (let i = 0; i < 300; i += 1) {
          const question = createQuestion({ category: 'letter', level, lang, rng })
          const [emoji, gapped] = question.terms
          const indexes = [...gapped].flatMap((char, index) => (char === '_' ? [index] : []))
          const word = fillGaps(gapped, question.answer)
          expect(byEmoji.get(emoji)).toBe(word)
          expect(letterCount(word)).toBeLessThanOrEqual(letter.maxLength ?? Infinity)
          expect(letterCount(word)).toBeGreaterThanOrEqual(letter.minLength ?? 0)
          expect(indexes).toHaveLength(gaps)
          expect(indexes.map((index) => [...word][index]).join('')).toBe(question.answer)
          if (letter.position === 'first') {
            expect(indexes[0]).toBe(0)
          }
          // Two gaps are never side by side.
          if (gaps === 2) {
            expect(indexes[1] - indexes[0]).toBeGreaterThan(1)
          }
          const steps = question.steps ?? [question]
          expect(steps).toHaveLength(gaps)
          expect(steps.map((step) => step.answer).join('')).toBe(question.answer)
          for (const step of steps) {
            expect(step.answer).toMatch(/^\p{L}$/u)
            expect(step.choices).toHaveLength(4)
            expect(new Set(step.choices).size).toBe(4)
            expect(step.choices).toContain(step.answer)
            expect(step.hintRemoves).toHaveLength(2)
            expect(step.hintRemoves).not.toContain(step.answer)
            expect(step.choices).toEqual(expect.arrayContaining(step.hintRemoves))
          }
          expect(question.choices).toEqual(steps[0].choices)
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
    expect(formatFact({ op: 'letter', key: '🐈=k_t_', answer: 'at' })).toBe('🐈 katt')
  })

  it('fills the gaps left to right, leaving the rest open', () => {
    expect(fillGaps('k_t_', 'a')).toBe('kat_')
    expect(fillGaps('k_t_', 'at')).toBe('katt')
    expect(fillGaps('k_t_', '')).toBe('k_t_')
  })
})

describe('answering two missing letters', () => {
  const twoGaps = levels.find(({ letter }) => letter.gaps === 2).id
  const start = createSession({ category: 'letter', level: twoGaps, timer: 0, lang: 'sv' }, 0, seededRng(5))
  const [first, second] = start.question.steps
  const wrongOf = (step) => step.choices.find((choice) => choice !== step.answer)

  it('moves on to the second gap after a right first letter', () => {
    const halfway = sessionReducer(start, { type: 'choose', value: first.answer, now: 1 })
    expect(halfway.phase).toBe('answering')
    expect(halfway.step).toBe(1)
    expect(halfway.picked).toEqual([first.answer])
    expect(halfway.results).toHaveLength(0)
    // The first gap's choices are no longer the ones asked.
    const stale = first.choices.find((choice) => !second.choices.includes(choice))
    if (stale) {
      expect(sessionReducer(halfway, { type: 'choose', value: stale, now: 2 })).toBe(halfway)
    }
    const done = sessionReducer(halfway, { type: 'choose', value: second.answer, now: 2 })
    expect(done.phase).toBe('feedback')
    expect(done.results[0]).toEqual(expect.objectContaining({ correct: true, given: start.question.answer }))
  })

  it('ends the question at a wrong first letter', () => {
    const missed = sessionReducer(start, { type: 'choose', value: wrongOf(first), now: 1 })
    expect(missed.phase).toBe('feedback')
    expect(missed.results[0]).toEqual(expect.objectContaining({ correct: false, given: wrongOf(first) }))
  })

  it('counts a wrong second letter as wrong', () => {
    const halfway = sessionReducer(start, { type: 'choose', value: first.answer, now: 1 })
    const missed = sessionReducer(halfway, { type: 'choose', value: wrongOf(second), now: 2 })
    expect(missed.results[0]).toEqual(expect.objectContaining({ correct: false, given: first.answer + wrongOf(second) }))
  })

  it('starts the next question at its first step', () => {
    const missed = sessionReducer(start, { type: 'choose', value: wrongOf(first), now: 1 })
    const next = sessionReducer(missed, { type: 'next', now: 2 })
    expect(next.step).toBe(0)
    expect(next.picked).toEqual([])
  })
})
