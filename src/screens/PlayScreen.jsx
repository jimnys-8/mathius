import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import ChoiceAnswers from '../components/ChoiceAnswers.jsx'
import Countdown from '../components/Countdown.jsx'
import Equation from '../components/Equation.jsx'
import Icon from '../components/Icon.jsx'
import Numpad from '../components/Numpad.jsx'
import RoundProgress from '../components/RoundProgress.jsx'
import { createSession, isTimed, sessionReducer } from '../game/session.js'
import { useI18n } from '../i18n/i18n.js'
import { useMediaQuery } from '../useMediaQuery.js'
import { SOLUTION_FRAME } from '../viz/scenes.js'
import Visualization from '../viz/Visualization.jsx'
import './PlayScreen.css'

/**
 * In timed mode, a correct answer moves on by itself this long after its
 * solution has finished animating. The clock is paused meanwhile.
 */
const AUTO_NEXT_MS = 700

function hintText(question, t) {
  if (question.op === 'sqrt' && question.choices) {
    return t('play.hintHelpSqrt', { side: Math.floor(Math.sqrt(question.terms[0])) })
  }
  if (question.op === 'eq') {
    const [a, b] = question.terms
    if (b > 0) {
      return t('play.hintHelpEqTake', { a, b })
    }
    return b < 0 ? t('play.hintHelpEqAdd', { b: -b }) : t('play.hintHelpEqShare', { a })
  }
  return t('play.hintHelp')
}

function feedbackText(state, { t, formatNumber }) {
  if (state.phase !== 'feedback') {
    // A non-breaking space keeps the line's height when there is no text.
    return state.hinted ? hintText(state.question, t) : '\u00a0'
  }
  if (state.lastCorrect) {
    return t('play.praise', { index: state.questionNumber })
  }
  return t('play.wrong', { answer: formatNumber(state.question.answer) })
}

/**
 * Plays one session: shows questions until the round is over, then
 * reports the finished session through `onFinish`.
 */
export default function PlayScreen({ settings, keypad = false, onKeypadChange, onFinish, onQuit }) {
  const [state, dispatch] = useReducer(sessionReducer, settings, (initial) => createSession(initial, Date.now()))
  const inputRef = useRef(null)
  const i18n = useI18n()
  const { t } = i18n
  // Touch devices get on-screen number keys instead of the system keyboard.
  // With a keyboard, the keys can be brought up too.
  const touch = useMediaQuery('(pointer: coarse)')

  // Report the finished session exactly once.
  const finished = state.phase === 'finished'
  const reported = useRef(false)
  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true
      onFinish(state)
    }
  }, [finished, onFinish, state])

  const timed = isTimed(state)

  // The clock only runs while answering; end the session when it runs out.
  const clockRunning = timed && state.phase === 'answering'
  const clockEndsAt = clockRunning ? state.clockRunningSince + state.settings.timer * 1000 - state.clockUsedMs : null
  useEffect(() => {
    if (clockEndsAt === null) {
      return undefined
    }
    const timer = setTimeout(() => dispatch({ type: 'timeUp', now: Date.now() }), Math.max(0, clockEndsAt - Date.now()))
    return () => clearTimeout(timer)
  }, [clockEndsAt])

  // Keep the pace up when racing the clock: once the solution has played,
  // move on to the next question.
  const [settledQuestion, setSettledQuestion] = useState(0)
  const { questionNumber } = state
  const handleSettled = useCallback(
    (frame) => {
      if (frame === SOLUTION_FRAME) {
        setSettledQuestion(questionNumber)
      }
    },
    [questionNumber],
  )
  const autoNext = timed && state.phase === 'feedback' && state.lastCorrect && settledQuestion === questionNumber
  useEffect(() => {
    if (!autoNext) {
      return undefined
    }
    const timer = setTimeout(() => dispatch({ type: 'next', now: Date.now() }), AUTO_NEXT_MS)
    return () => clearTimeout(timer)
  }, [autoNext])

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

  const handleChoose = useCallback((value) => dispatch({ type: 'choose', value, now: Date.now() }), [])
  const { choices } = state.question
  const showKeypad = !choices && (touch || keypad)

  // Pressing an on-screen key moves focus off the answer box; put it back
  // so the keyboard keeps working alongside the keys.
  const keepKeyboard = () => {
    if (!touch) {
      focusInput()
    }
  }

  const toggleKeypad = () => {
    onKeypadChange?.(!keypad)
    focusInput()
  }

  const correctCount = state.results.filter((result) => result.correct).length
  const status = state.phase === 'feedback' ? (state.lastCorrect ? 'correct' : 'wrong') : 'open'

  return (
    <main className={`page play${touch || showKeypad ? ' is-compact' : ''}${showKeypad && !touch ? ' has-keypad' : ''}`}>
      <header className="play-header">
        <div className="play-header-start">
          <button type="button" className="btn btn-quiet" onClick={onQuit}>
            <Icon name="cross" /> <span>{t('play.stop')}</span>
          </button>
          {!touch && !choices && (
            <button
              type="button"
              className="btn btn-quiet play-keypad-toggle"
              onClick={toggleKeypad}
              aria-pressed={keypad}
              aria-label={t(keypad ? 'play.hideKeypad' : 'play.showKeypad')}
              title={t(keypad ? 'play.hideKeypad' : 'play.showKeypad')}
            >
              🔢
            </button>
          )}
        </div>
        {timed ? (
          <>
            <Countdown
              seconds={state.settings.timer}
              usedMs={state.clockUsedMs}
              runningSince={state.clockRunningSince}
            />
            <span className="play-score" aria-label={t('play.score', { count: correctCount })}>
              <Icon name="check" /> {correctCount}
            </span>
          </>
        ) : (
          <RoundProgress results={state.results} current={state.phase === 'answering'} />
        )}
      </header>

      <section className="play-viz card">
        <Visualization
          key={`${state.questionNumber}-${state.question.key}`}
          question={state.question}
          step={state.vizStep}
          onSettled={handleSettled}
        />
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
        keyboard={!touch}
      />

      <p className={`play-feedback is-${status}`} role="status">
        {feedbackText(state, i18n)}
      </p>

      {choices ? (
        <div className="play-choices">
          <ChoiceAnswers
            key={state.questionNumber}
            choices={choices}
            answer={state.question.answer}
            chosen={state.phase === 'answering' ? null : Number(state.input)}
            revealed={state.phase !== 'answering'}
            onChoose={handleChoose}
            as={state.question.choicesAs}
            // Picking the dots for a number is about counting them, not
            // matching the number's shape.
            numbersFirst={state.question.op !== 'count'}
          />
          <div className="play-actions">
            {state.phase === 'answering' ? (
              <button type="button" className="btn" onClick={handleHint} disabled={state.vizStep > 0}>
                💡 {t('play.hint')}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-large" onClick={handleEnter} autoFocus>
                {t('play.next')} <Icon name="arrowRight" />
              </button>
            )}
          </div>
        </div>
      ) : showKeypad ? (
        <div className="play-touch">
          <button type="button" className="btn" onClick={handleHint} disabled={state.phase !== 'answering' || state.vizStep > 0}>
            💡 {t('play.hint')}
          </button>
          <Numpad
            onDigit={(digit) => {
              dispatch({ type: 'input', value: state.input + digit })
              keepKeyboard()
            }}
            onBackspace={() => {
              dispatch({ type: 'input', value: state.input.slice(0, -1) })
              keepKeyboard()
            }}
            onEnter={() => {
              handleEnter()
              keepKeyboard()
            }}
            enterIcon={state.phase === 'answering' ? 'check' : 'arrowRight'}
            disabled={state.phase !== 'answering'}
            enterDisabled={state.phase === 'answering' && state.input === ''}
          />
        </div>
      ) : (
        <div className="play-actions">
          {state.phase === 'answering' ? (
            <>
              <button type="button" className="btn" onClick={handleHint} disabled={state.vizStep > 0}>
                💡 {t('play.hint')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleEnter}
                disabled={state.input === ''}
              >
                {t('play.check')}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-large" onClick={handleEnter} autoFocus>
              {t('play.next')} <Icon name="arrowRight" />
            </button>
          )}
        </div>
      )}
    </main>
  )
}
