import { useCallback, useState } from 'react'
import PlayerBar from './components/PlayerBar.jsx'
import { addProfile, getProfile, removeProfile, selectProfile, updateProfile } from './profiles/store.js'
import { useStore } from './profiles/useStore.js'
import PlayScreen from './screens/PlayScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import SetupScreen from './screens/SetupScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import './ui.css'

export default function App() {
  const [store, setStore] = useStore()
  const [screen, setScreen] = useState({ name: 'setup', round: 0 })
  const profile = getProfile(store, store.activeProfileId)

  const handleFinish = useCallback((session) => {
    setScreen((current) => ({ name: 'summary', round: current.round, session }))
  }, [])

  const play = () => setScreen((current) => ({ name: 'play', round: current.round + 1 }))
  const toSetup = () => setScreen((current) => ({ name: 'setup', round: current.round }))

  if (!profile) {
    return (
      <ProfileScreen
        profiles={store.profiles}
        onSelect={(id) => {
          setStore((current) => selectProfile(current, id))
          toSetup()
        }}
        onCreate={(details) => {
          setStore((current) => addProfile(current, details))
          toSetup()
        }}
        onRemove={(id) => setStore((current) => removeProfile(current, id))}
      />
    )
  }

  const settings = profile.settings

  if (screen.name === 'play') {
    return <PlayScreen key={screen.round} settings={settings} onFinish={handleFinish} onQuit={toSetup} />
  }

  if (screen.name === 'summary') {
    return <SummaryScreen session={screen.session} onPlayAgain={play} onDone={toSetup} />
  }

  return (
    <SetupScreen
      settings={settings}
      onChange={(next) => setStore((current) => updateProfile(current, profile.id, { settings: next }))}
      onStart={play}
      header={<PlayerBar profile={profile} onSwitch={() => setStore((current) => selectProfile(current, null))} />}
    />
  )
}
