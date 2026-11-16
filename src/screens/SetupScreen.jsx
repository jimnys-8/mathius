import AnalogClock from '../components/AnalogClock.jsx'
import ChoiceGroup from '../components/ChoiceGroup.jsx'
import Figure from '../components/Figure.jsx'
import Fraction from '../components/Fraction.jsx'
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
  fraction: '#c8553d',
  word: '#c26a1b',
  picture: '#5b6bd6',
  letter: '#2a9d8f',
  clockDigital: '#d1495b',
  clockWords: '#d1495b',
  digitalWords: '#d1495b',
  digitalClock: '#d1495b',
  odd: '#0f7c8c',
  series: '#6b5bd6',
  shapes: '#c2477a',
}

const CLOCK_ICON = <AnalogClock className="setup-clock-icon" hour={8} minute={0} numbers={false} />

/**
 * A clock game's icon: what is shown, an arrow, and what to pick, so the
 * four games look different even to a child who can't read the labels.
 * All show two o'clock, whose name is short in both languages; the word
 * is in the hour hand's color, apart from the digital time.
 */
const TIME_PAIRS = {
  clockDigital: ['clock', 'digital'],
  clockWords: ['clock', 'words'],
  digitalWords: ['digital', 'words'],
  digitalClock: ['digital', 'clock'],
}

function TimePair({ from, to }) {
  const { t } = useI18n()
  const faces = {
    clock: <AnalogClock className="setup-clock-icon" hour={2} minute={0} numbers={false} />,
    digital: <span className="setup-pair-digital">2:00</span>,
    words: <span className="setup-pair-words">{t('setup.twoOClock')}</span>,
  }
  return (
    <span className="setup-pair">
      {faces[from]}
      <Icon name="arrowRight" className="setup-pair-arrow" />
      {faces[to]}
    </span>
  )
}

/** Three circles and a square: the patterns area, three alike and one odd. */
const PATTERNS_ICON = (
  <svg className="setup-patterns-icon" viewBox="0 0 40 10" aria-hidden="true">
    {[5, 15, 25].map((cx) => (
      <circle key={cx} cx={cx} cy={5} r={3.6} />
    ))}
    <rect x={31.6} y={1.6} width={6.8} height={6.8} rx={1} className="setup-patterns-odd" />
  </svg>
)

/** Odd one out: three fruits and a car, ringed. */
const ODD_ICON = (
  <span className="setup-odd-icon">
    🍎🍐🍌<span className="setup-odd-one">🚗</span>
  </span>
)

/** Number series: three numbers and the missing one. */
const SERIES_ICON = (
  <span className="setup-series-icon">
    2 4 6 <span className="setup-series-gap">?</span>
  </span>
)

/** Shape series: a circle and a square taking turns, and the gap. */
const SHAPES_ICON = (
  <span className="setup-shapes-icon">
    <Figure figure={{ shape: 'circle', color: 'red' }} />
    <Figure figure={{ shape: 'square', color: 'blue' }} />
    <Figure figure={{ shape: 'circle', color: 'red' }} />
    <span className="setup-series-gap">?</span>
  </span>
)

const CATEGORY_ICONS = {
  odd: ODD_ICON,
  series: SERIES_ICON,
  shapes: SHAPES_ICON,
  mix: '+−×÷',
  // An italic x, so it isn't mistaken for a times sign.
  eq: (
    <>
      <i>x</i>=?
    </>
  ),
  // Drawn stacked: the ½ character is too small, and differs per font.
  fraction: <Fraction fraction={[1, 2]} className="setup-fraction-icon" />,
  ...Object.fromEntries(Object.entries(TIME_PAIRS).map(([id, [from, to]]) => [id, <TimePair key={id} from={from} to={to} />])),
}

const AREAS_LOOK = {
  math: { icon: '123', color: 'var(--color-a)' },
  reading: { icon: 'ABC', color: '#c26a1b' },
  time: { icon: CLOCK_ICON, color: '#d1495b' },
  patterns: { icon: PATTERNS_ICON, color: '#0f7c8c' },
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
