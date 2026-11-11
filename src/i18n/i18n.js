import { createContext, useContext } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, STRINGS } from './strings.js'

function interpolate(text, params) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
}

/**
 * Creates the translation helpers for a language.
 *
 * - `t(key, params)` returns the text for `key`, falling back to English
 *   and then to the key itself. For list values, `params.index` picks one.
 * - `formatNumber(n)` formats a number for the language (6,3 vs 6.3).
 * - `formatPercent(ratio)` formats 0.92 as "92%" or "92 %".
 * - `formatTimer(seconds)` names a timer choice ("30 s", "1 min", "Off").
 */
export function createI18n(lang) {
  const language = LANGUAGES.find((item) => item.id === lang) ?? LANGUAGES.find((item) => item.id === DEFAULT_LANGUAGE)
  const table = STRINGS[language.id]
  const numberFormat = new Intl.NumberFormat(language.locale, { maximumFractionDigits: 2, useGrouping: false })

  const percentFormat = new Intl.NumberFormat(language.locale, { style: 'percent', maximumFractionDigits: 0 })

  const formatNumber = (value) => numberFormat.format(value).replace('-', '−')
  const formatPercent = (ratio) => percentFormat.format(ratio)

  const t = (key, params = {}) => {
    let value = table[key] ?? STRINGS.en[key]
    if (value === undefined) {
      return key
    }
    if (Array.isArray(value)) {
      value = value[(params.index ?? 0) % value.length]
    }
    if (typeof value === 'function') {
      return value(params)
    }
    return interpolate(value, params)
  }

  const formatTimer = (seconds) => {
    if (seconds === 0) {
      return t('timer.off')
    }
    return seconds < 60 ? t('timer.seconds', { seconds }) : t('timer.minutes', { minutes: formatNumber(seconds / 60) })
  }

  return { lang: language.id, locale: language.locale, t, formatNumber, formatPercent, formatTimer }
}

export const I18nContext = createContext({ ...createI18n(DEFAULT_LANGUAGE), setLang: () => {} })

/** Translation helpers for the current language. */
export function useI18n() {
  return useContext(I18nContext)
}
