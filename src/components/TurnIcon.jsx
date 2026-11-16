import './TurnIcon.css'

/**
 * How far a turn rule turns: a faint dial with a thick arc over a
 * quarter or an eighth of it, ending in an arrowhead, clockwise or not,
 * for the hints on turning shapes.
 */
export default function TurnIcon({ step }) {
  const radius = 8
  const way = step > 0 ? 1 : -1
  // From the top, round by the step.
  const end = ((-90 + step) * Math.PI) / 180
  const [x, y] = [radius * Math.cos(end), radius * Math.sin(end)]
  // The arrowhead points along the circle at the end.
  const along = [-Math.sin(end) * way, Math.cos(end) * way]
  const across = [-along[1], along[0]]
  const point = (forward, side) =>
    `${x + along[0] * forward + across[0] * side},${y + along[1] * forward + across[1] * side}`
  return (
    <svg className="turn-icon" viewBox="-12 -12 24 24" aria-hidden="true">
      <circle className="turn-icon-dial" r={radius} />
      <path d={`M0,${-radius} A${radius},${radius} 0 0 ${step > 0 ? 1 : 0} ${x},${y}`} />
      <polygon points={`${point(4, 0)} ${point(-1, 3.6)} ${point(-1, -3.6)}`} />
    </svg>
  )
}
