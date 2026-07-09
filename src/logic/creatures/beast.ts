import type { KanjiDNA } from '../../types/game'
import { creatureColors } from './palette'
import { f, glossyEye, dnaClipId, wrapCreatureSvg } from './parts'

// 頭身の大きい獣シルエット。earVar: 0=とがり耳 1=ツノ 2=まる耳 / mane / tailVar: 0=ふさ尻尾 1=とげ尻尾
export function generateBeast(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = creatureColors(hue)
  const earVar = (sc + Math.round(symmetry * 10)) % 3
  const mane = curvature > 0.5
  const tailVar = symmetry > 0.5 ? 0 : 1
  // DNA で向き・首の傾き・スタンスを変えてポーズ差を出す
  const faceLeft = (sc + Math.round(hRatio * 10) + Math.round(hue / 30)) % 2 === 0
  const headTilt = (symmetry - 0.5) * 14
  const stanceVar = (sc + Math.round(curvature * 10) + Math.round(symmetry * 10)) % 3 // 0=直立 1=座り 2=駆け出し
  const headR = 14 + sc * 0.28
  const hx = 78, hy = 42
  const id = dnaClipId('beast', dna)
  const parts: string[] = []

  parts.push(`<ellipse cx="56" cy="92" rx="38" ry="6" fill="#000" opacity="0.3"/>`)

  // 尻尾（体の後ろ）。座りポーズではお尻の位置に合わせて下げる
  const tailStartIdx = parts.length
  if (tailVar === 0) {
    parts.push(`<path d="M32,58 C22,54 16,46 18,34" fill="none" stroke="${c.main}" stroke-width="7" stroke-linecap="round"/>`)
    parts.push(`<path d="M32,58 C22,54 16,46 18,34" fill="none" stroke="${c.outline}" stroke-width="9.5" stroke-linecap="round" opacity="0.9" style="paint-order:stroke"/>`)
    parts.push(`<path d="M32,58 C22,54 16,46 18,34" fill="none" stroke="${c.main}" stroke-width="7" stroke-linecap="round"/>`)
    parts.push(`<path d="M18,38 C12,32 12,26 17,20 C22,25 23,31 21,36 Z" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.8" stroke-linejoin="round"/>`)
  } else {
    parts.push(`<path d="M33,60 C24,56 18,50 16,40" fill="none" stroke="${c.main}" stroke-width="6" stroke-linecap="round"/>`)
    parts.push(`<polygon points="19,43 10,32 22,35" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.6" stroke-linejoin="round"/>`)
  }
  if (stanceVar === 1) {
    const tailSvg = `<g transform="translate(4,17) rotate(10 30 60)">${parts.slice(tailStartIdx).join('')}</g>`
    parts.length = tailStartIdx
    parts.push(tailSvg)
  }

  // 脚: DNA でスタンスを変えてポーズ差を出す
  // { x, dx: 足先の前後オフセット, dy: 持ち上げ量 }
  let farLegs, nearLegs
  if (stanceVar === 1) {
    // 座り: 前脚のみ直立。後脚は畳んだもも（本体の後で描く）
    farLegs = [{ x: 66, dx: 2, dy: 0 }]
    nearLegs = [{ x: 62, dx: 3, dy: 0 }]
  } else if (stanceVar === 2) {
    // 駆け出し: 前後に大きく開く
    farLegs = [{ x: 42, dx: -8, dy: 0 }, { x: 66, dx: 8, dy: 0 }]
    nearLegs = [{ x: 38, dx: -14, dy: 0 }, { x: 62, dx: 14, dy: 0 }]
  } else {
    farLegs = [{ x: 42, dx: 0, dy: 0 }, { x: 66, dx: 0, dy: 0 }]
    nearLegs = [{ x: 38, dx: 0, dy: 0 }, { x: 62, dx: 0, dy: 0 }]
  }
  const legShape = (x: number, topY: number, dx: number, dy: number, fill: string, sw: number) => {
    const bx = x + dx, byl = 88 + dy
    return `<path d="M${x - 5},${topY} L${f(bx - 6)},${f(byl - 3)} Q${f(bx - 6)},${f(byl)} ${f(bx - 2)},${f(byl)} L${f(bx + 4)},${f(byl)} Q${f(bx + 7)},${f(byl)} ${f(bx + 6)},${f(byl - 3)} L${x + 5},${topY} Z" fill="${fill}" stroke="${c.outline}" stroke-width="${sw}" stroke-linejoin="round"/>`
  }
  for (const l of farLegs) parts.push(legShape(l.x, 64, l.dx, l.dy - 1, c.dark, 1.8))

  // 胴体（一筆）
  const bodyLen = 6 + hRatio * 6
  const d =
    `M${f(34 - bodyLen * 0.4)},56 ` +
    `C${f(31 - bodyLen * 0.4)},44 ${f(42 - bodyLen * 0.3)},37 ${f(54)},37 ` +
    `C64,35 72,38 76,44 ` +
    `L76,62 C70,72 54,75 ${f(44 - bodyLen * 0.2)},73 ` +
    `C${f(34 - bodyLen * 0.4)},70 ${f(32 - bodyLen * 0.5)},63 ${f(34 - bodyLen * 0.4)},56 Z`
  const bodyStartIdx = parts.length
  parts.push(`<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>`)
  parts.push(`<path d="${d}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6" stroke-linejoin="round"/>`)
  parts.push(`<ellipse cx="52" cy="72" rx="17" ry="9" fill="${c.belly}" opacity="0.85" clip-path="url(#${id})"/>`)
  parts.push(`<rect x="0" y="62" width="120" height="30" fill="${c.dark}" opacity="0.25" clip-path="url(#${id})"/>`)
  if (stanceVar === 1) {
    // 座り: 胴体を後ろに傾けてお尻を接地させ、畳んだ後脚（もも＋前向きの足先）を重ねる
    const bodySvg = `<g transform="rotate(-25 72 64)">${parts.slice(bodyStartIdx).join('')}</g>`
    parts.length = bodyStartIdx
    parts.push(bodySvg)
    parts.push(`<ellipse cx="44" cy="76" rx="12.5" ry="10.5" fill="${c.main}" stroke="${c.outline}" stroke-width="2.4"/>`)
    parts.push(`<path d="M35,88 Q33,88 33,85.5 Q33,83 37,83 L50,83 Q54,83 54,85.5 Q54,88 50,88 Z" fill="${c.main}" stroke="${c.outline}" stroke-width="2" stroke-linejoin="round"/>`)
    parts.push(`<line x1="47" y1="88" x2="47" y2="84" stroke="${c.outline}" stroke-width="1.6"/>`)
  }

  // 近い側の脚
  for (const l of nearLegs) {
    parts.push(legShape(l.x, 62, l.dx, l.dy, c.main, 2))
    parts.push(`<line x1="${f(l.x + l.dx)}" y1="${f(88 + l.dy)}" x2="${f(l.x + l.dx)}" y2="${f(84.5 + l.dy)}" stroke="${c.outline}" stroke-width="1.6"/>`)
  }

  // ここから先（たてがみ・耳・頭・顔）は最後にまとめて headTilt で傾ける
  const headStartIdx = parts.length

  // たてがみ（頭の後ろ）
  if (mane) {
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.62 + i * 0.15)
      const sx = hx + Math.cos(a) * headR * 0.9
      const sy = hy + Math.sin(a) * headR * 0.9
      const tx = hx + Math.cos(a) * (headR + 9)
      const ty = hy + Math.sin(a) * (headR + 9)
      const wv = 5
      parts.push(`<polygon points="${f(sx + Math.sin(a) * wv)},${f(sy - Math.cos(a) * wv)} ${f(tx)},${f(ty)} ${f(sx - Math.sin(a) * wv)},${f(sy + Math.cos(a) * wv)}" fill="${c.dark}" stroke="${c.outline}" stroke-width="1.6" stroke-linejoin="round"/>`)
    }
  }

  // 耳 / ツノ
  if (earVar === 0) {
    parts.push(`<polygon points="66,32 60,16 75,26" fill="${c.main}" stroke="${c.outline}" stroke-width="2" stroke-linejoin="round"/>`)
    parts.push(`<polygon points="84,25 90,12 95,28" fill="${c.main}" stroke="${c.outline}" stroke-width="2" stroke-linejoin="round"/>`)
    parts.push(`<polygon points="86.5,24 90,16.5 92.5,25" fill="${c.belly}"/>`)
  } else if (earVar === 1) {
    parts.push(`<path d="M68,31 C63,24 63,17 69,11" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linecap="round"/>`)
    parts.push(`<path d="M88,27 C93,21 95,14 91,7" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linecap="round"/>`)
  } else {
    parts.push(`<circle cx="68" cy="27" r="7" fill="${c.main}" stroke="${c.outline}" stroke-width="2"/>`)
    parts.push(`<circle cx="68" cy="27" r="3.2" fill="${c.belly}"/>`)
    parts.push(`<circle cx="90" cy="24" r="7" fill="${c.main}" stroke="${c.outline}" stroke-width="2"/>`)
    parts.push(`<circle cx="90" cy="24" r="3.2" fill="${c.belly}"/>`)
  }

  // 頭（大きめ頭身）
  parts.push(`<circle cx="${hx}" cy="${hy}" r="${f(headR)}" fill="${c.main}" stroke="${c.outline}" stroke-width="2.6"/>`)
  // マズル
  parts.push(`<rect x="${f(hx + headR * 0.35)}" y="${f(hy + 1)}" width="${f(headR * 0.95)}" height="${f(headR * 0.7)}" rx="${f(headR * 0.3)}" fill="${c.belly}" stroke="${c.outline}" stroke-width="2"/>`)
  parts.push(`<circle cx="${f(hx + headR * 1.16)}" cy="${f(hy + headR * 0.22)}" r="2.4" fill="${c.outline}"/>`)
  parts.push(`<line x1="${f(hx + headR * 0.5)}" y1="${f(hy + headR * 0.58)}" x2="${f(hx + headR * 1.05)}" y2="${f(hy + headR * 0.58)}" stroke="${c.outline}" stroke-width="1.8" stroke-linecap="round"/>`)
  // 牙
  parts.push(`<polygon points="${f(hx + headR * 0.6)},${f(hy + headR * 0.58)} ${f(hx + headR * 0.72)},${f(hy + headR * 0.95)} ${f(hx + headR * 0.84)},${f(hy + headR * 0.58)}" fill="white" stroke="${c.outline}" stroke-width="1"/>`)
  // 目＋眉
  const er = headR * 0.3
  parts.push(glossyEye(hx + headR * 0.05, hy - headR * 0.25, er, c))
  parts.push(`<line x1="${f(hx + headR * 0.05 - er)}" y1="${f(hy - headR * 0.25 - er * 1.6)}" x2="${f(hx + headR * 0.05 + er)}" y2="${f(hy - headR * 0.25 - er * 1.15)}" stroke="${c.outline}" stroke-width="2.4" stroke-linecap="round"/>`)

  // 頭まわりを傾け、全体の向きを DNA で反転
  const head = `<g transform="rotate(${f(headTilt)} ${hx} ${hy})">${parts.slice(headStartIdx).join('')}</g>`
  const body = parts.slice(0, headStartIdx).join('') + head
  return wrapCreatureSvg(body, faceLeft)
}
