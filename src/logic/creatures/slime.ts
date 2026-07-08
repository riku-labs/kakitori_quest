import type { KanjiDNA } from '../../types/game'
import { creatureColors } from './palette'
import { f, glossyEye, browPair, dnaClipId, wrapCreatureSvg, CHEEK_COLOR } from './parts'

// 一筆の玉ねぎ型シルエット。bodyVar: 0=クラシック 1=とろけ(したたり) 2=とげ背
export function generateSlime(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = creatureColors(hue)
  const bodyVar = hRatio < 0.45 ? 0 : hRatio < 0.65 ? 1 : 2
  const eyeVar = symmetry > 0.55 ? 0 : 1 // 0=にこにこ 1=ちょい悪
  const mouthVar = (sc + Math.round(hRatio * 10)) % 3 // 0=にゃんこ口 1=にやり牙 2=お口ぽかん
  const cx = 60
  // 旧・底辺の波数に使っていた変数は「つぶれ具合」に転用（横に潰れる⇄縦に伸びる）
  const squish = ((sc % 3) - 1) * 0.1
  const W = (26 + hRatio * 10 + sc * 0.4) * (1 + squish)
  const H = ((bodyVar === 1 ? 48 : 58) + sc * 0.5) * (1 - squish * 0.8)
  const byy = 90
  const top = byy - H
  const curl = 0.25 + curvature * 0.75
  const id = dnaClipId('slime', dna)
  const parts: string[] = []

  parts.push(`<ellipse cx="${cx}" cy="${byy + 4}" rx="${f(W * 1.02)}" ry="${f(W * 0.16)}" fill="#000" opacity="0.3"/>`)

  // とげ背（本体の後ろから生やす）
  if (bodyVar === 2) {
    for (const [px, py, a] of [[-0.72, 0.42, -38], [-0.5, 0.2, -18], [0.55, 0.22, 20], [0.75, 0.45, 40]]) {
      const sx = cx + W * px, sy = top + H * py
      parts.push(`<g transform="rotate(${a} ${f(sx)} ${f(sy)})"><polygon points="${f(sx - 5)},${f(sy + 4)} ${f(sx)},${f(sy - 11)} ${f(sx + 5)},${f(sy + 4)}" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.6" stroke-linejoin="round"/></g>`)
    }
  }

  // 一筆シルエット（しずく型: 頂点はカールさせず柔らかく尖らせる）
  const tipLean = (curl - 0.5) * 10 // curvature で先端の傾き
  const tipX = cx + tipLean
  const tipY = top - 4 - curl * 4 // curvature で先端の高さ
  let d = `M${f(cx - W)},${f(byy - 6)} `
  d += `C${f(cx - W - 3)},${f(byy - 30)} ${f(cx - W * 0.6)},${f(top + H * 0.3)} ${f(tipX - W * 0.16)},${f(top + 5)} `
  d += `C${f(tipX - W * 0.05)},${f(tipY + 2)} ${f(tipX)},${f(tipY)} ${f(tipX + W * 0.06)},${f(tipY + 3)} `
  d += `C${f(tipX + W * 0.18)},${f(top + 6)} ${f(cx + W + 3)},${f(byy - 31)} ${f(cx + W)},${f(byy - 6)} `
  // 底辺はフラット（角丸で接地）
  d += `Q${f(cx + W)},${f(byy)} ${f(cx + W - 7)},${f(byy)} `
  d += `L${f(cx - W + 7)},${f(byy)} `
  d += `Q${f(cx - W)},${f(byy)} ${f(cx - W)},${f(byy - 6)} Z`

  parts.push(`<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>`)
  parts.push(`<path d="${d}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6" stroke-linejoin="round"/>`)
  // 陰影: 下部の暗いバンド＋おなかの明るみ＋頭のツヤ
  parts.push(`<rect x="0" y="${f(byy - H * 0.26)}" width="120" height="${f(H * 0.26 + 10)}" fill="${c.dark}" opacity="0.35" clip-path="url(#${id})"/>`)
  parts.push(`<ellipse cx="${f(cx)}" cy="${f(byy - H * 0.3)}" rx="${f(W * 0.55)}" ry="${f(H * 0.22)}" fill="${c.belly}" opacity="0.55" clip-path="url(#${id})"/>`)
  parts.push(`<ellipse cx="${f(cx - W * 0.42)}" cy="${f(top + H * 0.24)}" rx="${f(W * 0.24)}" ry="${f(H * 0.1)}" transform="rotate(-28 ${f(cx - W * 0.42)} ${f(top + H * 0.24)})" fill="white" opacity="0.45" clip-path="url(#${id})"/>`)

  // とろけ: 接地面から左右にあふれる水たまり
  if (bodyVar === 1) {
    parts.push(`<ellipse cx="${f(cx - W - 4)}" cy="${f(byy - 2.6)}" rx="7" ry="3" fill="${c.main}" stroke="${c.outline}" stroke-width="1.6"/>`)
    parts.push(`<ellipse cx="${f(cx + W + 5)}" cy="${f(byy - 2.4)}" rx="5.5" ry="2.6" fill="${c.main}" stroke="${c.outline}" stroke-width="1.6"/>`)
    // 頭からのしずく
    const x = cx - W * 0.3, y = top + H * 0.12
    parts.push(`<path d="M${f(x)},${f(y)} C${f(x - 3)},${f(y + 4)} ${f(x - 2.8)},${f(y + 8)} ${f(x)},${f(y + 9.5)} C${f(x + 2.8)},${f(y + 8)} ${f(x + 3)},${f(y + 4)} ${f(x)},${f(y)}" fill="${c.main}" stroke="${c.outline}" stroke-width="1.4"/>`)
  }

  // 顔
  const eyeR = H * 0.115 + curvature * 1.5
  const eyeY = top + H * 0.4
  const eyeX = W * 0.34
  parts.push(glossyEye(cx - eyeX, eyeY, eyeR, c))
  parts.push(glossyEye(cx + eyeX, eyeY, eyeR, c))
  if (eyeVar === 1) parts.push(browPair(cx - eyeX, cx + eyeX, eyeY - eyeR * 1.5, eyeR * 0.95, c))

  const my = eyeY + eyeR * 1.7
  if (mouthVar === 0) {
    const mw = eyeX * 0.75
    parts.push(`<path d="M${f(cx - mw)},${f(my)} Q${f(cx - mw / 2)},${f(my + 4.5)} ${f(cx)},${f(my)} Q${f(cx + mw / 2)},${f(my + 4.5)} ${f(cx + mw)},${f(my)}" fill="none" stroke="${c.outline}" stroke-width="2.2" stroke-linecap="round"/>`)
  } else if (mouthVar === 1) {
    const mw = eyeX * 0.95
    parts.push(`<path d="M${f(cx - mw)},${f(my)} Q${f(cx)},${f(my + mw * 0.75)} ${f(cx + mw)},${f(my)} Z" fill="${c.outline}"/>`)
    parts.push(`<polygon points="${f(cx - mw * 0.55)},${f(my + 0.5)} ${f(cx - mw * 0.3)},${f(my + 5)} ${f(cx - mw * 0.05)},${f(my + 0.5)}" fill="white"/>`)
    parts.push(`<polygon points="${f(cx + mw * 0.05)},${f(my + 0.5)} ${f(cx + mw * 0.3)},${f(my + 5)} ${f(cx + mw * 0.55)},${f(my + 0.5)}" fill="white"/>`)
  } else {
    parts.push(`<ellipse cx="${f(cx)}" cy="${f(my + 1)}" rx="3" ry="3.6" fill="${c.outline}"/>`)
  }
  // ほっぺ（にこにこ目のときだけ）
  if (eyeVar === 0) {
    parts.push(`<ellipse cx="${f(cx - eyeX - eyeR * 1.15)}" cy="${f(eyeY + eyeR * 1.1)}" rx="${f(eyeR * 0.7)}" ry="${f(eyeR * 0.42)}" fill="${CHEEK_COLOR}" opacity="0.5"/>`)
    parts.push(`<ellipse cx="${f(cx + eyeX + eyeR * 1.15)}" cy="${f(eyeY + eyeR * 1.1)}" rx="${f(eyeR * 0.7)}" ry="${f(eyeR * 0.42)}" fill="${CHEEK_COLOR}" opacity="0.5"/>`)
  }
  return wrapCreatureSvg(parts.join(''), false)
}
