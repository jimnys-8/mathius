import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { formatFact } from './format.js'
import { fractionWords, parseChoice, pictureFractions, reduce } from './fractions.js'
import { createQuestion, isCorrect } from './questions.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const levels = CATEGORIES.find((category) => category.id === 'fraction').levels
const valueOf = ([n, d]) => n / d
const isLowest = (fraction) => reduce(fraction)[0] === fraction[0]

describe('fraction questions', () => {
  const rng = seededRng(5)

  for (const { id: level, fraction: config } of levels) {
    it(`asks valid questions on level ${level}`, () => {
      for (let i = 0; i < 300; i += 1) {
        const question = createQuestion({ category: 'fraction', level, rng })
        const [picture, right] = question.terms
        const shown = pictureFractions(picture)
        const answer = parseChoice(question.answer).fraction

        // The picture: circles with fewer colored slices than slices.
        for (const [n, d] of shown) {
          expect(n).toBeGreaterThanOrEqual(1)
          expect(n).toBeLessThan(d)
        }
        if (config.kind === 'add') {
          expect(shown).toHaveLength(2)
          const [[a, b], [c, d]] = shown
          expect(config.pairs.map(String)).toContainEqual(String([b, d].sort((x, y) => x - y)))
          expect(valueOf(answer)).toBeCloseTo(valueOf([a, b]) + valueOf([c, d]))
          expect(valueOf(answer)).toBeLessThanOrEqual(config.whole ? 1 : 0.999)
        } else {
          expect(shown).toHaveLength(1)
          expect(config.dens).toContain(shown[0][1])
          if (config.kind === 'read') {
            expect(answer).toEqual(shown[0])
          } else {
            expect(isLowest(shown[0])).toBe(false)
            expect(answer).toEqual(reduce(shown[0]))
          }
        }

        // The choices: four values, only one of them right, in the level's forms.
        expect(right).toBe(question.answer)
        expect(question.choices).toHaveLength(4)
        expect(question.choices).toContain(question.answer)
        const parsed = question.choices.map(parseChoice)
        expect(new Set(parsed.map(({ fraction }) => valueOf(fraction))).size).toBe(4)
        for (const { form, fraction } of parsed) {
          expect(config.forms).toContain(form)
          expect(fraction[1]).toBeLessThanOrEqual(config.maxDen)
          expect(fraction[0]).toBeLessThanOrEqual(fraction[1])
          if (config.kind !== 'read') {
            expect(isLowest(fraction)).toBe(true)
          }
        }
        expect(question.hintRemoves).toHaveLength(2)
        expect(question.hintRemoves).not.toContain(question.answer)
        expect(isCorrect(question, question.answer)).toBe(true)
      }
    })
  }

  it('offers counting the white slices as a wrong answer when it can', () => {
    for (let i = 0; i < 100; i += 1) {
      const question = createQuestion({ category: 'fraction', level: 2, rng })
      const [[n, d]] = pictureFractions(question.terms[0])
      // Half colored, the white slices are the right answer.
      if (n * 2 !== d) {
        const fractions = question.choices.map((choice) => parseChoice(choice).fraction.join('/'))
        expect(fractions).toContain(`${d - n}/${d}`)
      }
    }
  })

  it('makes sums up to one whole on the top level', () => {
    const answers = new Set()
    for (let i = 0; i < 500; i += 1) {
      answers.add(parseChoice(createQuestion({ category: 'fraction', level: 5, rng }).answer).fraction.join('/'))
    }
    expect(answers).toContain('1/1')
  })
})

describe('fractionWords', () => {
  it('says fractions in Swedish and English', () => {
    expect(fractionWords([3, 8], 'sv')).toBe('tre åttondelar')
    expect(fractionWords([1, 2], 'sv')).toBe('en halv')
    expect(fractionWords([1, 4], 'en')).toBe('one fourth')
    expect(fractionWords([2, 3], 'en')).toBe('two thirds')
    expect(fractionWords([1, 1], 'sv')).toBe('en hel')
  })
})

describe('formatFact', () => {
  it('shows a fraction fact', () => {
    expect(formatFact({ op: 'fraction', key: '3/4=3/4' })).toBe('3/4')
    expect(formatFact({ op: 'fraction', key: '3/6=1/2' })).toBe('3/6 = 1/2')
    expect(formatFact({ op: 'fraction', key: '1/4+1/2=3/4' })).toBe('1/4 + 1/2 = 3/4')
  })
})
