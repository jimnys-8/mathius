import { useMemo, useState } from 'react'
import Fraction from '../components/Fraction.jsx'
import Fact from '../components/Fact.jsx'
import Icon from '../components/Icon.jsx'
import { OPERATIONS } from '../game/config.js'
import { levelText, useI18n } from '../i18n/i18n.js'
import { computeStats } from '../profiles/stats.js'
import './StatsScreen.css'

function percent(value) {
  return `${Math.round(value * 100)}%`
}

function formatWhen(timestamp, now, { t, locale }) {
  const date = new Date(timestamp)
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const days = Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(timestamp).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days === 0) {
    return t('stats.todayAt', { time })
  }
  if (days === 1) {
    return t('stats.yesterdayAt', { time })
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
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
  const i18n = useI18n()
  const { t, formatPercent, formatTimer } = i18n
  const [now] = useState(() => Date.now())
  const describeSettings = (session) =>
    [t(`category.${session.category}`), levelText(t, session.category, session.level).name]
      .concat(session.timer > 0 ? [`⏱ ${formatTimer(session.timer)}`] : [])
      .join(' · ')
  const stats = useMemo(() => computeStats(history, now), [history, now])

  return (
    <main className="page stats">
      <header className="stats-header">
        <button type="button" className="btn btn-quiet" onClick={onBack}>
          <Icon name="arrowLeft" /> {t('stats.back')}
        </button>
        <h1>
          <span aria-hidden="true">{profile.avatar}</span> {profile.name}
        </h1>
      </header>

      {stats.games === 0 ? (
        <section className="card stats-empty">
          <p>{t('stats.empty')}</p>
        </section>
      ) : (
        <>
          <section className="stats-tiles" aria-label={t('stats.totals')}>
            <Tile label={t('stats.questions')} value={stats.answered} />
            <Tile label={t('stats.correct')} value={formatPercent(stats.accuracy)} />
            <Tile label={t('stats.games')} value={stats.games} />
            <Tile label={t('stats.today')} value={stats.answeredToday} />
          </section>

          <section className="card">
            <h2>{t('stats.byOperation')}</h2>
            <ul className="stats-meters">
              {/* Only what the player has tried, so a young player isn't faced with square roots. */}
              {stats.byOperation.filter(({ answered }) => answered > 0).map(({ op, answered, correct }) => {
                const ratio = correct / answered
                return (
                  <li key={op} className="stats-meter" title={t('stats.correctOf', { correct, count: answered })}>
                    <span
                      className={`stats-meter-symbol${[...OPERATIONS[op].symbol].length > 2 ? ' is-wide' : ''}`}
                      aria-hidden="true"
                    >
                      {op === 'eq' ? <i>x</i> : op === 'fraction' ? <Fraction fraction={[1, 2]} className="stats-meter-fraction" /> : OPERATIONS[op].symbol}
                    </span>
                    <span className="stats-meter-name">{t(`category.${op}`)}</span>
                    <span
                      className="stats-meter-track"
                      role="meter"
                      aria-label={t(`category.${op}`)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(ratio * 100)}
                    >
                      <span className="stats-meter-fill" style={{ width: percent(ratio) }} />
                    </span>
                    <span className="stats-meter-value">
                      <strong>{formatPercent(ratio)}</strong> {t('stats.ofCount', { count: answered })}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <div className="stats-columns">
            <section className="card">
              <h2>⏱ {t('stats.bestTimed')}</h2>
              {stats.bestTimed.length === 0 ? (
                <p className="stats-note">{t('stats.noTimed')}</p>
              ) : (
                <ul className="stats-list">
                  {stats.bestTimed.map((session) => (
                    <li key={`${session.category}-${session.level}-${session.timer}`}>
                      <span>{describeSettings(session)}</span>
                      <strong>{session.correct}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2>{t('stats.tricky')}</h2>
              {stats.tricky.length === 0 ? (
                <p className="stats-note">{t('stats.noTricky')}</p>
              ) : (
                <ul className="stats-facts">
                  {stats.tricky.map((fact) => (
                    <li key={fact.key} title={t('stats.missed', { wrong: fact.wrong, count: fact.right + fact.wrong })}>
                      <Fact fact={fact} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card">
            <h2>{t('stats.recent')}</h2>
            <ul className="stats-list">
              {stats.recent.map((session, index) => (
                <li key={`${session.at}-${index}`}>
                  <span className="stats-when">{formatWhen(session.at, now, i18n)}</span>
                  <span>{describeSettings(session)}</span>
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
