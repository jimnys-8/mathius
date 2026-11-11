import { useCallback, useState } from 'react'
import PlayScreen from './screens/PlayScreen.jsx'
import SetupScreen from './screens/SetupScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import './ui.css'

const DEFAULT_SETTINGS = { category: 'add', level: 1, timer: 0 }

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [screen, setScreen] = useState({ name: 'setup', round: 0 })

  const handleFinish = useCallback((session) => {
    setScreen((current) => ({ name: 'summary', round: current.round, session }))
  }, [])

  const play = () => setScreen((current) => ({ name: 'play', round: current.round + 1 }))
  const toSetup = () => setScreen((current) => ({ name: 'setup', round: current.round }))

  if (screen.name === 'play') {
    return <PlayScreen key={screen.round} settings={settings} onFinish={handleFinish} onQuit={toSetup} />
  }

  if (screen.name === 'summary') {
    return <SummaryScreen session={screen.session} onPlayAgain={play} onDone={toSetup} />
  }

  return <SetupScreen settings={settings} onChange={setSettings} onStart={play} />
}
