import { useI18n } from '../i18n/i18n.js'
import { HINT_FRAME } from '../viz/scenes.js'
import { useSolutionSettled } from './useSolutionSettled.js'
import './SeriesCard.css'

const DOTS_PER_ROW = 2
const DOT_ROWS = 5

/**
 * Up to ten dots in rows of two, filled from the bottom up, so a row of
 * tiles that grows by one dot grows like a staircase.
 */
function Dots({ count }) {
  return (
    <svg className="series-dots" viewBox={`0 0 ${DOTS_PER_ROW} ${DOT_ROWS}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <circle
          key={index}
          cx={(index % DOTS_PER_ROW) + 0.5}
          cy={DOT_ROWS - Math.floor(index / DOTS_PER_ROW) - 0.5}
          r={0.38}
        />
      ))}
    </svg>
  )
}

/** A number in a tile, or its dots on the dots level. */
function Value({ value, dots }) {
  const { formatNumber } = useI18n()
  return dots ? <Dots count={value} /> : <span className="series-number">{formatNumber(value)}</span>
}

/** "+1" on the dots level reads as "+●", for children who can't read numerals. */
function ArcLabel({ label, dots }) {
  if (!dots) {
    return label
  }
  return (
    <>
      {label[0]}
      <svg className="series-arc-dot" viewBox="0 0 2 2" aria-hidden="true">
        <circle cx={1} cy={1} r={0.8} />
      </svg>
    </>
  )
}

/**
 * A number series with one tile missing. 💡 draws the steps between the
 * numbers it shows (+2, ×2), or writes 3×3 under square numbers, and
 * colors two steps that take turns in two colors. The solution fills in
 * the gap and the steps to it. Like Visualization, calls `onSettled(step)`
 * once the solution is shown.
 *
 * Questions without choices are answered in the gap tile, which then
 * holds the answer box.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  HINT_FRAME shows the steps, SOLUTION_FRAME the whole series
 * @param {(frame: number) => void} [props.onSettled]
 * @param {string} props.input  the answer typed or picked
 * @param {'open'|'correct'|'wrong'} props.status
 */
export default function SeriesCard({ question, step, onSettled, input, status, onInput, onEnter, inputRef, readOnly, keyboard }) {
  const { t, formatNumber } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const hinted = step >= HINT_FRAME
  const { terms, unknown: gap, arcs, notes, alternate } = question
  const dots = question.show === 'dots'
  const long = !dots && Math.max(...terms) >= 100
  // Colors for two steps taking turns: each number and the step after it.
  const turn = (index) => (alternate && hinted ? ` is-turn-${index % 2}` : '')
  const shown = (index) => solved || (hinted && index !== gap)

  const gapContent = () => {
    if (solved) {
      return <Value value={question.answer} dots={dots} />
    }
    if (question.choices) {
      return <span className="series-number">?</span>
    }
    return (
      <input
        ref={inputRef}
        className="series-input"
        type="text"
        inputMode={keyboard ? 'numeric' : 'none'}
        pattern="[0-9]*"
        autoComplete="off"
        enterKeyHint="done"
        aria-label={t('play.yourAnswer')}
        placeholder="?"
        value={input}
        readOnly={readOnly}
        autoFocus
        onChange={(event) => onInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onEnter()
          }
        }}
      />
    )
  }

  const spoken = terms.map((value, index) => (index === gap && !solved ? '?' : formatNumber(value))).join(', ')

  return (
    <div className={`series-card${dots ? ' is-dots' : ''}${long ? ' is-long' : ''}`} style={{ '--count': terms.length }}>
      <div className="series-row" role="img" aria-label={spoken}>
        {terms.map((value, index) =>
          index === gap ? (
            <span key={index} className={`series-tile is-gap is-${status}${turn(index)}`} style={{ gridColumn: index + 1 }}>
              {gapContent()}
              {solved && status === 'wrong' && input !== '' && (
                <span className="series-wrong" aria-hidden="true">
                  {formatNumber(Number(input))}
                </span>
              )}
            </span>
          ) : (
            <span key={index} className={`series-tile${turn(index)}`} style={{ gridColumn: index + 1 }}>
              <Value value={value} dots={dots} />
            </span>
          ),
        )}
        {arcs?.map((label, index) => (
          <span
            key={`arc-${index}`}
            className={`series-arc${shown(index) && shown(index + 1) ? ' is-shown' : ''}${turn(index)}`}
            style={{ gridColumn: `${index + 1} / span 2` }}
            aria-hidden="true"
          >
            <span className="series-arc-line" />
            <span className="series-arc-label">
              <ArcLabel label={label} dots={dots} />
            </span>
          </span>
        ))}
        {notes?.map((note, index) => (
          <span
            key={`note-${index}`}
            className={`series-note${shown(index) ? ' is-shown' : ''}`}
            style={{ gridColumn: index + 1 }}
            aria-hidden="true"
          >
            {note}
          </span>
        ))}
      </div>
    </div>
  )
}
