/**
 * Reading words aloud with the browser's speech synthesis (Web Speech
 * API), for the English words game.
 *
 * Browsers only speak after the page has been tapped, and iOS only once
 * something was spoken from within a tap, so `unlockSpeech()` speaks a
 * silent utterance on the first tap anywhere. After that, words can be
 * read as they appear, not just when a button is pressed.
 *
 * Chrome lists no voices the first time it is asked and loads them in
 * the background (about half a second), and without a voice it reads
 * with the system's, which gives English words a Swedish accent on a
 * Swedish computer. So `unlockSpeech()`
 * also starts loading them, and a word asked for before they are there
 * waits for them.
 */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

/** Whether this browser can read aloud at all. */
export const canSpeak = Boolean(synth) && typeof SpeechSynthesisUtterance !== 'undefined'

// A bit slower than normal, for children learning the words.
const RATE = 0.85

// How long a word waits for the voices to load before it is read anyway.
const VOICES_WAIT_MS = 1500

const normalized = (lang) => lang.replace('_', '-').toLowerCase()

/**
 * Voices known to sound natural, on Apple devices, in Chrome and on
 * Windows. Macs and iPhones also have robotic novelty voices (Albert,
 * Zarvox, Bubbles) for US English, whose names are translated with the
 * system's language, so the good ones are picked by name instead.
 */
const GOOD_VOICES =
  /^(Samantha|Ava|Allison|Susan|Nicky|Zoe|Evan|Nathan|Joelle|Noelle|Aaron|Tom|Alva|Klara|Oskar|Google|Microsoft (Aria|Jenny|Guy|Ana|Michelle|Sofie|Mattias|Hillevi))\b/
// Downloaded higher-quality versions of the same voices.
const BETTER_VOICES = /\((premium|enhanced|förbättrad)\)|natural|neural|online/i

let voices = []
const loadVoices = () => {
  voices = synth.getVoices()
}

/**
 * A voice for a locale like 'en-US': a natural one on the device if there
 * is one, else any for the locale or its language, since reading with the
 * system's voice gives it the wrong accent. None only if the device has
 * none. Desktop Chrome's online Google voices come after the device's:
 * when one fails, Chrome reads with the system's voice instead, and they
 * don't work offline.
 */
function voiceFor(locale) {
  const forLocale = voices.filter((voice) => normalized(voice.lang) === normalized(locale))
  const score = (voice) =>
    (GOOD_VOICES.test(voice.name) ? 4 : 0) +
    (voice.localService ? 3 : 0) +
    (BETTER_VOICES.test(voice.name) ? 2 : 0) +
    (voice.default ? 1 : 0)
  const best = [...forLocale].sort((a, b) => score(b) - score(a))[0]
  const language = locale.slice(0, 2).toLowerCase()
  return best ?? voices.find((voice) => normalized(voice.lang).startsWith(language))
}

function speakNow(text, locale) {
  if (synth.speaking || synth.pending) {
    synth.cancel()
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = locale
  const voice = voiceFor(locale)
  if (voice) {
    utterance.voice = voice
  }
  utterance.rate = RATE
  synth.speak(utterance)
}

// A word waiting for the voices to load, and its timeout.
let waiting = null

function stopWaiting() {
  if (waiting) {
    clearTimeout(waiting.timer)
    synth.removeEventListener('voiceschanged', waiting.speak)
    waiting = null
  }
}

/** Reads `text` aloud in a locale ('en-US', 'sv-SE'), cutting off whatever was being read. */
export function speak(text, locale) {
  if (!canSpeak) {
    return
  }
  stopWaiting()
  if (voices.length === 0) {
    loadVoices()
  }
  if (voices.length > 0) {
    speakNow(text, locale)
    return
  }
  const speakLater = () => {
    stopWaiting()
    loadVoices()
    speakNow(text, locale)
  }
  waiting = { speak: speakLater, timer: setTimeout(speakLater, VOICES_WAIT_MS) }
  synth.addEventListener('voiceschanged', speakLater)
}

/** Stops reading aloud, or a word from being read once the voices are in. */
export function stopSpeaking() {
  if (!canSpeak) {
    return
  }
  stopWaiting()
  if (synth.speaking || synth.pending) {
    synth.cancel()
  }
}

const UNLOCK_EVENTS = ['touchend', 'click', 'keydown']

/** Starts loading the voices, and lets speech start without a tap later on, once the page has been tapped. */
export function unlockSpeech() {
  if (!canSpeak) {
    return
  }
  loadVoices()
  synth.addEventListener('voiceschanged', loadVoices)
  const unlock = () => {
    for (const type of UNLOCK_EVENTS) {
      window.removeEventListener(type, unlock, true)
    }
    if (!synth.speaking && !synth.pending) {
      const silent = new SpeechSynthesisUtterance('')
      silent.volume = 0
      synth.speak(silent)
    }
  }
  for (const type of UNLOCK_EVENTS) {
    window.addEventListener(type, unlock, true)
  }
}
