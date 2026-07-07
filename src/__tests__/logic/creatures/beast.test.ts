import { describe, it, expect } from 'vitest'
import { generateBeast } from '../../../logic/creatures/beast'
import { normalizeIds } from './testUtils'
import type { KanjiDNA } from '../../../types/game'

const base: KanjiDNA = { strokeCount: 5, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 30 }

describe('generateBeast', () => {
  it('有効な 120x120 SVG を返す', () => {
    const svg = generateBeast(base)
    expect(svg).toMatch(/^<svg width="120" height="120"/)
    expect(svg).toContain('</svg>')
  })

  it('同じ DNA から同じ SVG（id 正規化後）を返す', () => {
    expect(normalizeIds(generateBeast(base))).toBe(normalizeIds(generateBeast(base)))
  })

  it('向き反転が DNA で変わる', () => {
    // faceLeft = (sc + round(hR*10) + round(hue/30)) % 2 === 0
    const left = generateBeast({ ...base, strokeCount: 4 }) // 4+5+1=10 偶数 → 反転
    const right = generateBeast({ ...base, strokeCount: 5 }) // 11 奇数 → そのまま
    expect(left).toContain('scale(-1,1)')
    expect(right).not.toContain('scale(-1,1)')
  })

  it('スタンスが DNA で変わる（座りは胴体回転 rotate(-25 を含む）', () => {
    // stanceVar = (sc + round(cur*10) + round(sym*10)) % 3 → 1 で座り
    const sitting = generateBeast({ strokeCount: 5, hRatio: 0.5, curvature: 0.8, symmetry: 0.3, hue: 30 }) // 5+8+3=16 → 1
    // 3+4+8=15 → 0 = 直立（ブリーフ注意書きの修正版）
    const standing = generateBeast({ strokeCount: 3, hRatio: 0.5, curvature: 0.4, symmetry: 0.8, hue: 30 })
    expect(sitting).toContain('rotate(-25')
    expect(standing).not.toContain('rotate(-25')
  })

  it('curvature > 0.5 でたてがみが付く（polygon 数が増える）', () => {
    const plain = generateBeast({ ...base, curvature: 0.2 })
    const maned = generateBeast({ ...base, curvature: 0.8 })
    expect((maned.match(/<polygon/g) ?? []).length).toBeGreaterThan(
      (plain.match(/<polygon/g) ?? []).length,
    )
  })
})
