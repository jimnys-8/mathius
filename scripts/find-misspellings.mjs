// Finds real words that differ from each emoji word by one letter, as a
// starting point for src/game/misspellings.js.
//
//   node scripts/find-misspellings.mjs <dictionary.jsonl> [out.txt]
//
// The dictionary is one JSON object per line with the word in
// `normaliserat_ord` (as in Språkbanken's so2009-ord.jsonl). Prints one
// row per word, in the table's format: words where the changed letter
// looks or sounds like the right one go in the second column. Words with
// capitals (names), hyphens or spaces are skipped, and so are rude ones.

import { readFileSync, writeFileSync } from 'node:fs'
import { alikeLetters } from '../src/game/letters.js'
import { rudeIn } from '../src/game/rudeWords.js'
import { WORDS } from '../src/game/words.js'

const [dictionaryPath, outPath] = process.argv.slice(2)
if (!dictionaryPath) {
  console.error('Usage: node scripts/find-misspellings.mjs <dictionary.jsonl> [out.txt]')
  process.exit(1)
}

// Dictionary words by length in letters, each once.
const byLength = new Map()
for (const line of readFileSync(dictionaryPath, 'utf8').split('\n')) {
  if (!line.trim()) {
    continue
  }
  const word = JSON.parse(line).normaliserat_ord
  if (typeof word !== 'string' || !/^\p{Ll}+$/u.test(word)) {
    continue
  }
  const length = [...word].length
  if (!byLength.has(length)) {
    byLength.set(length, new Set())
  }
  byLength.get(length).add(word)
}

/** The changed letters if `other` differs from `word` in exactly one place. */
function oneChange(word, other) {
  const a = [...word]
  const b = [...other]
  const changed = a.flatMap((letter, index) => (letter === b[index] ? [] : [index]))
  return changed.length === 1 ? { right: a[changed[0]], wrong: b[changed[0]] } : null
}

const emojiOf = new Map(WORDS.map((word) => [word.sv, word.emoji]))
const rows = []
let empty = 0
for (const { emoji, sv: word } of WORDS) {
  const far = []
  const near = []
  for (const other of byLength.get([...word].length) ?? []) {
    const change = oneChange(word, other)
    if (!change || rudeIn(other, word).length > 0) {
      continue
    }
    // Words that are emoji words themselves get their emoji, for fun.
    const shown = emojiOf.has(other) ? `${other}${emojiOf.get(other)}` : other
    ;(alikeLetters(change.right).has(change.wrong) ? near : far).push(shown)
  }
  if (far.length + near.length === 0) {
    empty += 1
    rows.push(`  // ${emoji} ${word}: no one-letter words`)
  } else {
    rows.push(`  // ${emoji} ${far.length + near.length}`, `  ['${word}', '${far.join(' ')}', '${near.join(' ')}'],`)
  }
}

const out = rows.join('\n') + '\n'
if (outPath) {
  writeFileSync(outPath, out)
  console.log(`Wrote ${WORDS.length} words (${empty} without matches) to ${outPath}`)
} else {
  process.stdout.write(out)
}
