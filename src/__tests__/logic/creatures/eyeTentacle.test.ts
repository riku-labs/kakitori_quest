import { describe, it, expect } from 'vitest'
import { generateEyeTentacle } from '../../../logic/creatures/eyeTentacle'
import { normalizeIds } from './testUtils'
import type { KanjiDNA } from '../../../types/game'

const base: KanjiDNA = { strokeCount: 5, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 0 }

describe('generateEyeTentacle', () => {
  it('有効な 120x120 SVG を返す', () => {
    const svg = generateEyeTentacle(base)
    expect(svg).toMatch(/^<svg width="120" height="120"/)
    expect(svg).toContain('</svg>')
  })

  it('同じ DNA から同じ SVG（id 正規化後）を返す', () => {
    expect(normalizeIds(generateEyeTentacle(base))).toBe(normalizeIds(generateEyeTentacle(base)))
  })

  it('symmetry > 0.55 でまる瞳（circle 瞳）・以下で縦スリット（ellipse 瞳）', () => {
    const round = generateEyeTentacle({ ...base, symmetry: 0.8 })
    const slit = generateEyeTentacle({ ...base, symmetry: 0.3 })
    expect(normalizeIds(round)).not.toBe(normalizeIds(slit))
  })

  it('触手の本数が strokeCount で変わる（4 + sc % 4 本）', () => {
    // 触手は先細り塗りパス（Z で閉じる path）。本数差が path 数に表れる
    const four = generateEyeTentacle({ ...base, strokeCount: 4 }) // 4本
    const seven = generateEyeTentacle({ ...base, strokeCount: 7 }) // 7本
    expect((seven.match(/<path/g) ?? []).length).toBe((four.match(/<path/g) ?? []).length + 3)
  })
})
