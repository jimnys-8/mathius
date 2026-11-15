import { useEffect, useRef } from 'react'
import { SOLUTION_FRAME } from '../viz/scenes.js'

/**
 * For cards that show their solution in one step: calls
 * `onSettled(SOLUTION_FRAME)` once the solution has had `ms` to appear,
 * as Visualization does when its solution has finished animating.
 */
export function useSolutionSettled(step, onSettled, ms = 500) {
  const solved = step >= SOLUTION_FRAME
  const onSettledRef = useRef(onSettled)
  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])
  useEffect(() => {
    if (!solved) {
      return undefined
    }
    const timer = setTimeout(() => onSettledRef.current?.(SOLUTION_FRAME), ms)
    return () => clearTimeout(timer)
  }, [solved, ms])
  return solved
}
