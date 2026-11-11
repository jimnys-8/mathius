import { useI18n } from '../i18n/i18n.js'
import './PlayerBar.css'

/** The current player, with a way to switch to someone else. */
export default function PlayerBar({ profile, onSwitch, children }) {
  const { t } = useI18n()
  return (
    <header className="player-bar">
      <button type="button" className="player-bar-who" onClick={onSwitch} aria-label={t('player.switchLabel', { name: profile.name })}>
        <span className="player-bar-avatar" aria-hidden="true">
          {profile.avatar}
        </span>
        <span className="player-bar-name">{profile.name}</span>
        <span className="player-bar-switch">{t('player.switch')}</span>
      </button>
      <div className="player-bar-actions">{children}</div>
    </header>
  )
}
