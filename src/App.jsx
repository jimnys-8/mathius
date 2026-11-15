import { useEffect, useMemo, useState } from 'react'
import Icon from './components/Icon.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'
import PlayerBar from './components/PlayerBar.jsx'
import { normalizeSettings } from './game/config.js'
import { fitToUnlocked, newlyUnlocked, unlockedLevels } from './game/progress.js'
import { I18nContext, createI18n, levelText, useI18n } from './i18n/i18n.js'
import {
  addProfile,
  bestTimedScore,
  getHistory,
  getProfile,
  recordSession,
  removeProfile,
  selectProfile,
  setLanguage,
  updateProfile,
} from './profiles/store.js'
import { useStore } from './profiles/useStore.js'
import PlayScreen from './screens/PlayScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import SetupScreen from './screens/SetupScreen.jsx'
import StatsScreen from './screens/StatsScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import './ui.css'

function RecordBadge({ correct, previousBest }) {
  const { t } = useI18n()
  if (previousBest === null || correct > previousBest) {
    return correct > 0 ? <p className="summary-record is-new">🏆 {t('summary.newBest')}</p> : null
  }
  return <p className="summary-record">{t('summary.best', { best: previousBest })}</p>
}

function UnlockBadge({ category, level }) {
  const { t } = useI18n()
  return (
    <p className="summary-record is-new">
      <Icon name="unlock" /> {t('summary.unlocked', { level: levelText(t, category, level).name })}
    </p>
  )
}

function Screens({ store, setStore }) {
  const { t } = useI18n()
  const [screen, setScreen] = useState({ name: 'setup', round: 0 })
  const profile = getProfile(store, store.activeProfileId)

  const play = () => setScreen((current) => ({ name: 'play', round: current.round + 1 }))
  const show = (name) => setScreen((current) => ({ name, round: current.round }))

  if (!profile) {
    return (
      <ProfileScreen
        profiles={store.profiles}
        header={
          <div className="top-bar">
            <LanguageToggle />
          </div>
        }
        onSelect={(id) => {
          setStore((current) => selectProfile(current, id))
          show('setup')
        }}
        onCreate={(details) => {
          setStore((current) => addProfile(current, details))
          show('setup')
        }}
        onRemove={(id) => setStore((current) => removeProfile(current, id))}
      />
    )
  }

  const history = getHistory(store, profile.id)
  const unlockedFor = (category) => unlockedLevels(history, category, Boolean(profile.unlockAll))
  // Never land on a locked level, e.g. one picked before levels were locked.
  const fitSettings = (next) => fitToUnlocked(next, unlockedFor(next.category))
  const settings = fitSettings(normalizeSettings(profile.settings))

  const handleFinish = (session) => {
    const previousBest = session.settings.timer > 0 ? bestTimedScore(history, session.settings) : undefined
    const { category, level } = session.settings
    const correct = session.results.filter((result) => result.correct).length
    const unlocked = newlyUnlocked(history, { category, level, total: session.results.length, correct }, Boolean(profile.unlockAll))
    setStore((current) => recordSession(current, profile.id, session))
    setScreen((current) => ({ name: 'summary', round: current.round, session, previousBest, unlocked }))
  }

  if (screen.name === 'play') {
    return (
      <PlayScreen
        key={screen.round}
        settings={settings}
        keypad={Boolean(profile.keypad)}
        onKeypadChange={(keypad) => setStore((current) => updateProfile(current, profile.id, { keypad }))}
        onFinish={handleFinish}
        onQuit={() => show('setup')}
      />
    )
  }

  if (screen.name === 'summary') {
    const { session, previousBest, unlocked } = screen
    const correct = session.results.filter((result) => result.correct).length
    return (
      <SummaryScreen session={session} onPlayAgain={play} onDone={() => show('setup')}>
        {previousBest !== undefined && session.results.length > 0 && (
          <RecordBadge correct={correct} previousBest={previousBest} />
        )}
        {unlocked !== null && <UnlockBadge category={session.settings.category} level={unlocked} />}
      </SummaryScreen>
    )
  }

  if (screen.name === 'stats') {
    return <StatsScreen profile={profile} history={history} onBack={() => show('setup')} />
  }

  return (
    <SetupScreen
      settings={settings}
      unlocked={unlockedFor(settings.category)}
      onChange={(next) => setStore((current) => updateProfile(current, profile.id, { settings: fitSettings(next) }))}
      onStart={play}
      header={
        <PlayerBar profile={profile} onSwitch={() => setStore((current) => selectProfile(current, null))}>
          <button type="button" className="btn" onClick={() => show('stats')} aria-label={t('player.stats')}>
            📊 <span className="player-bar-label">{t('player.stats')}</span>
          </button>
          <LanguageToggle />
        </PlayerBar>
      }
    />
  )
}

export default function App() {
  const [store, setStore] = useStore()
  const i18n = useMemo(
    () => ({ ...createI18n(store.language), setLang: (lang) => setStore((current) => setLanguage(current, lang)) }),
    [store.language, setStore],
  )

  useEffect(() => {
    document.documentElement.lang = i18n.lang
  }, [i18n.lang])

  return (
    <I18nContext.Provider value={i18n}>
      <Screens store={store} setStore={setStore} />
    </I18nContext.Provider>
  )
}
