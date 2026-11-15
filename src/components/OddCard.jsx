import { showWord } from '../game/reading.js'
import { useI18n } from '../i18n/i18n.js'
import { HINT_FRAME } from '../viz/scenes.js'
import { useSolutionSettled } from './useSolutionSettled.js'
import './OddCard.css'

/**
 * Three circles and a square: "which one doesn't fit?" for a child who
 * can't read the question yet.
 */
function OddSign() {
  return (
    <svg className="odd-sign" viewBox="0 0 40 10" aria-hidden="true">
      {[5, 15, 25].map((cx) => (
        <circle key={cx} cx={cx} cy={5} r={3.6} />
      ))}
      <rect className="odd-sign-odd" x={31.6} y={1.6} width={6.8} height={6.8} rx={1} />
    </svg>
  )
}

/** One of the four, as the level shows it: an emoji (with its word on the word level) or a number. */
function OddItem({ item, question }) {
  const { formatNumber } = useI18n()
  if (question.show === 'numbers') {
    return <span className="odd-item odd-number">{formatNumber(item.value)}</span>
  }
  return (
    <span className="odd-item">
      <span className="odd-emoji">{item.emoji}</span>
      {question.show === 'words' && <span className="odd-word">{showWord(item.word, question.case)}</span>}
    </span>
  )
}

/**
 * The picture for an odd-one-out question. While answering it asks which
 * one doesn't fit, and the hint adds what three of them have in common.
 * The solution explains the answer: "🐄 🐖 🐑 bor på bondgården, men
 * inte 🦁". Like Visualization, calls `onSettled(step)` once the
 * solution is shown.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  HINT_FRAME shows the clue, SOLUTION_FRAME the explanation
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function OddCard({ question, step, onSettled }) {
  const { t } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const hinted = step >= HINT_FRAME

  // Both faces share one grid cell, so the card keeps its size when the
  // explanation takes over.
  return (
    <div className={`odd-card${solved ? ' is-solved' : ''}${hinted ? ' is-hinted' : ''}`}>
      <div className="odd-face odd-ask" aria-hidden={solved}>
        <OddSign />
        <p className="odd-prompt">{t('play.oddPrompt')}</p>
        <p className="odd-clue">{t('play.oddClue', { phrase: question.phrase })}</p>
      </div>
      <div className="odd-face odd-explain" aria-hidden={!solved}>
        <div className="odd-three">
          {question.three.map((item, index) => (
            <OddItem key={index} item={item} question={question} />
          ))}
        </div>
        <p className="odd-phrase">{question.phrase},</p>
        <div className="odd-but">
          <span className="odd-but-not">{t('play.oddButNot')}</span>
          <OddItem item={question.oddOne} question={question} />
        </div>
      </div>
    </div>
  )
}
