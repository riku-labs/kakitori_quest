import { describe, it, expect } from 'vitest'
import { generateOrb } from '../../../logic/creatures/orb'
import { normalizeIds } from './testUtils'
import type { KanjiDNA } from '../../../types/game'

const base: KanjiDNA = { strokeCount: 5, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 200 }

describe('generateOrb', () => {
  it('有効な 120x120 SVG を返す', () => {
    const svg = generateOrb(base)
    expect(svg).toMatch(/^<svg width="120" height="120"/)
    expect(svg).toContain('</svg>')
  })

  it('同じ DNA から同じ SVG（id 正規化後）を返す', () => {
    expect(normalizeIds(generateOrb(base))).toBe(normalizeIds(generateOrb(base)))
  })

  it('オーラの破線円ときらめきを含む', () => {
    const svg = generateOrb(base)
    expect(svg).toContain('stroke-dasharray')
    expect(svg).toContain('rotate(45')
  })

  it('体シルエットが DNA で変わる（玉/おばけ/ほのお）', () => {
    // bodyVar = (sc + round(sym*10)) % 3
    const orb = generateOrb({ ...base, strokeCount: 4, symmetry: 0.8 }) // (4+8)%3=0 玉
    const ghost = generateOrb({ ...base, strokeCount: 5, symmetry: 0.8 }) // (5+8)%3=1 おばけ
    const flame = generateOrb({ ...base, strokeCount: 6, symmetry: 0.8 }) // (6+8)%3=2 ほのお
    expect(normalizeIds(orb)).not.toBe(normalizeIds(ghost))
    expect(normalizeIds(ghost)).not.toBe(normalizeIds(flame))
  })
})
