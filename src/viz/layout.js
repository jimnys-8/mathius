// Geometry helpers for visualization scenes. All coordinates are in "dot
// units": neighbouring dot centers are one unit apart.

export const DOT_RADIUS = 0.38
/** Extra space after every fifth dot, so groups of five can be seen at a glance. */
export const FIVE_GAP = 0.35
/** Vertical space between two separate groups of dots. */
export const GROUP_GAP = 0.9

/** Offset of the n:th dot along a row or column, including five-gaps. */
export function offset(index) {
  return index + Math.floor(index / 5) * FIVE_GAP
}

/** Distance between the first and last dot center of a run of `count` dots. */
export function span(count) {
  return count <= 0 ? 0 : offset(count - 1)
}

export function rowsFor(count, perRow = 10) {
  return Math.max(1, Math.ceil(count / perRow))
}

/** Position of dot `index` when dots are laid out in rows of `perRow`. */
export function gridPosition(index, { x = 0, y = 0, perRow = 10 } = {}) {
  const row = Math.floor(index / perRow)
  const col = index % perRow
  return { x: x + offset(col), y: y + row }
}

/** Position of the dot at (row, col) in an array with five-gaps in both directions. */
export function arrayPosition(row, col, { x = 0, y = 0 } = {}) {
  return { x: x + offset(col), y: y + offset(row) }
}

/** Vertical center of the rows that dots [from, to) occupy in a grid. */
export function rowsCenter(from, to, { y = 0, perRow = 10 } = {}) {
  const first = Math.floor(from / perRow)
  const last = Math.floor((Math.max(to, from + 1) - 1) / perRow)
  return y + (first + last) / 2
}

/**
 * Stagger delay (seconds) for the index:th of `count` elements, so that
 * the whole group takes at most `total` seconds to start moving.
 */
export function stagger(index, count, { total = 1.6, max = 0.09 } = {}) {
  if (count <= 1) {
    return 0
  }
  return index * Math.min(max, total / count)
}
