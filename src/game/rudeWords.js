/**
 * Rude or vulgar Swedish words a misspelling must not contain, used by
 * misspellings.test.js and scripts/find-misspellings.mjs.
 */
export const RUDE_WORDS = [
  'bajs',
  'bög',
  'fan',
  'fis',
  'fitt',
  'hora',
  'kiss',
  'knull',
  'kuk',
  'kåt',
  'neger',
  'patt',
  'piss',
  'pitt',
  'pung',
  'runk',
  'röv',
  'sket',
  'skit',
  'snopp',
]

/**
 * The rude words `misspelled` holds that `word` doesn't (a word's own
 * are fine: elefant has "fan").
 */
export function rudeIn(misspelled, word) {
  return RUDE_WORDS.filter((rude) => misspelled.includes(rude) && !word.includes(rude))
}
