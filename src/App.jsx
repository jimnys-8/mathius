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

function BubbleField({ nodesConfig, width = 200, height = 150, radius = 11, className = '' }) {
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    const nextNodes = nodesConfig.map((node) => ({
      ...node,
      x: node.targetX,
      y: node.targetY,
    }))

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
      .force('x', forceX((node) => node.targetX).strength(0.15))
      .force('y', forceY((node) => node.targetY).strength(0.1))
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
  }, [nodesConfig, radius])

  return (
    <div className={`bubble-viz ${className}`.trim()} aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={radius}
            className={`bubble bubble-${node.color}`}
          />
        ))}
      </svg>
    </div>
  )
}

function buildNodes(count, color, idPrefix, targetX) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${idPrefix}-${index}`,
    color,
    targetX,
    targetY: 75,
  }))
}

function EquationGrid({ question, inputValue, onInputChange, onEnter, submitted }) {
  const isAddition = question.operator === '+'
  const isSubtraction = question.operator === '-'
  const leftCount = question.left
  const rightCount = question.right

  const leftNodes = useMemo(() => {
    if (isAddition) {
      return buildNodes(leftCount, 'purple', 'left', 90)
    }

    if (isSubtraction) {
      return [
        ...buildNodes(question.answer, 'blue', 'left-blue', 65),
        ...buildNodes(rightCount, 'magenta', 'left-magenta', 125),
      ]
    }

    return []
  }, [isAddition, isSubtraction, leftCount, rightCount, question.answer])

  const rightNodes = useMemo(() => {
    if (isAddition) {
      return buildNodes(rightCount, 'orange', 'right', 90)
    }

    if (isSubtraction) {
      return buildNodes(rightCount, 'magenta', 'right-magenta', 90)
    }

    return []
  }, [isAddition, isSubtraction, rightCount])

  const resultNodes = useMemo(() => {
    if (isAddition) {
      return [
        ...buildNodes(leftCount, 'purple', 'result-left', 115),
        ...buildNodes(rightCount, 'orange', 'result-right', 225),
      ]
    }

    if (isSubtraction) {
      return buildNodes(question.answer, 'blue', 'result-blue', 170)
    }

    return []
  }, [isAddition, isSubtraction, leftCount, rightCount, question.answer])

  const leftOperandClass = isSubtraction
    ? 'operand operand-left operand-grid operand-blue'
    : 'operand operand-left operand-grid'
  const rightOperandClass = isSubtraction
    ? 'operand operand-right operand-grid operand-magenta'
    : 'operand operand-right operand-grid'

  return (
    <div className="equation-grid">
      <BubbleField nodesConfig={leftNodes} className="bubble-viz-left" />
      <span className="equation-sign equation-sign-top">{question.operator}</span>
      <BubbleField nodesConfig={rightNodes} className="bubble-viz-right" />
      <span className="equation-sign equation-sign-top">=</span>
      <BubbleField nodesConfig={resultNodes} width={340} className="bubble-viz-result" />

      <span className={leftOperandClass}>{leftCount}</span>
      <span className="equation-sign equation-sign-bottom">{question.operator}</span>
      <span className={rightOperandClass}>{rightCount}</span>
      <span className="equation-sign equation-sign-bottom">=</span>
      <input
        type="text"
        inputMode="numeric"
        className="answer-input answer-input-grid"
        value={inputValue}
        onChange={onInputChange}
        onKeyDown={onEnter}
        placeholder="Answer"
        readOnly={submitted}
        autoFocus
      />
    </div>
  )
}

function App() {
  const [question, setQuestion] = useState(() => createQuestion())
  const [inputValue, setInputValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const hasEquationVisualization = question.operator === '+' || question.operator === '-'

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
      {hasEquationVisualization ? (
        <EquationGrid
          question={question}
          inputValue={inputValue}
          onInputChange={(event) => setInputValue(event.target.value)}
          onEnter={handleEnter}
          submitted={submitted}
        />
      ) : (
        <>
          <h1 className="question">{question.text}</h1>
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
        </>
      )}

      <p className={`result ${submitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
        {resultText}
      </p>
    </main>
  )
}

export default App
