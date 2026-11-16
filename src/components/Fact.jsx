import { formatFact } from '../game/format.js'
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

/**
 * A solved fact as the stats and the round summary list it: as text
 * (see formatFact), or drawn for a shape series.
 *
 * @param {{ fact: { key: string, op: string, answer: number|string } }} props
 */
export default function Fact({ fact }) {
  const { formatNumber } = useI18n()
  const text = formatFact(fact, formatNumber)
  return fact.op === 'shapes' ? <ShapeFact fact={fact} text={text} /> : text
}

/** "you said 7", with a figure drawn for a shape series. */
export function GivenAnswer({ result }) {
  const { t, formatNumber } = useI18n()
  if (result.op !== 'shapes') {
    return t('summary.youSaid', { given: typeof result.given === 'string' ? result.given : formatNumber(result.given) })
  }
  const [before, after] = t('summary.youSaid', { given: '\u0000' }).split('\u0000')
  return (
    <>
      {before}
      <span className="fact-shapes">
        <Figure figure={result.given} />
      </span>
      {after}
    </>
  )
}
