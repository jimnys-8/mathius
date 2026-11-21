import { useEffect } from 'react'
import { showWord } from '../game/reading.js'
import { useI18n } from '../i18n/i18n.js'
import { LANGUAGES } from '../i18n/strings.js'
import { canSpeak, speak, stopSpeaking } from '../speech.js'
import { HINT_FRAME } from '../viz/scenes.js'
import { useSolutionSettled } from './useSolutionSettled.js'
import './TranslateCard.css'

const localeOf = (lang) => LANGUAGES.find((language) => language.id === lang).locale

// The word is read as the card slides in.
const SPEAK_DELAY_MS = 150

/**
 * The picture for an English-words question: the word to translate, big,
 * with a button that reads it aloud. It is also read as it appears, and
 * once answered the translation is read too. The emoji shows with a hint
 * (when the answers are words) and with the solution, the translation
 * with the solution. Like Visualization, calls `onSettled(step)` once
 * the solution is shown.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  shows the hint from HINT_FRAME, the solution from SOLUTION_FRAME
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function TranslateCard({ question, step, onSettled }) {
  const { t } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const [word] = question.terms
  const shownWord = showWord(word, question.case)
  const translation = showWord(question.translation, question.case)
  // With pictures to pick from, showing the emoji would give the answer away.
  const emojiShown = solved || (step >= HINT_FRAME && question.as === 'words')

  const say = () => speak(word, localeOf(question.from))

  // Read the word as it appears (the card is remade for each question).
  // After a moment, so a card set up twice in a row (React's strict mode,
  // in development) doesn't start reading twice.
  useEffect(() => {
    const timer = setTimeout(() => speak(word, localeOf(question.from)), SPEAK_DELAY_MS)
    return () => {
      clearTimeout(timer)
      stopSpeaking()
    }
  }, [word, question.from])

  // Once answered, the answer in the player's own language.
  useEffect(() => {
    if (solved) {
      speak(question.translation, localeOf(question.to))
    }
  }, [solved, question.translation, question.to])

  return (
    <div className={`translate-card${solved ? ' is-solved' : ''}`}>
      <div className="translate-given">
        <span className="translate-word" lang={question.from} style={{ '--chars': Math.max(4, [...shownWord].length) }}>
          {shownWord}
        </span>
        {canSpeak && (
          <button type="button" className="btn translate-say" onClick={say} aria-label={t('play.sayAgain')} title={t('play.sayAgain')}>
            🔊
          </button>
        )}
      </div>
      <span className={`translate-emoji${emojiShown ? ' is-shown' : ''}`} aria-hidden={!emojiShown}>
        {question.emoji}
      </span>
      <span
        className="translate-answer"
        lang={question.to}
        aria-hidden={!solved}
        style={{ '--chars': Math.max(6, [...translation].length) }}
      >
        {translation}
      </span>
    </div>
  )
}
