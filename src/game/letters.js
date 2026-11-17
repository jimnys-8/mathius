import { shuffle } from './reading.js'
import { WORDS, letterCount } from './words.js'

/**
 * "Which letter?": an emoji and its word with one letter left out, and
 * the player picks the missing letter from four (terms = [emoji, the
 * word with "_" for the letter, the letter]). Answer and choices are
 * lowercase letters; `question.case` says how to show them.
 *
 * With two letters left out, the gaps are filled one at a time, left to
 * right: the question has a step per gap (see Question `steps`), and its
 * answer is the two letters in order ("at" for "k_t_").
 *
 * `level.letter`:
 * - maxLength, minLength: the longest and shortest words used
 * - gaps: how many letters are left out (1 or 2, never side by side)
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

/** Letters that look or sound like `letter`, not counting itself. */
export function alikeLetters(letter) {
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

/** The word with the letters at `indexes` replaced by gaps. */
export function withGap(word, ...indexes) {
  const chars = [...word]
  for (const index of indexes) {
    chars[index] = '_'
  }
  return chars.join('')
}

/**
 * A gapped word with its gaps filled by `letters` in order, left to
 * right; gaps left over stay "_" ("k_t_" with "a" is "kat_").
 */
export function fillGaps(gapped, letters) {
  const fill = [...letters]
  return [...gapped].map((char) => (char === '_' && fill.length > 0 ? fill.shift() : char)).join('')
}

/** Two letter positions that aren't side by side, smallest first. */
function pickTwoApart(positions, rng) {
  const pairs = positions.flatMap((first, index) =>
    positions.slice(index + 1).flatMap((second) => (second - first > 1 ? [[first, second]] : [])),
  )
  return pairs[Math.floor(rng() * pairs.length)]
}

/** One gap's answer, its four choices, and the two wrong ones a hint takes away. */
function gapStep(answer, distractors, lang, rng) {
  const wrong = pickWrongLetters(answer, distractors, lang, rng)
  return {
    answer,
    choices: shuffle([answer, ...wrong], rng),
    hintRemoves: shuffle(wrong, rng).slice(0, 2),
  }
}

/**
 * @param {{ maxLength?: number, minLength?: number, gaps?: 1|2, position: 'first'|'any', case: 'upper'|'lower', distractors: 'far'|'near' }} letter
 * @param {'sv'|'en'} lang
 * @param {() => number} rng
 */
export function createLetterQuestion(letter, lang, rng) {
  const pool = WORDS.filter((word) => {
    const length = letterCount(word[lang])
    return length <= (letter.maxLength ?? Infinity) && length >= (letter.minLength ?? 0)
  })
  const { emoji, [lang]: word } = pool[Math.floor(rng() * pool.length)]
  const positions = letterPositions(word)
  if (letter.gaps === 2) {
    const indexes = pickTwoApart(positions, rng)
    const steps = indexes.map((index) => gapStep([...word][index], letter.distractors, lang, rng))
    const answer = steps.map((step) => step.answer).join('')
    const gapped = withGap(word, ...indexes)
    return {
      op: 'letter',
      terms: [emoji, gapped, answer],
      unknown: 2,
      answer,
      steps,
      // The first gap's, so the question reads as one with choices.
      choices: steps[0].choices,
      hintRemoves: steps[0].hintRemoves,
      case: letter.case,
      key: `${emoji}=${gapped}`,
    }
  }
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
