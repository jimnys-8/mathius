import { showWord } from '../game/reading.js'
import { useSolutionSettled } from './useSolutionSettled.js'
import './ReadingCard.css'
import './LetterCard.css'

/**
 * The picture for a missing-letter question: a big emoji, and below it
 * its word with an empty slot where a letter is missing. The solution
 * fills in the letter. Like Visualization, calls `onSettled(step)` once
 * the solution is shown.
 *
 * With two slots, they are answered left to right: the first `filled`
 * show their letter, and the one being asked is marked.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} [props.filled]  slots already answered
 * @param {number} props.step  shows the solution from SOLUTION_FRAME
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function LetterCard({ question, filled = 0, step, onSettled }) {
  const solved = useSolutionSettled(step, onSettled)
  const [emoji, gapped, letters] = question.terms
  const chars = [...showWord(gapped, question.case)]
  const fill = [...letters]
  const asking = fill.length > 1 && !solved
  const gaps = chars.flatMap((char, index) => (char === '_' ? [index] : []))

  return (
    <div className={`reading-card letter-card${solved ? ' is-solved' : ''}`}>
      <span className="reading-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="reading-word" style={{ '--chars': Math.max(4, chars.length) }}>
        {chars.map((char, index) => {
          if (char !== '_') {
            return char
          }
          const gap = gaps.indexOf(index)
          const state = gap < filled ? ' is-filled' : asking && gap === filled ? ' is-asked' : ''
          return (
            <span key={index} className={`letter-gap${state}`}>
              <span className="letter-gap-letter">{showWord(fill[gap], question.case)}</span>
            </span>
          )
        })}
      </span>
    </div>
  )
}
