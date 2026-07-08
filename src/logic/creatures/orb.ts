import type { KanjiDNA } from '../../types/game'
import { creatureColors } from './palette'
import { f, nextClipId, wrapCreatureSvg, glossyEye, browPair } from './parts'

// 浮遊体。bodyVar: 0=まんまる玉 1=おばけ 2=ほのお / wingVar: 0=なし 1=コウモリ翼 2=ちび羽
export function generateOrb(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = creatureColors(hue)
  const hR10 = Math.round(hRatio * 10), cu10 = Math.round(curvature * 10), sy10 = Math.round(symmetry * 10)
  const bodyVar = (sc + sy10) % 3
  const wingVar = (hR10 + cu10) % 3
  const mouthVar = (sc + hR10) % 3
  const angry = symmetry <= 0.55
  const faceLeft = (sc + hR10 + Math.round(hue / 30)) % 2 === 0
  const tilt = (symmetry - 0.5) * 12
  const R = 15 + sc * 0.35
  const cx = 60, cy = 46
  const id = nextClipId('orb')
  const parts: string[] = []

  parts.push(`<ellipse cx="60" cy="94" rx="${f(R * 0.8)}" ry="3" fill="#000" opacity="0.2"/>`)
  // オーラ
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${f(R + 9)}" fill="none" stroke="${c.main}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4,3"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${f(R + 15)}" fill="none" stroke="${c.main}" stroke-width="1" opacity="0.15" stroke-dasharray="3,5"/>`)
  // きらめき
  for (const [sx, sy, ss] of [[cx - R - 13, cy - 8, 2.6], [cx + R + 11, cy + 6, 2.2], [cx + 6, cy - R - 13, 2]])
    parts.push(`<rect x="${f(sx - ss)}" y="${f(sy - ss)}" width="${f(ss * 2)}" height="${f(ss * 2)}" transform="rotate(45 ${f(sx)} ${f(sy)})" fill="${c.accent}" opacity="0.8"/>`)

  // 翼（本体の後ろ）
  if (wingVar === 1) {
    for (const sgn of [-1, 1]) {
      const bx0 = cx + sgn * (R - 2)
      parts.push(`<polygon points="${f(bx0)},${f(cy - 4)} ${f(bx0 + sgn * (R + 8))},${f(cy - R - 2)} ${f(bx0 + sgn * (R + 2))},${f(cy - 5)} ${f(bx0 + sgn * (R + 10))},${f(cy + 2)} ${f(bx0 + sgn * 4)},${f(cy + 6)}" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.8" stroke-linejoin="round"/>`)
    }
  } else if (wingVar === 2) {
    for (const sgn of [-1, 1])
      parts.push(`<ellipse cx="${f(cx + sgn * (R + 5))}" cy="${f(cy - 4)}" rx="7" ry="4" transform="rotate(${sgn * -28} ${f(cx + sgn * (R + 5))} ${f(cy - 4)})" fill="${c.belly}" stroke="${c.outline}" stroke-width="1.8"/>`)
  }

  // 本体シルエット
  let d: string | null
  if (bodyVar === 1) {
    // おばけ: ドーム＋ゆらゆらスカート
    const skirtY = cy + R * 1.05
    d = `M${f(cx - R)},${f(cy)} A${f(R)},${f(R)} 0 0 1 ${f(cx + R)},${f(cy)} L${f(cx + R * 0.92)},${f(skirtY - 4)} `
    const n = 4
    let px = cx + R * 0.92
    for (let i = 1; i <= n; i++) {
      const nx = cx + R * 0.92 - (2 * R * 0.92 * i) / n
      d += `Q${f((px + nx) / 2)},${f(skirtY + (i % 2 === 0 ? 6 : -3))} ${f(nx)},${f(skirtY - 4)} `
      px = nx
    }
    d += 'Z'
  } else if (bodyVar === 2) {
    // ほのお: しずく型＋先端の揺らぎ
    const lean = (curvature - 0.5) * 12
    d =
      `M${f(cx - R)},${f(cy + 4)} ` +
      `C${f(cx - R - 2)},${f(cy - 10)} ${f(cx - R * 0.5)},${f(cy - R * 0.6)} ${f(cx - R * 0.35)},${f(cy - R - 2)} ` +
      `C${f(cx - R * 0.2)},${f(cy - R - 8)} ${f(cx + lean - 2)},${f(cy - R - 12)} ${f(cx + lean)},${f(cy - R - 16)} ` +
      `C${f(cx + lean + 4)},${f(cy - R - 8)} ${f(cx + R * 0.4)},${f(cy - R - 4)} ${f(cx + R * 0.5)},${f(cy - R * 0.5)} ` +
      `C${f(cx + R * 0.9)},${f(cy - R * 0.2)} ${f(cx + R + 2)},${f(cy - 6)} ${f(cx + R)},${f(cy + 4)} ` +
      `A${f(R)},${f(R * 0.85)} 0 0 1 ${f(cx - R)},${f(cy + 4)} Z`
  } else {
    d = null // まんまる玉
  }

  if (d === null) {
    parts.push(`<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${f(R)}"/></clipPath></defs>`)
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${f(R)}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6"/>`)
  } else {
    parts.push(`<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>`)
    parts.push(`<path d="${d}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6" stroke-linejoin="round"/>`)
  }
  parts.push(`<rect x="0" y="${f(cy + R * 0.4)}" width="120" height="${f(R * 1.6)}" fill="${c.dark}" opacity="0.28" clip-path="url(#${id})"/>`)
  if (bodyVar === 2)
    parts.push(`<path d="M${f(cx - R * 0.45)},${f(cy + 6)} Q${f(cx - R * 0.45)},${f(cy - R * 0.5)} ${f(cx)},${f(cy - R * 0.95)} Q${f(cx + R * 0.45)},${f(cy - R * 0.5)} ${f(cx + R * 0.45)},${f(cy + 6)} Q${f(cx)},${f(cy + R * 0.6)} ${f(cx - R * 0.45)},${f(cy + 6)} Z" fill="${c.belly}" opacity="0.9"/>`)
  parts.push(`<ellipse cx="${f(cx - R * 0.4)}" cy="${f(cy - R * 0.42)}" rx="${f(R * 0.26)}" ry="${f(R * 0.12)}" transform="rotate(-30 ${f(cx - R * 0.4)} ${f(cy - R * 0.42)})" fill="white" opacity="0.45"/>`)

  // 顔
  const er = R * 0.22 + curvature * 1.2
  const ex = R * 0.36
  const ey = cy + (bodyVar === 1 ? -2 : 0)
  parts.push(glossyEye(cx - ex, ey, er, c))
  parts.push(glossyEye(cx + ex, ey, er, c))
  if (angry) parts.push(browPair(cx - ex, cx + ex, ey - er * 1.5, er * 0.95, c))
  const my = ey + er * 1.7
  if (mouthVar === 0) {
    const mw = ex * 0.8
    parts.push(`<path d="M${f(cx - mw)},${f(my)} Q${f(cx)},${f(my + mw * 0.8)} ${f(cx + mw)},${f(my)} Z" fill="${c.outline}"/>`)
    parts.push(`<polygon points="${f(cx - mw * 0.5)},${f(my + 0.5)} ${f(cx - mw * 0.25)},${f(my + 4.5)} ${f(cx)},${f(my + 0.5)}" fill="white"/>`)
  } else if (mouthVar === 1) {
    parts.push(`<path d="M${f(cx - ex * 0.7)},${f(my)} Q${f(cx)},${f(my + 4)} ${f(cx + ex * 0.7)},${f(my)}" fill="none" stroke="${c.outline}" stroke-width="2.2" stroke-linecap="round"/>`)
  } else {
    parts.push(`<ellipse cx="${f(cx)}" cy="${f(my + 1)}" rx="2.8" ry="3.4" fill="${c.outline}"/>`)
  }

  return wrapCreatureSvg(`<g transform="rotate(${f(tilt)} ${cx} ${cy})">${parts.join('')}</g>`, faceLeft)
}
