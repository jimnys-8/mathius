import { useMemo, useState } from 'react'
import { OPERATIONS, TIMER_OPTIONS, getCategory, getLevel } from '../game/config.js'
import { computeStats } from '../profiles/stats.js'
import './StatsScreen.css'

function percent(value) {
  return `${Math.round(value * 100)}%`
}

function formatFact(key, answer) {
  return key.replace('?', String(answer)).replace(/([+−×÷=])/g, ' $1 ')
}

function timerLabel(seconds) {
  return TIMER_OPTIONS.find((option) => option.seconds === seconds)?.label ?? `${seconds} s`
}

function formatWhen(timestamp, now) {
  const date = new Date(timestamp)
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const days = Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(timestamp).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days === 0) {
    return `Today ${time}`
  }
  if (days === 1) {
    return `Yesterday ${time}`
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function Tile({ label, value }) {
  return (
    <div className="stats-tile">
      <span className="stats-tile-value">{value}</span>
      <span className="stats-tile-label">{label}</span>
    </div>
  )
}

/** A player's results: totals, accuracy per operation, records and tricky facts. */
export default function StatsScreen({ profile, history, onBack }) {
  const [now] = useState(() => Date.now())
  const stats = useMemo(() => computeStats(history, now), [history, now])

  return (
    <main className="page stats">
      <header className="stats-header">
        <button type="button" className="btn btn-quiet" onClick={onBack}>
          ← Back
        </button>
        <h1>
          <span aria-hidden="true">{profile.avatar}</span> {profile.name}
        </h1>
      </header>

      {stats.games === 0 ? (
        <section className="card stats-empty">
          <p>Play a game and your results will show up here!</p>
        </section>
      ) : (
        <>
          <section className="stats-tiles" aria-label="Totals">
            <Tile label="questions" value={stats.answered} />
            <Tile label="correct" value={percent(stats.accuracy)} />
            <Tile label="games" value={stats.games} />
            <Tile label="today" value={stats.answeredToday} />
          </section>

          <section className="card">
            <h2>Correct answers</h2>
            <ul className="stats-meters">
              {stats.byOperation.map(({ op, answered, correct }) => {
                const ratio = answered > 0 ? correct / answered : 0
                return (
                  <li key={op} className="stats-meter" title={answered > 0 ? `${correct} of ${answered} correct` : undefined}>
                    <span className="stats-meter-symbol" aria-hidden="true">
                      {OPERATIONS[op].symbol}
                    </span>
                    <span className="stats-meter-name">{OPERATIONS[op].label}</span>
                    <span
                      className="stats-meter-track"
                      role="meter"
                      aria-label={`${OPERATIONS[op].label} correct`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(ratio * 100)}
                    >
                      <span className="stats-meter-fill" style={{ width: percent(ratio) }} />
                    </span>
                    <span className="stats-meter-value">
                      {answered > 0 ? (
                        <>
                          <strong>{percent(ratio)}</strong> of {answered}
                        </>
                      ) : (
                        'not tried yet'
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <div className="stats-columns">
            <section className="card">
              <h2>⏱ Best timed scores</h2>
              {stats.bestTimed.length === 0 ? (
                <p className="stats-note">Turn on the timer to set a record!</p>
              ) : (
                <ul className="stats-list">
                  {stats.bestTimed.map((session) => (
                    <li key={`${session.category}-${session.level}-${session.timer}`}>
                      <span>
                        {getCategory(session.category).label} · {getLevel(session.level).name} · {timerLabel(session.timer)}
                      </span>
                      <strong>{session.correct}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2>Practice these</h2>
              {stats.tricky.length === 0 ? (
                <p className="stats-note">No tricky ones yet. Great job!</p>
              ) : (
                <ul className="stats-facts">
                  {stats.tricky.map((fact) => (
                    <li key={fact.key} title={`Missed ${fact.wrong} of ${fact.right + fact.wrong}`}>
                      {formatFact(fact.key, fact.answer)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card">
            <h2>Recent games</h2>
            <ul className="stats-list">
              {stats.recent.map((session, index) => (
                <li key={`${session.at}-${index}`}>
                  <span className="stats-when">{formatWhen(session.at, now)}</span>
                  <span>
                    {getCategory(session.category).label} · {getLevel(session.level).name}
                    {session.timer > 0 && ` · ⏱ ${timerLabel(session.timer)}`}
                  </span>
                  <strong>
                    {session.correct}/{session.total}
                  </strong>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}
