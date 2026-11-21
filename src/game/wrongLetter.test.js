import { describe, expect, it } from 'vitest'
import { getCategory } from './config.js'
import { MISSPELLINGS } from './misspellings.js'
import { createWrongLetterQuestion, parseWrongLetterAnswer } from './wrongLetter.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const LEVELS = getCategory('wrongLetter').levels

describe('createWrongLetterQuestion', () => {
  for (const { id, wrongLetter: level } of LEVELS) {
    describe(`level ${id}`, () => {
      const rng = seededRng(id * 31)
      const questions = Array.from({ length: 200 }, () => createWrongLetterQuestion(level, rng))

      it('misspells a word from its list, within the length', () => {
        for (const { terms, word } of questions) {
          const [emoji, misspelled] = terms
          const entry = MISSPELLINGS.find((candidate) => candidate.word === word)
          expect(entry.emoji).toBe(emoji)
          expect(entry[level.list]).toContain(misspelled)
          expect([...word].length).toBeLessThanOrEqual(level.maxLength ?? Infinity)
        }
      })

      it('asks first for the wrong letter, then for the right one', () => {
        for (const { terms, word, steps, answer } of questions) {
          const [, misspelled] = terms
          const [tap, pick] = steps
          const index = Number(tap.answer)
          expect(tap.inWord).toBe(true)
          expect(tap.choices).toHaveLength([...misspelled].length)
          expect(tap.choices).toContain(tap.answer)
          expect([...misspelled][index]).not.toBe([...word][index])
          expect(pick.answer).toBe([...word][index])
          expect(pick.choices).toHaveLength(4)
          expect(pick.choices).toContain(pick.answer)
          expect(pick.choices).not.toContain([...misspelled][index])
          expect(answer).toBe(`${tap.answer}${pick.answer}`)
          expect(parseWrongLetterAnswer(answer)).toEqual({ index, letter: pick.answer })
        }
      })

      it('lets a hint grey out only right letters, and take away only wrong choices', () => {
        for (const { steps } of questions) {
          const [tap, pick] = steps
          expect(tap.hintRemoves).not.toContain(tap.answer)
          expect(tap.hintRemoves.length).toBeGreaterThan(0)
          expect(pick.hintRemoves).toHaveLength(2)
          expect(pick.hintRemoves).not.toContain(pick.answer)
        }
      })

      it('uses many different words', () => {
        const words = new Set(questions.map((question) => question.word))
        expect(words.size).toBeGreaterThan(10)
      })
    })
  }

  it('reads a wrong tap on its own', () => {
    expect(parseWrongLetterAnswer('12')).toEqual({ index: 12, letter: '' })
  })
})
