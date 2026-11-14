import { useI18n } from '../i18n/i18n.js'
import './Numpad.css'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'enter']

/** On-screen number keys for touch devices. */
export default function Numpad({ onDigit, onBackspace, onEnter, enterLabel = '✓', disabled = false, enterDisabled = false }) {
  const { t } = useI18n()
  return (
    <div className="numpad" role="group" aria-label={t('play.numberKeys')}>
      {KEYS.map((key) => {
        if (key === 'back') {
          return (
            <button key={key} type="button" className="numpad-key is-back" onClick={onBackspace} disabled={disabled} aria-label={t('play.delete')}>
              {/* An SVG, not the ⌫ character: Nunito lacks it, and phones draw it thin from a fallback font */}
              <svg className="numpad-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z" />
                <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
              </svg>
            </button>
          )
        }
        if (key === 'enter') {
          return (
            <button key={key} type="button" className="numpad-key is-enter" onClick={onEnter} disabled={enterDisabled}>
              {enterLabel}
            </button>
          )
        }
        return (
          <button key={key} type="button" className="numpad-key" onClick={() => onDigit(key)} disabled={disabled}>
            {key}
          </button>
        )
      })}
    </div>
  )
}
