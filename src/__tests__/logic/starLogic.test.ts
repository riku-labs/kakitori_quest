import { describe, it, expect } from 'vitest'
import { calculateStars } from '../../logic/starLogic'
import type { StrokeEndingResult } from '../../types/game'

const allCorrect = (n: number): StrokeEndingResult[] =>
  Array.from({ length: n }, (_, i) => ({ strokeIndex: i, detectedEnding: null, isCorrect: true, expectedEndings: [] }))

const allWrong = (n: number): StrokeEndingResult[] =>
  Array.from({ length: n }, (_, i) => ({ strokeIndex: i, detectedEnding: null, isCorrect: false, expectedEndings: [] }))

describe('calculateStars', () => {
  it('全画正解なら ★3 を返す', () => {
    expect(calculateStars(allCorrect(4))).toBe(3)
  })

  it('全画不正解でもクリアなら ★1 を返す', () => {
    expect(calculateStars(allWrong(4))).toBe(1)
  })

  it('accuracy 0.5 なら ★2 を返す', () => {
    const results = [...allCorrect(2), ...allWrong(2)]
    expect(calculateStars(results)).toBe(2)
  })
})
