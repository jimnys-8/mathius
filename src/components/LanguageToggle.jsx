import { useI18n } from '../i18n/i18n.js'
import { LANGUAGES } from '../i18n/strings.js'
import './LanguageToggle.css'

/** Switches the app between the available languages. */
export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="language-toggle" role="group" aria-label={t('app.languageSwitch')}>
      {LANGUAGES.map((language) => (
        <button
          key={language.id}
          type="button"
          lang={language.id}
          className={language.id === lang ? 'is-active' : ''}
          aria-pressed={language.id === lang}
          title={language.name}
          onClick={() => setLang(language.id)}
        >
          {language.short}
        </button>
      ))}
    </div>
  )
}
