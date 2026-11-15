import { parseClock } from '../game/time.js'
import { useI18n } from '../i18n/i18n.js'
import { HINT_FRAME } from '../viz/scenes.js'
import AnalogClock from './AnalogClock.jsx'
import DigitalTime from './DigitalTime.jsx'
import { useSolutionSettled } from './useSolutionSettled.js'
import './TimeCard.css'

/**
 * The picture for a clock question: the analog clock or the digital time
 * to read. A hint writes the minutes around the clock (and, for words,
 * shades the halves past and to the hour); a digital time gets its clock
 * shown as the hint. The solution adds the answer below.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function TimeCard({ question, step, onSettled }) {
  const { t } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const hinted = step >= HINT_FRAME
  const { op, numbers } = question
  const [shown, answer] = question.terms
  const words = op === 'clockWords' || op === 'digitalWords'
  const clockHint = hinted ? (words ? 'halves' : 'minutes') : null

  if (op === 'clockDigital' || op === 'clockWords') {
    const { hour, minute } = parseClock(shown)
    return (
      <div className={`time-card is-clock-first${solved ? ' is-solved' : ''}`}>
        <AnalogClock className="time-card-clock" hour={hour} minute={minute} numbers={numbers} hint={clockHint} label={t('viz.clock')} />
        <div className="time-card-answer">
          {op === 'clockDigital' ? (
            <DigitalTime className="time-card-digital is-small" text={answer} />
          ) : (
            <span className="time-card-words" style={{ '--chars': answer.length }}>
              {answer}
            </span>
          )}
        </div>
      </div>
    )
  }

  // A digital time: its clock appears with a hint (for words) or the solution.
  const { hour, minute } = question.time
  const showClock = solved || (op === 'digitalWords' && hinted)
  return (
    <div className={`time-card is-digital-first${solved ? ' is-solved' : ''}`}>
      <DigitalTime className="time-card-digital" text={shown} />
      <div className={`time-card-help${showClock ? ' is-shown' : ''}`}>
        <AnalogClock className="time-card-clock is-small" hour={hour} minute={minute} hint={clockHint} />
        {op === 'digitalWords' && (
          <span className="time-card-words time-card-answer" style={{ '--chars': answer.length }}>
            {answer}
          </span>
        )}
      </div>
    </div>
  )
}
