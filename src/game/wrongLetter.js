import { pickWrongLetters } from './letters.js'
import { MISSPELLINGS } from './misspellings.js'
import { shuffle } from './reading.js'

/**
 * "Find the mistake": an emoji and its word spelled with one wrong
 * letter (🐈 kött). It's answered in two steps (see Question `steps`):
 * first the child taps the wrong letter in the word, then picks the right
 * one from four. terms = [emoji, the misspelled word, the answer], and
 * `word` is the right word.
 *
 * Step one's choices are the letters' positions as strings ("0" is the
 * first letter), and its hint greys out about half of the right ones.
 * Step two's choices never hold the wrong letter. The answer is the two
 * steps' answers joined ("1a"); a wrong tap ends the question with just
 * the tapped position as the answer given.
 *
 * The words are always Swedish: the misspellings are hand-picked.
 *
 * `level.wrongLetter`:
 * - maxLength: the longest words used
 * - list: 'far' for the easier misspellings, 'near' for the harder ones
 *   (the columns in misspellings.js)
 * - case: 'upper' or 'lower'
 * - distractors: the wrong letters to pick from, as in letters.js
 */

const LANG = 'sv'

/** The position where two words of the same length differ. */
function changedIndex(word, misspelled) {
  const right = [...word]
  return [...misspelled].findIndex((letter, index) => letter !== right[index])
}

/** The answer "1a" split into the tapped position and the letter picked. */
export function parseWrongLetterAnswer(answer) {
  const [, index, letter = ''] = /^(\d+)(.*)$/.exec(answer) ?? []
  return { index: Number(index), letter }
}

/**
 * The misspelled word with an answer's letter put in at its position
 * ("kött" with "1a" is "katt"); with only a position, unchanged.
 */
export function fixWrongLetter(misspelled, answer) {
  const { index, letter } = parseWrongLetterAnswer(answer)
  const chars = [...misspelled]
  if (letter) {
    chars[index] = letter
  }
  return chars.join('')
}

/**
 * @param {{ maxLength?: number, list: 'far'|'near', case: 'upper'|'lower', distractors: 'far'|'near' }} level
 * @param {() => number} rng
 */
export function createWrongLetterQuestion(level, rng) {
  const pool = MISSPELLINGS.filter(
    (entry) => entry[level.list].length > 0 && [...entry.word].length <= (level.maxLength ?? Infinity),
  )
  const { emoji, word, [level.list]: misspellings } = pool[Math.floor(rng() * pool.length)]
  const misspelled = misspellings[Math.floor(rng() * misspellings.length)]
  const index = changedIndex(word, misspelled)
  const right = [...word][index]
  const wrongLetter = [...misspelled][index]

  const positions = [...misspelled].map((_, position) => String(position))
  const rightPositions = positions.filter((position) => position !== String(index))
  const tap = {
    answer: String(index),
    choices: positions,
    // The hint greys out about half of the right letters.
    hintRemoves: shuffle(rightPositions, rng).slice(0, Math.ceil(rightPositions.length / 2)),
    inWord: true,
  }
  const wrong = pickWrongLetters(right, level.distractors, LANG, rng, [wrongLetter])
  const pick = {
    answer: right,
    choices: shuffle([right, ...wrong], rng),
    hintRemoves: shuffle(wrong, rng).slice(0, 2),
  }

  return {
    op: 'wrongLetter',
    terms: [emoji, misspelled, `${index}${right}`],
    unknown: 2,
    answer: `${index}${right}`,
    word,
    steps: [tap, pick],
    // The first step's, so the question reads as one with choices.
    choices: tap.choices,
    hintRemoves: tap.hintRemoves,
    case: level.case,
    key: `${emoji}=${misspelled}`,
  }
}
