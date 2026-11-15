import { showWord } from '../game/reading.js'
import { useSolutionSettled } from './useSolutionSettled.js'
import './ReadingCard.css'

/**
 * The picture for a reading question: a big emoji to find the word for,
 * or a big word to find the emoji for. The solution adds the other half.
 * Like Visualization, calls `onSettled(step)` once the solution is shown.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  shows the solution from SOLUTION_FRAME
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function ReadingCard({ question, step, onSettled }) {
  const solved = useSolutionSettled(step, onSettled)

  const pictureFirst = question.op === 'word'
  const [emoji, word] = pictureFirst ? question.terms : [question.terms[1], question.terms[0]]
  const shownWord = showWord(word, question.case)

  const picture = (
    <span className="reading-emoji" aria-hidden={!pictureFirst && !solved}>
      {emoji}
    </span>
  )
  const text = (
    <span className="reading-word" style={{ '--chars': Math.max(4, [...shownWord].length) }}>
      {shownWord}
    </span>
  )

  // The half that is asked for keeps its space until it is shown, so
  // nothing moves when it appears.
  return (
    <div className={`reading-card${solved ? ' is-solved' : ''}${pictureFirst ? ' is-picture-first' : ' is-word-first'}`}>
      <div className="reading-given">{pictureFirst ? picture : text}</div>
      <div className="reading-answer">{pictureFirst ? text : picture}</div>
    </div>
  )
}
