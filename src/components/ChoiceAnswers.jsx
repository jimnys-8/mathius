import { useEffect } from 'react'
import { showWord } from '../game/reading.js'
import { parseClock } from '../game/time.js'
import { useI18n } from '../i18n/i18n.js'
import AnalogClock from './AnalogClock.jsx'
import DigitalTime from './DigitalTime.jsx'
import Figure from './Figure.jsx'
import { FractionChoice } from './Fraction.jsx'
import './ChoiceAnswers.css'

const DOTS_PER_ROW = 5
const NONE = []

/**
 * A count shown as dots in rows of five, like a ten frame. Rows fill from
 * the bottom up, so the dots of every button rest on the same line.
 */
function DotCount({ count, rows, perRow = DOTS_PER_ROW }) {
  return (
    <svg className={`choice-dots${perRow < DOTS_PER_ROW ? ' is-square' : ''}`} viewBox={`0 0 ${perRow} ${rows}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <circle
          key={index}
          cx={(index % perRow) + 0.5}
          cy={rows - Math.floor(index / perRow) - 0.5}
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
 * below, in rows of five or in the `dotGrid` given as [per row, rows].
 *  With `numbersFirst` off, the numeral only appears once answered,
 * for questions where it would give the answer away.
 *
 * With `as="words"` the choices are words, shown in `wordCase` (single
 * letters with `as="letters"`), and with
 * `as="emoji"` they are emojis. Choices in `removed` (taken away by a
 * hint) can't be picked.
 *
 * For telling the time: `as="digital"` shows digital times ("8:20"),
 * `as="phrases"` times in words, and `as="clock"` analog clocks for
 * times written "8:20", with `clock` options for AnalogClock. With
 * `as="fractions"` the choices are fractions ("stacked:3/4", see
 * fractions.js). With `as="figures"` they are figure keys (see shapes.js),
 * drawn, with `figurePips` for Figure's `pips`.
 *
 * `waiting` keeps the buttons' room but hides them, for a step answered
 * elsewhere (a letter tapped in the word) before these are asked.
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
  dotGrid = undefined,
  figurePips = false,
  waiting = false,
}) {
  const { t, formatNumber } = useI18n()
  const byValue = choices.every((choice) => Number.isInteger(choice))
  const dots = as === 'dots'
  const [perRow, rows] = dotGrid ?? [DOTS_PER_ROW, dots ? Math.ceil(Math.max(...choices) / DOTS_PER_ROW) : 0]
  // Word buttons share one text size, set by the longest word.
  const chars = as === 'words' ? Math.max(4, ...choices.map((choice) => [...choice].length)) : undefined

  useEffect(() => {
    if (revealed || waiting) {
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
  }, [choices, byValue, revealed, waiting, onChoose, removed])

  let label = formatNumber
  if (as === 'words' || as === 'letters') {
    label = (choice) => showWord(choice, wordCase)
  } else if (as === 'emoji' || as === 'phrases') {
    label = (choice) => choice
  } else if (as === 'digital') {
    label = (choice) => <DigitalTime text={choice} />
  } else if (as === 'fractions') {
    label = (choice) => <FractionChoice choice={choice} />
  } else if (as === 'figures') {
    label = (choice) => <Figure figure={choice} pips={figurePips} className="choice-figure" />
  } else if (as === 'clock') {
    label = (choice) => <AnalogClock {...parseClock(choice)} {...clock} />
  }

  return (
    <div
      className={`choice-answers is-${as}${waiting ? ' is-waiting' : ''}`}
      // Capitals are wider than small letters.
      style={chars ? { '--chars': chars, '--char-width': wordCase === 'upper' ? 0.8 : 0.66 } : undefined}
      role="group"
      aria-label={t('play.chooseAnswer')}
      aria-hidden={waiting || undefined}
      inert={waiting || undefined}
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
            disabled={revealed || waiting || isRemoved}
            onClick={() => onChoose(choice)}
            aria-label={
              dots ? t('play.dotCount', { count: choice }) : as === 'clock' ? choice : as === 'figures' ? String(index + 1) : undefined
            }
          >
            {!byValue && (
              <span className="choice-answer-key" aria-hidden="true">
                {index + 1}
              </span>
            )}
            {dots ? (
              <>
                <DotCount count={choice} rows={rows} perRow={perRow} />
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
