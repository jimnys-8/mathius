import { useEffect } from 'react'
import { showWord } from '../game/reading.js'
import { parseClock } from '../game/time.js'
import { useI18n } from '../i18n/i18n.js'
import AnalogClock from './AnalogClock.jsx'
import DigitalTime from './DigitalTime.jsx'
import './ChoiceAnswers.css'

const DOTS_PER_ROW = 5
const NONE = []

/**
 * A count shown as dots in rows of five, like a ten frame. Rows fill from
 * the bottom up, so the dots of every button rest on the same line.
 */
function DotCount({ count, rows }) {
  const width = DOTS_PER_ROW
  return (
    <svg className="choice-dots" viewBox={`0 0 ${width} ${rows}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <circle
          key={index}
          cx={(index % DOTS_PER_ROW) + 0.5}
          cy={rows - Math.floor(index / DOTS_PER_ROW) - 0.5}
          r={0.38}
        />
      ))}
    </svg>
  )
}

/** The choice a key press picks, or undefined. */
function choiceForKey(key, choices, byValue) {
  const digit = Number(key)
  if (!/^\d$/.test(key)) {
    return undefined
  }
  if (byValue) {
    // Whole-number choices are picked by their number; 0 stands for 10.
    const value = digit === 0 ? 10 : digit
    return choices.includes(value) ? value : undefined
  }
  return choices[digit - 1]
}

/**
 * Big buttons for multiple-choice answers. Whole numbers are picked with
 * their own key (7 for 7, 0 for 10); other choices with keys 1–4, shown
 * on the buttons. Once answered, the right choice turns green and a wrong
 * pick red.
 *
 * With `as="dots"` each choice shows that many dots with its numeral
 * below. With `numbersFirst` off, the numeral only appears once answered,
 * for questions where it would give the answer away.
 *
 * With `as="words"` the choices are words, shown in `wordCase` (single
 * letters with `as="letters"`), and with
 * `as="emoji"` they are emojis. Choices in `removed` (taken away by a
 * hint) can't be picked.
 *
 * For telling the time: `as="digital"` shows digital times ("8:20"),
 * `as="phrases"` times in words, and `as="clock"` analog clocks for
 * times written "8:20", with `clock` options for AnalogClock.
 */
export default function ChoiceAnswers({
  choices,
  answer,
  chosen,
  revealed,
  onChoose,
  as = 'numbers',
  numbersFirst = true,
  wordCase = 'lower',
  removed = NONE,
  clock = undefined,
}) {
  const { t, formatNumber } = useI18n()
  const byValue = choices.every((choice) => Number.isInteger(choice))
  const dots = as === 'dots'
  const rows = dots ? Math.ceil(Math.max(...choices) / DOTS_PER_ROW) : 0
  // Word buttons share one text size, set by the longest word.
  const chars = as === 'words' ? Math.max(4, ...choices.map((choice) => [...choice].length)) : undefined

  useEffect(() => {
    if (revealed) {
      return undefined
    }
    const handleKey = (event) => {
      const choice = choiceForKey(event.key, choices, byValue)
      if (choice !== undefined && !event.repeat && !removed.includes(choice)) {
        onChoose(choice)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [choices, byValue, revealed, onChoose, removed])

  let label = formatNumber
  if (as === 'words' || as === 'letters') {
    label = (choice) => showWord(choice, wordCase)
  } else if (as === 'emoji' || as === 'phrases') {
    label = (choice) => choice
  } else if (as === 'digital') {
    label = (choice) => <DigitalTime text={choice} />
  } else if (as === 'clock') {
    label = (choice) => <AnalogClock {...parseClock(choice)} {...clock} />
  }

  return (
    <div
      className={`choice-answers is-${as}`}
      style={chars ? { '--chars': chars } : undefined}
      role="group"
      aria-label={t('play.chooseAnswer')}
    >
      {choices.map((choice, index) => {
        let state = ''
        if (revealed) {
          state = choice === answer ? ' is-correct' : choice === chosen ? ' is-wrong' : ' is-dim'
        }
        const isRemoved = removed.includes(choice)
        return (
          <button
            key={choice}
            type="button"
            className={`choice-answer${state}${isRemoved ? ' is-removed' : ''}`}
            disabled={revealed || isRemoved}
            onClick={() => onChoose(choice)}
            aria-label={dots ? t('play.dotCount', { count: choice }) : as === 'clock' ? choice : undefined}
          >
            {!byValue && (
              <span className="choice-answer-key" aria-hidden="true">
                {index + 1}
              </span>
            )}
            {dots ? (
              <>
                <DotCount count={choice} rows={rows} />
                <span className={`choice-answer-number${revealed || numbersFirst ? '' : ' is-hidden'}`} aria-hidden="true">
                  {formatNumber(choice)}
                </span>
              </>
            ) : (
              label(choice)
            )}
          </button>
        )
      })}
    </div>
  )
}
