import { showWord } from '../game/reading.js'
import { useI18n } from '../i18n/i18n.js'
import { useSolutionSettled } from './useSolutionSettled.js'
import './ReadingCard.css'
import './LetterCard.css'
import './WrongLetterCard.css'

/**
 * The picture for a wrong-letter question: a big emoji and its word with
 * one wrong letter. First every letter is a button, and tapping one
 * answers the first step (`onTap` with its position, as a string); the
 * hint greys out the positions in `removed`. Once the wrong letter is
 * found it's crossed out over a line to write on, while the right one is
 * picked. The solution puts the right letter in, and marks a right
 * letter tapped by mistake. Like Visualization, calls `onSettled(step)`
 * once the solution is shown.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.answered  steps answered so far (the session's `step`)
 * @param {string[]} props.picked  the choices made so far
 * @param {boolean} props.answering  whether letters can be tapped
 * @param {string[]} [props.removed]  positions the hint greys out
 * @param {(position: string) => void} props.onTap
 * @param {number} props.step  shows the solution from SOLUTION_FRAME
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function WrongLetterCard({ question, answered, picked, answering, removed = [], onTap, step, onSettled }) {
  const { t } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const [emoji, misspelled] = question.terms
  const chars = [...showWord(misspelled, question.case)]
  const [tap, pick] = question.steps
  const wrongIndex = Number(tap.answer)
  const tapping = answering && answered === 0 && !solved
  const found = answered > 0 && !solved
  const tappedRight = picked[0] !== undefined && picked[0] !== tap.answer ? Number(picked[0]) : -1

  return (
    <div className={`reading-card wrong-letter-card${tapping ? ' is-tapping' : ''}${solved ? ' is-solved' : ''}`}>
      <span className="reading-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span
        className="reading-word wrong-letter-word"
        style={{ '--chars': Math.max(4, chars.length) }}
        role={tapping ? 'group' : undefined}
        aria-label={tapping ? t('play.promptWrongLetter.tap') : undefined}
      >
        {chars.map((char, index) => {
          const position = String(index)
          if (tapping) {
            const isRemoved = removed.includes(position)
            return (
              <button
                key={index}
                type="button"
                className={`wrong-letter-tap${isRemoved ? ' is-removed' : ''}`}
                disabled={isRemoved}
                onClick={() => onTap(position)}
              >
                {char}
              </button>
            )
          }
          if (index === wrongIndex && (found || solved)) {
            // Crossed out over a line while the right letter is picked; the solution puts it in.
            return (
              <span key={index} className={`letter-gap wrong-letter-slot${found ? ' is-asked' : ''}`}>
                <span className="wrong-letter-was" aria-hidden={solved}>
                  {char}
                </span>
                <span className="letter-gap-letter">{showWord(pick.answer, question.case)}</span>
              </span>
            )
          }
          return (
            <span key={index} className={`wrong-letter-char${solved && index === tappedRight ? ' is-tapped' : ''}`}>
              {char}
            </span>
          )
        })}
      </span>
    </div>
  )
}
