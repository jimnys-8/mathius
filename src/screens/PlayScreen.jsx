import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import ChoiceAnswers from '../components/ChoiceAnswers.jsx'
import Countdown from '../components/Countdown.jsx'
import Equation from '../components/Equation.jsx'
import FractionCard from '../components/FractionCard.jsx'
import Icon from '../components/Icon.jsx'
import LetterCard from '../components/LetterCard.jsx'
import MatrixCard from '../components/MatrixCard.jsx'
import Numpad from '../components/Numpad.jsx'
import OddCard from '../components/OddCard.jsx'
import ReadingCard from '../components/ReadingCard.jsx'
import SeriesCard from '../components/SeriesCard.jsx'
import ShapeSeriesCard from '../components/ShapeSeriesCard.jsx'
import TimeCard from '../components/TimeCard.jsx'
import RoundProgress from '../components/RoundProgress.jsx'
import { fractionWords, parseChoice, pictureFractions } from '../game/fractions.js'
import { showWord } from '../game/reading.js'
import { SERIES_DOT_GRID } from '../game/series.js'
import { createSession, isTimed, sessionReducer } from '../game/session.js'
import { useI18n } from '../i18n/i18n.js'
import { useMediaQuery } from '../useMediaQuery.js'
import { HINT_FRAME, SOLUTION_FRAME } from '../viz/scenes.js'
import Visualization from '../viz/Visualization.jsx'
import './PlayScreen.css'

/**
 * In timed mode, a correct answer moves on by itself this long after its
 * solution has finished animating. The clock is paused meanwhile.
 */
const AUTO_NEXT_MS = 700

function isReading(question) {
  return question.op === 'word' || question.op === 'picture'
}

// How each clock game shows its answer buttons.
const CLOCK_CHOICES = { clockDigital: 'digital', clockWords: 'phrases', digitalWords: 'phrases', digitalClock: 'clock' }

function choicesAs(question) {
  if (isReading(question)) {
    return question.op === 'word' ? 'words' : 'emoji'
  }
  if (question.op === 'letter') {
    return 'letters'
  }
  if (question.op === 'fraction') {
    return 'fractions'
  }
  if (question.op === 'odd') {
    return question.show
  }
  if (question.op === 'shapes' || question.op === 'matrix') {
    return 'figures'
  }
  return CLOCK_CHOICES[question.op] ?? question.choicesAs
}

/** An answer as the question shows it: a number, a word, an emoji or a fraction. */
function formatAnswer(question, value, { formatNumber, lang }) {
  if (question.op === 'word' || question.op === 'letter' || question.show === 'words') {
    return showWord(value, question.case)
  }
  if (question.op === 'fraction') {
    const { form, fraction } = parseChoice(value)
    return form === 'words' ? fractionWords(fraction, lang) : fraction[0] === fraction[1] ? '1' : fraction.join('/')
  }
  return typeof value === 'string' ? value : formatNumber(value)
}

function hintText(question, t) {
  if (isReading(question)) {
    return t('play.hintHelpRead')
  }
  if (question.op === 'letter') {
    return t('play.hintHelpLetter')
  }
  if (question.op === 'odd') {
    return t('play.hintHelpOdd')
  }
  if (question.op === 'series') {
    return t(question.notes ? 'play.hintHelpSquares' : 'play.hintHelpSeries')
  }
  if (question.op === 'shapes') {
    // One attribute repeating says which one: "Titta på färgerna."
    return t(`play.hintHelpShapes.${question.kind === 'one' ? question.rules[0].attributes[0] : question.kind}`)
  }
  if (question.op === 'matrix') {
    // A step says what steps ("Räkna formerna i varje ruta."), one of each which thing.
    const [rule] = question.rules
    if (question.kind === 'latinOne') {
      return t(`play.hintHelpMatrix.latinOne.${rule.attributes[0]}`)
    }
    if (question.kind === 'unionLine') {
      return t(`play.hintHelpMatrix.unionLine.${rule.lines[0]}`)
    }
    return t(`play.hintHelpMatrix.${rule.type === 'step' ? rule.attribute : question.kind}`)
  }
  if (question.op === 'fraction') {
    const [first, second] = pictureFractions(question.terms[0])
    return t(`play.hintHelpFraction.${second && first[1] !== second[1] ? 'addCommon' : question.kind}`)
  }
  if (question.time) {
    return t(question.op === 'clockWords' || question.op === 'digitalWords' ? 'play.hintHelpClockWords' : 'play.hintHelpClock')
  }
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

function feedbackText(state, i18n) {
  const { t } = i18n
  if (state.phase !== 'feedback') {
    // A non-breaking space keeps the line's height when there is no text.
    return state.hinted ? hintText(state.question, t) : '\u00a0'
  }
  if (state.lastCorrect) {
    return t('play.praise', { index: state.questionNumber })
  }
  if (state.question.op === 'shapes' || state.question.op === 'matrix') {
    // A figure has no short name; the gap and the buttons show it.
    return t('play.wrongShape')
  }
  return t('play.wrong', { answer: formatAnswer(state.question, state.question.answer, i18n) })
}

/**
 * Plays one session: shows questions until the round is over, then
 * reports the finished session through `onFinish`.
 */
/**
 * The hint button and the main button (check or next), side by side and
 * the same size whichever is in use, so nothing moves when a question is
 * answered and a tap meant for Next can't land on the hint as the next
 * question appears.
 */
function ActionPair({ hint, main }) {
  return (
    <div className="play-actions is-pair">
      {hint}
      {main}
    </div>
  )
}

export default function PlayScreen({ settings, keypad = false, onKeypadChange, onFinish, onQuit }) {
  const i18n = useI18n()
  const { t } = i18n
  // Reading questions use words in the language the session starts in.
  const [state, dispatch] = useReducer(sessionReducer, settings, (initial) =>
    createSession({ ...initial, lang: i18n.lang }, Date.now()),
  )
  const inputRef = useRef(null)
  const nextRef = useRef(null)
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

  // Once answered, Next takes the focus, so Enter moves on.
  useEffect(() => {
    if (state.phase === 'feedback') {
      nextRef.current?.focus({ preventScroll: true })
    }
  }, [state.phase, questionNumber])

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
  const reading = isReading(state.question)
  const clock = Boolean(state.question.time)
  const letter = state.question.op === 'letter'
  const fraction = state.question.op === 'fraction'
  const odd = state.question.op === 'odd'
  const series = state.question.op === 'series'
  const shapes = state.question.op === 'shapes'
  const matrix = state.question.op === 'matrix'
  const answering = state.phase === 'answering'
  const hintButton = (
    <button type="button" className="btn btn-large" onClick={handleHint} disabled={!answering || state.vizStep > 0}>
      💡 {t('play.hint')}
    </button>
  )
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
        {reading ? (
          <ReadingCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
          />
        ) : odd ? (
          <OddCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
          />
        ) : series ? (
          <SeriesCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
            input={state.input}
            status={status}
            onInput={(value) => dispatch({ type: 'input', value })}
            onEnter={handleEnter}
            inputRef={inputRef}
            readOnly={state.phase !== 'answering'}
            keyboard={!touch}
          />
        ) : shapes ? (
          <ShapeSeriesCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
            status={status}
          />
        ) : matrix ? (
          <MatrixCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
            status={status}
          />
        ) : fraction ? (
          <FractionCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
          />
        ) : letter ? (
          <LetterCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
          />
        ) : clock ? (
          <TimeCard
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
          />
        ) : (
          <Visualization
            key={`${state.questionNumber}-${state.question.key}`}
            question={state.question}
            step={state.vizStep}
            onSettled={handleSettled}
          />
        )}
      </section>

      {!reading && !clock && !letter && !fraction && !odd && !series && !shapes && !matrix && (
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
      )}

      <p className={`play-feedback is-${status}`} role="status">
        {feedbackText(state, i18n)}
      </p>

      {choices ? (
        <div className="play-choices">
          <ChoiceAnswers
            key={state.questionNumber}
            choices={choices}
            answer={state.question.answer}
            chosen={state.phase === 'answering' ? null : typeof state.question.answer === 'string' ? state.input : Number(state.input)}
            revealed={state.phase !== 'answering'}
            onChoose={handleChoose}
            as={choicesAs(state.question)}
            wordCase={state.question.case}
            removed={state.hinted ? state.question.hintRemoves : undefined}
            clock={
              clock
                ? { numbers: state.question.numbers, hint: state.vizStep >= HINT_FRAME ? 'minutes' : null }
                : undefined
            }
            // Picking the dots for a number is about counting them, not
            // matching the number's shape.
            numbersFirst={state.question.op !== 'count'}
            dotGrid={series ? SERIES_DOT_GRID : undefined}
            figurePips={matrix && state.question.pips}
          />
          <ActionPair
            hint={hintButton}
            main={
              <button
                ref={nextRef}
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleEnter}
                disabled={answering}
              >
                {t('play.next')} <Icon name="arrowRight" />
              </button>
            }
          />
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
        <ActionPair
          hint={hintButton}
          main={
            answering ? (
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleEnter}
                disabled={state.input === ''}
              >
                {t('play.check')}
              </button>
            ) : (
              <button ref={nextRef} type="button" className="btn btn-primary btn-large" onClick={handleEnter}>
                {t('play.next')} <Icon name="arrowRight" />
              </button>
            )
          }
        />
      )}
    </main>
  )
}
