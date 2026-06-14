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
  const operations = ['+', '-', '*', '/', '√']
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
  } else if (operator === '/') {
    right = Math.floor(Math.random() * 11) + 1
    answer = Math.floor(Math.random() * 13)
    left = right * answer
  } else {
    // square root of a perfect square
    answer = Math.floor(Math.random() * 11) + 2
    const radicand = answer * answer
    return {
      text: `√${radicand}`,
      left: radicand,
      right: null,
      operator,
      answer,
      radicand,
    }
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

function getNestedCircleLayout(groupCount, width, height) {
  if (groupCount <= 0) {
    return []
  }

  const columns = Math.min(4, groupCount)
  const rows = Math.ceil(groupCount / columns)
  const xGap = width / (columns + 1)
  const yGap = height / (rows + 1)
  const outerRadius = Math.max(14, Math.min(28, Math.min(xGap, yGap) * 0.42))

  return Array.from({ length: groupCount }, (_, groupIndex) => {
    const col = groupIndex % columns
    const row = Math.floor(groupIndex / columns)

    return {
      id: `group-${groupIndex}`,
      cx: xGap * (col + 1),
      cy: yGap * (row + 1),
      outerRadius,
    }
  })
}

function getInnerOffsets(count, maxRadius) {
  if (count <= 0) {
    return []
  }

  if (count === 1) {
    return [{ x: 0, y: 0 }]
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, index) => {
    const ratio = Math.sqrt((index + 0.5) / count)
    const distance = maxRadius * ratio
    const angle = index * goldenAngle

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    }
  })
}

function NestedGroupField({
  groups,
  innerCount,
  width = 420,
  height = 220,
  className = '',
  shellClassName = 'multiply-group-shell',
  itemClassName = 'multiply-group-item',
}) {
  const groupLayout = useMemo(() => getNestedCircleLayout(groups, width, height), [groups, width, height])

  return (
    <div className={`bubble-viz ${className}`.trim()} aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {groupLayout.map((group) => {
          const innerRadius = Math.max(2.8, Math.min(5.4, group.outerRadius * 0.2))
          const innerOffsets = getInnerOffsets(innerCount, group.outerRadius - innerRadius - 2)

          return (
            <g key={group.id}>
              <circle
                cx={group.cx}
                cy={group.cy}
                r={group.outerRadius}
                className={shellClassName}
              />
              {innerOffsets.map((offset, index) => (
                <circle
                  key={`${group.id}-inner-${index}`}
                  cx={group.cx + offset.x}
                  cy={group.cy + offset.y}
                  r={innerRadius}
                  className={itemClassName}
                />
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function getGridLayout(rows, cols, width, height) {
  if (rows <= 0 || cols <= 0) {
    return { nodes: [], radius: 0 }
  }

  const xGap = width / (cols + 1)
  const yGap = height / (rows + 1)
  const radius = Math.max(3.5, Math.min(11, Math.min(xGap, yGap) * 0.4))
  const nodes = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      nodes.push({
        id: `cell-${row}-${col}`,
        cx: xGap * (col + 1),
        cy: yGap * (row + 1),
        row,
        col,
      })
    }
  }

  return { nodes, radius }
}

function GridField({
  rows,
  cols,
  width = 200,
  height = 150,
  className = '',
  dotClassName = 'grid-dot',
  firstRowClassName = '',
  firstColumnClassName = '',
}) {
  const layout = useMemo(() => getGridLayout(rows, cols, width, height), [rows, cols, width, height])

  return (
    <div className={`bubble-viz ${className}`.trim()} aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {layout.nodes.map((node) => {
          let dotClass = dotClassName
          if (firstColumnClassName && node.col === 0) {
            dotClass = firstColumnClassName
          } else if (firstRowClassName && node.row === 0) {
            dotClass = firstRowClassName
          }

          return (
            <circle
              key={node.id}
              cx={node.cx}
              cy={node.cy}
              r={layout.radius}
              className={dotClass}
            />
          )
        })}
      </svg>
    </div>
  )
}

function symbolForOperator(operator) {
  if (operator === '*') {
    return 'x'
  }

  return operator
}

function EquationGrid({ question, inputValue, onInputChange, onEnter, submitted }) {
  const isAddition = question.operator === '+'
  const isSubtraction = question.operator === '-'
  const isMultiplication = question.operator === '*'
  const isDivision = question.operator === '/'
  const isSqrt = question.operator === '√'
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

    if (isMultiplication) {
      return buildNodes(leftCount, 'blue', 'left-multiply', 90)
    }

    return []
  }, [isAddition, isSubtraction, isMultiplication, leftCount, rightCount, question.answer])

  const rightNodes = useMemo(() => {
    if (isAddition) {
      return buildNodes(rightCount, 'orange', 'right', 90)
    }

    if (isSubtraction) {
      return buildNodes(rightCount, 'magenta', 'right-magenta', 90)
    }

    if (isMultiplication) {
      return buildNodes(rightCount, 'orange', 'right-multiply', 90)
    }

    return []
  }, [isAddition, isSubtraction, isMultiplication, rightCount])

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

  let leftOperandClass = 'operand operand-left operand-grid'
  let rightOperandClass = 'operand operand-right operand-grid'

  if (isSubtraction) {
    leftOperandClass += ' operand-blue'
    rightOperandClass += ' operand-magenta'
  } else if (isDivision) {
    leftOperandClass += ' operand-cyan'
    rightOperandClass += ' operand-red'
  }
  const topOperator = symbolForOperator(question.operator)
  const resultWidth = isMultiplication ? 420 : 340
  const resultHeight = isMultiplication ? 220 : 150
  const resultRadius = 11
  const sideRadius = isMultiplication || isDivision ? 9 : 11
  const resultClassName = isMultiplication
    ? 'bubble-viz-result bubble-viz-result-multiply'
    : 'bubble-viz-result'

  if (isSqrt) {
    return (
      <div className="equation-grid equation-grid-sqrt">
        <GridField
          rows={question.answer}
          cols={question.answer}
          width={200}
          height={200}
          className="bubble-viz-square"
          firstColumnClassName="grid-dot grid-dot-result"
        />
        <span className="radical-expr">
          <span className="radical-sign">√</span>
          <span className="radical-radicand">{question.radicand}</span>
        </span>
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

  return (
    <div className="equation-grid">
      {isDivision ? (
        <GridField
          rows={rightCount}
          cols={question.answer}
          width={220}
          height={150}
          className="bubble-viz-left"
          firstColumnClassName="grid-dot grid-dot-divisor"
          firstRowClassName="grid-dot grid-dot-result"
        />
      ) : (
        <BubbleField nodesConfig={leftNodes} radius={sideRadius} className="bubble-viz-left" />
      )}
      <span className="equation-sign equation-sign-top">{topOperator}</span>
      {isDivision ? (
        <GridField
          rows={rightCount}
          cols={1}
          width={70}
          height={150}
          className="bubble-viz-right bubble-viz-divisor-col"
          dotClassName="grid-dot grid-dot-divisor"
        />
      ) : (
        <BubbleField nodesConfig={rightNodes} radius={sideRadius} className="bubble-viz-right" />
      )}
      <span className="equation-sign equation-sign-top">=</span>
      {isMultiplication ? (
        <NestedGroupField
          groups={rightCount}
          innerCount={leftCount}
          width={resultWidth}
          height={resultHeight}
          className={resultClassName}
        />
      ) : isDivision ? (
        <GridField
          rows={1}
          cols={question.answer}
          width={resultWidth}
          height={150}
          className={`${resultClassName} bubble-viz-divide-result`}
          dotClassName="grid-dot grid-dot-result"
        />
      ) : (
        <BubbleField
          nodesConfig={resultNodes}
          width={resultWidth}
          height={resultHeight}
          radius={resultRadius}
          className={resultClassName}
        />
      )}

      <span className={leftOperandClass}>{leftCount}</span>
      <span className="equation-sign equation-sign-bottom">{topOperator}</span>
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
  const hasEquationVisualization =
    question.operator === '+' ||
    question.operator === '-' ||
    question.operator === '*' ||
    question.operator === '/' ||
    question.operator === '√'

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
