import { describe, expect, it } from 'vitest'
import { alikeLetters } from './letters.js'
import { MISSPELLINGS } from './misspellings.js'
import { rudeIn } from './rudeWords.js'
import { WORDS } from './words.js'

const SWEDISH_WORDS = new Set(WORDS.map((word) => word.sv))

/** The one changed position and its two letters, or null if not exactly one. */
function oneChange(word, misspelled) {
  const right = [...word]
  const wrong = [...misspelled]
  if (right.length !== wrong.length) {
    return null
  }
  const changed = right.flatMap((letter, index) => (letter === wrong[index] ? [] : [index]))
  return changed.length === 1 ? { right: right[changed[0]], wrong: wrong[changed[0]] } : null
}

describe('misspellings', () => {
  it('lists each word once, with its emoji from the word list', () => {
    const words = MISSPELLINGS.map((entry) => entry.word)
    expect(new Set(words).size).toBe(words.length)
    for (const entry of MISSPELLINGS) {
      expect(entry.emoji, entry.word).toBeTruthy()
    }
  })

  for (const { word, far, near } of MISSPELLINGS) {
    describe(word, () => {
      it('has misspellings in both groups, none twice', () => {
        expect(far.length).toBeGreaterThan(0)
        expect(near.length).toBeGreaterThan(0)
        const all = [...far, ...near]
        expect(new Set(all).size).toBe(all.length)
      })

      it('changes exactly one letter in each', () => {
        for (const misspelled of [...far, ...near]) {
          expect(oneChange(word, misspelled), misspelled).not.toBeNull()
        }
      })

      it('swaps in a look- or sound-alike letter only in the alike group', () => {
        for (const misspelled of far) {
          const { right, wrong } = oneChange(word, misspelled) ?? {}
          expect(alikeLetters(right).has(wrong), `${misspelled}: ${wrong} looks or sounds like ${right}`).toBe(false)
        }
        for (const misspelled of near) {
          const { right, wrong } = oneChange(word, misspelled) ?? {}
          expect(alikeLetters(right).has(wrong), `${misspelled}: ${wrong} is not like ${right}`).toBe(true)
        }
      })

      it('makes no other listed word and nothing rude', () => {
        for (const misspelled of [...far, ...near]) {
          expect(SWEDISH_WORDS.has(misspelled), misspelled).toBe(false)
          expect(rudeIn(misspelled, word), misspelled).toEqual([])
        }
      })
    })
  }
})
