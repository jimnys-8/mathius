import { useMemo, useState } from 'react'
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
    answer,
  }
}

function App() {
  const [question, setQuestion] = useState(() => createQuestion())
  const [inputValue, setInputValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

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

      <p className={`result ${submitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
        {resultText}
      </p>
    </main>
  )
}

export default App
