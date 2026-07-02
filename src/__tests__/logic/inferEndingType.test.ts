// kakitori の velocityProfile と検出種別の対応はライブラリ実装で
// tome→decelerating / hane→accelerating / harai→それ以外(constant) と定義されている。
// 参照: @k1low/kakitori StrokeEndingChecker
import { describe, it, expect } from 'vitest'
import { inferEndingType } from '../../logic/inferEndingType'

describe('inferEndingType', () => {
  it('decelerating は tome', () => {
    expect(inferEndingType('decelerating')).toBe('tome')
  })

  it('accelerating は hane', () => {
    expect(inferEndingType('accelerating')).toBe('hane')
  })

  it('constant は harai', () => {
    expect(inferEndingType('constant')).toBe('harai')
  })

  it('undefined は null', () => {
    expect(inferEndingType(undefined)).toBeNull()
  })

  it('未知の値は null', () => {
    expect(inferEndingType('unknown')).toBeNull()
  })
})
