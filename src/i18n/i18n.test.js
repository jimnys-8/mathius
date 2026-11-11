import { describe, expect, it } from 'vitest'
import { createI18n } from './i18n.js'
import { STRINGS } from './strings.js'

describe('createI18n', () => {
  it('translates with parameters', () => {
    expect(createI18n('en').t('play.wrong', { answer: 7 })).toBe('Not quite. The answer is 7.')
    expect(createI18n('sv').t('play.wrong', { answer: 7 })).toBe('Inte riktigt. Svaret är 7.')
  })

  it('picks from lists by index', () => {
    const { t } = createI18n('en')
    expect(t('summary.headline', { index: 3 })).toBe('Amazing!')
    expect(t('play.praise', { index: 6 })).toBe(t('play.praise', { index: 0 }))
  })

  it('falls back to the default language and to the key', () => {
    expect(createI18n('xx').lang).toBe('sv')
    expect(createI18n('en').t('no.such.key')).toBe('no.such.key')
  })

  it('formats decimals for the language', () => {
    expect(createI18n('sv').formatNumber(6.3)).toBe('6,3')
    expect(createI18n('en').formatNumber(6.3)).toBe('6.3')
    expect(createI18n('sv').formatNumber(144)).toBe('144')
  })

  it('formats percentages for the language', () => {
    expect(createI18n('en').formatPercent(0.92)).toBe('92%')
    expect(createI18n('sv').formatPercent(0.92).replace(/\s/, ' ')).toBe('92 %')
  })

  it('names timer choices', () => {
    expect(createI18n('en').formatTimer(0)).toBe('Off')
    expect(createI18n('sv').formatTimer(30)).toBe('30 s')
    expect(createI18n('sv').formatTimer(120)).toBe('2 min')
  })

  it('has the same keys in every language', () => {
    expect(Object.keys(STRINGS.sv).sort()).toEqual(Object.keys(STRINGS.en).sort())
  })
})
