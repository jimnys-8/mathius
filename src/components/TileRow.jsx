import './TileRow.css'

/**
 * A row of tiles with one gap, for the series games, and rows of marks
 * under it that the hint shows: arcs from one tile to the next (+2, a
 * turn), brackets under a run of tiles (one round of a repeat), and
 * notes under single tiles (3×3). Marks keep their room while hidden,
 * so nothing moves when they appear.
 *
 * The tiles share the width of the nearest container (the card sets
 * `container-type: inline-size`), up to 5.5rem each; `--tile` holds a
 * tile's width for sizing what goes in it.
 *
 * @param {Object} props
 * @param {React.ReactNode[]} props.tiles  what each tile holds, the gap's included
 * @param {number} props.gap  which tile is missing
 * @param {'open'|'correct'|'wrong'} props.status  the gap turns green once answered
 * @param {string} props.label  the row read out, "2, 4, ?"
 * @param {(index: number) => string} [props.tileClass]  extra classes for a tile
 * @param {Array<Array<{ from: number, span?: number, kind: 'arc'|'bracket'|'note', label?: React.ReactNode, shown: boolean, className?: string }>>} [props.marks]
 *   rows of marks; an arc spans from tile `from` to the next, a bracket `span` tiles
 */
export default function TileRow({ tiles, gap, status, label, tileClass = () => '', marks = [] }) {
  return (
    <div className="tile-row" role="img" aria-label={label} style={{ '--count': tiles.length }}>
      {tiles.map((content, index) => (
        <span
          key={index}
          className={`tile${index === gap ? ` is-gap is-${status}` : ''} ${tileClass(index)}`.trim()}
          style={{ gridColumn: index + 1 }}
        >
          {content}
        </span>
      ))}
      {marks.map((row, rowIndex) =>
        row.map(({ from, span = 1, kind, label: markLabel, shown, className = '' }) => (
          <span
            key={`${rowIndex}-${kind}-${from}`}
            className={`tile-mark tile-${kind}${shown ? ' is-shown' : ''} ${className}`.trim()}
            style={{ gridRow: rowIndex + 2, gridColumn: `${from + 1} / span ${kind === 'arc' ? 2 : span}` }}
            aria-hidden="true"
          >
            {kind !== 'note' && <span className={`tile-${kind}-line`} />}
            {markLabel !== undefined && <span className="tile-mark-label">{markLabel}</span>}
          </span>
        )),
      )}
    </div>
  )
}
