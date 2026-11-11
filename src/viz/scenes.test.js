import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../game/questions.js'
import { buildScene } from './scenes.js'

const FACTS = {
  add: [
    [3, 4, 7],
    [8, 5, 13],
    [47, 38, 85],
    [1, 1, 2],
  ],
  sub: [
    [9, 4, 5],
    [13, 5, 8],
    [85, 38, 47],
    [2, 1, 1],
  ],
  mul: [
    [3, 4, 12],
    [1, 5, 5],
    [12, 12, 144],
    [7, 8, 56],
  ],
  div: [
    [12, 3, 4],
    [5, 1, 5],
    [144, 12, 12],
    [56, 8, 7],
  ],
}

function cases() {
  const result = []
  for (const [op, facts] of Object.entries(FACTS)) {
    for (const terms of facts) {
      for (const unknown of [0, 1, 2]) {
        result.push(makeQuestion(op, terms, unknown))
      }
    }
  }
  return result
}

describe('buildScene', () => {
  for (const question of cases()) {
    describe(question.key, () => {
      const scene = buildScene(question)

      it('has a question, hint and solution frame', () => {
        expect(scene.frames).toHaveLength(3)
        expect(scene.durations).toHaveLength(3)
      })

      it('uses unique ids within each frame', () => {
        for (const frame of scene.frames) {
          for (const kind of Object.keys(frame)) {
            const ids = frame[kind].map((element) => element.id)
            expect(new Set(ids).size).toBe(ids.length)
          }
        }
      })

      it('uses finite coordinates', () => {
        const { x, y, width, height } = scene.viewBox
        expect([x, y, width, height].every(Number.isFinite)).toBe(true)
        for (const frame of scene.frames) {
          for (const element of [...frame.dots, ...frame.slots, ...frame.labels]) {
            expect(Number.isFinite(element.x) && Number.isFinite(element.y)).toBe(true)
          }
        }
      })

      it('keeps the same dots in every frame', () => {
        const ids = scene.frames.map((frame) => frame.dots.map((dot) => dot.id).sort().join())
        expect(new Set(ids).size).toBe(1)
      })

      it('shows the answer in the solution', () => {
        const labels = scene.frames[2].labels.map((label) => label.text)
        expect(labels).toContain(String(question.answer))
      })

      it('does not stack dots on top of each other in the hint', () => {
        const positions = scene.frames[1].dots.map((dot) => `${dot.x.toFixed(2)},${dot.y.toFixed(2)}`)
        expect(new Set(positions).size).toBe(positions.length)
      })
    })
  }
})
