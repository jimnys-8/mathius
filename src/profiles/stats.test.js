import { describe, expect, it } from 'vitest'
import { OPERATIONS } from '../game/config.js'
import { computeStats } from './stats.js'

const DAY = 24 * 60 * 60 * 1000
const now = new Date(2026, 10, 11, 18, 0).getTime()

function session(overrides) {
  return { at: now, category: 'add', level: 1, timer: 0, total: 10, correct: 8, hinted: 0, durationMs: 1, ...overrides }
}

describe('computeStats', () => {
  it('handles an empty history', () => {
    const stats = computeStats({ sessions: [], facts: {} }, now)
    expect(stats.answered).toBe(0)
    expect(stats.accuracy).toBeNull()
    expect(stats.tricky).toEqual([])
    expect(stats.byOperation.map((entry) => entry.op)).toEqual(Object.keys(OPERATIONS))
    expect(stats.byOperation.every((entry) => entry.answered === 0)).toBe(true)
  })

  it('sums totals and counts today separately', () => {
    const stats = computeStats(
      {
        sessions: [session({ at: now - 2 * DAY, total: 10, correct: 5 }), session({ total: 4, correct: 4 })],
        facts: {},
      },
      now,
    )
    expect(stats.answered).toBe(14)
    expect(stats.correct).toBe(9)
    expect(stats.accuracy).toBeCloseTo(9 / 14)
    expect(stats.games).toBe(2)
    expect(stats.answeredToday).toBe(4)
    expect(stats.recent[0].total).toBe(4)
  })

  it('groups facts by operation', () => {
    const stats = computeStats(
      {
        sessions: [],
        facts: {
          '3+4=?': { op: 'add', answer: 7, right: 3, wrong: 1, lastSeen: 1 },
          '7×8=?': { op: 'mul', answer: 56, right: 0, wrong: 2, lastSeen: 1 },
        },
      },
      now,
    )
    const byOp = Object.fromEntries(stats.byOperation.map(({ op, answered, correct }) => [op, { answered, correct }]))
    expect(byOp.add).toEqual({ answered: 4, correct: 3 })
    expect(byOp.mul).toEqual({ answered: 2, correct: 0 })
    expect(byOp.sub).toEqual({ answered: 0, correct: 0 })
    expect(stats.tricky.map((fact) => fact.key)).toEqual(['7×8=?', '3+4=?'])
  })

  it('keeps the best timed score per category, level and time', () => {
    const stats = computeStats(
      {
        sessions: [
          session({ category: 'mul', timer: 60, correct: 12 }),
          session({ category: 'mul', timer: 60, correct: 15 }),
          session({ category: 'add', timer: 60, correct: 20 }),
          session({ category: 'mul', timer: 30, correct: 7 }),
          session({ timer: 0, correct: 10 }),
        ],
        facts: {},
      },
      now,
    )
    expect(stats.bestTimed.map((entry) => [entry.category, entry.timer, entry.correct])).toEqual([
      ['add', 60, 20],
      ['mul', 30, 7],
      ['mul', 60, 15],
    ])
  })
})
