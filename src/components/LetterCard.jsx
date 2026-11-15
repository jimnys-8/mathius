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
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  shows the solution from SOLUTION_FRAME
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function LetterCard({ question, step, onSettled }) {
  const solved = useSolutionSettled(step, onSettled)
  const [emoji, gapped, letter] = question.terms
  const chars = [...showWord(gapped, question.case)]

  return (
    <div className={`reading-card letter-card${solved ? ' is-solved' : ''}`}>
      <span className="reading-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="reading-word" style={{ '--chars': Math.max(4, chars.length) }}>
        {chars.map((char, index) =>
          char === '_' ? (
            <span key={index} className="letter-gap">
              <span className="letter-gap-letter">{showWord(letter, question.case)}</span>
            </span>
          ) : (
            char
          ),
        )}
      </span>
    </div>
  )
}
