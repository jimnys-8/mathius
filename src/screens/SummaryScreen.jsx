import { summarize } from '../game/session.js'
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

function headline(stars) {
  return ['Keep practicing!', 'Good try!', 'Great work!', 'Amazing!'][stars]
}

function formatKey(result) {
  return result.key.replace('?', String(result.answer)).replace(/([+−×÷=])/g, ' $1 ')
}

/** Results of a finished session. */
export default function SummaryScreen({ session, onPlayAgain, onDone, children }) {
  const { total, correct } = summarize(session.results)
  const stars = starsFor(correct, total)
  const timed = session.settings.timer > 0

  return (
    <main className="page summary">
      <section className="card summary-score">
        <div className="summary-stars" aria-label={`${stars} of 3 stars`}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={`summary-star${index < stars ? ' is-lit' : ''}`} style={{ animationDelay: `${0.2 + index * 0.25}s` }}>
              ★
            </span>
          ))}
        </div>
        <h1>{headline(stars)}</h1>
        <p className="summary-count">
          {timed ? (
            <>
              <strong>{correct}</strong> correct in {session.settings.timer} seconds
            </>
          ) : (
            <>
              <strong>{correct}</strong> of {total} correct
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
                {result.correct ? '✓' : '✗'}
              </span>
              <span className="summary-fact">{formatKey(result)}</span>
              {!result.correct && <span className="summary-given">you said {result.given}</span>}
              {result.hinted && <span className="summary-hint" title="Used a hint">💡</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="summary-actions">
        <button type="button" className="btn" onClick={onDone}>
          Done
        </button>
        <button type="button" className="btn btn-primary btn-large" onClick={onPlayAgain} autoFocus>
          Play again
        </button>
      </div>
    </main>
  )
}
