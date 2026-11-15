/**
 * Telling the time, in four games:
 *
 * - 'clockDigital': an analog clock is shown; pick its digital time.
 * - 'clockWords':   an analog clock is shown; pick the time in words.
 * - 'digitalWords': a digital time is shown; pick it in words.
 * - 'digitalClock': a digital time is shown; pick its analog clock.
 *
 * Times are an hour (0–23) and a minute. Analog clocks are written
 * "8:20" (12-hour, as `parseClock` reads it), digital times "8:20" or,
 * on 24-hour levels, "08:20" and "20:20". An analog clock can't tell
 * 8:20 from 20:20, and both read "tjugo över åtta", so the options of a
 * question always show different times on a 12-hour face.
 *
 * Wrong options are the usual mix-ups: the hands swapped (8:20 for
 * 4:40), the hour one off, "över" for "i" (8:20 for 8:40), and the
 * minutes a step off.
 */

const CHOICES = 4

const HOUR_WORDS = {
  sv: ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'],
  en: ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
}

// Five-minute steps in words; {h} is the hour, {next} the next hour.
const MINUTE_WORDS = {
  sv: [
    '{h}',
    'fem över {h}',
    'tio över {h}',
    'kvart över {h}',
    'tjugo över {h}',
    'fem i halv {next}',
    'halv {next}',
    'fem över halv {next}',
    'tjugo i {next}',
    'kvart i {next}',
    'tio i {next}',
    'fem i {next}',
  ],
  en: [
    "{h} o'clock",
    'five after {h}',
    'ten after {h}',
    'quarter after {h}',
    'twenty after {h}',
    'twenty-five after {h}',
    'half past {h}',
    'twenty-five to {next}',
    'twenty to {next}',
    'quarter to {next}',
    'ten to {next}',
    'five to {next}',
  ],
}

/** The hour on a 12-hour face, 1–12. */
export function hour12(hour) {
  return hour % 12 || 12
}

const pad = (n) => String(n).padStart(2, '0')

/** A time as an analog clock shows it: "8:20". */
export function clockText(hour, minute) {
  return `${hour12(hour)}:${pad(minute)}`
}

/** Reads "8:20" (or "20:20") back into hour and minute. */
export function parseClock(text) {
  const [hour, minute] = text.split(':').map(Number)
  return { hour, minute }
}

/** A digital time: "8:20", or "08:20" and "20:20" with a 24-hour clock. */
export function digitalText(hour, minute, hour24 = false) {
  return hour24 ? `${pad(hour)}:${pad(minute)}` : clockText(hour, minute)
}

/** A time in words, in five-minute steps: "tjugo över åtta". */
export function timeWords(hour, minute, lang) {
  const words = HOUR_WORDS[lang] ?? HOUR_WORDS.sv
  const pattern = (MINUTE_WORDS[lang] ?? MINUTE_WORDS.sv)[Math.round(minute / 5) % 12]
  return pattern.replace('{h}', words[hour12(hour)]).replace('{next}', words[hour12(hour + 1)])
}

function shuffle(items, rng) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

const randomItem = (items, rng) => items[Math.floor(rng() * items.length)]

/** Usual mix-ups of a time, as [hour12, minute] pairs. */
function mixUps(h, m, minutes) {
  const step = minutes.length > 1 ? minutes[1] - minutes[0] : 60
  const candidates = [
    // The hands swapped: the hour read off the minute hand and back.
    m % 5 === 0 ? [m / 5 || 12, (h * 5) % 60] : null,
    // The hour one off, often from an hour hand halfway to the next.
    [hour12(h + 1), m],
    [hour12(h + 11), m],
    // "över" and "i" mixed up: 8:20 and 8:40.
    [h, (60 - m) % 60],
    // The minutes a step off.
    [h, (m + step) % 60],
    [h, (m + 60 - step) % 60],
  ]
  return candidates.filter((time) => time && minutes.includes(time[1]))
}

/**
 * @param {'clockDigital'|'clockWords'|'digitalWords'|'digitalClock'} op
 * @param {{ minutes: number[], hour24?: boolean, numbers?: boolean }} level
 * @param {'sv'|'en'} lang
 * @param {() => number} rng
 */
export function createTimeQuestion(op, { minutes, hour24 = false, numbers = true }, lang, rng) {
  const h = 1 + Math.floor(rng() * 12)
  const m = randomItem(minutes, rng)
  // On 24-hour levels, morning or afternoon; every option keeps to it.
  const afternoon = hour24 && rng() < 0.5 ? 12 : 0
  const hour = (h % 12) + afternoon

  const wrong = []
  const seen = new Set([`${h}:${m}`])
  const add = ([wh, wm]) => {
    if (!seen.has(`${wh}:${wm}`) && wrong.length < CHOICES - 1) {
      seen.add(`${wh}:${wm}`)
      wrong.push([wh, wm])
    }
  }
  shuffle(mixUps(h, m, minutes), rng).forEach(add)
  while (wrong.length < CHOICES - 1) {
    add([1 + Math.floor(rng() * 12), randomItem(minutes, rng)])
  }

  const shownAnalog = op === 'clockDigital' || op === 'clockWords'
  const asChoice = (wh, wm) => {
    const choiceHour = (wh % 12) + afternoon
    if (op === 'clockDigital') {
      return digitalText(choiceHour, wm, hour24)
    }
    if (op === 'digitalClock') {
      return clockText(choiceHour, wm)
    }
    return timeWords(choiceHour, wm, lang)
  }

  const shown = shownAnalog ? clockText(hour, m) : digitalText(hour, m, hour24)
  const answer = asChoice(h, m)
  return {
    op,
    terms: [shown, answer],
    unknown: 1,
    answer,
    choices: shuffle([answer, ...wrong.map(([wh, wm]) => asChoice(wh, wm))], rng),
    time: { hour, minute: m },
    numbers,
    key: `${op}:${shown}=${answer}`,
  }
}
