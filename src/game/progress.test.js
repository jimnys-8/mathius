import { describe, expect, it } from 'vitest'
import { fitToUnlocked, isPassed, newlyUnlocked, unlockedLevels } from './progress.js'

const session = (category, level, correct, total = 10) => ({ category, level, timer: 0, total, correct, hinted: 0 })
const history = (...sessions) => ({ sessions, facts: {} })

describe('isPassed', () => {
  it('needs 9 right and at most 1 wrong', () => {
    expect(isPassed(session('add', 1, 9))).toBe(true)
    expect(isPassed(session('add', 1, 10))).toBe(true)
    expect(isPassed(session('add', 1, 8))).toBe(false)
  })

  it('works the same for timed rounds of any length', () => {
    expect(isPassed({ ...session('add', 1, 14, 15), timer: 60 })).toBe(true)
    expect(isPassed({ ...session('add', 1, 20, 22), timer: 60 })).toBe(false)
    expect(isPassed({ ...session('add', 1, 5, 5), timer: 30 })).toBe(false)
  })
})

describe('unlockedLevels', () => {
  it('opens the dots level and the easy level from the start', () => {
    expect([...unlockedLevels(history(), 'add')]).toEqual([0, 1])
  })

  it('opens only the easy level when there is no dots level', () => {
    expect([...unlockedLevels(history(), 'mul')]).toEqual([1])
  })

  it('opens the next level after a pass', () => {
    expect([...unlockedLevels(history(session('add', 1, 9)), 'add')]).toEqual([0, 1, 2])
  })

  it('ignores rounds that did not pass, and other games', () => {
    const played = history(session('add', 1, 8), session('add', 4, 2), session('sub', 1, 10))
    expect([...unlockedLevels(played, 'add')]).toEqual([0, 1])
  })

  it('keeps everything below a passed level open', () => {
    expect([...unlockedLevels(history(session('add', 3, 10)), 'add')]).toEqual([0, 1, 2, 3, 4])
  })

  it('stops at the last level', () => {
    expect([...unlockedLevels(history(session('count', 3, 10)), 'count')]).toEqual([1, 2, 3])
  })

  it('follows the order of the levels, not their ids', () => {
    expect([...unlockedLevels(history(session('clockDigital', 5, 10)), 'clockDigital')]).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('opens every level when a grown-up unlocked them', () => {
    expect([...unlockedLevels(history(), 'eq', true)]).toEqual([1, 2, 3, 4])
  })
})

describe('fitToUnlocked', () => {
  it('keeps an open level', () => {
    const settings = { category: 'add', level: 1, timer: 0, levels: {} }
    expect(fitToUnlocked(settings, new Set([0, 1]))).toBe(settings)
  })

  it('moves a locked level down to the hardest open one', () => {
    const settings = { category: 'add', level: 4, timer: 0, levels: { add: 4 } }
    expect(fitToUnlocked(settings, new Set([0, 1, 2]))).toEqual({ category: 'add', level: 2, timer: 0, levels: { add: 2 } })
  })
})

describe('newlyUnlocked', () => {
  it('names the level a passing round opened', () => {
    expect(newlyUnlocked(history(), session('add', 1, 10))).toBe(2)
  })

  it('is null when nothing new opened', () => {
    expect(newlyUnlocked(history(), session('add', 1, 5))).toBeNull()
    expect(newlyUnlocked(history(session('add', 1, 10)), session('add', 1, 10))).toBeNull()
    expect(newlyUnlocked(history(), session('add', 1, 10), true)).toBeNull()
  })
})
