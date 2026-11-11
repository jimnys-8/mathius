import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  addProfile,
  bestTimedScore,
  emptyStore,
  getHistory,
  getProfile,
  loadStore,
  recordSession,
  removeProfile,
  saveStore,
  updateProfile,
} from './store.js'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
    data,
  }
}

function session(settings, results, startedAt = 0, endedAt = 60_000) {
  return { settings, results, startedAt, endedAt }
}

const result = (key, op, correct, hinted = false) => ({ key, op, correct, hinted, answer: 7, given: 0, ms: 1000 })

describe('loadStore / saveStore', () => {
  it('round-trips the store', () => {
    const storage = memoryStorage()
    const store = addProfile(emptyStore(), { name: 'Alva', avatar: '🦊' }, 1, 'alva')
    expect(saveStore(storage, store)).toBe(true)
    expect(loadStore(storage)).toEqual(store)
  })

  it('adds fields missing from older saves', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{"version":1,"profiles":[],"activeProfileId":null,"history":{}}' })
    expect(loadStore(storage).language).toBe('sv')
  })

  it('falls back to an empty store for missing or broken data', () => {
    expect(loadStore(memoryStorage())).toEqual(emptyStore())
    expect(loadStore(memoryStorage({ [STORAGE_KEY]: '{nope' }))).toEqual(emptyStore())
    expect(loadStore(memoryStorage({ [STORAGE_KEY]: '{"version":99}' }))).toEqual(emptyStore())
    expect(loadStore(undefined)).toEqual(emptyStore())
  })

  it('reports failed writes instead of throwing', () => {
    const storage = {
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
    }
    expect(saveStore(storage, emptyStore())).toBe(false)
  })
})

describe('profiles', () => {
  it('adds, updates and removes profiles', () => {
    let store = addProfile(emptyStore(), { name: '  Alva ', avatar: '🦊' }, 1, 'alva')
    store = addProfile(store, { name: 'Sixten', avatar: '🐼' }, 2, 'sixten')
    expect(store.activeProfileId).toBe('sixten')
    expect(getProfile(store, 'alva').name).toBe('Alva')

    store = updateProfile(store, 'alva', { settings: { category: 'mul', level: 3, timer: 60 } })
    expect(getProfile(store, 'alva').settings.category).toBe('mul')

    store = removeProfile(store, 'sixten')
    expect(store.profiles.map((profile) => profile.id)).toEqual(['alva'])
    expect(store.activeProfileId).toBeNull()
    expect(store.history.sixten).toBeUndefined()
  })
})

describe('recordSession', () => {
  const settings = { category: 'mul', level: 2, timer: 60 }

  it('stores a summary and per-fact results', () => {
    let store = addProfile(emptyStore(), { name: 'Alva', avatar: '🦊' }, 1, 'alva')
    store = recordSession(
      store,
      'alva',
      session(settings, [result('7×8=?', 'mul', false), result('7×8=?', 'mul', true, true), result('3×4=?', 'mul', true)]),
    )
    const history = getHistory(store, 'alva')
    expect(history.sessions).toEqual([
      { at: 60_000, category: 'mul', level: 2, timer: 60, total: 3, correct: 2, hinted: 1, durationMs: 60_000 },
    ])
    expect(history.facts['7×8=?']).toEqual({ op: 'mul', answer: 7, right: 1, wrong: 1, lastSeen: 60_000 })
    expect(history.facts['3×4=?']).toEqual({ op: 'mul', answer: 7, right: 1, wrong: 0, lastSeen: 60_000 })
  })

  it('ignores sessions without answers', () => {
    const store = addProfile(emptyStore(), { name: 'Alva', avatar: '🦊' }, 1, 'alva')
    expect(recordSession(store, 'alva', session(settings, []))).toBe(store)
  })

  it('finds the best timed score for the same settings', () => {
    let store = addProfile(emptyStore(), { name: 'Alva', avatar: '🦊' }, 1, 'alva')
    expect(bestTimedScore(getHistory(store, 'alva'), settings)).toBeNull()
    store = recordSession(store, 'alva', session(settings, [result('a', 'mul', true), result('b', 'mul', true)]))
    store = recordSession(store, 'alva', session(settings, [result('c', 'mul', true)]))
    store = recordSession(store, 'alva', session({ ...settings, level: 3 }, Array(5).fill(result('d', 'mul', true))))
    expect(bestTimedScore(getHistory(store, 'alva'), settings)).toBe(2)
  })
})
