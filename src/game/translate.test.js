import { describe, expect, it } from 'vitest'
import { getCategory } from './config.js'
import { TRANSLATE_WORDS, createTranslateQuestion, kindOf } from './translate.js'
import { WORDS } from './words.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const LEVELS = getCategory('translate').levels
const byEmoji = new Map(WORDS.map((word) => [word.emoji, word]))

describe('TRANSLATE_WORDS', () => {
  it('leaves out words spelled the same in both languages', () => {
    expect(TRANSLATE_WORDS.some((word) => word.sv === word.en)).toBe(false)
    expect(TRANSLATE_WORDS.map((word) => word.en)).not.toContain('tiger')
  })

  it('leaves out pairs that are not translations', () => {
    expect(TRANSLATE_WORDS.map((word) => word.emoji)).not.toContain('🍼')
  })

  it('knows the kind of most words', () => {
    const known = TRANSLATE_WORDS.filter((word) => kindOf(word) !== null)
    expect(known.length).toBeGreaterThan(TRANSLATE_WORDS.length * 0.9)
    expect(kindOf(byEmoji.get('🔴'))).toBe('color')
    expect(kindOf(byEmoji.get('🐕'))).toBe('animal')
  })
})

describe('createTranslateQuestion', () => {
  for (const lang of ['sv', 'en']) {
    for (const { id, translate: level } of LEVELS) {
      describe(`level ${id} (${lang})`, () => {
        const rng = seededRng(id * 17 + lang.length)
        const questions = Array.from({ length: 300 }, () => createTranslateQuestion(level, lang, rng))
        const from = lang === 'sv' ? 'en' : 'sv'

        it('shows a word in the other language and asks for its picture or translation', () => {
          for (const question of questions) {
            const word = byEmoji.get(question.emoji)
            expect(question.from).toBe(from)
            expect(question.to).toBe(lang)
            expect(question.terms[0]).toBe(word[from])
            expect(question.translation).toBe(word[lang])
            expect(question.answer).toBe(level.answer === 'emoji' ? word.emoji : word[lang])
            expect(question.terms[1]).toBe(question.answer)
          }
        })

        it('offers four different choices, one of them right', () => {
          const shown = new Set(TRANSLATE_WORDS.map((word) => (level.answer === 'emoji' ? word.emoji : word[lang])))
          for (const question of questions) {
            expect(question.choices).toHaveLength(4)
            expect(new Set(question.choices).size).toBe(4)
            expect(question.choices).toContain(question.answer)
            for (const choice of question.choices) {
              expect(shown.has(choice)).toBe(true)
            }
          }
        })

        it(level.answer === 'emoji' ? 'takes two wrong pictures away on a hint' : 'takes nothing away on a hint', () => {
          for (const question of questions) {
            expect(question.hintRemoves).toHaveLength(level.answer === 'emoji' ? 2 : 0)
            expect(question.hintRemoves).not.toContain(question.answer)
            for (const removed of question.hintRemoves) {
              expect(question.choices).toContain(removed)
            }
          }
        })

        if (level.distractors === 'kind') {
          it('picks wrong words of the same kind', () => {
            const kindByWord = new Map(TRANSLATE_WORDS.map((word) => [word[lang], kindOf(word)]))
            for (const question of questions) {
              const kind = kindByWord.get(question.answer)
              if (kind === 'animal' || kind === 'food' || kind === 'color') {
                for (const choice of question.choices) {
                  expect(kindByWord.get(choice)).toBe(kind)
                }
              }
            }
          })
        }
      })
    }
  }
})
