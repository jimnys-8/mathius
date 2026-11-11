import { describe, expect, it } from 'vitest'
import { formatFact } from './format.js'

describe('formatFact', () => {
  it('fills in the answer and spaces the symbols', () => {
    expect(formatFact('7×?=56', 8)).toBe('7 × 8 = 56')
    expect(formatFact('?+4=9', 5)).toBe('5 + 4 = 9')
  })

  it('formats square roots', () => {
    expect(formatFact('√49=?', 7)).toBe('√49 = 7')
    expect(formatFact('√?=7', 49)).toBe('√49 = 7')
    expect(formatFact('√40≈?', 6.3)).toBe('√40 ≈ 6.3')
  })

  it('formats numbers for the language', () => {
    const comma = (n) => String(n).replace('.', ',')
    expect(formatFact('3×4=?', 12.5, comma)).toBe('3 × 4 = 12,5')
  })
})
