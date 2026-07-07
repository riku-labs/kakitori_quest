import { describe, it, expect } from 'vitest'
import { generateSlime } from '../../../logic/creatures/slime'
import { normalizeIds } from './testUtils'
import type { KanjiDNA } from '../../../types/game'

const base: KanjiDNA = { strokeCount: 5, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 120 }

describe('generateSlime', () => {
  it('有効な 120x120 SVG を返す', () => {
    const svg = generateSlime(base)
    expect(svg).toMatch(/^<svg width="120" height="120"/)
    expect(svg).toContain('</svg>')
  })

  it('同じ DNA から同じ SVG（id 正規化後）を返す', () => {
    expect(normalizeIds(generateSlime(base))).toBe(normalizeIds(generateSlime(base)))
  })

  it('symmetry > 0.55 でほっぺ（にこにこ）、以下で怒り眉', () => {
    const cute = generateSlime({ ...base, symmetry: 0.8 })
    const angry = generateSlime({ ...base, symmetry: 0.3 })
    expect(cute).toContain('hsl(350,85%,72%)')
    expect(angry).not.toContain('hsl(350,85%,72%)')
  })

  it('hRatio で体型が変わる（とろけ型は水たまり用 ellipse が増える）', () => {
    const classic = generateSlime({ ...base, hRatio: 0.3 })
    const melty = generateSlime({ ...base, hRatio: 0.5 })
    expect(normalizeIds(classic)).not.toBe(normalizeIds(melty))
  })

  it('底面はフラット（波打ちの Q 連打がない）: 底辺に L コマンドを含む', () => {
    // 注: byy=90 は f()=toFixed(1) で "90.0" と描画される（ブリーフ規約の逐語仕様）ため
    // "90 " ではなく "90.0 " に一致させる。詳細は task-2-report.md 参照。
    expect(generateSlime(base)).toMatch(/L[\d.]+,90\.0 /)
  })
})
