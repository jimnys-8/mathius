/**
 * Persistent app data: player profiles, their settings and their results.
 *
 * All functions are pure and return a new store; `loadStore` and
 * `saveStore` do the reading and writing.
 *
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} name
 * @property {string} avatar   an emoji
 * @property {number} createdAt
 * @property {{ category: string, level: number, timer: number, levels?: Object<string, number> }} settings
 *   `levels` remembers the level last used in each category.
 *
 * @typedef {Object} SessionRecord
 * @property {number} at          when the session ended
 * @property {string} category
 * @property {number} level
 * @property {number} timer       seconds, 0 for a round
 * @property {number} total
 * @property {number} correct
 * @property {number} hinted
 * @property {number} durationMs
 *
 * @typedef {Object} FactRecord
 * @property {string} op
 * @property {number} answer
 * @property {number} right
 * @property {number} wrong
 * @property {number} lastSeen
 *
 * @typedef {Object} History
 * @property {SessionRecord[]} sessions   oldest first
 * @property {Object<string, FactRecord>} facts  by question key
 */

import { DEFAULT_LANGUAGE } from '../i18n/strings.js'

export const STORAGE_KEY = 'mathius:v1'
const VERSION = 1
const MAX_SESSIONS = 300

export const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐵', '🐨', '🐯', '🐧', '🦄', '🐙', '🐢', '🦖', '🐰', '🐻', '🐝', '🦉']

export const DEFAULT_SETTINGS = { category: 'add', level: 1, timer: 0 }

export function emptyStore() {
  return { version: VERSION, language: DEFAULT_LANGUAGE, profiles: [], activeProfileId: null, history: {} }
}

export function emptyHistory() {
  return { sessions: [], facts: {} }
}

/** Reads the store, falling back to an empty one if it is missing or broken. */
export function loadStore(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) {
      return emptyStore()
    }
    const data = JSON.parse(raw)
    if (data?.version !== VERSION || !Array.isArray(data.profiles)) {
      return emptyStore()
    }
    return { ...emptyStore(), ...data }
  } catch {
    return emptyStore()
  }
}

export function saveStore(storage, store) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(store))
    return true
  } catch {
    // Storage may be full or blocked (e.g. private browsing); the game
    // still works, it just won't remember anything.
    return false
  }
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function addProfile(store, { name, avatar }, now = Date.now(), id = newId()) {
  const profile = {
    id,
    name: name.trim(),
    avatar,
    createdAt: now,
    settings: { ...DEFAULT_SETTINGS },
  }
  return {
    ...store,
    profiles: [...store.profiles, profile],
    activeProfileId: id,
    history: { ...store.history, [id]: emptyHistory() },
  }
}

export function updateProfile(store, id, patch) {
  return {
    ...store,
    profiles: store.profiles.map((profile) => (profile.id === id ? { ...profile, ...patch } : profile)),
  }
}

export function removeProfile(store, id) {
  const history = { ...store.history }
  delete history[id]
  return {
    ...store,
    profiles: store.profiles.filter((profile) => profile.id !== id),
    activeProfileId: store.activeProfileId === id ? null : store.activeProfileId,
    history,
  }
}

export function setLanguage(store, language) {
  return { ...store, language }
}

export function selectProfile(store, id) {
  return { ...store, activeProfileId: id }
}

export function getProfile(store, id) {
  return store.profiles.find((profile) => profile.id === id) ?? null
}

export function getHistory(store, id) {
  return store.history[id] ?? emptyHistory()
}

/** Adds a finished game session to a profile's history. */
export function recordSession(store, profileId, session) {
  const { settings, results, startedAt, endedAt } = session
  if (results.length === 0) {
    return store
  }
  const history = getHistory(store, profileId)
  const at = endedAt ?? Date.now()

  const record = {
    at,
    category: settings.category,
    level: settings.level,
    timer: settings.timer,
    total: results.length,
    correct: results.filter((result) => result.correct).length,
    hinted: results.filter((result) => result.hinted).length,
    durationMs: at - startedAt,
  }

  const facts = { ...history.facts }
  for (const result of results) {
    const fact = facts[result.key] ?? { op: result.op, answer: result.answer, right: 0, wrong: 0, lastSeen: 0 }
    facts[result.key] = {
      ...fact,
      right: fact.right + (result.correct ? 1 : 0),
      wrong: fact.wrong + (result.correct ? 0 : 1),
      lastSeen: at,
    }
  }

  return {
    ...store,
    history: {
      ...store.history,
      [profileId]: {
        sessions: [...history.sessions, record].slice(-MAX_SESSIONS),
        facts,
      },
    },
  }
}

/** Best number of correct answers in timed sessions with these settings. */
export function bestTimedScore(history, { category, level, timer }) {
  let best = null
  for (const session of history.sessions) {
    if (session.timer === timer && session.category === category && session.level === level) {
      best = Math.max(best ?? 0, session.correct)
    }
  }
  return best
}
