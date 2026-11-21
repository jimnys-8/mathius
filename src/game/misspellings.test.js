import { describe, expect, it } from 'vitest'
import { MISSPELLINGS } from './misspellings.js'
import { rudeIn } from './rudeWords.js'
import { WORDS } from './words.js'

const EMOJI_OF = new Map(WORDS.map((word) => [word.sv, word.emoji]))

/** How many letters differ, or -1 if the lengths differ. */
function changedLetters(word, misspelled) {
  const right = [...word]
  const wrong = [...misspelled]
  if (right.length !== wrong.length) {
    return -1
  }
  return right.filter((letter, index) => letter !== wrong[index]).length
}

describe('misspellings', () => {
  it('lists each word once, with its emoji from the word list', () => {
    const words = MISSPELLINGS.map((entry) => entry.word)
    expect(new Set(words).size).toBe(words.length)
    for (const entry of MISSPELLINGS) {
      expect(entry.emoji, entry.word).toBe(EMOJI_OF.get(entry.word))
    }
  })

  for (const { word, far, near } of MISSPELLINGS) {
    describe(word, () => {
      it('has an easy misspelling, and none twice', () => {
        expect(far.length).toBeGreaterThan(0)
        const all = [...far, ...near]
        expect(new Set(all).size).toBe(all.length)
      })

      it('changes exactly one letter in each', () => {
        for (const misspelled of [...far, ...near]) {
          expect(changedLetters(word, misspelled), misspelled).toBe(1)
        }
      })

      it('has nothing rude', () => {
        for (const misspelled of [...far, ...near]) {
          expect(rudeIn(misspelled, word), misspelled).toEqual([])
        }
      })
    })
  }
})
