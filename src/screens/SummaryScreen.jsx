import Fact, { GivenAnswer } from '../components/Fact.jsx'
import Icon from '../components/Icon.jsx'
import { ROUND_LENGTH } from '../game/config.js'
import { PASS } from '../game/progress.js'
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

/**
 * Results of a finished session. `onEasier` and `onHarder` play a round
 * on the level below or above, when there is one; with `harderLocked`
 * the harder one shows a padlock and how to open it.
 */
export default function SummaryScreen({ session, onPlayAgain, onDone, onEasier, onHarder, harderLocked = false, children }) {
  const { t } = useI18n()
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
              <span className="summary-fact">
                <Fact fact={result} />
              </span>
              {!result.correct && (
                <span className="summary-given">
                  <GivenAnswer result={result} />
                </span>
              )}
              {result.hinted && <span className="summary-hint" title={t('summary.usedHint')}>💡</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="summary-actions">
        {(onEasier || onHarder) && (
          <div className="summary-levels">
            {onEasier && (
              <button type="button" className="btn" onClick={onEasier}>
                <Icon name="arrowLeft" /> {t('summary.easier')}
              </button>
            )}
            {onHarder && (
              <button type="button" className="btn summary-harder" onClick={onHarder} disabled={harderLocked}>
                {harderLocked && <Icon name="lock" />} {t('summary.harder')} {!harderLocked && <Icon name="arrowRight" />}
              </button>
            )}
          </div>
        )}
        {onHarder && harderLocked && (
          <p className="summary-unlock-hint">{t('setup.unlockHint', { correct: PASS.correct, total: ROUND_LENGTH })}</p>
        )}
        <div className="summary-main">
          <button type="button" className="btn" onClick={onDone}>
            {t('summary.done')}
          </button>
          <button type="button" className="btn btn-primary btn-large" onClick={onPlayAgain} autoFocus>
            {t('summary.playAgain')}
          </button>
        </div>
      </div>
    </main>
  )
}
