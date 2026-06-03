import { describe, it, expect } from 'vitest'
import { resolveBattle } from '../../logic/battleLogic'
import type { StrokeEndingResult } from '../../types/game'

const makeResult = (isCorrect: boolean): StrokeEndingResult => ({
  strokeIndex: 0,
  detectedEnding: null,
  isCorrect,
  expectedEndings: [],
})

describe('resolveBattle', () => {
  it('精度が閾値以上なら win を返す', () => {
    const results = [makeResult(true), makeResult(true)]
    expect(resolveBattle(results)).toBe('win')
  })

  it('精度が閾値未満なら lose を返す', () => {
    const results = [makeResult(false), makeResult(false)]
    expect(resolveBattle(results)).toBe('lose')
  })

  it('閾値ちょうどなら win を返す', () => {
    const results = [makeResult(true), makeResult(true), makeResult(false)]
    expect(resolveBattle(results)).toBe('win')
  })

  it('結果が空なら lose を返す', () => {
    expect(resolveBattle([])).toBe('lose')
  })
})
