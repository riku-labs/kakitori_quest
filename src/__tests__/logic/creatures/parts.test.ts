import { describe, it, expect } from 'vitest'
import { creatureColors } from '../../../logic/creatures/palette'
import { f, glossyEye, browPair, nextClipId, wrapCreatureSvg } from '../../../logic/creatures/parts'

describe('creatureColors', () => {
  it('hue から5色のパレットを返す', () => {
    const c = creatureColors(120)
    expect(c.main).toBe('hsl(120,68%,55%)')
    expect(c.belly).toBe('hsl(120,60%,76%)')
    expect(c.dark).toBe('hsl(120,60%,36%)')
    expect(c.outline).toBe('hsl(120,55%,15%)')
    expect(c.accent).toBe('hsl(300,75%,60%)')
  })
})

describe('parts ヘルパー', () => {
  it('f は小数1桁に丸める', () => {
    expect(f(1.2345)).toBe('1.2')
  })

  it('glossyEye は白目・瞳・ハイライト2つを含む', () => {
    const c = creatureColors(0)
    const eye = glossyEye(50, 40, 5, c)
    expect(eye).toContain('fill="white"')
    expect(eye).toContain(c.outline)
    expect((eye.match(/<circle/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('browPair は内側が下がる2本の線を返す', () => {
    const c = creatureColors(0)
    expect((browPair(40, 70, 30, 5, c).match(/<line/g) ?? []).length).toBe(2)
  })

  it('nextClipId は呼ぶたびに異なる id を返す', () => {
    expect(nextClipId('s')).not.toBe(nextClipId('s'))
  })

  it('wrapCreatureSvg は 120x120 の svg で包み、mirror 指定で反転 g を挟む', () => {
    const plain = wrapCreatureSvg('<circle/>', false)
    expect(plain).toMatch(/^<svg width="120" height="120" viewBox="0 0 120 120">/)
    expect(plain).not.toContain('scale(-1,1)')
    expect(wrapCreatureSvg('<circle/>', true)).toContain('translate(120,0) scale(-1,1)')
  })
})
