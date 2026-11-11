import './PlayerBar.css'

/** The current player, with a way to switch to someone else. */
export default function PlayerBar({ profile, onSwitch, children }) {
  return (
    <header className="player-bar">
      <button type="button" className="player-bar-who" onClick={onSwitch} aria-label={`${profile.name}. Switch player`}>
        <span className="player-bar-avatar" aria-hidden="true">
          {profile.avatar}
        </span>
        <span className="player-bar-name">{profile.name}</span>
        <span className="player-bar-switch">Switch</span>
      </button>
      <div className="player-bar-actions">{children}</div>
    </header>
  )
}
