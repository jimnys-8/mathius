import { commonDenominator, parseChoice, pictureFractions } from '../game/fractions.js'
import { useI18n } from '../i18n/i18n.js'
import { HINT_FRAME } from '../viz/scenes.js'
import Fraction from './Fraction.jsx'
import Pie from './Pie.jsx'
import { useSolutionSettled } from './useSolutionSettled.js'
import './FractionCard.css'

/**
 * The picture for a fraction question: a circle to read, or two to add.
 * The hint draws help on the circles: for a sum of different slices,
 * both cut into slices of the same size; for a circle to simplify, thick
 * lines where the bigger slices go. The solution writes each circle's
 * fraction below it and, unless the question was to read one circle,
 * adds "=" and the answer's circle.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step
 * @param {(frame: number) => void} [props.onSettled]
 */
export default function FractionCard({ question, step, onSettled }) {
  const { t } = useI18n()
  const solved = useSolutionSettled(step, onSettled)
  const hinted = step >= HINT_FRAME
  const shown = pictureFractions(question.terms[0])
  const answer = parseChoice(question.terms[1]).fraction
  const { kind } = question

  let extra
  let bold
  if (hinted && kind === 'add' && shown[0][1] !== shown[1][1]) {
    extra = commonDenominator(shown[0][1], shown[1][1])
  }
  if (hinted && kind === 'simplify') {
    bold = answer[1]
  }

  const items = shown.map((fraction) => ({ fraction, extra, bold }))
  const withResult = kind !== 'read'
  if (withResult) {
    items.push({ fraction: answer, result: true })
  }
  const item = ({ fraction: [n, d], extra: lines, bold: thick, result }, index) => (
    <span key={`i${index}`} className="fraction-card-item">
      <Pie
        className="fraction-card-pie"
        colored={n}
        slices={d}
        extra={lines}
        bold={thick}
        label={result ? undefined : t('viz.pie', { colored: n, slices: d })}
      />
      <span className="fraction-card-label">
        <Fraction fraction={[n, d]} />
      </span>
    </span>
  )
  const sign = (text, index) => (
    <span key={`s${index}`} className="fraction-card-sign" aria-hidden="true">
      {text}
    </span>
  )

  const given = items.filter((entry) => !entry.result)
  const result = items.find((entry) => entry.result)

  // The answer's circle slides in with the solution, so the question's
  // circles stay centered until then. Each circle's fraction keeps its
  // space below it, so nothing moves up or down.
  return (
    <div className={`fraction-card has-${items.length}${solved ? ' is-solved' : ''}`}>
      {given.flatMap((entry, index) => (index > 0 ? [sign('+', index), item(entry, index)] : [item(entry, index)]))}
      {result && (
        <span className="fraction-card-result">
          {sign('=', 'result')}
          {item(result, 'result')}
        </span>
      )}
    </div>
  )
}
