import { calculateAccuracy } from './accuracyLogic'
import type { StrokeEndingResult } from '../types/game'

export const BATTLE_WIN_THRESHOLD = 0.6

export function resolveBattle(
  results: StrokeEndingResult[],
  threshold = BATTLE_WIN_THRESHOLD,
): 'win' | 'lose' {
  const accuracy = calculateAccuracy(results)
  return accuracy >= threshold ? 'win' : 'lose'
}
