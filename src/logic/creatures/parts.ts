// 全種族共通の描画パーツ（設計: docs/superpowers/specs/2026-07-07-creature-v2-design.md）
import type { CreaturePalette } from './palette'

export const CHEEK_COLOR = 'hsl(350,85%,72%)'

export const f = (n: number): string => n.toFixed(1)

let uid = 0
/** clipPath 用の一意 id。id は毎回変わるため決定性比較時は正規化すること */
export function nextClipId(prefix: string): string {
  return `${prefix}${uid++}`
}

export function wrapCreatureSvg(inner: string, mirror: boolean): string {
  const content = mirror
    ? `<g transform="translate(120,0) scale(-1,1)">${inner}</g>`
    : inner
  return `<svg width="120" height="120" viewBox="0 0 120 120">${content}</svg>`
}

// 大きくつややかな目（かわいらしさの核）
export function glossyEye(ex: number, ey: number, r: number, c: CreaturePalette): string {
  const out: string[] = []
  out.push(`<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(r * 0.85)}" ry="${f(r)}" fill="white" stroke="${c.outline}" stroke-width="1.6"/>`)
  out.push(`<circle cx="${f(ex)}" cy="${f(ey + r * 0.18)}" r="${f(r * 0.5)}" fill="${c.outline}"/>`)
  out.push(`<circle cx="${f(ex + r * 0.2)}" cy="${f(ey - r * 0.05)}" r="${f(r * 0.19)}" fill="white"/>`)
  out.push(`<circle cx="${f(ex - r * 0.14)}" cy="${f(ey + r * 0.36)}" r="${f(r * 0.09)}" fill="white" opacity="0.9"/>`)
  return out.join('')
}

// 内側が下がる怒り眉（left: 右下がり / right: 左下がり）
export function browPair(lx: number, rx: number, y: number, w: number, c: CreaturePalette): string {
  return (
    `<line x1="${f(lx - w)}" y1="${f(y - w * 0.5)}" x2="${f(lx + w)}" y2="${f(y + w * 0.4)}" stroke="${c.outline}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<line x1="${f(rx - w)}" y1="${f(y + w * 0.4)}" x2="${f(rx + w)}" y2="${f(y - w * 0.5)}" stroke="${c.outline}" stroke-width="2.6" stroke-linecap="round"/>`
  )
}
