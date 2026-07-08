import type { KanjiDNA } from '../../types/game'
import { creatureColors } from './palette'
import { f, glossyEye, browPair, dnaClipId, wrapCreatureSvg, CHEEK_COLOR } from './parts'

// 大頭身のこびと/ゴブリン。bodyVar: 0=ほっそり 1=洋ナシ 2=がっしり
export function generateBiped(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = creatureColors(hue)
  const hR10 = Math.round(hRatio * 10), cu10 = Math.round(curvature * 10), sy10 = Math.round(symmetry * 10)
  const hornVar = (sc + sy10) % 3 // 0=2本ヅノ 1=1本ヅノ 2=とんがり毛
  const poseVar = (sc + cu10 + sy10) % 3 // 0=両手下ろし 1=片手上げ 2=ファイティング
  const mouthVar = (sc + hR10) % 3
  const angry = symmetry <= 0.55
  const faceLeft = (sc + hR10 + Math.round(hue / 30)) % 2 === 0
  const bw = 14 + hRatio * 10
  const tw = bw * 0.62
  const r = 19 + sc * 0.3
  const hy = 35
  const id = dnaClipId('biped', dna)
  const parts: string[] = []

  parts.push(`<ellipse cx="60" cy="92" rx="${f(bw + 12)}" ry="5" fill="#000" opacity="0.3"/>`)

  // 腕（本体の後ろ・アウトライン二重ストローク）
  const arm = (d: string) => {
    parts.push(`<path d="${d}" fill="none" stroke="${c.outline}" stroke-width="8.5" stroke-linecap="round"/>`)
    parts.push(`<path d="${d}" fill="none" stroke="${c.main}" stroke-width="5.5" stroke-linecap="round"/>`)
  }
  const fist = (x: number, y: number) => parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="4.6" fill="${c.main}" stroke="${c.outline}" stroke-width="2"/>`)
  const downL = () => { arm(`M${f(60 - tw + 2)},54 C${f(60 - bw - 6)},58 ${f(60 - bw - 8)},66 ${f(60 - bw - 9)},72`); fist(60 - bw - 9, 73) }
  const downR = () => { arm(`M${f(60 + tw - 2)},54 C${f(60 + bw + 6)},58 ${f(60 + bw + 8)},66 ${f(60 + bw + 9)},72`); fist(60 + bw + 9, 73) }
  if (poseVar === 0) { downL(); downR() }
  else if (poseVar === 1) {
    arm(`M${f(60 - tw + 2)},54 C${f(60 - bw - 8)},50 ${f(60 - bw - 10)},42 ${f(60 - bw - 8)},36`); fist(60 - bw - 8, 35)
    downR()
  } else {
    arm(`M${f(60 - tw + 2)},56 C${f(60 - bw - 6)},56 ${f(60 - bw - 7)},52 ${f(60 - bw - 5)},49`); fist(60 - bw - 5, 47.5)
    arm(`M${f(60 + tw - 2)},56 C${f(60 + bw + 6)},56 ${f(60 + bw + 7)},52 ${f(60 + bw + 5)},49`); fist(60 + bw + 5, 47.5)
  }

  // 胴体（一筆・洋ナシ型）
  const d =
    `M${f(60 - tw)},50 ` +
    `C${f(60 - bw - 3)},58 ${f(60 - bw - 1)},72 ${f(60 - bw)},79 ` +
    `Q${f(60 - bw)},86 ${f(60 - bw + 7)},86 ` +
    `L${f(60 + bw - 7)},86 ` +
    `Q${f(60 + bw)},86 ${f(60 + bw)},79 ` +
    `C${f(60 + bw + 1)},72 ${f(60 + bw + 3)},58 ${f(60 + tw)},50 ` +
    `Q60,46 ${f(60 - tw)},50 Z`
  parts.push(`<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>`)
  parts.push(`<path d="${d}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6" stroke-linejoin="round"/>`)
  parts.push(`<ellipse cx="60" cy="72" rx="${f(bw * 0.72)}" ry="11" fill="${c.belly}" opacity="0.85" clip-path="url(#${id})"/>`)
  parts.push(`<rect x="0" y="77" width="120" height="12" fill="${c.dark}" opacity="0.28" clip-path="url(#${id})"/>`)

  // 足
  for (const sgn of [-1, 1])
    parts.push(`<ellipse cx="${f(60 + sgn * bw * 0.55)}" cy="88.5" rx="7.5" ry="4" fill="${c.main}" stroke="${c.outline}" stroke-width="2"/>`)

  // 耳（とがり耳・左右）
  parts.push(`<polygon points="${f(60 - r + 3)},${f(hy - 3)} ${f(60 - r - 8)},${f(hy - 1)} ${f(60 - r + 3)},${f(hy + 4)}" fill="${c.main}" stroke="${c.outline}" stroke-width="1.8" stroke-linejoin="round"/>`)
  parts.push(`<polygon points="${f(60 + r - 3)},${f(hy - 3)} ${f(60 + r + 8)},${f(hy - 1)} ${f(60 + r - 3)},${f(hy + 4)}" fill="${c.main}" stroke="${c.outline}" stroke-width="1.8" stroke-linejoin="round"/>`)

  // ツノ / 毛（頭の後ろ）
  if (hornVar === 0) {
    for (const sgn of [-1, 1])
      parts.push(`<polygon points="${f(60 + sgn * r * 0.55)},${f(hy - r * 0.75)} ${f(60 + sgn * r * 0.85)},${f(hy - r - 9)} ${f(60 + sgn * r * 0.2)},${f(hy - r * 0.92)}" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.6" stroke-linejoin="round"/>`)
  } else if (hornVar === 1) {
    parts.push(`<polygon points="${f(60 - 4.5)},${f(hy - r + 2)} 60,${f(hy - r - 11)} ${f(60 + 4.5)},${f(hy - r + 2)}" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.6" stroke-linejoin="round"/>`)
  } else {
    for (const [dx, h] of [[-r * 0.4, 6], [0, 9], [r * 0.4, 6]])
      parts.push(`<polygon points="${f(60 + dx - 4)},${f(hy - r + 3)} ${f(60 + dx + 1)},${f(hy - r - h)} ${f(60 + dx + 5)},${f(hy - r + 3)}" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.4" stroke-linejoin="round"/>`)
  }

  // 頭（大頭身）
  parts.push(`<circle cx="60" cy="${hy}" r="${f(r)}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6"/>`)
  parts.push(`<ellipse cx="${f(60 - r * 0.42)}" cy="${f(hy - r * 0.42)}" rx="${f(r * 0.3)}" ry="${f(r * 0.14)}" transform="rotate(-28 ${f(60 - r * 0.42)} ${f(hy - r * 0.42)})" fill="white" opacity="0.4"/>`)

  // 顔
  const er = r * 0.23
  const ex = r * 0.38
  parts.push(glossyEye(60 - ex, hy - 1, er, c))
  parts.push(glossyEye(60 + ex, hy - 1, er, c))
  if (angry) parts.push(browPair(60 - ex, 60 + ex, hy - 1 - er * 1.5, er * 0.95, c))
  const my = hy + r * 0.42
  if (mouthVar === 0) {
    const mw = r * 0.42
    parts.push(`<path d="M${f(60 - mw)},${f(my)} Q60,${f(my + mw * 0.8)} ${f(60 + mw)},${f(my)} Z" fill="${c.outline}"/>`)
    // 下アゴから上向きの牙（ゴブリン風）
    parts.push(`<polygon points="${f(60 - mw * 0.7)},${f(my + mw * 0.45)} ${f(60 - mw * 0.5)},${f(my - 2.5)} ${f(60 - mw * 0.3)},${f(my + mw * 0.5)}" fill="white"/>`)
    parts.push(`<polygon points="${f(60 + mw * 0.3)},${f(my + mw * 0.5)} ${f(60 + mw * 0.5)},${f(my - 2.5)} ${f(60 + mw * 0.7)},${f(my + mw * 0.45)}" fill="white"/>`)
  } else if (mouthVar === 1) {
    parts.push(`<path d="M${f(60 - r * 0.3)},${f(my)} Q60,${f(my + 4)} ${f(60 + r * 0.3)},${f(my)}" fill="none" stroke="${c.outline}" stroke-width="2.2" stroke-linecap="round"/>`)
  } else {
    parts.push(`<ellipse cx="60" cy="${f(my + 1)}" rx="3" ry="3.6" fill="${c.outline}"/>`)
  }
  if (!angry) {
    parts.push(`<ellipse cx="${f(60 - ex - er * 1.2)}" cy="${f(hy + er * 1.1)}" rx="${f(er * 0.7)}" ry="${f(er * 0.4)}" fill="${CHEEK_COLOR}" opacity="0.5"/>`)
    parts.push(`<ellipse cx="${f(60 + ex + er * 1.2)}" cy="${f(hy + er * 1.1)}" rx="${f(er * 0.7)}" ry="${f(er * 0.4)}" fill="${CHEEK_COLOR}" opacity="0.5"/>`)
  }

  return wrapCreatureSvg(parts.join(''), faceLeft)
}
