import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './config.js'
import { GROUPS, KINDS } from './groups.js'
import { emojiCatalog, groupPool, keyGroup, numberCatalog, secondAnswer } from './oddOneOut.js'
import { createQuestion, isCorrect } from './questions.js'

function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const levels = CATEGORIES.find((category) => category.id === 'odd').levels
const catalog = emojiCatalog()
const byId = new Map(catalog.items.map((item) => [item.id, item]))

// These check the rules, not the exact list, so groups.js can be edited
// freely: a mistake there shows up as a failing rule.
describe('the groups in groups.js', () => {
  it('uses only tags that are groups', () => {
    const unknown = catalog.items.flatMap((item) => [...item.sure, ...item.unsure].filter((tag) => !GROUPS[tag]).map((tag) => `${item.emoji} ${tag}`))
    expect(unknown).toEqual([])
  })

  it('has each kind as a far group, and each emoji once', () => {
    for (const kind of Object.keys(KINDS).filter((kind) => kind !== 'none')) {
      expect(GROUPS[kind]?.level).toBe('far')
    }
    const emojis = catalog.items.map((item) => item.emoji)
    expect(emojis.filter((emoji, index) => emojis.indexOf(emoji) !== index)).toEqual([])
  })

  it('names every emoji in both languages, each name once', () => {
    for (const lang of ['sv', 'en']) {
      expect(catalog.items.filter((item) => !item[lang]).map((item) => item.emoji)).toEqual([])
      const names = catalog.items.map((item) => item[lang])
      expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([])
    }
  })

  it('has phrases for every group, and parents that are groups', () => {
    for (const [id, group] of Object.entries(GROUPS)) {
      expect(['far', 'close', 'trait'], id).toContain(group.level)
      expect(group.sv && group.en, id).toBeTruthy()
      for (const parent of [group.in ?? [], ...(group.unsure ?? [])].flat()) {
        expect(GROUPS[parent], `${id} → ${parent}`).toBeDefined()
      }
    }
  })

  it('puts the members of a close group in its parent too', () => {
    const outside = catalog.items.flatMap((item) =>
      [...item.sure].filter((tag) => GROUPS[tag].level === 'close' && !item.sure.has(GROUPS[tag].in)).map((tag) => `${item.emoji} ${tag}`),
    )
    expect(outside).toEqual([])
  })

  it('lets every group make questions without a second right answer', () => {
    const rng = seededRng(3)
    const stuck = Object.keys(GROUPS).filter((groupId) => {
      const { members, odds } = groupPool(catalog, groupId)
      for (let attempt = 0; attempt < 300 && members.length >= 3 && odds.length > 0; attempt += 1) {
        const three = [...members].sort(() => rng() - 0.5).slice(0, 3)
        const odd = odds[Math.floor(rng() * odds.length)]
        if (!secondAnswer(catalog, [...three, odd], odd)) {
          return false
        }
      }
      return true
    })
    expect(stuck).toEqual([])
  })
})

describe('secondAnswer', () => {
  // A small made-up catalog, so these don't depend on the real list.
  const groups = {
    fruit: { level: 'close', in: 'food' },
    red: { level: 'trait', color: true },
    big: { level: 'trait', in: ['animal'] },
  }
  const item = (id, tags, unsure = '') => ({
    id,
    kind: 'x',
    sure: new Set(tags.split(' ').filter(Boolean)),
    unsure: new Set(unsure.split(' ').filter(Boolean)),
  })
  const fixture = { groups, items: [] }
  const apple = item('apple', 'fruit red')
  const strawberry = item('strawberry', 'fruit red')
  const rose = item('rose', 'red')
  const banana = item('banana', 'fruit')
  const cherry = item('cherry', 'fruit red')

  it('finds another group that leaves out a different one', () => {
    // Apple, strawberry and banana are fruit, so the rose fits as well.
    expect(secondAnswer(fixture, [apple, strawberry, rose, banana], banana)).toBe('fruit')
  })

  it('accepts a group that holds all four or only the odd one', () => {
    expect(secondAnswer(fixture, [apple, strawberry, cherry, banana], banana)).toBeNull()
  })

  it('counts doubt as a possible second answer', () => {
    const cow = item('cow', 'big')
    const ox = item('ox', 'big')
    const sheep = item('sheep', '', 'big')
    const lion = item('lion', 'big')
    // "Sheep isn't bigger than you" could be argued.
    expect(secondAnswer(fixture, [cow, ox, sheep, lion], lion)).toBe('big')
  })
})

describe('number groups', () => {
  it('puts numbers in the groups they belong to', () => {
    const numbers = numberCatalog(30).items
    const groupsOf = (value) => [...numbers[value - 1].sure].sort()
    expect(groupsOf(10)).toEqual(['even', 'fives', 'tens', 'twoDigits'])
    expect(groupsOf(9)).toEqual(['oneDigit', 'squares', 'threes', 'uneven'])
  })
})

describe('odd-one-out questions', () => {
  for (const lang of ['sv', 'en']) {
    for (const { id: level, odd } of levels) {
      it(`has one right answer among four (${lang}, level ${level})`, () => {
        const rng = seededRng(level * 11)
        const numbers = odd.numbers ? numberCatalog(odd.numbers) : null
        for (let index = 0; index < 150; index += 1) {
          const question = createQuestion({ category: 'odd', level, lang, rng })
          expect(question.choices).toHaveLength(4)
          expect(new Set(question.choices).size).toBe(4)
          expect(question.choices).toContain(question.answer)
          expect(isCorrect(question, question.answer)).toBe(true)
          expect(keyGroup(question.key)).toBe(question.group)
          expect(question.phrase).toBeTruthy()

          const source = numbers ?? catalog
          const find = (shown) =>
            numbers
              ? numbers.items[shown - 1]
              : catalog.items.find((item) => (odd.show === 'words' ? item[lang] : item.emoji) === shown)
          const four = question.choices.map(find)
          const oddItem = find(question.answer)
          const group = source.groups[question.group]
          expect(odd.numbers ? 'number' : odd.levels).toContain(group.level)
          expect(four.filter((item) => item.sure.has(question.group))).toHaveLength(3)
          expect(oddItem.sure.has(question.group)).toBe(false)
          expect(secondAnswer(source, four, oddItem)).toBeNull()
        }
      })
    }
  }

  it('shows words at the word level and emojis below it', () => {
    const rng = seededRng(5)
    const emoji = createQuestion({ category: 'odd', level: 2, lang: 'sv', rng })
    expect(emoji.choices).toContain(emoji.oddOne.emoji)
    const words = createQuestion({ category: 'odd', level: 4, lang: 'sv', rng })
    expect(words.choices).toContain(words.oddOne.word)
    expect(words.three.every((item) => item.emoji && item.word)).toBe(true)
  })

  it('picks an odd color of the same kind as one of the three', () => {
    const rng = seededRng(9)
    for (let index = 0; index < 100; index += 1) {
      const question = createQuestion({ category: 'odd', level: 3, lang: 'sv', rng })
      if (GROUPS[question.group].color) {
        const kinds = question.three.map((item) => byId.get(item.emoji).kind)
        expect(kinds).toContain(byId.get(question.oddOne.emoji).kind)
      }
    }
  })

  it('leaves out the groups of the last questions', () => {
    const rng = seededRng(13)
    const avoid = []
    for (let index = 0; index < 60; index += 1) {
      const question = createQuestion({ category: 'odd', level: 1, lang: 'sv', avoid, rng })
      // Level 1 has nine groups, so the last four are left out.
      expect(avoid.slice(-4).map(keyGroup)).not.toContain(question.group)
      avoid.push(question.key)
    }
  })
})
