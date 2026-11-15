import './Pie.css'

const R = 1

function point(index, slices, radius = R) {
  const angle = (index / slices) * 2 * Math.PI - Math.PI / 2
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

function spokes(slices) {
  return slices > 1 ? Array.from({ length: slices }, (_, index) => point(index, slices)) : []
}

/**
 * A circle cut in `slices` equal slices from the top, clockwise, with the
 * first `colored` of them colored.
 *
 * - `extra`: thinner, dashed lines cutting it into that many slices,
 *   e.g. fourths drawn on a half
 * - `bold`: thick lines where it would be cut into that many slices,
 *   e.g. halves drawn on sixths
 */
export default function Pie({ colored, slices, extra, bold, className = '', style, label }) {
  const filled =
    colored === slices ? (
      <circle className="pie-colored" r={R} />
    ) : (
      colored > 0 &&
      (() => {
        const [x1, y1] = point(0, slices)
        const [x2, y2] = point(colored, slices)
        const large = colored / slices > 0.5 ? 1 : 0
        return <path className="pie-colored" d={`M0 0L${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}Z`} />
      })()
    )

  return (
    <svg
      className={`pie ${className}`.trim()}
      style={style}
      viewBox="-1.08 -1.08 2.16 2.16"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle className="pie-plate" r={R} />
      {filled}
      {extra &&
        spokes(extra).map(([x, y], index) => <line key={`e${index}`} className="pie-extra" x1={0} y1={0} x2={x} y2={y} />)}
      {spokes(slices).map(([x, y], index) => (
        <line key={index} className="pie-line" x1={0} y1={0} x2={x} y2={y} />
      ))}
      {bold &&
        spokes(bold).map(([x, y], index) => <line key={`b${index}`} className="pie-bold" x1={0} y1={0} x2={x} y2={y} />)}
      <circle className="pie-rim" r={R} />
    </svg>
  )
}
