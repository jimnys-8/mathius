/**
 * Reading words aloud with the browser's speech synthesis (Web Speech
 * API), for the English words game.
 *
 * Browsers only speak after the page has been tapped, and iOS only once
 * something was spoken from within a tap, so `unlockSpeech()` speaks a
 * silent utterance on the first tap anywhere. After that, words can be
 * read as they appear, not just when a button is pressed.
 */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

/** Whether this browser can read aloud at all. */
export const canSpeak = Boolean(synth) && typeof SpeechSynthesisUtterance !== 'undefined'

// A bit slower than normal, for children learning the words.
const RATE = 0.85

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

/**
 * A natural voice for a locale like 'en-US', or none, so the device picks
 * its own default for the language (Android names its voices by language).
 */
function voiceFor(locale) {
  const score = (voice) => (BETTER_VOICES.test(voice.name) ? 2 : 0) + (voice.default ? 1 : 0)
  return synth
    .getVoices()
    .filter((voice) => normalized(voice.lang) === normalized(locale) && GOOD_VOICES.test(voice.name))
    .sort((a, b) => score(b) - score(a))[0]
}

/** Reads `text` aloud in a locale ('en-US', 'sv-SE'), cutting off whatever was being read. */
export function speak(text, locale) {
  if (!canSpeak) {
    return
  }
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

/** Stops reading aloud. */
export function stopSpeaking() {
  if (canSpeak && (synth.speaking || synth.pending)) {
    synth.cancel()
  }
}

const UNLOCK_EVENTS = ['touchend', 'click', 'keydown']

/** Lets speech start without a tap later on, once the page has been tapped. */
export function unlockSpeech() {
  if (!canSpeak) {
    return
  }
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
