import { OPERATIONS } from '../game/config.js'
import { useI18n } from '../i18n/i18n.js'
import './Equation.css'

// Colors link each term to its dots: first term, second term, result.
const TERM_CLASSES = ['term-a', 'term-b', 'term-c']
// Square roots have two terms: the radicand and the root (the result).
const SQRT_TERM_CLASSES = ['term-a', 'term-c']

/**
 * The question as an equation, with an answer box in place of the
 * unknown term. For multiple-choice questions the box shows the chosen
 * answer instead of taking input.
 */
export default function Equation({ question, input, onInput, onEnter, status, inputRef, readOnly, keyboard = true }) {
  const { t, formatNumber } = useI18n()
  const sqrt = question.op === 'sqrt'
  const classes = sqrt ? SQRT_TERM_CLASSES : TERM_CLASSES

  const renderTerm = (index) => {
    if (index !== question.unknown) {
      return <span className={`equation-term ${classes[index]}`}>{formatNumber(question.terms[index])}</span>
    }
    if (question.choices) {
      const shown = input === '' ? '?' : formatNumber(Number(input))
      return (
        <span className={`equation-answer ${classes[index]} is-${status}`}>
          <span className="equation-input is-choice" style={{ '--chars': Math.max(2, shown.length) }}>
            {shown}
          </span>
        </span>
      )
    }
    return (
      <span className={`equation-answer ${classes[index]} is-${status}`}>
        <input
          ref={inputRef}
          className="equation-input"
          type="text"
          inputMode={keyboard ? 'numeric' : 'none'}
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          aria-label={t('play.yourAnswer')}
          value={input}
          readOnly={readOnly}
          autoFocus
          onChange={(event) => onInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onEnter()
            }
          }}
          style={{ '--chars': Math.max(2, input.length) }}
        />
      </span>
    )
  }

  if (sqrt) {
    return (
      <div className="equation" aria-live="polite">
        <span className="radical">
          <svg className="radical-sign" viewBox="0 0 20 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M1 25 L6 22 L12 38 L19.5 1.5" />
          </svg>
          <span className="visually-hidden">√</span>
          <span className="radical-body">{renderTerm(0)}</span>
        </span>
        <span className="equation-sign">{question.choices ? '≈' : '='}</span>
        {renderTerm(1)}
      </div>
    )
  }

  return (
    <div className="equation" aria-live="polite">
      {renderTerm(0)}
      <span className="equation-sign">{OPERATIONS[question.op].symbol}</span>
      {renderTerm(1)}
      <span className="equation-sign">=</span>
      {renderTerm(2)}
    </div>
  )
}
