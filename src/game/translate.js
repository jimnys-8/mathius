import { KINDS } from './groups.js'
import { shuffle } from './reading.js'
import { WORDS } from './words.js'

/**
 * English words ('translate'): a word in one language is shown and read
 * aloud, and the player picks what it means: its emoji, or its word in
 * the other language from four. Players of the Swedish app see English
 * words and pick Swedish ones; the English app turns it around.
 *
 * terms = [word, answer], the answer being the emoji or the translation.
 * The question also carries `emoji`, `translation` (said aloud once
 * answered), and `from` and `to`, the two languages.
 *
 * Wrong options, by `level.translate.distractors`:
 * - 'any': any words
 * - 'kind': things of the same kind (animals, food, plants, colors), so
 *   the word has to be known, not just its kind
 */

const CHOICES = 4

/**
 * Pairs that show the same emoji but don't mean the same thing (🍼 is
 * "välling" in the reading games but "bottle" in English), so they are
 * no translations to learn.
 */
const NOT_TRANSLATIONS = new Set(['🍼', '🍊', '🐏', '🐝', '🧁', '🍀'])

// What kind of thing each emoji is, from the odd-one-out groups.
const KIND_OF = new Map(
  Object.entries(KINDS)
    .filter(([kind]) => kind !== 'none')
    .flatMap(([kind, entries]) => entries.map(([emoji]) => [emoji, kind])),
)
const COLORS = new Set(['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪'])

/** What kind of thing a word is ('color', 'animal', 'food', ...), or null. */
export function kindOf(word) {
  return COLORS.has(word.emoji) ? 'color' : (KIND_OF.get(word.emoji) ?? null)
}

/**
 * The words to translate: spelled differently in the two languages, since
 * "tiger" = "tiger" gives the answer away, and real translations.
 */
export const TRANSLATE_WORDS = WORDS.filter((word) => word.sv !== word.en && !NOT_TRANSLATIONS.has(word.emoji))

/** The other language: Swedish players learn English, and English players Swedish. */
export function otherLanguage(lang) {
  return lang === 'en' ? 'sv' : 'en'
}

function pickDistractors(answer, distractors, rng) {
  const others = shuffle(
    TRANSLATE_WORDS.filter((word) => word !== answer),
    rng,
  )
  if (distractors === 'kind') {
    const kind = kindOf(answer)
    const same = kind ? others.filter((word) => kindOf(word) === kind) : []
    // Too few of the kind: fill up with any words.
    return [...same, ...others.filter((word) => !same.includes(word))].slice(0, CHOICES - 1)
  }
  return others.slice(0, CHOICES - 1)
}

/**
 * @param {{ answer: 'emoji'|'word', distractors: 'any'|'kind', case: 'upper'|'lower' }} level
 * @param {'sv'|'en'} lang  the player's language, the one answered in
 * @param {() => number} rng
 */
export function createTranslateQuestion(level, lang, rng) {
  const from = otherLanguage(lang)
  const answer = TRANSLATE_WORDS[Math.floor(rng() * TRANSLATE_WORDS.length)]
  const wrong = pickDistractors(answer, level.distractors, rng)
  const shown = level.answer === 'emoji' ? (word) => word.emoji : (word) => word[lang]
  const word = answer[from]
  return {
    op: 'translate',
    terms: [word, shown(answer)],
    unknown: 1,
    answer: shown(answer),
    choices: shuffle([answer, ...wrong], rng).map(shown),
    // With pictures to pick from, a hint takes away two of them; with
    // words, it shows the picture instead (in the card).
    hintRemoves: level.answer === 'emoji' ? shuffle(wrong, rng).slice(0, 2).map(shown) : [],
    emoji: answer.emoji,
    translation: answer[lang],
    from,
    to: lang,
    as: level.answer === 'emoji' ? 'emoji' : 'words',
    case: level.case,
    // "🐕=dog=hund": the same fact whichever way it is asked.
    key: `${answer.emoji}=${word}=${answer[lang]}`,
  }
}
