import { useState } from 'react'
import { AVATARS } from '../profiles/store.js'
import './ProfileScreen.css'

function NewProfileForm({ onCreate, onCancel, takenAvatars }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(() => AVATARS.find((option) => !takenAvatars.includes(option)) ?? AVATARS[0])
  const trimmed = name.trim()

  return (
    <form
      className="card profile-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed) {
          onCreate({ name: trimmed, avatar })
        }
      }}
    >
      <label className="profile-form-label" htmlFor="profile-name">
        What's your name?
      </label>
      <input
        id="profile-name"
        className="profile-form-name"
        value={name}
        maxLength={20}
        autoComplete="off"
        autoFocus
        onChange={(event) => setName(event.target.value)}
      />

      <fieldset className="profile-avatars">
        <legend className="profile-form-label">Pick an animal</legend>
        {AVATARS.map((option) => (
          <label key={option} className="profile-avatar-option">
            <input type="radio" name="avatar" aria-label={option} checked={avatar === option} onChange={() => setAvatar(option)} />
            <span aria-hidden="true">{option}</span>
          </label>
        ))}
      </fieldset>

      <div className="profile-form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-large" disabled={!trimmed}>
          {avatar} Let's go!
        </button>
      </div>
    </form>
  )
}

/** "Who's playing?": pick, add or remove player profiles. */
export default function ProfileScreen({ profiles, onSelect, onCreate, onRemove }) {
  const [adding, setAdding] = useState(profiles.length === 0)
  const [editing, setEditing] = useState(false)

  return (
    <main className="page profiles">
      <header className="profiles-header">
        <h1 className="app-title">
          <span className="term-a">Math</span>
          <span className="term-b">i</span>
          <span className="term-c">us</span>
        </h1>
        <p>{profiles.length === 0 ? 'Welcome! Let’s make your player.' : 'Who’s playing?'}</p>
      </header>

      {adding ? (
        <NewProfileForm
          onCreate={onCreate}
          onCancel={profiles.length > 0 ? () => setAdding(false) : null}
          takenAvatars={profiles.map((profile) => profile.avatar)}
        />
      ) : (
        <>
          <ul className="profile-list">
            {profiles.map((profile) => (
              <li key={profile.id} className="profile-item">
                <button type="button" className="profile-tile" onClick={() => onSelect(profile.id)} disabled={editing}>
                  <span className="profile-avatar" aria-hidden="true">
                    {profile.avatar}
                  </span>
                  <span className="profile-name">{profile.name}</span>
                </button>
                {editing && (
                  <button
                    type="button"
                    className="profile-remove"
                    aria-label={`Remove ${profile.name}`}
                    onClick={() => {
                      if (window.confirm(`Remove ${profile.name} and all their results?`)) {
                        onRemove(profile.id)
                      }
                    }}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
            {!editing && (
              <li className="profile-item">
                <button type="button" className="profile-tile is-new" onClick={() => setAdding(true)}>
                  <span className="profile-avatar" aria-hidden="true">
                    ＋
                  </span>
                  <span className="profile-name">New player</span>
                </button>
              </li>
            )}
          </ul>
          {profiles.length > 0 && (
            <div className="profiles-footer">
              <button type="button" className="btn btn-quiet" onClick={() => setEditing((value) => !value)}>
                {editing ? 'Done' : 'Edit players'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
