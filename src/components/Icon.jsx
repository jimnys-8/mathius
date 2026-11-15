import './Icon.css'

// Drawn on a 24×24 grid as strokes in the text color.
const PATHS = {
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  cross: ['M6.5 6.5l11 11M17.5 6.5l-11 11'],
  arrowRight: ['M4.5 12h15M13.5 6l6 6-6 6'],
  arrowLeft: ['M19.5 12h-15M10.5 6l-6 6 6 6'],
  lock: ['M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  unlock: ['M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2'],
  backspace: ['M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z', 'M11.5 9.5l5 5M16.5 9.5l-5 5'],
}

/**
 * A small symbol that sits in text like a letter. Drawn rather than typed
 * (✓ ✕ → ⌫): Nunito lacks those characters, and phones draw them thin
 * from a fallback font.
 */
export default function Icon({ name, className = '' }) {
  return (
    <svg className={`icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
