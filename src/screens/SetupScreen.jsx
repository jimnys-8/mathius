import ChoiceGroup from '../components/ChoiceGroup.jsx'
import { CATEGORIES, LEVELS, ROUND_LENGTH, TIMER_OPTIONS } from '../game/config.js'
import { useI18n } from '../i18n/i18n.js'
import './SetupScreen.css'

const CATEGORY_COLORS = {
  add: 'var(--color-a)',
  sub: 'var(--color-b)',
  mul: 'var(--color-c)',
  div: '#2f80ed',
  mix: '#e0457b',
}

/** Choose what to practice, how hard, and whether to race the clock. */
export default function SetupScreen({ settings, onChange, onStart, header }) {
  const { t, formatTimer } = useI18n()
  const update = (patch) => onChange({ ...settings, ...patch })

  const categoryOptions = CATEGORIES.map((category) => ({
    value: category.id,
    label: t(`category.${category.id}`),
    icon: category.id === 'mix' ? '+−×÷' : category.symbol,
    color: CATEGORY_COLORS[category.id],
  }))

  const levelOptions = LEVELS.map((level) => ({
    value: level.id,
    label: t(`level.${level.id}.name`),
    detail: t(`level.${level.id}.desc`),
    icon: '★'.repeat(level.id),
    color: '#e59a00',
  }))

  const timerOptions = TIMER_OPTIONS.map((seconds) => ({
    value: seconds,
    label: seconds === 0 ? formatTimer(0) : `⏱ ${formatTimer(seconds)}`,
  }))

  return (
    <main className="page setup">
      {header}

      <section className="card setup-section">
        <ChoiceGroup
          legend={t('setup.category')}
          variant="tiles"
          options={categoryOptions}
          value={settings.category}
          onChange={(category) => update({ category })}
        />
      </section>

      <section className="card setup-section">
        <ChoiceGroup
          legend={t('setup.level')}
          variant="steps"
          options={levelOptions}
          value={settings.level}
          onChange={(level) => update({ level })}
        />
      </section>

      <section className="card setup-section">
        <ChoiceGroup
          legend={t('setup.timer')}
          options={timerOptions}
          value={settings.timer}
          onChange={(timer) => update({ timer })}
        />
        <p className="setup-hint">
          {settings.timer > 0
            ? t('setup.timerHint', { time: formatTimer(settings.timer) })
            : t('setup.roundHint', { count: ROUND_LENGTH })}
        </p>
      </section>

      <div className="setup-start">
        <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
          {t('setup.start')} ▶
        </button>
      </div>
    </main>
  )
}
