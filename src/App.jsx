import { useCallback, useState } from 'react'
import PlayScreen from './screens/PlayScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import './ui.css'

const DEFAULT_SETTINGS = { category: 'mix', level: 2, timer: 0 }

export default function App() {
  const [screen, setScreen] = useState({ name: 'play', round: 0 })
  const settings = DEFAULT_SETTINGS

  const handleFinish = useCallback((session) => {
    setScreen((current) => ({ name: 'summary', round: current.round, session }))
  }, [])

  const playAgain = () => setScreen((current) => ({ name: 'play', round: current.round + 1 }))

  if (screen.name === 'summary') {
    return <SummaryScreen session={screen.session} onPlayAgain={playAgain} onDone={playAgain} />
  }

  return <PlayScreen key={screen.round} settings={settings} onFinish={handleFinish} onQuit={playAgain} />
}
