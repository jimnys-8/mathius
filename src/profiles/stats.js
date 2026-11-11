import { CATEGORIES, OPERATIONS } from '../game/config.js'

const TRICKY_LIMIT = 8
const RECENT_LIMIT = 10

function startOfDay(timestamp) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/**
 * Aggregates a profile's history for the stats screen.
 *
 * @param {import('./store.js').History} history
 * @param {number} now
 */
export function computeStats(history, now = Date.now()) {
  const { sessions, facts } = history
  const today = startOfDay(now)

  let answered = 0
  let correct = 0
  let answeredToday = 0
  for (const session of sessions) {
    answered += session.total
    correct += session.correct
    if (session.at >= today) {
      answeredToday += session.total
    }
  }

  const byOperation = Object.keys(OPERATIONS).map((op) => ({ op, answered: 0, correct: 0 }))
  for (const fact of Object.values(facts)) {
    const entry = byOperation.find((item) => item.op === fact.op)
    if (entry) {
      entry.answered += fact.right + fact.wrong
      entry.correct += fact.right
    }
  }

  const best = new Map()
  for (const session of sessions) {
    if (session.timer > 0) {
      const key = `${session.category}|${session.level}|${session.timer}`
      const current = best.get(key)
      if (!current || session.correct > current.correct) {
        best.set(key, session)
      }
    }
  }
  const categoryOrder = CATEGORIES.map((category) => category.id)
  const bestTimed = [...best.values()].sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.level - b.level || a.timer - b.timer,
  )

  // Facts that went wrong most often, relative to how often they were seen.
  const tricky = Object.entries(facts)
    .filter(([, fact]) => fact.wrong > 0)
    .map(([key, fact]) => ({ key, ...fact, missRate: fact.wrong / (fact.right + fact.wrong) }))
    .sort((a, b) => b.missRate - a.missRate || b.wrong - a.wrong || b.lastSeen - a.lastSeen)
    .slice(0, TRICKY_LIMIT)

  return {
    answered,
    correct,
    accuracy: answered > 0 ? correct / answered : null,
    games: sessions.length,
    answeredToday,
    byOperation,
    bestTimed,
    tricky,
    recent: sessions.slice(-RECENT_LIMIT).reverse(),
  }
}
