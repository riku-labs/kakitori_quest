import type { KanjiDNA } from '../../types/game'
import { creatureColors } from './palette'
import { f, nextClipId, wrapCreatureSvg } from './parts'

// 浮遊する一つ目。pupilVar: 0=まる瞳 1=縦スリット / lidVar: 0=ぱっちり 1=怒りまぶた 2=にっこり半目
export function generateEyeTentacle(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = creatureColors(hue)
  const hR10 = Math.round(hRatio * 10)
  const pupilVar = symmetry > 0.55 ? 0 : 1
  const lidVar = (sc + hR10) % 3
  const tentCount = 4 + (sc % 4)
  const R = 16 + sc * 0.4
  const cx = 60, cy = 50 + (curvature - 0.5) * 5 // 浮遊高さも DNA で揺らす
  const id = nextClipId('eye')
  const parts: string[] = []

  parts.push(`<ellipse cx="60" cy="95" rx="${f(R * 0.9)}" ry="3.5" fill="#000" opacity="0.22"/>`)

  // 触手（先細りの塗りパス・先端が curvature でカール）
  const tentLen = 13 + sc * 0.7
  for (let i = 0; i < tentCount; i++) {
    const a = (i / tentCount) * Math.PI * 2 + Math.PI / tentCount - Math.PI / 2
    const dx = Math.cos(a), dy = Math.sin(a)
    const px = -dy, py = dx
    const bxp = cx + dx * (R - 2), byp = cy + dy * (R - 2)
    const curlAmt = (curvature - 0.3) * tentLen * 0.7 * (i % 2 === 0 ? 1 : -1)
    const exp = cx + dx * (R + tentLen) + px * curlAmt
    const eyp = cy + dy * (R + tentLen) + py * curlAmt
    const cxp = cx + dx * (R + tentLen * 0.55) + px * curlAmt * 0.25
    const cyp = cy + dy * (R + tentLen * 0.55) + py * curlAmt * 0.25
    const w = 3.4
    parts.push(`<path d="M${f(bxp - px * w)},${f(byp - py * w)} Q${f(cxp - px * w * 0.5)},${f(cyp - py * w * 0.5)} ${f(exp)},${f(eyp)} Q${f(cxp + px * w * 0.5)},${f(cyp + py * w * 0.5)} ${f(bxp + px * w)},${f(byp + py * w)} Z" fill="${c.main}" stroke="${c.outline}" stroke-width="1.6" stroke-linejoin="round"/>`)
  }

  // 本体
  parts.push(`<defs><clipPath id="${id}"><circle cx="${cx}" cy="${f(cy)}" r="${f(R)}"/></clipPath></defs>`)
  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(R)}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6"/>`)
  parts.push(`<rect x="0" y="${f(cy + R * 0.45)}" width="120" height="${f(R)}" fill="${c.dark}" opacity="0.3" clip-path="url(#${id})"/>`)
  parts.push(`<ellipse cx="${f(cx - R * 0.42)}" cy="${f(cy - R * 0.45)}" rx="${f(R * 0.26)}" ry="${f(R * 0.12)}" transform="rotate(-30 ${f(cx - R * 0.42)} ${f(cy - R * 0.45)})" fill="white" opacity="0.4"/>`)

  // まつ毛（symmetry 高で追加）
  if (symmetry > 0.6) {
    for (const [dx2, len] of [[-0.45, 5], [0, 6.5], [0.45, 5]]) {
      const lx = cx + R * 0.72 * dx2
      parts.push(`<line x1="${f(lx)}" y1="${f(cy - R * 0.72)}" x2="${f(lx + dx2 * 4)}" y2="${f(cy - R * 0.72 - len)}" stroke="${c.outline}" stroke-width="2" stroke-linecap="round"/>`)
    }
  }

  // 巨大な目（視線も DNA で動かす）
  const eR = R * 0.7
  const gx = (hRatio - 0.5) * eR * 0.5
  const gy = (curvature - 0.5) * eR * 0.35
  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(eR)}" fill="white" stroke="${c.outline}" stroke-width="2"/>`)
  parts.push(`<circle cx="${f(cx + gx)}" cy="${f(cy + gy)}" r="${f(eR * 0.6)}" fill="${c.dark}"/>`)
  if (pupilVar === 0) {
    parts.push(`<circle cx="${f(cx + gx)}" cy="${f(cy + gy)}" r="${f(eR * 0.3)}" fill="#000"/>`)
  } else {
    parts.push(`<ellipse cx="${f(cx + gx)}" cy="${f(cy + gy)}" rx="${f(eR * 0.13)}" ry="${f(eR * 0.44)}" fill="#000"/>`)
  }
  parts.push(`<circle cx="${f(cx + gx + eR * 0.22)}" cy="${f(cy + gy - eR * 0.2)}" r="${f(eR * 0.13)}" fill="white"/>`)
  parts.push(`<circle cx="${f(cx + gx - eR * 0.14)}" cy="${f(cy + gy + eR * 0.24)}" r="${f(eR * 0.06)}" fill="white" opacity="0.9"/>`)

  // まぶた
  if (lidVar === 1) {
    parts.push(`<path d="M${f(cx - eR)},${f(cy - eR * 0.25)} A${f(eR)},${f(eR)} 0 0 1 ${f(cx + eR)},${f(cy - eR * 0.25)} L${f(cx + eR)},${f(cy - eR * 1.1)} L${f(cx - eR)},${f(cy - eR * 1.1)} Z" fill="${c.main}" stroke="${c.outline}" stroke-width="1.8"/>`)
  } else if (lidVar === 2) {
    parts.push(`<path d="M${f(cx - eR)},${f(cy + eR * 0.35)} A${f(eR)},${f(eR)} 0 0 0 ${f(cx + eR)},${f(cy + eR * 0.35)} L${f(cx + eR)},${f(cy + eR * 1.1)} L${f(cx - eR)},${f(cy + eR * 1.1)} Z" fill="${c.main}" stroke="${c.outline}" stroke-width="1.8"/>`)
  }
  return wrapCreatureSvg(parts.join(''), false)
}
