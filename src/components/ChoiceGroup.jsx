import { useId } from 'react'
import './ChoiceGroup.css'

/**
 * A group of big, tappable radio options.
 *
 * @param {Object} props
 * @param {string} props.legend
 * @param {{ value: any, label: React.ReactNode, detail?: React.ReactNode, icon?: React.ReactNode, disabled?: boolean }[]} props.options
 * @param {any} props.value
 * @param {(value: any) => void} props.onChange
 * @param {'tiles'|'steps'|'pills'} [props.variant]
 */
export default function ChoiceGroup({ legend, options, value, onChange, variant = 'pills', hideLegend = false }) {
  const name = useId()

  return (
    <fieldset className={`choice-group is-${variant}`}>
      <legend className={hideLegend ? 'visually-hidden' : 'choice-legend'}>{legend}</legend>
      <div className="choice-options">
        {options.map((option) => {
          const id = `${name}-${option.value}`
          return (
            <div key={option.value} className="choice-option">
              <input
                id={id}
                type="radio"
                name={name}
                checked={option.value === value}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              <label htmlFor={id} style={option.color ? { '--choice-color': option.color } : undefined}>
                {option.icon && (
                  <span className="choice-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <span className="choice-label">{option.label}</span>
                {option.detail && <span className="choice-detail">{option.detail}</span>}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
