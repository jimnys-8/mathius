import { describe, expect, it } from 'vitest'
import {
  AREAS,
  CATEGORIES,
  DEFAULT_LEVEL,
  areaOf,
  getLevel,
  normalizeSettings,
  switchArea,
  switchCategory,
  switchLevel,
} from './config.js'

describe('levels', () => {
  it('gives every category the default level and unique level ids', () => {
    for (const category of CATEGORIES) {
      const ids = category.levels.map((level) => level.id)
      expect(ids).toContain(DEFAULT_LEVEL)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('falls back to the default level', () => {
    expect(getLevel('add', 99).id).toBe(DEFAULT_LEVEL)
    expect(getLevel('nope', 2).id).toBe(2)
  })
})

describe('settings', () => {
  it('repairs unknown categories and levels', () => {
    expect(normalizeSettings({ category: 'nope', level: 99, timer: 0 })).toEqual({
      category: 'add',
      level: DEFAULT_LEVEL,
      timer: 0,
      levels: {},
      games: {},
    })
  })

  it('remembers the level of each category', () => {
    let settings = normalizeSettings({ category: 'add', level: 3, timer: 0 })
    settings = switchCategory(settings, 'mul')
    expect(settings.level).toBe(DEFAULT_LEVEL)
    settings = switchLevel(settings, 2)
    settings = switchCategory(settings, 'add')
    expect(settings.level).toBe(3)
    settings = switchCategory(settings, 'mul')
    expect(settings.level).toBe(2)
  })

  it('puts every category in exactly one area', () => {
    const grouped = AREAS.flatMap((area) => area.categories)
    expect([...grouped].sort()).toEqual(CATEGORIES.map((category) => category.id).sort())
    expect(areaOf('word').id).toBe('reading')
  })

  it('returns to the game last played in an area', () => {
    let settings = normalizeSettings({ category: 'add', level: 1, timer: 0 })
    settings = switchArea(settings, 'time')
    expect(settings.category).toBe('clockDigital')
    settings = switchCategory(settings, 'clockWords')
    settings = switchArea(settings, 'math')
    expect(settings.category).toBe('add')
    settings = switchArea(settings, 'time')
    expect(settings.category).toBe('clockWords')
    // Staying in the same area changes nothing.
    expect(switchArea(settings, 'time')).toBe(settings)
  })
})
