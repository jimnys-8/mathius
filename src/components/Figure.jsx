import { isSpotsKey, makeFigure, parseFigure, parseSpots } from '../game/shapes.js'
import './Figure.css'

// Each shape fits a circle of radius 1 around (0, 0). An arrow points up, a heart down.
const SHAPE_PATHS = {
  circle: <circle r={0.92} />,
  square: <rect x={-0.8} y={-0.8} width={1.6} height={1.6} rx={0.16} />,
  triangle: <polygon points="0,-0.92 1,0.8 -1,0.8" strokeLinejoin="round" />,
  star: (
    <polygon
      points="0,-0.905 0.247,-0.245 0.951,-0.214 0.399,0.225 0.588,0.904 0,0.515 -0.588,0.904 -0.399,0.225 -0.951,-0.214 -0.247,-0.245"
      strokeLinejoin="round"
    />
  ),
  heart: (
    <path d="M0,0.92 C-0.45,0.6 -1,0.18 -1,-0.32 C-1,-0.72 -0.68,-0.95 -0.36,-0.95 C-0.16,-0.95 -0.04,-0.84 0,-0.68 C0.04,-0.84 0.16,-0.95 0.36,-0.95 C0.68,-0.95 1,-0.72 1,-0.32 C1,0.18 0.45,0.6 0,0.92 Z" />
  ),
  diamond: <polygon points="0,-1 0.78,0 0,1 -0.78,0" strokeLinejoin="round" />,
  arrow: <polygon points="0,-1 0.8,-0.12 0.3,-0.12 0.3,0.95 -0.3,0.95 -0.3,-0.12 -0.8,-0.12" strokeLinejoin="round" />,
}

// Where the figures go in a 100×100 box, like the dots on a die.
const LOW = 22
const MID = 50
const HIGH = 78
const DIE = {
  1: [[MID, MID]],
  2: [
    [LOW, HIGH],
    [HIGH, LOW],
  ],
  3: [
    [LOW, HIGH],
    [MID, MID],
    [HIGH, LOW],
  ],
  4: [
    [LOW, LOW],
    [HIGH, LOW],
    [LOW, HIGH],
    [HIGH, HIGH],
  ],
  5: [
    [LOW, LOW],
    [HIGH, LOW],
    [MID, MID],
    [LOW, HIGH],
    [HIGH, HIGH],
  ],
  6: [
    [LOW, LOW],
    [HIGH, LOW],
    [LOW, MID],
    [HIGH, MID],
    [LOW, HIGH],
    [HIGH, HIGH],
  ],
}

// How big a figure is (its radius in the box): alone or one of several.
const RADIUS = { big: [44, 13], small: [20, 7] }

// The rim, in box units, so big and small figures share one line width.
const RIM = { solid: 3.5, outline: 7 }

/**
 * A spot tile (see src/game/shapes.js): small figures in the spots of a
 * die's four (or, in keys from before, its five), each in its own color.
 * `dropped` spots (an array like `spots`) are drawn faint and crossed
 * out, for a hint.
 */
function Spots({ spots, dropped, className }) {
  const drawn = spots.map((spot, index) => spot ?? dropped?.[index] ?? null)
  const radius = SPOT_RADIUS[spots.length]
  return (
    <svg className={['figure', 'is-spots', className].filter(Boolean).join(' ')} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {drawn.map((spot, index) => {
        if (!spot) {
          return null
        }
        const [x, y] = DIE[spots.length][index]
        const gone = !spots[index]
        return (
          <g key={index} className={`figure-spot is-${spot.color}${gone ? ' is-dropped' : ''}`}>
            <g className="figure-shape" transform={`translate(${x} ${y}) scale(${radius})`} strokeWidth={RIM.solid / radius}>
              {SHAPE_PATHS[spot.shape]}
            </g>
            {gone && <line className="figure-spot-cross" x1={x - radius} y1={y + radius} x2={x + radius} y2={y - radius} />}
          </g>
        )
      })}
    </svg>
  )
}

// A spot's radius, by how many spots: four as big as fits the corners, five leaving room for the middle one.
const SPOT_RADIUS = { 4: 20, 5: 14 }

/**
 * A figure (see src/game/shapes.js), drawn in a square: its shape in its
 * color, solid or as an outline, big or small, turned, and up to six of
 * it laid out like the dots on a die. Takes a figure or a figure key, or
 * a spot tile's key. Sizes itself to its container's width.
 *
 * With `plain`, the figure is drawn in gray: for hints that show only
 * an attribute other than color. With `pips`, a lone figure is drawn as
 * small as one of several, for grids where counts are added up. For a
 * spot tile, `dropped` adds crossed-out spots (see Spots).
 */
export default function Figure({ figure, className = '', plain = false, pips = false, dropped = null }) {
  if (isSpotsKey(figure)) {
    return <Spots spots={parseSpots(figure)} dropped={dropped} className={className} />
  }
  const { shape, color, size, fill, count, turn } = typeof figure === 'string' ? parseFigure(figure) : makeFigure(figure)
  const [alone, several] = RADIUS[size]
  const radius = count === 1 && !pips ? alone : several
  const classes = ['figure', `is-${plain ? 'plain' : color}`, `is-${fill}`, className].filter(Boolean).join(' ')
  return (
    <svg className={classes} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {DIE[count].map(([x, y], index) => (
        <g
          key={index}
          className="figure-shape"
          transform={`translate(${x} ${y}) rotate(${turn}) scale(${radius})`}
          strokeWidth={RIM[fill] / radius}
        >
          {SHAPE_PATHS[shape]}
        </g>
      ))}
    </svg>
  )
}
