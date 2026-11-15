import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { createQuestion } from './questions.js'
import { clockText, digitalText, hour12, parseClock, timeWords } from './time.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('timeWords', () => {
  it('says the time the Swedish way', () => {
    const say = (hour, minute) => timeWords(hour, minute, 'sv')
    expect(say(8, 0)).toBe('åtta')
    expect(say(8, 5)).toBe('fem över åtta')
    expect(say(8, 15)).toBe('kvart över åtta')
    expect(say(8, 20)).toBe('tjugo över åtta')
    expect(say(8, 25)).toBe('fem i halv nio')
    expect(say(8, 30)).toBe('halv nio')
    expect(say(8, 35)).toBe('fem över halv nio')
    expect(say(8, 40)).toBe('tjugo i nio')
    expect(say(8, 45)).toBe('kvart i nio')
    expect(say(8, 55)).toBe('fem i nio')
    expect(say(12, 45)).toBe('kvart i ett')
    expect(say(23, 30)).toBe('halv tolv')
    expect(say(0, 10)).toBe('tio över tolv')
  })

  it('says the time the American way', () => {
    const say = (hour, minute) => timeWords(hour, minute, 'en')
    expect(say(8, 0)).toBe("eight o'clock")
    expect(say(8, 15)).toBe('quarter after eight')
    expect(say(8, 30)).toBe('half past eight')
    expect(say(8, 35)).toBe('twenty-five to nine')
    expect(say(8, 45)).toBe('quarter to nine')
    expect(say(11, 50)).toBe('ten to twelve')
  })
})

describe('clock and digital times', () => {
  it('writes analog times on a 12-hour face and digital ones on either', () => {
    expect(clockText(20, 5)).toBe('8:05')
    expect(clockText(0, 30)).toBe('12:30')
    expect(digitalText(20, 5)).toBe('8:05')
    expect(digitalText(20, 5, true)).toBe('20:05')
    expect(digitalText(8, 5, true)).toBe('08:05')
    expect(digitalText(0, 0, true)).toBe('00:00')
    expect(parseClock('8:05')).toEqual({ hour: 8, minute: 5 })
    expect(hour12(12)).toBe(12)
    expect(hour12(13)).toBe(1)
  })
})

describe('clock questions', () => {
  const rng = seededRng(11)
  const games = CATEGORIES.filter((category) => category.levels.some((level) => level.time))

  for (const { id: category, levels } of games) {
    for (const { id: level, time } of levels) {
      it(`asks with four different times on the level's minutes (${category}, level ${level})`, () => {
        for (let i = 0; i < 200; i += 1) {
          const lang = i % 2 ? 'en' : 'sv'
          const question = createQuestion({ category, level, lang, rng })
          const { hour, minute } = question.time
          expect(time.minutes).toContain(minute)
          expect(question.choices).toHaveLength(4)
          expect(new Set(question.choices).size).toBe(4)
          expect(question.choices).toContain(question.answer)
          expect(question.numbers).toBe(time.numbers ?? true)

          if (category === 'clockDigital') {
            expect(question.terms[0]).toBe(clockText(hour, minute))
            expect(question.answer).toBe(digitalText(hour, minute, time.hour24))
          } else if (category === 'clockWords') {
            expect(question.terms[0]).toBe(clockText(hour, minute))
            expect(question.answer).toBe(timeWords(hour, minute, lang))
          } else if (category === 'digitalWords') {
            expect(question.terms[0]).toBe(digitalText(hour, minute, time.hour24))
            expect(question.answer).toBe(timeWords(hour, minute, lang))
          } else {
            expect(question.terms[0]).toBe(digitalText(hour, minute, time.hour24))
            expect(question.answer).toBe(clockText(hour, minute))
          }
        }
      })
    }
  }

  it('never offers two options that look the same on a 12-hour face', () => {
    for (let i = 0; i < 300; i += 1) {
      const question = createQuestion({ category: 'clockDigital', level: 5, rng })
      const faces = question.choices.map((choice) => {
        const { hour, minute } = parseClock(choice)
        return clockText(hour, minute)
      })
      expect(new Set(faces).size).toBe(4)
      // Morning or afternoon, all options agree.
      const halves = question.choices.map((choice) => parseClock(choice).hour >= 12)
      expect(new Set(halves).size).toBe(1)
    }
  })

  it('offers the usual mix-ups as wrong options', () => {
    let swapped = 0
    for (let i = 0; i < 300; i += 1) {
      const question = createQuestion({ category: 'digitalClock', level: 4, rng })
      const { hour, minute } = question.time
      if (minute % 5 === 0 && minute !== 0) {
        const swap = clockText(minute / 5, (hour12(hour) * 5) % 60)
        swapped += question.choices.includes(swap) ? 1 : 0
      }
    }
    expect(swapped).toBeGreaterThan(100)
  })
})
