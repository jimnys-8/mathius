import AnalogClock from '../components/AnalogClock.jsx'
import ChoiceGroup from '../components/ChoiceGroup.jsx'
import Icon from '../components/Icon.jsx'
import {
  AREAS,
  ROUND_LENGTH,
  TIMER_OPTIONS,
  areaOf,
  getCategory,
  switchArea,
  switchCategory,
  switchLevel,
} from '../game/config.js'
import { PASS } from '../game/progress.js'
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
  letter: '#2a9d8f',
  clockDigital: '#d1495b',
  clockWords: '#d1495b',
  digitalWords: '#d1495b',
  digitalClock: '#d1495b',
}

const CLOCK_ICON = <AnalogClock className="setup-clock-icon" hour={8} minute={0} numbers={false} />

/**
 * A clock game's icon: what is shown, an arrow, and what to pick, so the
 * four games look different even to a child who can't read the labels.
 */
const TIME_FACES = {
  clock: CLOCK_ICON,
  digital: <span className="setup-pair-digital">8:00</span>,
  words: <span className="setup-pair-words">Abc</span>,
}
const timePair = (from, to) => (
  <span className="setup-pair">
    {TIME_FACES[from]}
    <Icon name="arrowRight" className="setup-pair-arrow" />
    {TIME_FACES[to]}
  </span>
)

const CATEGORY_ICONS = {
  mix: '+−×÷',
  // An italic x, so it isn't mistaken for a times sign.
  eq: (
    <>
      <i>x</i>=?
    </>
  ),
  clockDigital: timePair('clock', 'digital'),
  clockWords: timePair('clock', 'words'),
  digitalWords: timePair('digital', 'words'),
  digitalClock: timePair('digital', 'clock'),
}

const AREAS_LOOK = {
  math: { icon: '123', color: 'var(--color-a)' },
  reading: { icon: 'ABC', color: '#c26a1b' },
  time: { icon: CLOCK_ICON, color: '#d1495b' },
}

const levelStars = (id) => (id === 0 ? '☆' : '★'.repeat(id))

/** Choose what to practice, how hard, and whether to race the clock. */
export default function SetupScreen({ settings, unlocked, onChange, onStart, header }) {
  const { t, formatTimer } = useI18n()
  const update = (patch) => onChange({ ...settings, ...patch })

  const area = areaOf(settings.category)
  const areaOptions = AREAS.map(({ id }) => ({
    value: id,
    label: t(`area.${id}`),
    ...AREAS_LOOK[id],
  }))

  const categoryOptions = area.categories.map(getCategory).map((category) => ({
    value: category.id,
    label: t(`category.${category.id}`),
    icon: CATEGORY_ICONS[category.id] ?? category.symbol,
    color: CATEGORY_COLORS[category.id],
  }))

  const levelOptions = getCategory(settings.category).levels.map((level) => {
    const { name, desc } = levelText(t, settings.category, level.id)
    const locked = !unlocked.has(level.id)
    return {
      value: level.id,
      label: locked ? (
        <>
          <Icon name="lock" className="setup-level-lock" /> {name}
        </>
      ) : (
        name
      ),
      detail: desc,
      icon: levelStars(level.id),
      color: '#e59a00',
      disabled: locked,
    }
  })
  const anyLocked = levelOptions.some((option) => option.disabled)

  const timerOptions = TIMER_OPTIONS.map((seconds) => ({
    value: seconds,
    label: seconds === 0 ? formatTimer(0) : `⏱ ${formatTimer(seconds)}`,
  }))

  return (
    <main className="page setup">
      {header}

      <section className="card setup-section">
        <ChoiceGroup
          legend={t('setup.area')}
          variant="tabs"
          options={areaOptions}
          value={area.id}
          onChange={(id) => onChange(switchArea(settings, id))}
        />
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
        {anyLocked && <p className="setup-hint">{t('setup.unlockHint', { correct: PASS.correct, total: ROUND_LENGTH })}</p>}
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

      {/* Always in view: what will be played, and the button to play it. */}
      <footer className="setup-footer">
        <p className="setup-summary">
          <strong>{t(`category.${settings.category}`)}</strong>
          <span>
            <span className="setup-summary-stars" aria-hidden="true">
              {levelStars(settings.level)}
            </span>{' '}
            {levelText(t, settings.category, settings.level).name}
          </span>
          <span>{settings.timer > 0 ? `⏱ ${formatTimer(settings.timer)}` : t('setup.questions', { count: ROUND_LENGTH })}</span>
        </p>
        <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
          {t('setup.start')} ▶
        </button>
      </footer>
    </main>
  )
}
