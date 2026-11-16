import { SIDE } from '../game/matrix.js'
import { parseFigure } from '../game/shapes.js'
import { useI18n } from '../i18n/i18n.js'
import { HINT_FRAME } from '../viz/scenes.js'
import Figure from './Figure.jsx'
import TurnIcon from './TurnIcon.jsx'
import { useSolutionSettled } from './useSolutionSettled.js'
import './TileRow.css'
import './MatrixCard.css'

const MINUS = '−'

// Grid lines: tiles sit in the odd tracks (1, 3, 5), gutters in the even
// ones, and the labels in track 6, right of the rows and below the columns.
const tileTrack = (index) => 2 * index + 1
const LABEL_TRACK = 2 * SIDE

/** What a label shows of a figure: only the attributes a rule is about, as on the shape series brackets. */
function ValueLabel({ figure, attributes }) {
  if (attributes.includes('shape') && attributes.includes('color')) {
    return <Figure figure={{ shape: figure.shape, color: figure.color }} className="matrix-label-figure" />
  }
  if (attributes[0] === 'count') {
    return <span className="matrix-label-count">{figure.count}</span>
  }
  const shown = {
    shape: { figure: { shape: figure.shape }, plain: true },
    color: { figure: { shape: 'circle', color: figure.color } },
  }[attributes[0]]
  return <Figure figure={shown.figure} plain={shown.plain} className="matrix-label-figure" />
}

const GapLabel = () => <span className="matrix-label-gap">?</span>

/** What a value is, for telling labels apart: just the attributes a rule is about. */
const valueOf = (figure, attributes) => attributes.map((attribute) => figure[attribute]).join('.')

/**
 * The marks a hint draws, one set per rule (the second in green):
 *
 * - rows / cols: what each row has (right of it) or each column (below it)
 * - latin: right of each row, the three it has one of each of, in the
 *   same order on every row, with "?" where the gap's row misses one
 * - step: +1 or a turn between the tiles, waiting for the solution next to the gap
 * - sum / union: + and = between the tiles, along the rows and down the columns
 * - diagonal: a line through the diagonal, to the gap
 * - checker: (in the card) the tiles tinted in turn, all but the gap
 */
function hintMarks(question, figures, { hinted, solved }) {
  const { rules, unknown: gap } = question
  const open = (index) => solved || index !== gap
  const at = (row, col) => row * SIDE + col
  const marks = []
  rules.forEach((rule, ruleIndex) => {
    const className = ruleIndex === 1 ? 'is-second' : ''
    const add = (mark) => marks.push({ className, shown: hinted, ...mark, key: `${ruleIndex}-${marks.length}` })
    if (rule.type === 'rows' || rule.type === 'cols') {
      for (let line = 0; line < SIDE; line += 1) {
        const indexes = [0, 1, 2].map((other) => (rule.type === 'rows' ? at(line, other) : at(other, line)))
        const known = indexes.find((index) => index !== gap)
        add({
          row: rule.type === 'rows' ? tileTrack(line) : LABEL_TRACK,
          col: rule.type === 'rows' ? LABEL_TRACK : tileTrack(line),
          place: rule.type === 'rows' ? 'side' : 'below',
          content: <ValueLabel figure={figures[known]} attributes={rule.attributes} />,
        })
      }
    } else if (rule.type === 'latin') {
      // The order of a row without the gap, so every row lines up.
      const full = [0, 1, 2].find((row) => Math.floor(gap / SIDE) !== row || solved)
      const order = [0, 1, 2].map((col) => figures[at(full, col)])
      for (let row = 0; row < SIDE; row += 1) {
        const has = [0, 1, 2].filter((col) => open(at(row, col))).map((col) => valueOf(figures[at(row, col)], rule.attributes))
        add({
          row: tileTrack(row),
          col: LABEL_TRACK,
          place: 'side',
          content: order.map((figure, index) =>
            has.includes(valueOf(figure, rule.attributes)) ? (
              <ValueLabel key={index} figure={figure} attributes={rule.attributes} />
            ) : (
              <GapLabel key={index} />
            ),
          ),
        })
      }
    } else if (rule.type === 'step') {
      const label = (step) =>
        rule.attribute === 'turn' ? <TurnIcon step={step} /> : step > 0 ? `+${step}` : `${MINUS}${-step}`
      // Between tile `between` and the next, along row `line` (and down column `line`).
      for (let line = 0; line < SIDE; line += 1) {
        for (let between = 0; between < SIDE - 1; between += 1) {
          add({
            row: tileTrack(line),
            col: tileTrack(between) + 1,
            place: 'across',
            content: label(rule.across),
            shown: hinted && open(at(line, between)) && open(at(line, between + 1)),
          })
          if (rule.down !== 0) {
            add({
              row: tileTrack(between) + 1,
              col: tileTrack(line),
              place: 'down',
              content: label(rule.down),
              shown: hinted && open(at(between, line)) && open(at(between + 1, line)),
            })
          }
        }
      }
    } else if (rule.type === 'diagonal') {
      // Through the middle of the corner tiles, which the grid's own diagonal passes.
      add({
        row: '1 / 6',
        col: '1 / 6',
        place: 'over',
        content: (
          <svg className="matrix-diagonal" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1={15} y1={15} x2={85} y2={85} />
          </svg>
        ),
      })
    } else if (rule.type === 'sum' || rule.type === 'union') {
      // Tile 1 + tile 2 = tile 3, along every row and down every column.
      for (let line = 0; line < SIDE; line += 1) {
        ;['+', '='].forEach((sign, between) => {
          add({ row: tileTrack(line), col: tileTrack(between) + 1, place: 'across', content: sign, sign: true })
          add({ row: tileTrack(between) + 1, col: tileTrack(line), place: 'down', content: sign, sign: true })
        })
      }
    }
  })
  return marks
}

/**
 * A matrix: a 3×3 grid of tiles with one missing. 💡 draws the rules
 * (see hintMarks); the solution fills in the gap. Like Visualization,
 * calls `onSettled(step)` once the solution is shown.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  HINT_FRAME shows the rules, SOLUTION_FRAME the whole grid
 * @param {(frame: number) => void} [props.onSettled]
 * @param {'open'|'correct'|'wrong'} props.status
 */
export default function MatrixCard({ question, step, onSettled, status }) {
  const { t } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const hinted = step >= HINT_FRAME
  const { terms, unknown: gap, rules, pips } = question
  const figures = terms.map((key) => (key.startsWith('spots:') ? null : parseFigure(key)))
  const marks = hintMarks(question, figures, { hinted, solved })

  // Room for the labels, only where this question has them.
  const sideLines = Math.max(0, ...rules.map((rule) => (rule.type === 'latin' ? 3 : rule.type === 'rows' ? 1 : 0)))
  const side = rules.filter((rule) => rule.type === 'latin' || rule.type === 'rows').length
  const below = rules.some((rule) => rule.type === 'cols')
  // A checkerboard's hint tints the tiles in turn, all but the gap.
  const checker = hinted && rules.some((rule) => rule.type === 'checker')
  const tint = (index) => (checker && (index !== gap || solved) ? ` is-tint-${index % 2}` : '')

  // Read out row by row, a letter for each different tile: "A, B, C; B, C, A; C, A, ?".
  const letters = [...new Set(terms)]
  const letter = (index) => (index === gap && !solved ? '?' : String.fromCharCode(65 + letters.indexOf(terms[index])))
  const spoken = [0, 1, 2].map((row) => [0, 1, 2].map((col) => letter(row * SIDE + col)).join(', ')).join('; ')

  // Labels that share a spot (two rules right of a row) stack.
  const spots = new Map()
  for (const mark of marks) {
    const spot = `${mark.row}-${mark.col}`
    spots.set(spot, [...(spots.get(spot) ?? []), mark])
  }

  return (
    <div className="matrix-card">
      <div
        className={`matrix-grid${below ? ' has-below' : ''}`}
        role="img"
        aria-label={`${t('category.matrix')} ${spoken}`}
        style={{ '--side-items': sideLines, '--side-lines': side }}
      >
        {terms.map((key, index) => (
          <span
            key={index}
            className={`tile matrix-tile${index === gap ? ` is-gap is-${status}` : ''}${tint(index)}`}
            style={{ gridRow: tileTrack(Math.floor(index / SIDE)), gridColumn: tileTrack(index % SIDE) }}
          >
            {index === gap && !solved ? <span className="matrix-gap">?</span> : <Figure figure={key} pips={pips} className="matrix-figure" />}
          </span>
        ))}
        {[...spots.values()].map((group) => (
          <span
            key={group[0].key}
            className={`matrix-marks is-${group[0].place}`}
            style={{ gridRow: group[0].row, gridColumn: group[0].col }}
            aria-hidden="true"
          >
            {group.map((mark) => (
              <span key={mark.key} className={`tile-mark matrix-mark${mark.sign ? ' is-sign' : ''}${mark.shown ? ' is-shown' : ''} ${mark.className}`.trim()}>
                {mark.content}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
