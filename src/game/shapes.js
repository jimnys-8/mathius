// Figures: what the pattern games draw (shape series, and later
// matrices). A figure is a set of attributes that a rule can vary one at
// a time: its shape, color, size, fill, how many of it there are, and
// which way it points. Figure.jsx draws one.
//
// Figures travel as keys, strings like "heart.red.big.solid.1.0" with
// the attributes in ATTRIBUTES order, so they can be answers, choices
// and question keys, and show up in the stats.

export const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond']

/** Shapes that point somewhere, so turning them shows: an arrow points up, a heart down. */
export const TURNING_SHAPES = ['arrow', 'heart']

export const COLORS = ['red', 'blue', 'yellow', 'green', 'purple']

export const SIZES = ['big', 'small']

export const FILLS = ['solid', 'outline']

/** Figures in one tile, laid out like the dots on a die. */
export const MAX_COUNT = 6

/** The values an attribute can take; `turn` is in degrees, clockwise from pointing up. */
export const VALUES = {
  shape: [...new Set([...SHAPES, ...TURNING_SHAPES])],
  color: COLORS,
  size: SIZES,
  fill: FILLS,
  count: [1, 2, 3, 4, 5, 6],
  turn: [0, 45, 90, 135, 180, 225, 270, 315],
}

export const ATTRIBUTES = ['shape', 'color', 'size', 'fill', 'count', 'turn']

const DEFAULTS = { shape: 'circle', color: 'red', size: 'big', fill: 'solid', count: 1, turn: 0 }

const NUMERIC = new Set(['count', 'turn'])

/** A full figure, with defaults for the attributes left out. */
export function makeFigure(attributes = {}) {
  return { ...DEFAULTS, ...attributes }
}

/** "heart.red.big.solid.1.0" for a figure. */
export function figureKey(figure) {
  const full = makeFigure(figure)
  return ATTRIBUTES.map((attribute) => full[attribute]).join('.')
}

/** The figure a key stands for. */
export function parseFigure(key) {
  const parts = key.split('.')
  return Object.fromEntries(
    ATTRIBUTES.map((attribute, index) => {
      const part = parts[index] ?? DEFAULTS[attribute]
      return [attribute, NUMERIC.has(attribute) ? Number(part) : part]
    }),
  )
}

/** Whether a key is a figure key, for telling them apart from other answers. */
export function isFigureKey(value) {
  return typeof value === 'string' && value.split('.').length === ATTRIBUTES.length && VALUES.shape.includes(value.split('.')[0])
}
