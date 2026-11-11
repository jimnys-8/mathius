import { useEffect, useReducer, useRef } from 'react'
import Equation from '../components/Equation.jsx'
import RoundProgress from '../components/RoundProgress.jsx'
import { createSession, sessionReducer } from '../game/session.js'
import Visualization from '../viz/Visualization.jsx'
import './PlayScreen.css'

const PRAISE = ['Great job!', 'Correct!', 'Well done!', 'Nice one!', 'You got it!', 'Super!']

function feedbackText(state) {
  if (state.phase !== 'feedback') {
    return state.hinted ? 'Count the dots to find the answer.' : ' '
  }
  if (state.lastCorrect) {
    return PRAISE[state.questionNumber % PRAISE.length]
  }
  return `Not quite. The answer is ${state.question.answer}.`
}

/**
 * Plays one session: shows questions until the round is over, then
 * reports the finished session through `onFinish`.
 */
export default function PlayScreen({ settings, onFinish, onQuit }) {
  const [state, dispatch] = useReducer(sessionReducer, settings, (initial) => createSession(initial, Date.now()))
  const inputRef = useRef(null)

  const finished = state.phase === 'finished'
  useEffect(() => {
    if (finished) {
      onFinish(state)
    }
  }, [finished, onFinish, state])

  const focusInput = () => inputRef.current?.focus({ preventScroll: true })

  const handleEnter = () => {
    if (state.phase === 'answering') {
      dispatch({ type: 'submit', now: Date.now() })
    } else if (state.phase === 'feedback') {
      dispatch({ type: 'next', now: Date.now() })
    }
  }

  const handleHint = () => {
    dispatch({ type: 'hint' })
    focusInput()
  }

  const status = state.phase === 'feedback' ? (state.lastCorrect ? 'correct' : 'wrong') : 'open'

  return (
    <main className="page play">
      <header className="play-header">
        <button type="button" className="btn btn-quiet" onClick={onQuit}>
          ✕ <span>Stop</span>
        </button>
        <RoundProgress results={state.results} current={state.phase === 'answering'} />
      </header>

      <section className="play-viz card">
        <Visualization key={`${state.questionNumber}-${state.question.key}`} question={state.question} step={state.vizStep} />
      </section>

      <Equation
        key={state.questionNumber}
        question={state.question}
        input={state.input}
        onInput={(value) => dispatch({ type: 'input', value })}
        onEnter={handleEnter}
        status={status}
        readOnly={state.phase !== 'answering'}
        inputRef={inputRef}
      />

      <p className={`play-feedback is-${status}`} role="status">
        {feedbackText(state)}
      </p>

      <div className="play-actions">
        {state.phase === 'answering' ? (
          <>
            <button type="button" className="btn" onClick={handleHint} disabled={state.vizStep > 0}>
              💡 Hint
            </button>
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={handleEnter}
              disabled={state.input === ''}
            >
              Check
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-large" onClick={handleEnter} autoFocus>
            Next →
          </button>
        )}
      </div>
    </main>
  )
}
