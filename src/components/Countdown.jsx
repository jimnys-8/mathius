import { useEffect, useState } from 'react'
import './Countdown.css'

/**
 * Remaining time as a shrinking bar and seconds. The bar is a CSS
 * animation, so it stays smooth while the seconds update a few times a
 * second.
 */
export default function Countdown({ startedAt, seconds }) {
  const endsAt = startedAt + seconds * 1000
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [])

  const left = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const elapsed = Math.max(0, Math.min(seconds * 1000, now - startedAt))

  return (
    <div className={`countdown${left <= 10 ? ' is-ending' : ''}`} role="timer" aria-label={`${left} seconds left`}>
      <div className="countdown-track">
        <div
          className="countdown-bar"
          style={{ animationDuration: `${seconds}s`, animationDelay: `-${elapsed}ms` }}
        />
      </div>
      <span className="countdown-seconds">{left}</span>
    </div>
  )
}
