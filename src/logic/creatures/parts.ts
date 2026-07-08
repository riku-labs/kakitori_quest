// 全種族共通の描画パーツ（設計: docs/superpowers/specs/2026-07-07-creature-v2-design.md）
import type { CreaturePalette } from './palette'
import type { KanjiDNA } from '../../types/game'

export const CHEEK_COLOR = 'hsl(350,85%,72%)'

export const f = (n: number): string => n.toFixed(1)

/**
 * DNA から決定的に導出する clipPath 用 id。
 * 同一 DNA・同一種族なら常に同じ id になるため、generateCreature() の
 * 出力決定性（同じ入力→同じ SVG 文字列）を壊さない。
 */
export function dnaClipId(prefix: string, dna: KanjiDNA): string {
  return `${prefix}${dna.strokeCount}-${Math.round(dna.hRatio * 100)}-${Math.round(dna.curvature * 100)}-${Math.round(dna.symmetry * 100)}-${Math.round(dna.hue)}`
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
