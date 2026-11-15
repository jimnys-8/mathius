import { WORDS, letterCount } from './words.js'

/**
 * Reading questions, in two kinds:
 *
 * - 'word': an emoji is shown, and the player picks its word from four
 *   (terms = [emoji, word], the answer is the word).
 * - 'picture': a word is shown, and the player picks its emoji from four
 *   (terms = [word, emoji], the answer is the emoji).
 *
 * Words are stored in lowercase; `question.case` says how to show them.
 * Wrong options are words from the same level, picked by
 * `level.read.distractors`:
 *
 * - 'distinct': each starts with its own letter, so the first letter is
 *   enough to tell them apart
 * - 'any': any words
 * - 'alike': words that look like the answer (same first letter, about
 *   as long), so the whole word has to be read
 */

const CHOICES = 4
// How many look-alikes to choose the wrong options among, for variety.
const ALIKE_POOL = 6

function shuffle(items, rng) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

/** The words a level uses, in a language. */
export function levelWords(read, lang) {
  return WORDS.filter((word) => letterCount(word[lang]) <= (read.maxLength ?? Infinity))
}

function likeness(a, b) {
  return (a[0] === b[0] ? 2 : 0) + (Math.abs(letterCount(a) - letterCount(b)) <= 1 ? 1 : 0) + (a.at(-1) === b.at(-1) ? 0.5 : 0)
}

function pickDistractors(answer, pool, distractors, lang, rng) {
  const others = shuffle(
    pool.filter((word) => word !== answer),
    rng,
  )
  if (distractors === 'distinct') {
    const picked = []
    const letters = new Set([answer[lang][0]])
    for (const word of others) {
      if (!letters.has(word[lang][0])) {
        picked.push(word)
        letters.add(word[lang][0])
      }
      if (picked.length === CHOICES - 1) {
        return picked
      }
    }
    // Too few first letters to go round: fill up with any words.
    return [...picked, ...others.filter((word) => !picked.includes(word))].slice(0, CHOICES - 1)
  }
  if (distractors === 'alike') {
    // Sorting is stable, so equally alike words keep their shuffled order.
    const alike = [...others].sort((a, b) => likeness(answer[lang], b[lang]) - likeness(answer[lang], a[lang]))
    return shuffle(alike.slice(0, ALIKE_POOL), rng).slice(0, CHOICES - 1)
  }
  return others.slice(0, CHOICES - 1)
}

/**
 * @param {'word'|'picture'} op
 * @param {{ maxLength?: number, case: 'upper'|'lower', distractors: 'distinct'|'any'|'alike' }} read
 * @param {'sv'|'en'} lang
 * @param {() => number} rng
 */
export function createReadingQuestion(op, read, lang, rng) {
  const pool = levelWords(read, lang)
  const answer = pool[Math.floor(rng() * pool.length)]
  const wrong = pickDistractors(answer, pool, read.distractors, lang, rng)
  const options = shuffle([answer, ...wrong], rng)
  const word = answer[lang]
  const shown = op === 'word' ? (item) => item[lang] : (item) => item.emoji
  return {
    op,
    terms: op === 'word' ? [answer.emoji, word] : [word, answer.emoji],
    unknown: 1,
    answer: shown(answer),
    choices: options.map(shown),
    // A hint takes away two of the wrong options.
    hintRemoves: shuffle(wrong, rng).slice(0, 2).map(shown),
    case: read.case,
    key: op === 'word' ? `${answer.emoji}=${word}` : `${word}=${answer.emoji}`,
  }
}

/** A word as a level shows it. */
export function showWord(word, wordCase) {
  return wordCase === 'upper' ? word.toUpperCase() : word
}
