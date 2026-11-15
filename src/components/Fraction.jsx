import { fractionWords, parseChoice } from '../game/fractions.js'
import { useI18n } from '../i18n/i18n.js'
import './Fraction.css'

/**
 * A fraction as text: stacked with a fraction bar (the default), inline
 * ("3/4") or in words ("tre fjärdedelar"). One whole is "1", or words.
 *
 * @param {Object} props
 * @param {[number, number]} props.fraction
 * @param {'stacked'|'inline'|'words'} [props.form]
 */
export default function Fraction({ fraction, form = 'stacked', className = '' }) {
  const { lang } = useI18n()
  const [n, d] = fraction
  const classes = `fraction is-${form} ${className}`.trim()
  if (form === 'words') {
    return <span className={classes}>{fractionWords(fraction, lang)}</span>
  }
  if (n === d) {
    return <span className={classes}>1</span>
  }
  if (form === 'inline') {
    return <span className={classes}>{`${n}/${d}`}</span>
  }
  return (
    <span className={classes} role="img" aria-label={`${n}/${d}`}>
      <span className="fraction-top" aria-hidden="true">
        {n}
      </span>
      <span className="fraction-bottom" aria-hidden="true">
        {d}
      </span>
    </span>
  )
}

/** A fraction answer choice, e.g. "words:3/4". */
export function FractionChoice({ choice }) {
  const { form, fraction } = parseChoice(choice)
  return <Fraction fraction={fraction} form={form} />
}
