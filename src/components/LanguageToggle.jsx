import { useI18n } from '../i18n/i18n.js'
import { LANGUAGES } from '../i18n/strings.js'
import './LanguageToggle.css'

/**
 * Switches the app between the available languages: one button with a
 * flag per language, where a press anywhere moves to the next language.
 */
export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n()
  const index = Math.max(
    0,
    LANGUAGES.findIndex((language) => language.id === lang),
  )
  const next = LANGUAGES[(index + 1) % LANGUAGES.length]

  return (
    <button
      type="button"
      className="language-toggle"
      style={{ '--count': LANGUAGES.length, '--index': index }}
      onClick={() => setLang(next.id)}
      aria-label={t('app.switchLanguage', { current: LANGUAGES[index].name, next: next.name })}
      title={next.name}
    >
      <span className="language-toggle-thumb" aria-hidden="true" />
      {LANGUAGES.map((language) => (
        <span key={language.id} className={`language-toggle-flag${language.id === lang ? ' is-active' : ''}`} aria-hidden="true">
          {language.flag}
        </span>
      ))}
    </button>
  )
}
