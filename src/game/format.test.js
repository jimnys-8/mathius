import { describe, expect, it } from 'vitest'
import { formatFact } from './format.js'

const fact = (key, op, answer) => ({ key, op, answer })

describe('formatFact', () => {
  it('fills in the answer and spaces the symbols', () => {
    expect(formatFact(fact('7×?=56', 'mul', 8))).toBe('7 × 8 = 56')
    expect(formatFact(fact('?+4=9', 'add', 5))).toBe('5 + 4 = 9')
  })

  it('formats square roots', () => {
    expect(formatFact(fact('√49=?', 'sqrt', 7))).toBe('√49 = 7')
    expect(formatFact(fact('√?=7', 'sqrt', 49))).toBe('√49 = 7')
    expect(formatFact(fact('√40≈?', 'sqrt', 6.3))).toBe('√40 ≈ 6.3')
  })

  it('shows counted dots', () => {
    expect(formatFact(fact('●3=?', 'count', 3))).toBe('●●● = 3')
    expect(formatFact(fact('3=●?', 'count', 3))).toBe('●●● = 3')
  })

  it('says what x is in equations', () => {
    expect(formatFact(fact('3x+1=10', 'eq', 3))).toBe('3x + 1 = 10, x = 3')
    expect(formatFact(fact('x−2=5', 'eq', 7))).toBe('x − 2 = 5, x = 7')
  })

  it('shows the emoji and the word for reading, even words with an x', () => {
    expect(formatFact(fact('🐂=oxe', 'word', 'oxe'))).toBe('🐂 oxe')
    expect(formatFact(fact('fox=🦊', 'picture', '🦊'))).toBe('fox 🦊')
  })

  it('shows the clock or digital time and the answer for telling the time', () => {
    expect(formatFact(fact('clockDigital:8:20=20:20', 'clockDigital', '20:20'))).toBe('🕗 8:20 = 20:20')
    expect(formatFact(fact('clockWords:8:20=tjugo över åtta', 'clockWords', 'tjugo över åtta'))).toBe(
      '🕗 8:20: tjugo över åtta',
    )
    expect(formatFact(fact('digitalWords:20:20=tjugo över åtta', 'digitalWords', 'tjugo över åtta'))).toBe(
      '20:20: tjugo över åtta',
    )
    expect(formatFact(fact('digitalClock:20:20=8:20', 'digitalClock', '8:20'))).toBe('20:20 = 🕗')
  })

  it('names the figures of a shape series by letters', () => {
    const red = 'circle.red.big.solid.1.0'
    const blue = 'square.blue.big.solid.1.0'
    expect(formatFact(fact(`${red},${blue},${red},${blue},${red},?`, 'shapes', blue))).toBe('A B A B A (B)')
    expect(formatFact(fact(`?,${blue},${red},${blue}`, 'shapes', red))).toBe('(A) B A B')
  })

  it('shows a matrix row by row, a letter for each tile', () => {
    const red = 'circle.red.big.solid.1.0'
    const blue = 'square.blue.big.solid.1.0'
    expect(formatFact(fact(`${red},${blue},${red},${blue},${red},${blue},${red},${blue},?`, 'matrix', red))).toBe(
      'A B A / B A B / A B (A)',
    )
  })

  it('shows a number series with the answer in brackets', () => {
    expect(formatFact(fact('2,4,6,8,?', 'series', 10))).toBe('2 4 6 8 (10)')
    expect(formatFact(fact('7,10,?,16,19', 'series', 13))).toBe('7 10 (13) 16 19')
  })

  it('shows the three that go together and the odd one', () => {
    expect(formatFact(fact('farm:🐄,🐖,🐑:🦁', 'odd', '🦁'))).toBe('🐄 🐖 🐑 ≠ 🦁')
    expect(formatFact(fact('even:2,16,22:7', 'odd', 7))).toBe('2 16 22 ≠ 7')
  })

  it('formats numbers for the language', () => {
    const comma = (n) => String(n).replace('.', ',')
    expect(formatFact(fact('3×4=?', 'mul', 12.5), comma)).toBe('3 × 4 = 12,5')
  })
})
