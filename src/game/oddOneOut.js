import { GROUPS, KINDS } from './groups.js'
import { shuffle } from './reading.js'
import { WORDS } from './words.js'

/**
 * Odd-one-out questions: four things, three of which share a group, and
 * the player picks the one that doesn't fit. The groups and what is in
 * them live in groups.js; numbers get their groups here.
 *
 * A level picks its groups by `odd.levels` ('far', 'close', 'trait') and
 * shows them as emojis or words (`odd.show`), or uses numbers up to
 * `odd.numbers`. The question carries what the picture needs to explain
 * the answer: the group's phrase, the three and the odd one.
 *
 * Questions with a second right answer are thrown away, see
 * `secondAnswer`.
 *
 * @typedef {{ id: string, kind: string, sure: Set<string>, unsure: Set<string>, sv: string, en: string, emoji?: string, value?: number }} Item
 * @typedef {{ groups: Object<string, Object>, items: Item[] }} Catalog
 */

const OTHERS = 3
// Rejected draws before giving up on a question.
const ATTEMPTS = 60
// How many of the last questions' groups are not used again, at most.
const RECENT_GROUPS = 6

/** The emoji groups from groups.js, with names from words.js for emojis that have none there. */
export function emojiCatalog() {
  const words = new Map(WORDS.map((word) => [word.emoji, word]))
  const items = Object.entries(KINDS).flatMap(([kind, rows]) =>
    rows.map(([emoji, tagText, sv, en]) => {
      const tags = tagText.split(' ').filter(Boolean)
      const sure = new Set(tags.filter((tag) => !tag.startsWith('?')))
      if (kind !== 'none') {
        sure.add(kind)
      }
      return {
        id: emoji,
        emoji,
        kind,
        sure,
        unsure: new Set(tags.filter((tag) => tag.startsWith('?')).map((tag) => tag.slice(1))),
        sv: sv ?? words.get(emoji)?.sv,
        en: en ?? words.get(emoji)?.en,
      }
    }),
  )
  return { groups: GROUPS, items }
}

/** Groups for numbers: what a child can check about one number. */
export const NUMBER_GROUPS = {
  even: { test: (n) => n % 2 === 0, sv: 'är jämna tal', en: 'are even' },
  uneven: { test: (n) => n % 2 === 1, sv: 'är udda tal', en: 'are odd' },
  oneDigit: { test: (n) => n < 10, sv: 'har bara en siffra', en: 'have just one digit' },
  twoDigits: { test: (n) => n >= 10, sv: 'har två siffror', en: 'have two digits' },
  tens: { test: (n) => n % 10 === 0, sv: 'slutar på 0', en: 'end in 0' },
  fives: { test: (n) => n % 5 === 0, sv: 'finns i femmans tabell', en: 'are in the five times table' },
  threes: { test: (n) => n % 3 === 0, sv: 'finns i treans tabell', en: 'are in the three times table' },
  squares: { test: (n) => Number.isInteger(Math.sqrt(n)), sv: 'är kvadrattal', en: 'are square numbers' },
}

/** The numbers 1 to `max`, in the number groups. */
export function numberCatalog(max) {
  const groups = Object.fromEntries(Object.entries(NUMBER_GROUPS).map(([id, group]) => [id, { ...group, level: 'number' }]))
  const items = Array.from({ length: max }, (_, index) => {
    const value = index + 1
    const sure = new Set(Object.keys(NUMBER_GROUPS).filter((id) => NUMBER_GROUPS[id].test(value)))
    return { id: String(value), value, kind: 'number', sure, unsure: new Set(), sv: String(value), en: String(value) }
  })
  return { groups, items }
}

export function isIn(item, groupId) {
  return item.sure.has(groupId)
}

/** Whether an item could be argued to be in a group or not. */
export function isUnsure(catalog, item, groupId) {
  if (item.sure.has(groupId)) {
    return false
  }
  const doubtful = catalog.groups[groupId].unsure ?? []
  return item.unsure.has(groupId) || doubtful.some((other) => item.sure.has(other) || item.unsure.has(other))
}

function hasColor(catalog, item) {
  return [...item.sure, ...item.unsure].some((tag) => catalog.groups[tag]?.color)
}

/** What a group's questions are drawn from: its members and the possible odd ones. */
export function groupPool(catalog, groupId) {
  const group = catalog.groups[groupId]
  const clear = (item) => !isUnsure(catalog, item, groupId)
  let within
  if (group.level === 'far') {
    within = (item) => item.kind !== 'none'
  } else if (group.level === 'close') {
    within = (item) => isIn(item, group.in)
  } else if (group.color) {
    within = (item) => hasColor(catalog, item)
  } else if (group.in) {
    within = (item) => group.in.some((parent) => isIn(item, parent) || item.unsure.has(parent))
  } else {
    within = () => true
  }
  const pool = catalog.items.filter((item) => within(item) && clear(item))
  return {
    members: pool.filter((item) => isIn(item, groupId)),
    odds: pool.filter((item) => !isIn(item, groupId)),
  }
}

/**
 * Another group that would make a different one of the four the odd one
 * out, or null. A group counts when it may hold the other three (members,
 * or doubtful) while that one is not surely in it: with 🍎 🍓 🌹 and 🍌,
 * 🍎 🍓 🍌 are fruit, so 🌹 would be right too.
 *
 * @param {Catalog} catalog
 * @param {Item[]} four
 * @param {Item} odd
 */
export function secondAnswer(catalog, four, odd) {
  for (const groupId of Object.keys(catalog.groups)) {
    for (const other of four) {
      if (other === odd || isIn(other, groupId)) {
        continue
      }
      const rest = four.filter((item) => item !== other)
      if (rest.every((item) => isIn(item, groupId) || isUnsure(catalog, item, groupId))) {
        return groupId
      }
    }
  }
  return null
}

function pickWeighted(entries, rng) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = rng() * total
  for (const entry of entries) {
    roll -= entry.weight
    if (roll < 0) {
      return entry
    }
  }
  return entries.at(-1)
}

/**
 * For colors, an odd one of the same kind as one of the three makes a
 * better puzzle: 🍎 🍓 🍒 and 🍌 rather than and 🐢.
 */
function oddCandidates(catalog, groupId, three, odds) {
  if (!catalog.groups[groupId].color) {
    return odds
  }
  const kinds = new Set(three.map((item) => item.kind).filter((kind) => kind !== 'none'))
  const alike = odds.filter((item) => kinds.has(item.kind))
  return alike.length > 0 ? alike : odds
}

/** The group of a question key, "farm:🐄,🐖,🐑:🦁" → "farm". */
export function keyGroup(key) {
  return key.split(':')[0]
}

const catalogs = new Map()
function catalogFor(odd) {
  const id = odd.numbers ? `numbers:${odd.numbers}` : 'emoji'
  if (!catalogs.has(id)) {
    catalogs.set(id, odd.numbers ? numberCatalog(odd.numbers) : emojiCatalog())
  }
  return catalogs.get(id)
}

/**
 * @param {{ levels?: string[], show?: 'emoji'|'words', case?: 'upper'|'lower', numbers?: number }} odd
 * @param {'sv'|'en'} lang
 * @param {() => number} rng
 * @param {string[]} [avoid]  keys of recent questions, whose groups are left out if possible
 */
export function createOddQuestion(odd, lang, rng, avoid = []) {
  const catalog = catalogFor(odd)
  const levels = odd.numbers ? ['number'] : odd.levels
  const usable = Object.keys(catalog.groups)
    .filter((groupId) => levels.includes(catalog.groups[groupId].level))
    .map((groupId) => ({ groupId, ...groupPool(catalog, groupId) }))
    .filter(({ members, odds }) => members.length >= OTHERS && odds.length > 0)
  const recent = new Set(avoid.slice(-Math.min(RECENT_GROUPS, Math.floor(usable.length / 2))).map(keyGroup))
  const fresh = usable.filter(({ groupId }) => !recent.has(groupId))
  // Bigger groups come up more often, but not in proportion, so small
  // ones still turn up.
  const entries = (fresh.length > 0 ? fresh : usable).map((entry) => ({ ...entry, weight: Math.sqrt(entry.members.length) }))

  let draw
  for (let attempt = 0; attempt < ATTEMPTS && !draw; attempt += 1) {
    const { groupId, members, odds } = pickWeighted(entries, rng)
    const three = shuffle(members, rng).slice(0, OTHERS)
    const candidates = oddCandidates(catalog, groupId, three, odds)
    const oddOne = candidates[Math.floor(rng() * candidates.length)]
    if (!secondAnswer(catalog, [...three, oddOne], oddOne)) {
      draw = { groupId, three, oddOne }
    }
  }
  if (!draw) {
    throw new Error('No odd-one-out question without a second answer')
  }

  const { groupId, three, oddOne } = draw
  const show = odd.numbers ? 'numbers' : odd.show
  const shown = (item) => (show === 'numbers' ? item.value : show === 'words' ? item[lang] : item.emoji)
  const describe = (item) => ({ emoji: item.emoji, word: item[lang], value: item.value })
  const choices = [...three, oddOne].map(shown)
  return {
    op: 'odd',
    terms: [groupId, shown(oddOne)],
    unknown: 1,
    answer: shown(oddOne),
    choices: show === 'numbers' ? choices.sort((a, b) => a - b) : shuffle(choices, rng),
    group: groupId,
    phrase: catalog.groups[groupId][lang],
    show,
    case: odd.case ?? 'lower',
    three: three.map(describe),
    oddOne: describe(oddOne),
    key: `${groupId}:${three.map((item) => item.id).sort(show === 'numbers' ? (a, b) => a - b : undefined).join(',')}:${oddOne.id}`,
  }
}
