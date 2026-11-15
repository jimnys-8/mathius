import { shuffle } from './reading.js'
import { WORDS, letterCount } from './words.js'

/**
 * "Which letter?": an emoji and its word with one letter left out, and
 * the player picks the missing letter from four (terms = [emoji, the
 * word with "_" for the letter, the letter]). Answer and choices are
 * lowercase letters; `question.case` says how to show them.
 *
 * `level.letter`:
 * - maxLength: the longest words used
 * - position: 'first' leaves out the first letter, 'any' any letter
 * - case: 'upper' or 'lower'
 * - distractors: 'far' picks wrong letters that look and sound different
 *   from the answer; 'near' prefers ones that look or sound alike (b d p)
 */

const CHOICES = 4

// Letters to pick wrong options from; rare ones (q, w, x, z in Swedish)
// are left out so the options look like real candidates.
const ALPHABETS = {
  sv: 'abdefghijklmnoprstuvyåäö',
  en: 'abcdefghijklmnoprstuvwyz',
}

// Letters a beginner mixes up, by shape or by sound.
const ALIKE_GROUPS = ['bdpq', 'mn', 'eiy', 'eä', 'aäå', 'oöåu', 'gkj', 'td', 'fv', 'szc', 'ck', 'lr', 'uv', 'hn']

function alikeLetters(letter) {
  const alike = new Set()
  for (const group of ALIKE_GROUPS) {
    if (group.includes(letter)) {
      for (const other of group) {
        alike.add(other)
      }
    }
  }
  alike.delete(letter)
  return alike
}

function pickWrongLetters(answer, distractors, lang, rng) {
  const alphabet = [...ALPHABETS[lang]].filter((letter) => letter !== answer)
  const alike = [...alikeLetters(answer)].filter((letter) => alphabet.includes(letter))
  const others = shuffle(
    alphabet.filter((letter) => !alike.includes(letter)),
    rng,
  )
  const pool = distractors === 'near' ? [...shuffle(alike, rng), ...others] : others
  return pool.slice(0, CHOICES - 1)
}

/** Positions in a word that hold a letter (not a space or hyphen). */
function letterPositions(word) {
  return [...word].flatMap((char, index) => (/\p{L}/u.test(char) ? [index] : []))
}

/** The word with the letter at `index` replaced by a gap. */
export function withGap(word, index) {
  const chars = [...word]
  chars[index] = '_'
  return chars.join('')
}

/**
 * @param {{ maxLength?: number, position: 'first'|'any', case: 'upper'|'lower', distractors: 'far'|'near' }} letter
 * @param {'sv'|'en'} lang
 * @param {() => number} rng
 */
export function createLetterQuestion(letter, lang, rng) {
  const pool = WORDS.filter((word) => letterCount(word[lang]) <= (letter.maxLength ?? Infinity))
  const { emoji, [lang]: word } = pool[Math.floor(rng() * pool.length)]
  const positions = letterPositions(word)
  const index = letter.position === 'first' ? positions[0] : positions[Math.floor(rng() * positions.length)]
  const answer = [...word][index]
  const wrong = pickWrongLetters(answer, letter.distractors, lang, rng)
  return {
    op: 'letter',
    terms: [emoji, withGap(word, index), answer],
    unknown: 2,
    answer,
    choices: shuffle([answer, ...wrong], rng),
    // A hint takes away two of the wrong options.
    hintRemoves: shuffle(wrong, rng).slice(0, 2),
    case: letter.case,
    key: `${emoji}=${withGap(word, index)}`,
  }
}
