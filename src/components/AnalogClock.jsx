import './AnalogClock.css'

const FACE = 46
const NUMBER_RADIUS = 35
const HINT_RADIUS = 54

// Points on the face, clockwise from 12.
function point(angle, radius) {
  const radians = (angle * Math.PI) / 180
  return [Math.sin(radians) * radius, -Math.cos(radians) * radius]
}

/**
 * An analog clock face. The hour hand sits between the hours as the
 * minutes pass (at 8:30, halfway from 8 to 9), like on a real clock. The
 * hour hand has the hour's color and the minute hand the minutes', as in
 * DigitalTime.
 *
 * @param {Object} props
 * @param {number} props.hour
 * @param {number} props.minute
 * @param {boolean} [props.numbers]  1–12 around the face
 * @param {'minutes'|'halves'|null} [props.hint]  'minutes' writes the
 *   minutes (5, 10, …) outside the face; 'halves' also shades the right
 *   half (past the hour) and the left half (to the next hour)
 * @param {string} [props.label]  what the clock says, for screen readers
 */
export default function AnalogClock({ hour, minute, numbers = true, hint = null, label, className = '' }) {
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const minuteAngle = minute * 6
  // With numbers, the minute hand stops short of them so it never covers
  // one; without, it reaches the minute ticks.
  const minuteLength = numbers ? 29 : 40
  const hourLength = numbers ? 19 : 24

  return (
    <svg
      className={`analog-clock ${className}`.trim()}
      viewBox="-60 -60 120 120"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {hint === 'halves' && (
        <>
          <path className="analog-clock-half is-past" d={`M0 ${-FACE}A${FACE} ${FACE} 0 0 1 0 ${FACE}Z`} />
          <path className="analog-clock-half is-to" d={`M0 ${FACE}A${FACE} ${FACE} 0 0 1 0 ${-FACE}Z`} />
        </>
      )}
      <circle className={`analog-clock-face${hint === 'halves' ? ' is-see-through' : ''}`} r={FACE} />
      {Array.from({ length: 60 }, (_, index) => {
        const major = index % 5 === 0
        const [x1, y1] = point(index * 6, major ? FACE - 6 : FACE - 3)
        const [x2, y2] = point(index * 6, FACE - 1)
        return <line key={index} className={major ? 'analog-clock-tick is-major' : 'analog-clock-tick'} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
      {numbers &&
        Array.from({ length: 12 }, (_, index) => {
          const [x, y] = point((index + 1) * 30, NUMBER_RADIUS)
          return (
            // dy centers the digits without dominant-baseline, which Safari
            // on iOS gets wrong.
            <text key={index} className="analog-clock-number" x={x} y={y} dy="0.35em">
              {index + 1}
            </text>
          )
        })}
      {hint &&
        Array.from({ length: 12 }, (_, index) => {
          const [x, y] = point(index * 30, HINT_RADIUS)
          return (
            <text key={index} className="analog-clock-minutes" x={x} y={y} dy="0.35em">
              {index * 5}
            </text>
          )
        })}
      <line
        className="analog-clock-hand is-hour"
        x1="0"
        y1="4"
        x2="0"
        y2={-hourLength}
        style={{ transform: `rotate(${hourAngle}deg)` }}
      />
      <line
        className="analog-clock-hand is-minute"
        x1="0"
        y1="5"
        x2="0"
        y2={-minuteLength}
        style={{ transform: `rotate(${minuteAngle}deg)` }}
      />
      <circle className="analog-clock-pin" r="3.2" />
    </svg>
  )
}
