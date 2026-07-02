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

  it('期待種別あり: 検出種別との対比とやり方のヒントを返す', () => {
    const results = [makeResult(0, false, 'harai', ['tome'])]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：はらいではなく「とめ」！さいごはピタッととめよう',
    )
  })

  it('期待種別あり: はねが期待されるケース', () => {
    const results = [makeResult(0, false, 'tome', ['hane'])]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：とめではなく「はね」！さいごはシュッとはねよう',
    )
  })

  it('期待種別あり: はらいが期待されるケース', () => {
    const results = [makeResult(0, false, 'tome', ['harai'])]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：とめではなく「はらい」！さいごはスーッとはらおう',
    )
  })

  it('期待種別が複数ある場合は最初の1つを使う', () => {
    const results = [makeResult(0, false, 'hane', ['tome', 'harai'])]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：はねではなく「とめ」！さいごはピタッととめよう',
    )
  })

  it('期待種別なし（検出のみ）: 検出種別を伝える', () => {
    const results = [makeResult(0, true, 'tome'), makeResult(1, false, 'harai')]
    expect(buildStrokeFeedback(results)).toBe('2かくめ：はらいになっているよ')
  })

  it('検出種別が期待種別に含まれるのに不正解（はね）は方向ミスのメッセージを返す', () => {
    const results = [makeResult(0, false, 'hane', ['hane'])]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：はねるむきをたしかめよう')
  })

  it('検出種別が期待種別に含まれるのに不正解（はらい）は方向ミスのメッセージを返す', () => {
    const results = [makeResult(0, false, 'harai', ['harai'])]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：はらうむきをたしかめよう')
  })

  it('検出種別が期待種別に含まれるのに不正解（とめ）は汎用メッセージを返す', () => {
    const results = [makeResult(0, false, 'tome', ['tome'])]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：かきかたをたしかめよう')
  })

  it('検出不能（null）かつ期待種別あり: 期待種別とヒントを返す', () => {
    const results = [makeResult(0, false, null, ['tome'])]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：さいごは「とめ」！ピタッととめよう',
    )
  })

  it('検出不能（null）かつ期待種別なし: 汎用メッセージを返す', () => {
    const results = [makeResult(0, false, null)]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：かきかたをたしかめよう')
  })

  it('複数の不正解を改行で結合して返す', () => {
    const results = [
      makeResult(0, false, 'harai', ['tome']),
      makeResult(1, true, 'tome'),
      makeResult(2, false, 'hane', ['hane']),
    ]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：はらいではなく「とめ」！さいごはピタッととめよう\n' +
        '2かくめ：はねるむきをたしかめよう'.replace('2かくめ', '3かくめ'),
    )
  })

  it('不正解ならどのパターンでも必ず何らかのメッセージを返す（#14）', () => {
    const detecteds: (EndingType | null)[] = [null, 'tome', 'hane', 'harai']
    const expectedsList: EndingType[][] = [[], ['tome'], ['hane'], ['harai'], ['tome', 'hane']]
    for (const d of detecteds) {
      for (const e of expectedsList) {
        const feedback = buildStrokeFeedback([makeResult(0, false, d, e)])
        expect(feedback, `detected=${d} expected=${e.join(',')}`).not.toBeNull()
      }
    }
  })
})
