import { DEFAULT_LEVEL, getCategory } from './config.js'

/**
 * Levels open one at a time, so a child starts easy instead of jumping
 * to the hardest level. A level is passed by one round, timed or not,
 * with at least `correct` right answers and at most `wrong` mistakes.
 */
export const PASS = { correct: 9, wrong: 1 }

/** Whether a recorded session passes its level. */
export function isPassed(session) {
  return session.correct >= PASS.correct && session.total - session.correct <= PASS.wrong
}

/**
 * The level ids a player can pick in a category. The default level and
 * any easier one (the dots level) are always open; passing a level opens
 * the next one, and every level below it.
 *
 * @param {import('../profiles/store.js').History} history
 * @param {string} categoryId
 * @param {boolean} [unlockAll]  a grown-up opened every level for this player
 * @returns {Set<number>}
 */
export function unlockedLevels(history, categoryId, unlockAll = false) {
  const { levels } = getCategory(categoryId)
  if (unlockAll) {
    return new Set(levels.map((level) => level.id))
  }
  let open = levels.findIndex((level) => level.id === DEFAULT_LEVEL)
  for (const session of history.sessions) {
    if (session.category === categoryId && isPassed(session)) {
      const index = levels.findIndex((level) => level.id === session.level)
      open = Math.max(open, Math.min(index + 1, levels.length - 1))
    }
  }
  return new Set(levels.slice(0, open + 1).map((level) => level.id))
}

/**
 * Settings moved down to the hardest open level when the chosen one is
 * locked, e.g. a level picked before levels had to be unlocked.
 */
export function fitToUnlocked(settings, unlocked) {
  if (unlocked.has(settings.level)) {
    return settings
  }
  const { levels } = getCategory(settings.category)
  const level = levels.filter((item) => unlocked.has(item.id)).at(-1)
  return { ...settings, level: level.id, levels: { ...settings.levels, [settings.category]: level.id } }
}

/** The level a just-finished session opened, or null if it opened none. */
export function newlyUnlocked(historyBefore, session, unlockAll = false) {
  const { category } = session
  const before = unlockedLevels(historyBefore, category, unlockAll)
  const after = unlockedLevels({ ...historyBefore, sessions: [...historyBefore.sessions, session] }, category, unlockAll)
  return [...after].find((id) => !before.has(id)) ?? null
}
