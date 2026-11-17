import { ROUND_LENGTH } from './config.js'
import { createQuestion, isCorrect, questionStep } from './questions.js'
import { HINT_FRAME, SOLUTION_FRAME } from '../viz/scenes.js'

/**
 * State of one game session (a round of questions, or a timed run).
 *
 * Phases:
 *   'answering'  waiting for an answer
 *   'feedback'   answer given, showing whether it was right
 *   'finished'   the round is over
 *
 * In timed mode the clock only runs while answering: it pauses when an
 * answer is given and starts again with the next question. `clockUsedMs`
 * is the time used by earlier questions and `clockRunningSince` when the
 * clock last started (null while paused).
 *
 * A question with `steps` is answered one choice at a time: `step` is
 * the one being asked and `picked` the choices made so far. A right
 * pick moves on to the next step; a wrong one, or the last step, ends
 * the question, with the picks joined as the answer given.
 */

const RECENT_LIMIT = 6

/**
 * @param {Object} settings
 * @param {string} settings.category
 * @param {number} settings.level
 * @param {number} settings.timer  seconds, 0 for a round of ROUND_LENGTH questions
 * @param {string} [settings.lang] language of the words in reading questions
 * @param {number} now             timestamp (ms)
 * @param {() => number} [rng]
 */
export function createSession(settings, now, rng = Math.random) {
  const question = createQuestion({ category: settings.category, level: settings.level, lang: settings.lang, rng })
  return {
    settings,
    rng,
    question,
    questionNumber: 1,
    input: '',
    step: 0,
    picked: [],
    phase: 'answering',
    vizStep: 0,
    hinted: false,
    lastCorrect: null,
    results: [],
    recent: [question.key],
    startedAt: now,
    questionStartedAt: now,
    endedAt: null,
    clockUsedMs: 0,
    clockRunningSince: now,
  }
}

export function isTimed(session) {
  return session.settings.timer > 0
}

/** Time used on the clock so far (ms). */
export function timeUsed(session, now) {
  const running = session.clockRunningSince === null ? 0 : now - session.clockRunningSince
  return session.clockUsedMs + running
}

/** Time left on the clock (ms); Infinity without a timer. */
export function timeLeft(session, now) {
  if (!isTimed(session)) {
    return Infinity
  }
  return Math.max(0, session.settings.timer * 1000 - timeUsed(session, now))
}

function stopClock(state, now) {
  if (state.clockRunningSince === null) {
    return state
  }
  return { ...state, clockUsedMs: timeUsed(state, now), clockRunningSince: null }
}

function nextQuestion(state, now) {
  const question = createQuestion({
    category: state.settings.category,
    level: state.settings.level,
    avoid: state.recent,
    lang: state.settings.lang,
    rng: state.rng,
  })
  return {
    ...state,
    question,
    questionNumber: state.questionNumber + 1,
    input: '',
    step: 0,
    picked: [],
    phase: 'answering',
    vizStep: 0,
    hinted: false,
    lastCorrect: null,
    recent: [...state.recent, question.key].slice(-RECENT_LIMIT),
    questionStartedAt: now,
    clockRunningSince: now,
  }
}

function finish(state, now) {
  return { ...stopClock(state, now), phase: 'finished', endedAt: now }
}

/**
 * Session reducer. Every action that depends on time carries `now`.
 *
 * Actions:
 *   { type: 'input', value }
 *   { type: 'hint' }
 *   { type: 'choose', value, now }   pick one of the question's choices
 *   { type: 'submit', now }
 *   { type: 'next', now }
 *   { type: 'timeUp', now }
 *   { type: 'quit', now }
 */
export function sessionReducer(state, action) {
  switch (action.type) {
    case 'input': {
      if (state.phase !== 'answering') {
        return state
      }
      const value = action.value.replace(/[^\d]/g, '').slice(0, 4)
      return { ...state, input: value }
    }

    case 'hint': {
      if (state.phase !== 'answering') {
        return state
      }
      return { ...state, hinted: true, vizStep: Math.max(state.vizStep, HINT_FRAME) }
    }

    case 'choose': {
      const asked = questionStep(state.question, state.step)
      if (state.phase !== 'answering' || !asked.choices?.includes(action.value)) {
        return state
      }
      const picked = [...state.picked, action.value]
      const lastStep = state.step >= (state.question.steps?.length ?? 1) - 1
      if (!lastStep && action.value === asked.answer) {
        return { ...state, step: state.step + 1, picked }
      }
      return sessionReducer({ ...state, picked, input: picked.join('') }, { type: 'submit', now: action.now })
    }

    case 'submit': {
      if (state.phase !== 'answering' || state.input === '') {
        return state
      }
      const correct = isCorrect(state.question, state.input)
      const result = {
        key: state.question.key,
        op: state.question.op,
        answer: state.question.answer,
        // Reading answers are words or emojis; the rest are numbers.
        given: typeof state.question.answer === 'string' ? state.input : Number(state.input),
        correct,
        hinted: state.hinted,
        ms: action.now - state.questionStartedAt,
      }
      return {
        ...stopClock(state, action.now),
        phase: 'feedback',
        vizStep: SOLUTION_FRAME,
        lastCorrect: correct,
        results: [...state.results, result],
      }
    }

    case 'next': {
      if (state.phase !== 'feedback') {
        return state
      }
      if (!isTimed(state) && state.results.length >= ROUND_LENGTH) {
        return finish(state, action.now)
      }
      if (isTimed(state) && timeLeft(state, action.now) <= 0) {
        return finish(state, action.now)
      }
      return nextQuestion(state, action.now)
    }

    case 'timeUp': {
      // Only while the clock runs; a paused clock can't run out.
      if (state.phase !== 'answering' || timeLeft(state, action.now) > 0) {
        return state
      }
      return finish(state, action.now)
    }

    case 'quit': {
      if (state.phase === 'finished') {
        return state
      }
      return finish(state, action.now)
    }

    default:
      return state
  }
}

export function summarize(results) {
  const correct = results.filter((result) => result.correct).length
  return {
    total: results.length,
    correct,
    wrong: results.length - correct,
    hinted: results.filter((result) => result.hinted).length,
  }
}
