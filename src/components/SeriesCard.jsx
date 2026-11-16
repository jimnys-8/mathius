import { SERIES_DOT_GRID } from '../game/series.js'
import { useI18n } from '../i18n/i18n.js'
import { HINT_FRAME } from '../viz/scenes.js'
import TileRow from './TileRow.jsx'
import { useSolutionSettled } from './useSolutionSettled.js'
import './SeriesCard.css'

const [DOTS_PER_ROW, DOT_ROWS] = SERIES_DOT_GRID

/** Dots in a 3×3 grid, filled from the bottom up, like on the answer buttons. */
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

/**
 * "+1" on the dots level reads as "+●", for children who can't read
 * numerals, and "+0" as "=".
 */
function ArcLabel({ label, dots }) {
  if (!dots) {
    return label
  }
  if (label === '+0') {
    return '='
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
  const turn = (index) => (alternate && hinted ? `is-turn-${index % 2}` : '')
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
  const tiles = terms.map((value, index) =>
    index === gap ? (
      <>
        {gapContent()}
        {solved && status === 'wrong' && input !== '' && (
          <span className="series-wrong" aria-hidden="true">
            {formatNumber(Number(input))}
          </span>
        )}
      </>
    ) : (
      <Value value={value} dots={dots} />
    ),
  )
  const marks = [
    arcs?.map((label, index) => ({
      kind: 'arc',
      from: index,
      label: <ArcLabel label={label} dots={dots} />,
      shown: shown(index) && shown(index + 1),
      className: turn(index),
    })) ??
      notes.map((note, index) => ({ kind: 'note', from: index, label: note, shown: shown(index) })),
  ]

  return (
    <div className={`series-card${long ? ' is-long' : ''}`}>
      <TileRow tiles={tiles} gap={gap} status={status} label={spoken} tileClass={turn} marks={marks} />
    </div>
  )
}
