import { useEffect } from 'react'
import { useI18n } from '../i18n/i18n.js'
import './ChoiceAnswers.css'

/**
 * Big buttons for multiple-choice answers. Keys 1–4 pick a choice too.
 * Once answered, the right choice turns green and a wrong pick red.
 */
export default function ChoiceAnswers({ choices, answer, chosen, revealed, onChoose }) {
  const { t, formatNumber } = useI18n()

  useEffect(() => {
    if (revealed) {
      return undefined
    }
    const handleKey = (event) => {
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < choices.length && !event.repeat) {
        onChoose(choices[index])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [choices, revealed, onChoose])

  return (
    <div className="choice-answers" role="group" aria-label={t('play.chooseAnswer')}>
      {choices.map((choice, index) => {
        let state = ''
        if (revealed) {
          state = choice === answer ? ' is-correct' : choice === chosen ? ' is-wrong' : ' is-dim'
        }
        return (
          <button
            key={choice}
            type="button"
            className={`choice-answer${state}`}
            disabled={revealed}
            onClick={() => onChoose(choice)}
          >
            <span className="choice-answer-key" aria-hidden="true">
              {index + 1}
            </span>
            {formatNumber(choice)}
          </button>
        )
      })}
    </div>
  )
}
