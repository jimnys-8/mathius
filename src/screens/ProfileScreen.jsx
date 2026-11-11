import { useState } from 'react'
import { useI18n } from '../i18n/i18n.js'
import { AVATARS } from '../profiles/store.js'
import './ProfileScreen.css'

function NewProfileForm({ onCreate, onCancel, takenAvatars }) {
  const { t } = useI18n()
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
        {t('profiles.nameQuestion')}
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
        <legend className="profile-form-label">{t('profiles.pickAnimal')}</legend>
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
            {t('profiles.cancel')}
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-large" disabled={!trimmed}>
          {avatar} {t('profiles.create')}
        </button>
      </div>
    </form>
  )
}

/** "Who's playing?": pick, add or remove player profiles. */
export default function ProfileScreen({ profiles, onSelect, onCreate, onRemove, header }) {
  const { t } = useI18n()
  const [adding, setAdding] = useState(profiles.length === 0)
  const [editing, setEditing] = useState(false)

  return (
    <main className="page profiles">
      {header}
      <header className="profiles-header">
        <h1 className="app-title">
          <span className="term-a">Math</span>
          <span className="term-b">i</span>
          <span className="term-c">us</span>
        </h1>
        <p>{profiles.length === 0 ? t('profiles.welcome') : t('profiles.whoIsPlaying')}</p>
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
                    aria-label={t('profiles.remove', { name: profile.name })}
                    onClick={() => {
                      if (window.confirm(t('profiles.confirmRemove', { name: profile.name }))) {
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
                  <span className="profile-name">{t('profiles.newPlayer')}</span>
                </button>
              </li>
            )}
          </ul>
          {profiles.length > 0 && (
            <div className="profiles-footer">
              <button type="button" className="btn btn-quiet" onClick={() => setEditing((value) => !value)}>
                {editing ? t('profiles.done') : t('profiles.edit')}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
