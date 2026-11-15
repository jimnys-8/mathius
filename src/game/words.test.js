import { describe, expect, it } from 'vitest'
import { WORDS, letterCount } from './words.js'

describe('WORDS', () => {
  it('has one word per emoji', () => {
    const emojis = WORDS.map((word) => word.emoji)
    expect(new Set(emojis).size).toBe(emojis.length)
  })

  it('has each word only once per language, so every question has one right answer', () => {
    for (const lang of ['sv', 'en']) {
      const words = WORDS.map((word) => word[lang])
      expect(words.filter((word, index) => words.indexOf(word) !== index)).toEqual([])
    }
  })

  it('writes words in lowercase, for the game to set the case', () => {
    for (const word of WORDS) {
      expect(word.sv).toBe(word.sv.toLowerCase())
      expect(word.en).toBe(word.en.toLowerCase())
    }
  })

  it('has plenty of short words in both languages for the easiest level', () => {
    for (const lang of ['sv', 'en']) {
      const short = WORDS.filter((word) => letterCount(word[lang]) <= 4)
      expect(short.length).toBeGreaterThan(30)
      // Four of them must start with different letters.
      expect(new Set(short.map((word) => word[lang][0])).size).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('letterCount', () => {
  it('counts letters, not spaces, hyphens or bytes', () => {
    expect(letterCount('hot dog')).toBe(6)
    expect(letterCount('t-rex')).toBe(4)
    expect(letterCount('räv')).toBe(3)
  })
})
