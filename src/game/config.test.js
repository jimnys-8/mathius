import { describe, expect, it } from 'vitest'
import { CATEGORIES, DEFAULT_LEVEL, getLevel, normalizeSettings, switchCategory, switchLevel } from './config.js'

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
})
