import { useEffect, useMemo, useState } from 'react'
import {
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force'
import './App.css'

function createQuestion() {
  const operations = ['+', '-', '*', '/']
  const operator = operations[Math.floor(Math.random() * operations.length)]

  let left
  let right
  let answer

  if (operator === '+') {
    left = Math.floor(Math.random() * 21)
    right = Math.floor(Math.random() * 21)
    answer = left + right
  } else if (operator === '-') {
    left = Math.floor(Math.random() * 21)
    right = Math.floor(Math.random() * 21)
    if (right > left) {
      const temp = left
      left = right
      right = temp
    }
    answer = left - right
  } else if (operator === '*') {
    left = Math.floor(Math.random() * 13)
    right = Math.floor(Math.random() * 13)
    answer = left * right
  } else {
    right = Math.floor(Math.random() * 11) + 1
    answer = Math.floor(Math.random() * 13)
    left = right * answer
  }

  return {
    text: `${left} ${operator} ${right}`,
    left,
    right,
    operator,
    answer,
  }
}

function AdditionBubbles({ leftCount, rightCount }) {
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    const width = 760
    const height = 220
    const radius = 12

    const nextNodes = [
      ...Array.from({ length: leftCount }, (_, index) => ({
        id: `left-${index}`,
        side: 'left',
        x: width * 0.28,
        y: height * 0.5,
      })),
      ...Array.from({ length: rightCount }, (_, index) => ({
        id: `right-${index}`,
        side: 'right',
        x: width * 0.72,
        y: height * 0.5,
      })),
    ]

    if (nextNodes.length === 0) {
      const emptyFrame = requestAnimationFrame(() => {
        setNodes([])
      })

      return () => {
        cancelAnimationFrame(emptyFrame)
      }
    }

    let frame = null
    const simulation = forceSimulation(nextNodes)
      .force(
        'x',
        forceX((node) => (node.side === 'left' ? width * 0.28 : width * 0.72)).strength(0.12),
      )
      .force('y', forceY(height * 0.5).strength(0.08))
      .force('charge', forceManyBody().strength(3))
      .force('collide', forceCollide(radius + 2).iterations(2))
      .alpha(0.9)
      .alphaDecay(0.05)

    simulation.on('tick', () => {
      if (frame !== null) {
        return
      }

      frame = requestAnimationFrame(() => {
        frame = null
        setNodes([...simulation.nodes()])
      })
    })

    return () => {
      simulation.stop()
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [leftCount, rightCount])

  return (
    <div className="bubble-viz" aria-hidden="true">
      <svg viewBox="0 0 760 220" preserveAspectRatio="xMidYMid meet">
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r="12"
            className={node.side === 'left' ? 'bubble bubble-left' : 'bubble bubble-right'}
          />
        ))}
      </svg>
    </div>
  )
}

function App() {
  const [question, setQuestion] = useState(() => createQuestion())
  const [inputValue, setInputValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const isAddition = question.operator === '+'

  const resultText = useMemo(() => {
    if (!submitted) {
      return 'Press Enter to submit your answer.'
    }

    if (isCorrect) {
      return 'Correct! Press Enter again for the next question.'
    }

    return `Incorrect. Correct answer: ${question.answer}. Press Enter for next question.`
  }, [submitted, isCorrect, question.answer])

  const handleEnter = (event) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()

    if (!submitted) {
      const parsedAnswer = Number(inputValue)
      const correct = Number.isFinite(parsedAnswer) && parsedAnswer === question.answer
      setIsCorrect(correct)
      setSubmitted(true)
      return
    }

    setQuestion(createQuestion())
    setInputValue('')
    setSubmitted(false)
    setIsCorrect(false)
  }

  return (
    <main className="game">
      <h1 className="question">
        {isAddition ? (
          <>
            <span className="operand operand-left">{question.left}</span>
            <span className="operator"> + </span>
            <span className="operand operand-right">{question.right}</span>
          </>
        ) : (
          question.text
        )}
      </h1>

      {isAddition && <AdditionBubbles leftCount={question.left} rightCount={question.right} />}

      <input
        type="text"
        inputMode="numeric"
        className="answer-input"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleEnter}
        placeholder="Type your answer"
        readOnly={submitted}
        autoFocus
      />

      <p className={`result ${submitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
        {resultText}
      </p>
    </main>
  )
}

export default App
