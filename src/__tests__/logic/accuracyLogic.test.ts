import { describe, it, expect } from 'vitest'
import { calculateAccuracy } from '../../logic/accuracyLogic'
import type { StrokeEndingResult } from '../../types/game'

const makeResult = (strokeIndex: number, isCorrect: boolean): StrokeEndingResult => ({
  strokeIndex,
  detectedEnding: null,
  isCorrect,
  expectedEndings: [],
})

describe('calculateAccuracy', () => {
  it('全画正解なら 1.0 を返す', () => {
    const results = [makeResult(0, true), makeResult(1, true)]
    expect(calculateAccuracy(results)).toBe(1.0)
  })

  it('全画不正解なら 0.0 を返す', () => {
    const results = [makeResult(0, false), makeResult(1, false)]
    expect(calculateAccuracy(results)).toBe(0.0)
  })

  it('2画中1画正解なら 0.5 を返す', () => {
    const results = [makeResult(0, true), makeResult(1, false)]
    expect(calculateAccuracy(results)).toBe(0.5)
  })

  it('結果が空のとき 0.0 を返す', () => {
    expect(calculateAccuracy([])).toBe(0.0)
  })
})
