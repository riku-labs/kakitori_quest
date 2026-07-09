import { describe, it, expect } from 'vitest'
import { generateBiped } from '../../../logic/creatures/biped'
import { normalizeIds } from './testUtils'
import type { KanjiDNA } from '../../../types/game'

const base: KanjiDNA = { strokeCount: 5, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 260 }

describe('generateBiped', () => {
  it('有効な 120x120 SVG を返す', () => {
    const svg = generateBiped(base)
    expect(svg).toMatch(/^<svg width="120" height="120"/)
    expect(svg).toContain('</svg>')
  })

  it('同じ DNA から同じ SVG（id 正規化後）を返す', () => {
    expect(normalizeIds(generateBiped(base))).toBe(normalizeIds(generateBiped(base)))
  })

  it('symmetry <= 0.55 で怒り眉・> 0.55 でほっぺ', () => {
    expect(generateBiped({ ...base, symmetry: 0.8 })).toContain('hsl(350,85%,72%)')
    expect(generateBiped({ ...base, symmetry: 0.3 })).not.toContain('hsl(350,85%,72%)')
  })

  it('ツノ/毛・ポーズが DNA で変わる', () => {
    const a = generateBiped({ strokeCount: 3, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 260 })
    const b = generateBiped({ strokeCount: 4, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 260 })
    expect(normalizeIds(a)).not.toBe(normalizeIds(b))
  })
})
