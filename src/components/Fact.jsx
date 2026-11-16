import { formatFact } from '../game/format.js'
import { isFigureKey, parseFigure } from '../game/shapes.js'
import { useI18n } from '../i18n/i18n.js'
import Figure from './Figure.jsx'
import './Fact.css'

/** A shape series drawn small, the answer in a dashed box where the gap was. */
function ShapeFact({ fact, text }) {
  return (
    <span className="fact-shapes" role="img" aria-label={text}>
      {fact.key.split(',').map((part, index) =>
        part === '?' ? (
          <span key={index} className="fact-shapes-answer">
            <Figure figure={fact.answer} />
          </span>
        ) : (
          <Figure key={index} figure={part} />
        ),
      )}
    </span>
  )
}

/** Whether a matrix's counts vary, so its figures are drawn with pips (see Figure). */
function matrixPips(keys) {
  const figures = keys.filter(isFigureKey)
  return new Set(figures.map((key) => parseFigure(key).count)).size > 1
}

/** A matrix drawn small, three by three in faint frames, the answer in a dashed one where the gap was. */
function MatrixFact({ fact, text }) {
  const parts = fact.key.split(',')
  const pips = matrixPips(parts.map((part) => (part === '?' ? fact.answer : part)))
  return (
    <span className="fact-matrix" role="img" aria-label={text}>
      {parts.map((part, index) => (
        <span key={index} className={`fact-matrix-tile${part === '?' ? ' is-answer' : ''}`}>
          <Figure figure={part === '?' ? fact.answer : part} pips={pips} />
        </span>
      ))}
    </span>
  )
}

/**
 * A solved fact as the stats and the round summary list it: as text
 * (see formatFact), or drawn for a shape series or a matrix.
 *
 * @param {{ fact: { key: string, op: string, answer: number|string } }} props
 */
export default function Fact({ fact }) {
  const { formatNumber } = useI18n()
  const text = formatFact(fact, formatNumber)
  if (fact.op === 'matrix') {
    return <MatrixFact fact={fact} text={text} />
  }
  return fact.op === 'shapes' ? <ShapeFact fact={fact} text={text} /> : text
}

/** "you said 7", with a figure drawn for a shape series or a matrix. */
export function GivenAnswer({ result }) {
  const { t, formatNumber } = useI18n()
  if (result.op !== 'shapes' && result.op !== 'matrix') {
    return t('summary.youSaid', { given: typeof result.given === 'string' ? result.given : formatNumber(result.given) })
  }
  const [before, after] = t('summary.youSaid', { given: '\u0000' }).split('\u0000')
  return (
    <>
      {before}
      {result.op === 'matrix' ? (
        <span className="fact-matrix-tile is-given">
          <Figure figure={result.given} pips={matrixPips([...result.key.split(','), result.answer])} />
        </span>
      ) : (
        <span className="fact-shapes">
          <Figure figure={result.given} />
        </span>
      )}
      {after}
    </>
  )
}
