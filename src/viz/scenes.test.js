import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../game/questions.js'
import { buildScene } from './scenes.js'

const FACTS = {
  count: [[1], [4], [7], [10]],
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
  sqrt: [
    [1, 1],
    [49, 7],
    [144, 12],
  ],
}

const EQUATIONS = [
  [1, 3, 7, 4],
  [1, 9, 19, 10],
  [3, 0, 12, 4],
  [5, 0, 50, 10],
  [3, 1, 10, 3],
  [5, 9, 59, 10],
  [3, -2, 13, 5],
  [2, -9, 1, 5],
  [5, -1, 49, 10],
]

const ESTIMATES = [
  [2, 1.4, [1.4, 2.5, 3.1, 4.7]],
  [40, 6.3, [6.1, 6.3, 6.6, 6.8]],
  [150, 12.2, [10.5, 11.3, 12.2, 13.7]],
]

function cases() {
  const result = []
  for (const [op, facts] of Object.entries(FACTS)) {
    for (const terms of facts) {
      for (let unknown = 0; unknown < terms.length; unknown += 1) {
        result.push(makeQuestion(op, terms, unknown))
      }
    }
  }
  for (const [radicand, answer, choices] of ESTIMATES) {
    result.push(makeQuestion('sqrt', [radicand, answer], 1, choices))
  }
  for (const terms of EQUATIONS) {
    result.push(makeQuestion('eq', terms, 3))
  }
  for (const count of [1, 6, 10]) {
    result.push(makeQuestion('count', [count], 0, [count], { choicesAs: 'dots' }))
  }
  // Guided pictures start half solved.
  for (const question of [...result]) {
    if (question.op === 'sub' || question.op === 'sqrt') {
      result.push({ ...question, guided: true })
    }
  }
  return result
}

const positions = (frame) => frame.dots.map((dot) => `${dot.id}@${dot.x.toFixed(2)},${dot.y.toFixed(2)}`).sort()

describe('buildScene', () => {
  for (const question of cases()) {
    describe(`${question.key}${question.guided ? ' (guided)' : ''}`, () => {
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
        // Picking dots for a numeral starts from an empty frame.
        const frames = question.choicesAs === 'dots' && question.op === 'count' ? scene.frames.slice(1) : scene.frames
        const ids = frames.map((frame) => frame.dots.map((dot) => dot.id).sort().join())
        expect(new Set(ids).size).toBe(1)
      })

      it('shows the answer in the solution', () => {
        const labels = scene.frames[2].labels.map((label) => label.text.replace('≈ ', ''))
        expect(labels).toContain(String(question.answer))
      })

      it('does not stack dots on top of each other in the hint', () => {
        const positions = scene.frames[1].dots.map((dot) => `${dot.x.toFixed(2)},${dot.y.toFixed(2)}`)
        expect(new Set(positions).size).toBe(positions.length)
      })
    })
  }
})

describe('equation pictures', () => {
  it('shares x dots into each bag', () => {
    for (const terms of EQUATIONS) {
      const [a, , , x] = terms
      const solution = buildScene(makeQuestion('eq', terms, 3)).frames[2]
      const bags = solution.boxes.filter((box) => box.id.startsWith('bag-'))
      expect(bags).toHaveLength(a)
      for (const bag of bags) {
        const inside = solution.dots.filter(
          (dot) =>
            dot.variant === 'solid' &&
            dot.x > bag.x &&
            dot.x < bag.x + bag.width &&
            dot.y > bag.y &&
            dot.y < bag.y + bag.height,
        )
        expect(inside).toHaveLength(x)
      }
    }
  })
})

describe('guided pictures', () => {
  it('colors the dots to take away before subtracting', () => {
    const [plain] = buildScene(makeQuestion('sub', [9, 4, 5], 2)).frames
    const [guided] = buildScene({ ...makeQuestion('sub', [9, 4, 5], 2), guided: true }).frames
    expect(plain.dots.filter((dot) => dot.tone === 'b')).toHaveLength(0)
    expect(guided.dots.filter((dot) => dot.tone === 'b')).toHaveLength(4)
  })

  it('does not give away a missing number in subtraction', () => {
    const [guided] = buildScene({ ...makeQuestion('sub', [9, 4, 5], 1), guided: true }).frames
    expect(guided.dots.filter((dot) => dot.tone === 'b')).toHaveLength(0)
  })

  it('lays out the square before answering', () => {
    for (const question of [makeQuestion('sqrt', [49, 7], 1), makeQuestion('sqrt', [40, 6.3], 1, [6.1, 6.3, 6.6, 6.8])]) {
      const plain = buildScene(question).frames
      const guided = buildScene({ ...question, guided: true }).frames
      expect(positions(plain[0])).not.toEqual(positions(plain[1]))
      expect(positions(guided[0])).toEqual(positions(guided[1]))
    }
  })
})
