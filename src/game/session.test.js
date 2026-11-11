import { describe, expect, it } from 'vitest'
import { ROUND_LENGTH } from './config.js'
import { createSession, sessionReducer, summarize, timeLeft } from './session.js'

const practice = { category: 'add', level: 1, timer: 0 }
const timed = { category: 'mul', level: 2, timer: 60 }

function answer(state, value, now) {
  const typed = sessionReducer(state, { type: 'input', value: String(value) })
  return sessionReducer(typed, { type: 'submit', now })
}

describe('sessionReducer', () => {
  it('records a correct answer and shows the solution', () => {
    const start = createSession(practice, 0)
    const state = answer(start, start.question.answer, 1500)
    expect(state.phase).toBe('feedback')
    expect(state.lastCorrect).toBe(true)
    expect(state.vizStep).toBe(2)
    expect(state.results).toEqual([
      expect.objectContaining({ key: start.question.key, correct: true, hinted: false, ms: 1500 }),
    ])
  })

  it('records a wrong answer', () => {
    const start = createSession(practice, 0)
    const state = answer(start, start.question.answer + 1, 10)
    expect(state.lastCorrect).toBe(false)
    expect(state.results[0].given).toBe(start.question.answer + 1)
  })

  it('ignores empty submissions and non-digits', () => {
    const start = createSession(practice, 0)
    expect(sessionReducer(start, { type: 'submit', now: 1 })).toBe(start)
    expect(sessionReducer(start, { type: 'input', value: '1a2' }).input).toBe('12')
  })

  it('marks hinted answers', () => {
    const start = createSession(practice, 0)
    const hinted = sessionReducer(start, { type: 'hint' })
    expect(hinted.vizStep).toBe(1)
    expect(answer(hinted, start.question.answer, 1).results[0].hinted).toBe(true)
  })

  it('does not accept input during feedback', () => {
    const start = createSession(practice, 0)
    const state = answer(start, 1, 1)
    expect(sessionReducer(state, { type: 'input', value: '5' })).toBe(state)
  })

  it('moves on to a new question', () => {
    const start = createSession(practice, 0)
    const state = sessionReducer(answer(start, 1, 1), { type: 'next', now: 2 })
    expect(state.phase).toBe('answering')
    expect(state.questionNumber).toBe(2)
    expect(state.input).toBe('')
    expect(state.vizStep).toBe(0)
    expect(state.question.key).not.toBe(start.question.key)
  })

  it('finishes a practice round after the round length', () => {
    let state = createSession(practice, 0)
    for (let i = 0; i < ROUND_LENGTH; i += 1) {
      state = answer(state, state.question.answer, i)
      state = sessionReducer(state, { type: 'next', now: i })
    }
    expect(state.phase).toBe('finished')
    expect(summarize(state.results)).toEqual({ total: ROUND_LENGTH, correct: ROUND_LENGTH, wrong: 0, hinted: 0 })
  })

  it('keeps going in timed mode until time is up', () => {
    let state = createSession(timed, 0)
    for (let i = 0; i < ROUND_LENGTH + 5; i += 1) {
      state = answer(state, state.question.answer, i * 1000)
      state = sessionReducer(state, { type: 'next', now: i * 1000 })
    }
    expect(state.phase).toBe('answering')
    expect(timeLeft(state, 20_000)).toBe(40_000)

    state = sessionReducer(state, { type: 'timeUp', now: 60_000 })
    expect(state.phase).toBe('finished')
    expect(timeLeft(state, 99_000)).toBe(0)
  })

  it('finishes after feedback when time ran out meanwhile', () => {
    const start = createSession(timed, 0)
    const state = answer(start, 1, 59_000)
    expect(sessionReducer(state, { type: 'next', now: 61_000 }).phase).toBe('finished')
  })
})
