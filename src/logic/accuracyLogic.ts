import type { StrokeEndingResult } from '../types/game'

export function calculateAccuracy(results: StrokeEndingResult[]): number {
  if (results.length === 0) return 0.0
  const correct = results.filter((r) => r.isCorrect).length
  return correct / results.length
}
