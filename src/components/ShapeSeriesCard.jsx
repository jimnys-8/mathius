import { parseFigure } from '../game/shapes.js'
import { useI18n } from '../i18n/i18n.js'
import { HINT_FRAME } from '../viz/scenes.js'
import Figure from './Figure.jsx'
import TileRow from './TileRow.jsx'
import { useSolutionSettled } from './useSolutionSettled.js'
import './ShapeSeriesCard.css'

const MINUS = '−'

/**
 * How far a turn rule turns: a faint dial with a thick arc over a
 * quarter or an eighth of it, ending in an arrowhead, clockwise or not,
 * for the arcs between turning arrows.
 */
function TurnIcon({ step }) {
  const radius = 8
  const way = step > 0 ? 1 : -1
  // From the top, round by the step.
  const end = ((-90 + step) * Math.PI) / 180
  const [x, y] = [radius * Math.cos(end), radius * Math.sin(end)]
  // The arrowhead points along the circle at the end.
  const along = [-Math.sin(end) * way, Math.cos(end) * way]
  const across = [-along[1], along[0]]
  const point = (forward, side) =>
    `${x + along[0] * forward + across[0] * side},${y + along[1] * forward + across[1] * side}`
  return (
    <svg className="shapes-turn-icon" viewBox="-12 -12 24 24" aria-hidden="true">
      <circle className="shapes-turn-dial" r={radius} />
      <path d={`M0,${-radius} A${radius},${radius} 0 0 ${step > 0 ? 1 : 0} ${x},${y}`} />
      <polygon points={`${point(4, 0)} ${point(-1, 3.6)} ${point(-1, -3.6)}`} />
    </svg>
  )
}

/**
 * What a bracket under a repeat shows when only some attributes repeat:
 * each figure with only those attributes (colors as dots, shapes in
 * gray), and a "?" for the gap, so it doesn't give the answer away.
 */
function UnitLabel({ figures, attribute, from, gap }) {
  return figures.map((figure, offset) => {
    const index = from + offset
    if (index === gap) {
      return (
        <span key={index} className="shapes-unit-gap">
          ?
        </span>
      )
    }
    const shown = {
      shape: { shape: figure.shape, plain: true },
      color: { shape: 'circle', color: figure.color },
      size: { shape: 'circle', size: figure.size, plain: true },
      fill: { shape: 'circle', fill: figure.fill, plain: true },
    }[attribute]
    return <Figure key={index} figure={shown} plain={shown.plain} className="shapes-unit-figure" />
  })
}

/**
 * The marks a hint draws for each rule, one row per rule: brackets under
 * each round of a repeat, and arcs between tiles for a turn (a curved
 * arrow) or a count (+1). Arcs next to the gap wait for the solution,
 * as in the number series.
 */
function hintMarks(question, figures, { hinted, solved }) {
  const { rules, unknown: gap } = question
  const shown = (index) => solved || (hinted && index !== gap)
  return rules.map((rule, row) => {
    const className = row === 1 ? 'is-second' : ''
    if (rule.type === 'repeat') {
      const marks = []
      // The whole figure repeating needs no label: the tiles are the unit.
      const labeled = !(rule.attributes.includes('shape') && rule.attributes.includes('color'))
      for (let from = 0; from < figures.length; from += rule.period) {
        const span = Math.min(rule.period, figures.length - from)
        marks.push({
          kind: 'bracket',
          from,
          span,
          shown: hinted,
          className,
          label: labeled ? (
            <UnitLabel figures={figures.slice(from, from + span)} attribute={rule.attributes[0]} from={from} gap={solved ? -1 : gap} />
          ) : undefined,
        })
      }
      return marks
    }
    return figures.slice(1).map((_, index) => ({
      kind: 'arc',
      from: index,
      shown: shown(index) && shown(index + 1),
      className,
      label: rule.type === 'turn' ? <TurnIcon step={rule.step} /> : rule.step > 0 ? `+${rule.step}` : `${MINUS}${-rule.step}`,
    }))
  })
}

/**
 * A shape series with one tile missing. 💡 draws the rules: a bracket
 * under each round of what repeats (with only the repeating attribute
 * drawn, when the rest stays the same), and arcs between arrows that
 * turn or tiles that count up. Two rules get a row each. The solution
 * fills in the gap. Like Visualization, calls `onSettled(step)` once the
 * solution is shown.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  HINT_FRAME shows the rules, SOLUTION_FRAME the whole series
 * @param {(frame: number) => void} [props.onSettled]
 * @param {'open'|'correct'|'wrong'} props.status
 */
export default function ShapeSeriesCard({ question, step, onSettled, status }) {
  const { t } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const hinted = step >= HINT_FRAME
  const { terms, unknown: gap } = question
  const figures = terms.map(parseFigure)

  const tiles = terms.map((key, index) =>
    index === gap && !solved ? (
      <span className="shapes-gap">?</span>
    ) : (
      <Figure figure={key} className="shapes-figure" />
    ),
  )
  // Read out as letters, one for each different figure: "A, B, A, B, ?".
  const letters = [...new Set(terms)]
  const spoken = terms
    .map((key, index) => (index === gap && !solved ? '?' : String.fromCharCode(65 + letters.indexOf(key))))
    .join(', ')

  return (
    <div className="shapes-card">
      <TileRow
        tiles={tiles}
        gap={gap}
        status={status}
        label={`${t('category.shapes')} ${spoken}`}
        marks={hintMarks(question, figures, { hinted, solved })}
      />
    </div>
  )
}
