import ChoiceGroup from '../components/ChoiceGroup.jsx'
import { CATEGORIES, LEVELS, TIMER_OPTIONS } from '../game/config.js'
import './SetupScreen.css'

const CATEGORY_COLORS = {
  add: 'var(--color-a)',
  sub: 'var(--color-b)',
  mul: 'var(--color-c)',
  div: '#2f80ed',
  mix: '#e0457b',
}

const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({
  value: category.id,
  label: category.label,
  icon: category.id === 'mix' ? '+−×÷' : category.symbol,
  color: CATEGORY_COLORS[category.id],
}))

const LEVEL_OPTIONS = LEVELS.map((level) => ({
  value: level.id,
  label: level.name,
  detail: level.description,
  icon: '★'.repeat(level.id),
  color: '#e59a00',
}))

const TIMER_CHOICES = TIMER_OPTIONS.map((option) => ({
  value: option.seconds,
  label: option.seconds === 0 ? 'Off' : `⏱ ${option.label}`,
}))

/** Choose what to practice, how hard, and whether to race the clock. */
export default function SetupScreen({ settings, onChange, onStart, header }) {
  const update = (patch) => onChange({ ...settings, ...patch })

  return (
    <main className="page setup">
      {header}

      <section className="card setup-section">
        <ChoiceGroup
          legend="What do you want to practice?"
          variant="tiles"
          options={CATEGORY_OPTIONS}
          value={settings.category}
          onChange={(category) => update({ category })}
        />
      </section>

      <section className="card setup-section">
        <ChoiceGroup
          legend="How hard?"
          variant="steps"
          options={LEVEL_OPTIONS}
          value={settings.level}
          onChange={(level) => update({ level })}
        />
      </section>

      <section className="card setup-section">
        <ChoiceGroup
          legend="Timer"
          options={TIMER_CHOICES}
          value={settings.timer}
          onChange={(timer) => update({ timer })}
        />
        <p className="setup-hint">
          {settings.timer > 0
            ? `How many can you get right in ${TIMER_OPTIONS.find((option) => option.seconds === settings.timer)?.label}?`
            : 'Take your time with a round of 10 questions.'}
        </p>
      </section>

      <div className="setup-start">
        <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
          Start ▶
        </button>
      </div>
    </main>
  )
}
