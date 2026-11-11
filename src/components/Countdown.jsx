import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/i18n.js'
import './Countdown.css'

/**
 * Remaining time as a shrinking bar and seconds. The clock can be paused:
 * `runningSince` is when it last started, or null while paused, and
 * `usedMs` the time used before that.
 */
export default function Countdown({ seconds, usedMs, runningSince }) {
  const { t } = useI18n()
  const [now, setNow] = useState(() => Date.now())
  const running = runningSince !== null

  useEffect(() => {
    if (!running) {
      return undefined
    }
    const interval = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(interval)
  }, [running])

  const total = seconds * 1000
  const used = usedMs + (running ? Math.max(0, now - runningSince) : 0)
  const leftMs = Math.max(0, total - used)
  const left = Math.ceil(leftMs / 1000)

  return (
    <div
      className={`countdown${left <= 10 ? ' is-ending' : ''}${running ? '' : ' is-paused'}`}
      role="timer"
      aria-label={t('play.timeLeft', { seconds: left })}
    >
      <div className="countdown-track">
        <div className="countdown-bar" style={{ transform: `scaleX(${leftMs / total})` }} />
      </div>
      <span className="countdown-seconds">{left}</span>
    </div>
  )
}
