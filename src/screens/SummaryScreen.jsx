import Icon from '../components/Icon.jsx'
import { formatFact } from '../game/format.js'
import { summarize } from '../game/session.js'
import { useI18n } from '../i18n/i18n.js'
import './SummaryScreen.css'

function starsFor(correct, total) {
  if (total === 0) {
    return 0
  }
  const ratio = correct / total
  if (ratio >= 0.9) {
    return 3
  }
  if (ratio >= 0.7) {
    return 2
  }
  return ratio >= 0.4 ? 1 : 0
}

/** Results of a finished session. */
export default function SummaryScreen({ session, onPlayAgain, onDone, children }) {
  const { t, formatNumber } = useI18n()
  const { total, correct } = summarize(session.results)
  const stars = starsFor(correct, total)
  const timed = session.settings.timer > 0

  return (
    <main className="page summary">
      <section className="card summary-score">
        <div className="summary-stars" aria-label={t('summary.stars', { count: stars })}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={`summary-star${index < stars ? ' is-lit' : ''}`} style={{ animationDelay: `${0.2 + index * 0.25}s` }}>
              ★
            </span>
          ))}
        </div>
        <h1>{t('summary.headline', { index: stars })}</h1>
        <p className="summary-count">
          {timed ? (
            <>
              <strong>{correct}</strong> {t('summary.inTime', { seconds: session.settings.timer })}
            </>
          ) : (
            <>
              <strong>{correct}</strong> {t('summary.ofTotal', { total })}
            </>
          )}
        </p>
        {children}
      </section>

      {session.results.length > 0 && (
        <ol className="summary-list card">
          {session.results.map((result, index) => (
            <li key={index} className={result.correct ? 'is-correct' : 'is-wrong'}>
              <span className="summary-mark" aria-hidden="true">
                <Icon name={result.correct ? 'check' : 'cross'} />
              </span>
              <span className="summary-fact">{formatFact(result, formatNumber)}</span>
              {!result.correct && (
                <span className="summary-given">
                  {t('summary.youSaid', {
                    given: typeof result.given === 'string' ? result.given : formatNumber(result.given),
                  })}
                </span>
              )}
              {result.hinted && <span className="summary-hint" title={t('summary.usedHint')}>💡</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="summary-actions">
        <button type="button" className="btn" onClick={onDone}>
          {t('summary.done')}
        </button>
        <button type="button" className="btn btn-primary btn-large" onClick={onPlayAgain} autoFocus>
          {t('summary.playAgain')}
        </button>
      </div>
    </main>
  )
}
