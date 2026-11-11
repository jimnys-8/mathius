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
 *   `key` may be a list of keys; the first one that has a text is used.
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

  const lookup = (key) => table[key] ?? STRINGS.en[key]

  const t = (keys, params = {}) => {
    const candidates = Array.isArray(keys) ? keys : [keys]
    const key = candidates.find((candidate) => lookup(candidate) !== undefined)
    if (key === undefined) {
      return candidates[candidates.length - 1]
    }
    let value = lookup(key)
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

/**
 * Name and description of a level. A category can word its levels its
 * own way (`level.sqrt.3.desc`); otherwise the shared texts are used.
 */
export function levelText(t, category, level) {
  return {
    name: t([`level.${category}.${level}.name`, `level.${level}.name`]),
    desc: t([`level.${category}.${level}.desc`, `level.${level}.desc`]),
  }
}
