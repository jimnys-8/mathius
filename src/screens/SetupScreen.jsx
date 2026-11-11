import ChoiceGroup from '../components/ChoiceGroup.jsx'
import { CATEGORIES, LEVELS } from '../game/config.js'
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

/** Choose what to practice and how hard. */
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

      <div className="setup-start">
        <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
          Start ▶
        </button>
      </div>
    </main>
  )
}
