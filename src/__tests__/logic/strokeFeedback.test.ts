import { describe, it, expect } from 'vitest'
import { buildStrokeFeedback } from '../../logic/strokeFeedback'
import type { StrokeEndingResult, EndingType } from '../../types/game'

const makeResult = (
  strokeIndex: number,
  isCorrect: boolean,
  detectedEnding: StrokeEndingResult['detectedEnding'] = null,
  expectedEndings: EndingType[] = [],
): StrokeEndingResult => ({ strokeIndex, isCorrect, detectedEnding, expectedEndings })

describe('buildStrokeFeedback', () => {
  it('全画正解なら null を返す', () => {
    const results = [makeResult(0, true, 'tome'), makeResult(1, true, 'harai')]
    expect(buildStrokeFeedback(results)).toBeNull()
  })

  it('不正解がなければ null を返す', () => {
    expect(buildStrokeFeedback([])).toBeNull()
  })

  it('1画不正解（tome 検出）のメッセージを返す', () => {
    const results = [makeResult(0, true, 'tome'), makeResult(1, false, 'tome')]
    expect(buildStrokeFeedback(results)).toBe('2かくめ：とめになっています')
  })

  it('harai 検出のメッセージを返す', () => {
    const results = [makeResult(0, false, 'harai')]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：はらいになっています')
  })

  it('hane 検出のメッセージを返す', () => {
    const results = [makeResult(0, false, 'hane')]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：はねになっています')
  })

  it('複数の不正解を改行で結合して返す', () => {
    const results = [
      makeResult(0, false, 'tome'),
      makeResult(1, true, 'harai'),
      makeResult(2, false, 'hane'),
    ]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：とめになっています\n3かくめ：はねになっています',
    )
  })

  it('detectedEnding が null の不正解は無視する', () => {
    const results = [makeResult(0, false, null), makeResult(1, false, 'tome')]
    expect(buildStrokeFeedback(results)).toBe('2かくめ：とめになっています')
  })
})
