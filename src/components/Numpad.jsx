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
              ⌫
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
