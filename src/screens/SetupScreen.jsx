import ChoiceGroup from '../components/ChoiceGroup.jsx'
import { CATEGORIES, ROUND_LENGTH, TIMER_OPTIONS, getCategory, switchCategory, switchLevel } from '../game/config.js'
import { levelText, useI18n } from '../i18n/i18n.js'
import './SetupScreen.css'

const CATEGORY_COLORS = {
  count: '#3fa34d',
  add: 'var(--color-a)',
  sub: 'var(--color-b)',
  mul: 'var(--color-c)',
  div: '#2f80ed',
  mix: '#e0457b',
  sqrt: '#0e8fa8',
  eq: '#a14fc4',
  word: '#c26a1b',
  picture: '#5b6bd6',
}

const CATEGORY_ICONS = {
  mix: '+−×÷',
  // An italic x, so it isn't mistaken for a times sign.
  eq: (
    <>
      <i>x</i>=?
    </>
  ),
}

/** Choose what to practice, how hard, and whether to race the clock. */
export default function SetupScreen({ settings, onChange, onStart, header }) {
  const { t, formatTimer } = useI18n()
  const update = (patch) => onChange({ ...settings, ...patch })

  const categoryOptions = CATEGORIES.map((category) => ({
    value: category.id,
    label: t(`category.${category.id}`),
    icon: CATEGORY_ICONS[category.id] ?? category.symbol,
    color: CATEGORY_COLORS[category.id],
  }))

  const levelOptions = getCategory(settings.category).levels.map((level) => {
    const { name, desc } = levelText(t, settings.category, level.id)
    return { value: level.id, label: name, detail: desc, icon: level.id === 0 ? '☆' : '★'.repeat(level.id), color: '#e59a00' }
  })

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
          onChange={(category) => onChange(switchCategory(settings, category))}
        />
      </section>

      <section className="card setup-section">
        <ChoiceGroup
          legend={t('setup.level')}
          variant="steps"
          options={levelOptions}
          value={settings.level}
          onChange={(level) => onChange(switchLevel(settings, level))}
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
