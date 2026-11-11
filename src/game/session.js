import { ROUND_LENGTH } from './config.js'
import { createQuestion, isCorrect } from './questions.js'
import { HINT_FRAME, SOLUTION_FRAME } from '../viz/scenes.js'

/**
 * State of one game session (a round of questions, or a timed run).
 *
 * Phases:
 *   'answering'  waiting for an answer
 *   'feedback'   answer given, showing whether it was right
 *   'finished'   the round is over
 */

const RECENT_LIMIT = 6

/**
 * @param {Object} settings
 * @param {string} settings.category
 * @param {number} settings.level
 * @param {number} settings.timer  seconds, 0 for a round of ROUND_LENGTH questions
 * @param {number} now             timestamp (ms)
 * @param {() => number} [rng]
 */
export function createSession(settings, now, rng = Math.random) {
  const question = createQuestion({ category: settings.category, level: settings.level, rng })
  return {
    settings,
    rng,
    question,
    questionNumber: 1,
    input: '',
    phase: 'answering',
    vizStep: 0,
    hinted: false,
    lastCorrect: null,
    results: [],
    recent: [question.key],
    startedAt: now,
    questionStartedAt: now,
    endedAt: null,
  }
}

export function isTimed(session) {
  return session.settings.timer > 0
}

export function timeLeft(session, now) {
  if (!isTimed(session)) {
    return Infinity
  }
  const end = session.startedAt + session.settings.timer * 1000
  return Math.max(0, end - (session.endedAt ?? now))
}

function nextQuestion(state, now) {
  const question = createQuestion({
    category: state.settings.category,
    level: state.settings.level,
    avoid: state.recent,
    rng: state.rng,
  })
  return {
    ...state,
    question,
    questionNumber: state.questionNumber + 1,
    input: '',
    phase: 'answering',
    vizStep: 0,
    hinted: false,
    lastCorrect: null,
    recent: [...state.recent, question.key].slice(-RECENT_LIMIT),
    questionStartedAt: now,
  }
}

function finish(state, now) {
  return { ...state, phase: 'finished', endedAt: now }
}

/**
 * Session reducer. Every action that depends on time carries `now`.
 *
 * Actions:
 *   { type: 'input', value }
 *   { type: 'hint' }
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

    case 'submit': {
      if (state.phase !== 'answering' || state.input === '') {
        return state
      }
      const correct = isCorrect(state.question, state.input)
      const result = {
        key: state.question.key,
        op: state.question.op,
        answer: state.question.answer,
        given: Number(state.input),
        correct,
        hinted: state.hinted,
        ms: action.now - state.questionStartedAt,
      }
      // In timed mode a correct answer moves on right away, so don't start
      // a solution animation that would be cut off halfway.
      const showSolution = !(isTimed(state) && correct)
      return {
        ...state,
        phase: 'feedback',
        vizStep: showSolution ? SOLUTION_FRAME : state.vizStep,
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

    case 'timeUp':
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
