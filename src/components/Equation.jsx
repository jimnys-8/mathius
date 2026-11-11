import { OPERATIONS } from '../game/config.js'
import './Equation.css'

const TERM_CLASSES = ['term-a', 'term-b', 'term-c']

/**
 * The question as an equation, with an answer box in place of the
 * unknown term.
 */
export default function Equation({ question, input, onInput, onEnter, status, inputRef, readOnly, keyboard = true }) {
  const symbol = OPERATIONS[question.op].symbol

  const renderTerm = (index) => {
    if (index !== question.unknown) {
      return (
        <span className={`equation-term ${TERM_CLASSES[index]}`}>{question.terms[index]}</span>
      )
    }
    return (
      <span className={`equation-answer ${TERM_CLASSES[index]} is-${status}`}>
        <input
          ref={inputRef}
          className="equation-input"
          type="text"
          inputMode={keyboard ? 'numeric' : 'none'}
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          aria-label="Your answer"
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

  return (
    <div className="equation" aria-live="polite">
      {renderTerm(0)}
      <span className="equation-sign">{symbol}</span>
      {renderTerm(1)}
      <span className="equation-sign">=</span>
      {renderTerm(2)}
    </div>
  )
}
