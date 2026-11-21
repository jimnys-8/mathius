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

/** The best voice for a locale like 'en-US': on the device, then any for it, then any for its language. */
function voiceFor(locale) {
  const voices = synth.getVoices()
  const exact = voices.filter((voice) => normalized(voice.lang) === normalized(locale))
  const language = locale.slice(0, 2).toLowerCase()
  return (
    exact.find((voice) => voice.localService) ??
    exact[0] ??
    voices.find((voice) => normalized(voice.lang).startsWith(language))
  )
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
