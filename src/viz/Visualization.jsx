import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/i18n.js'
import { DOT_RADIUS } from './layout.js'
import { buildScene } from './scenes.js'
import './Visualization.css'

const KINDS = ['boxes', 'brackets', 'slots', 'dots', 'labels']
/** Pixel size of one dot unit when there is room for it. */
const UNIT_PX = 44

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Every element that appears in any frame, with its state in the current
 * frame. Elements that are missing from the current frame keep the state
 * of the nearest frame they appear in, but are hidden.
 */
function resolveElements(frames, index) {
  const result = {}
  for (const kind of KINDS) {
    const byFrame = frames.map((frame) => new Map(frame[kind].map((element) => [element.id, element])))
    const ids = []
    const seen = new Set()
    for (const frame of frames) {
      for (const element of frame[kind]) {
        if (!seen.has(element.id)) {
          seen.add(element.id)
          ids.push(element.id)
        }
      }
    }
    result[kind] = ids.map((id) => {
      const current = byFrame[index].get(id)
      if (current) {
        return { ...current, visible: true }
      }
      for (let distance = 1; distance < frames.length; distance += 1) {
        for (const other of [index - distance, index + distance]) {
          const element = byFrame[other]?.get(id)
          if (element) {
            return { ...element, visible: false, delay: 0 }
          }
        }
      }
      return null
    })
  }
  return result
}

/** Advances one frame at a time towards `target`, letting each frame settle. */
function useFrameStepper(target, durations) {
  const [{ frame, enteredAt }, setState] = useState({ frame: 0, enteredAt: 0 })

  useEffect(() => {
    if (frame >= target) {
      return undefined
    }
    // Only wait for what is left of the current frame's animation.
    const remaining = durations[frame] - (performance.now() - enteredAt)
    const wait = frame === 0 || prefersReducedMotion() ? 0 : Math.max(0, remaining)
    const timer = setTimeout(() => setState({ frame: frame + 1, enteredAt: performance.now() }), wait)
    return () => clearTimeout(timer)
  }, [frame, enteredAt, target, durations])

  return Math.min(frame, durations.length - 1)
}

function bracketPath({ x1, y1, x2, y2 }) {
  const tick = 0.28
  if (x1 === x2) {
    return `M ${x1 + tick} ${y1} H ${x1} V ${y2} H ${x2 + tick}`
  }
  return `M ${x1} ${y1 + tick} V ${y1} H ${x2} V ${y2 + tick}`
}

function delayStyle(element) {
  return element.delay ? { transitionDelay: `${element.delay}s` } : undefined
}

function describe(question, t) {
  const [a, b, c] = question.terms
  return t(`viz.${question.op}`, { a, b, c })
}

/**
 * Draws the visualization of a question.
 *
 * @param {Object} props
 * @param {import('../game/questions.js').Question} props.question
 * @param {number} props.step  0 = question, 1 = hint, 2 = solution
 */
export default function Visualization({ question, step }) {
  const { t } = useI18n()
  const scene = useMemo(() => buildScene(question), [question])
  const frame = useFrameStepper(step, scene.durations)
  const elements = useMemo(() => resolveElements(scene.frames, frame), [scene, frame])
  const { x, y, width, height } = scene.viewBox

  return (
    <svg
      className="viz"
      viewBox={`${x} ${y} ${width} ${height}`}
      style={{ width: `min(100%, ${Math.round(width * UNIT_PX)}px)`, aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={frame === 0 ? t('viz.question') : describe(question, t)}
    >
      {elements.boxes.map((box) => (
        <rect
          key={box.id}
          className={`viz-box tone-${box.tone}${box.visible ? '' : ' is-hidden'}`}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={0.32}
          style={delayStyle(box)}
        />
      ))}
      {elements.brackets.map((bracket) => (
        <path
          key={bracket.id}
          className={`viz-bracket tone-${bracket.tone}${bracket.visible ? '' : ' is-hidden'}`}
          d={bracketPath(bracket)}
          style={delayStyle(bracket)}
        />
      ))}
      {elements.slots.map((slot) => (
        <circle
          key={slot.id}
          className={`viz-slot${slot.visible ? '' : ' is-hidden'}`}
          cx={slot.x}
          cy={slot.y}
          r={DOT_RADIUS * 0.8}
        />
      ))}
      {elements.dots.map((dot, index) => (
        <g
          key={dot.id}
          className="viz-dot-position"
          style={{ transform: `translate(${dot.x}px, ${dot.y}px)`, ...delayStyle(dot) }}
        >
          <circle
            className={`viz-dot tone-${dot.tone} is-${dot.variant}${dot.visible ? '' : ' is-hidden'}`}
            r={DOT_RADIUS}
            style={{ '--appear-delay': `${Math.min(index * 10, 900)}ms`, ...delayStyle(dot) }}
          />
        </g>
      ))}
      {elements.labels.map((label) => (
        <text
          key={label.id}
          className={`viz-label tone-${label.tone}${label.bold ? ' is-bold' : ''}${label.visible ? '' : ' is-hidden'}`}
          x={label.x}
          y={label.y}
          fontSize={label.size}
          textAnchor={label.anchor}
          dominantBaseline="central"
          style={delayStyle(label)}
        >
          {label.text}
        </text>
      ))}
    </svg>
  )
}
