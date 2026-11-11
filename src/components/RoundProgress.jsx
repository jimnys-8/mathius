import { ROUND_LENGTH } from '../game/config.js'
import { useI18n } from '../i18n/i18n.js'
import './RoundProgress.css'

/** A row of dots, one per question in the round, colored by result. */
export default function RoundProgress({ results, current }) {
  const { t } = useI18n()
  const dots = Array.from({ length: ROUND_LENGTH }, (_, index) => {
    const result = results[index]
    if (result) {
      return result.correct ? 'correct' : 'wrong'
    }
    return index === results.length && current ? 'current' : 'todo'
  })

  return (
    <ol className="round-progress" aria-label={t('play.progress', { number: Math.min(results.length + 1, ROUND_LENGTH), total: ROUND_LENGTH })}>
      {dots.map((state, index) => (
        <li key={index} className={`round-progress-dot is-${state}`} />
      ))}
    </ol>
  )
}
