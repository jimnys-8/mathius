import { WORDS } from './words.js'

/**
 * Misspelled words for "Vilken bokstav är fel?": the child taps the
 * wrong letter, then picks the right one.
 *
 * One row per word: the Swedish word (spelled as in words.js), then its
 * misspellings in two groups, separated by spaces:
 * - clearly wrong: a letter that neither looks nor sounds like the right
 *   one (katt → kamt), for the easier levels
 * - looks or sounds alike: b d p q, m n, e ä, o å u, i y, g k j, t d,
 *   f v, s c, l r (the ALIKE_GROUPS in letters.js), for the hardest level
 *
 * Rules for a misspelling, checked by misspellings.test.js:
 * - the same length as the word, with exactly one letter changed
 * - in the right group (alike swaps only under "looks or sounds alike")
 * - not another word in words.js, and no rude words in it
 * Not checked, so keep an eye out: it shouldn't be some other real
 * Swedish word (kanin → kamin, kamel → kanel), since then it doesn't
 * look misspelled.
 *
 * Short words (at most 4 letters) are the ones the easiest level uses.
 */

const TABLE = [
  // word        clearly wrong                looks or sounds alike

  // Short words
  ['katt', 'kamt kett kapt', 'kadt katd'],
  ['hund', 'vund hupd hurd', 'hunb humd hond'],
  ['gris', 'grös grik dris', 'grys glis gres'],
  ['häst', 'hust hämt häsk', 'hest håst häsd'],
  ['apa', 'ama ata apu', 'aba ada åpa'],
  ['orm', 'osm irm orf', 'orn urm örm'],
  ['räv', 'räm räk täv', 'räf råv'],
  ['fisk', 'fask fimk tisk', 'fysk fesk'],
  ['anka', 'anfa anko onka', 'amka anga ånka'],
  ['ost', 'ast ist olt', 'osd åst ust'],
  ['kaka', 'kafa kama kyka', 'kaga gaka kåka'],
  ['korv', 'kirv korm kosv', 'korf kurv kårv'],
  ['sked', 'skud skem skad', 'skeb skäd skep'],
  ['bröd', 'bröm brid fröd', 'dröd bröb brod'],
  ['träd', 'trid träm kräd', 'tred träb'],

  // Longer words
  ['banan', 'bunan bapan banon', 'baman danan banam'],
  ['tomat', 'tomut tokat timat', 'domat tomad tåmat'],
  ['morot', 'mokot mirot morat', 'norot morod morut'],
  ['groda', 'grida grofa groma', 'groba kroda grota'],
  ['uggla', 'iggla aggla ugglo', 'oggla ukgla uggra'],
  ['lejon', 'lajon lefon lejan', 'läjon lejom lejun'],
  ['zebra', 'zabra zemra zebro', 'zedra zepra zäbra'],
  ['panda', 'pinda panfa pando', 'pamda panba pända'],
  ['tiger', 'tiser tuger tifer', 'tiker tijer tigär'],
  ['kanin', 'kasin konin kanik', 'kanim ganin kanyn'],
  ['björn', 'bjösn bjirn björs', 'djörn björm bjurn'],
  ['äpple', 'upple ipple äpplo', 'epple äbple äpplä'],
  ['citron', 'cikron catron citran', 'sitron kitron citrom'],
  ['gurka', 'girka gurma gurko', 'kurka gorka gurga'],
  ['humla', 'hamla hukla humpa', 'homla hunla humra'],
  ['snigel', 'snagel snisel snigal', 'snikel snygel smigel'],
  ['fjäril', 'fjuril fjäsil fjäral', 'fjeril fjäryl vjäril'],
  ['kamel', 'kumel kasel kamol', 'kamäl kåmel kamer'],
  ['giraff', 'goraff gisaff giruff', 'jiraff kiraff gyraff'],
  ['pingvin', 'pangvin pingmin pingvan', 'pinkvin pingfin bingvin'],
  ['tårta', 'tirta tårfa tårti', 'torta tårda tålta'],
  ['choklad', 'chiklad chomlad chokled', 'choglad choklat chuklad'],
  ['pizza', 'puzza pozza pizzo', 'bizza pezza pyzza'],
  ['glass', 'gluss gliss glabs', 'glåss gläss'],
]

const split = (list) => list.split(/\s+/).filter(Boolean)

/**
 * @typedef {{ emoji: string, word: string, far: string[], near: string[] }} Misspelling
 * @type {Misspelling[]}
 */
export const MISSPELLINGS = TABLE.map(([word, far, near]) => ({
  emoji: WORDS.find((entry) => entry.sv === word)?.emoji,
  word,
  far: split(far),
  near: split(near),
}))
