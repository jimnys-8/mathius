import { useState } from 'react'
import { makeQuestion } from '../game/questions.js'
import Visualization from '../viz/Visualization.jsx'

// Development page showing every kind of visualization. Open with ?gallery
// (and optionally &step=1 or &step=2 to show hints or solutions).

const SAMPLES = [
  ['add', [3, 4, 7]],
  ['add', [8, 5, 13]],
  ['add', [47, 38, 85]],
  ['sub', [13, 5, 8]],
  ['sub', [62, 27, 35]],
  ['mul', [3, 4, 12]],
  ['mul', [7, 8, 56]],
  ['div', [12, 3, 4]],
  ['div', [56, 8, 7]],
  ['sqrt', [49, 7]],
  ['sqrt', [144, 12]],
  ['sqrt', [40, 6.3], [6.1, 6.3, 6.6, 6.8]],
  ['sqrt', [7, 2.6], [1.3, 2.6, 3.4, 4.8]],
  ['sqrt', [130, 11.4], [9.6, 10.2, 11.4, 12.7]],
]

const SYMBOLS = { add: '+', sub: '−', mul: '×', div: '÷' }

function Equation({ question }) {
  if (question.op === 'sqrt') {
    const [n, r] = question.terms
    return (
      <p style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.5rem 0 0' }}>
        √<span style={{ color: 'var(--color-a)' }}>{question.unknown === 0 ? '?' : n}</span>
        {question.choices ? ' ≈ ' : ' = '}
        <span style={{ color: 'var(--color-c)' }}>{question.unknown === 1 ? '?' : r}</span>
      </p>
    )
  }
  return (
    <p style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.5rem 0 0' }}>
      {question.terms.map((term, index) => (
        <span key={index}>
          {index === 1 && ` ${SYMBOLS[question.op]} `}
          {index === 2 && ' = '}
          <span style={{ color: `var(--color-${'abc'[index]})` }}>{index === question.unknown ? '?' : term}</span>
        </span>
      ))}
    </p>
  )
}

function Sample({ question, initialStep }) {
  const [step, setStep] = useState(initialStep)
  const [version, setVersion] = useState(0)
  return (
    <figure style={{ margin: 0, padding: '1rem', background: 'white', borderRadius: 16, textAlign: 'center' }}>
      <Visualization key={version} question={question} step={step} />
      <Equation question={question} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        <button
          onClick={() => {
            setVersion((value) => value + 1)
            setStep(0)
          }}
        >
          Reset
        </button>
        <button onClick={() => setStep(1)}>Hint</button>
        <button onClick={() => setStep(2)}>Solve</button>
      </div>
    </figure>
  )
}

export default function Gallery() {
  const params = new URLSearchParams(window.location.search)
  const step = Number(params.get('step') ?? 0)
  const only = params.get('op')
  const samples = SAMPLES.filter(([op]) => !only || op === only)

  return (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 16,
        padding: 16,
      }}
    >
      {samples.flatMap(([op, terms, choices]) => {
        const unknowns = choices ? [1] : terms.map((_, index) => index).reverse()
        return unknowns.map((unknown) => {
          const question = makeQuestion(op, terms, unknown, choices)
          return <Sample key={question.key} question={question} initialStep={step} />
        })
      })}
    </main>
  )
}
