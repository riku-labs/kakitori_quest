import { calculateAccuracy } from './accuracyLogic'
import type { StrokeEndingResult } from '../types/game'

const STAR3_THRESHOLD = 0.9
const STAR2_THRESHOLD = 0.5

export function calculateStars(results: StrokeEndingResult[]): 1 | 2 | 3 {
  const accuracy = calculateAccuracy(results)
  if (accuracy >= STAR3_THRESHOLD) return 3
  if (accuracy >= STAR2_THRESHOLD) return 2
  return 1
}
