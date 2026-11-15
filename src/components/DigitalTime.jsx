import './DigitalTime.css'

/**
 * A digital time, "8:20", with the hours in the hour hand's color and the
 * minutes in the minute hand's, as on AnalogClock.
 */
export default function DigitalTime({ text, className = '' }) {
  const [hours, minutes] = text.split(':')
  return (
    <span className={`digital-time ${className}`.trim()}>
      <span className="digital-time-hours">{hours}</span>
      <span className="digital-time-colon">:</span>
      <span className="digital-time-minutes">{minutes}</span>
    </span>
  )
}
