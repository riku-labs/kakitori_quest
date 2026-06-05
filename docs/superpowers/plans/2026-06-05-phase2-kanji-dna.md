# Phase 2: 漢字DNA クリーチャー生成 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 漢字のストロークデータからDNA変数を抽出し、5種族のSVGクリーチャーを手続き型生成する。熟語は全文字のDNAを合成して1体の敵を生成し、文字クリアごとにHPが減る。

**Architecture:** `kanjiDna.ts`（DNA抽出・合成）と `creatureGenerator.ts`（SVG生成）をピュアな関数モジュールとして実装し、`gameStore.ts` に `creatureSvg` / `stageCounter` を追加して `GameScreen` からフェッチ・生成する。`EnemyDisplay` はkakitoriレンダリングをSVGクリーチャー表示に差し替え、`BattleStage` に敵HPバーを追加する。

**Tech Stack:** TypeScript, React 19, Zustand 5, Vitest, SVG（ライブラリ追加なし）, hanzi-writer-data CDN

---

### Task 1: 型定義追加

**Files:**
- Modify: `src/types/game.ts`

- [ ] **Step 1: KanjiDNA と CreatureSpec 型を追加する**

`src/types/game.ts` の末尾に追加：

```typescript
// 漢字DNA（ストロークデータから抽出したパラメータ）
export interface KanjiDNA {
  strokeCount: number   // 画数（合計）
  hRatio: number        // 横画の比率 0〜1
  curvature: number     // 平均曲率 0〜1
  symmetry: number      // 左右対称度 0〜1
  hue: number           // 色相 0〜359
}

// クリーチャー生成結果
export interface CreatureSpec {
  species: number       // 種族 0〜4
  dna: KanjiDNA
  svgString: string     // 120×120 の SVG 文字列
}
```

- [ ] **Step 2: コミット**

```bash
git add src/types/game.ts
git commit -m "feat: add KanjiDNA and CreatureSpec types"
```

---

### Task 2: kanjiDna — ピュアな抽出・合成関数 + テスト

**Files:**
- Create: `src/logic/kanjiDna.ts`
- Create: `src/__tests__/logic/kanjiDna.test.ts`

- [ ] **Step 1: テストを書く**

`src/__tests__/logic/kanjiDna.test.ts` を作成：

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { KanjiDNA } from '../../types/game'
import { extractDNA, combineDNA, fetchWordDNA } from '../../logic/kanjiDna'

const straightH: number[][][] = [[[0, 0], [50, 0], [100, 0]]]
const straightV: number[][][] = [[[0, 0], [0, 50], [0, 100]]]
const curved: number[][][] = [[[0, 0], [50, 50], [100, 0]]]

describe('extractDNA', () => {
  it('横画のみ → hRatio=1', () => {
    expect(extractDNA('一', { strokes: ['M0 0'], medians: straightH }).hRatio).toBe(1)
  })

  it('縦画のみ → hRatio=0', () => {
    expect(extractDNA('丨', { strokes: ['M0 0'], medians: straightV }).hRatio).toBe(0)
  })

  it('横縦1本ずつ → hRatio=0.5', () => {
    expect(
      extractDNA('十', { strokes: ['M0 0', 'M0 0'], medians: [...straightH, ...straightV] }).hRatio
    ).toBe(0.5)
  })

  it('直線 → curvature=0', () => {
    expect(extractDNA('一', { strokes: ['M0 0'], medians: straightH }).curvature).toBe(0)
  })

  it('弧画 → curvature>0', () => {
    expect(extractDNA('弧', { strokes: ['M0 0'], medians: curved }).curvature).toBeGreaterThan(0)
  })

  it('strokeCount は画数と一致', () => {
    expect(
      extractDNA('二', { strokes: ['M0 0', 'M0 0'], medians: [...straightH, ...straightH] }).strokeCount
    ).toBe(2)
  })

  it('hue は charCode % 360', () => {
    expect(extractDNA('山', { strokes: ['M0 0'], medians: straightV }).hue).toBe('山'.codePointAt(0)! % 360)
  })
})

describe('combineDNA', () => {
  const d1: KanjiDNA = { strokeCount: 3, hRatio: 0.9, curvature: 0.1, symmetry: 0.9, hue: 0 }
  const d2: KanjiDNA = { strokeCount: 2, hRatio: 0.6, curvature: 0.5, symmetry: 0.7, hue: 100 }

  it('strokeCount は合計', () => { expect(combineDNA([d1, d2]).strokeCount).toBe(5) })
  it('hRatio は平均', () => { expect(combineDNA([d1, d2]).hRatio).toBeCloseTo(0.75) })
  it('curvature は最大値', () => { expect(combineDNA([d1, d2]).curvature).toBe(0.5) })
  it('symmetry は最小値', () => { expect(combineDNA([d1, d2]).symmetry).toBe(0.7) })
  it('hue は先頭 DNA の値', () => { expect(combineDNA([d1, d2]).hue).toBe(0) })
  it('1要素の場合はそのまま返す', () => { expect(combineDNA([d1])).toEqual(d1) })
})

const mockData = {
  strokes: ['M0 0', 'M0 0'],
  medians: [[[0, 0], [50, 0], [100, 0]], [[0, 0], [0, 50], [0, 100]]],
}

describe('fetchWordDNA', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    }))
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('1文字: strokeCount=2, hRatio=0.5', async () => {
    const dna = await fetchWordDNA('山')
    expect(dna.strokeCount).toBe(2)
    expect(dna.hRatio).toBe(0.5)
  })

  it('2文字: strokeCount は合計(4)', async () => {
    expect((await fetchWordDNA('山田')).strokeCount).toBe(4)
  })

  it('fetch が失敗した場合フォールバックDNAを返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const dna = await fetchWordDNA('山')
    expect(dna.strokeCount).toBe(4)
    expect(dna.hRatio).toBe(0.5)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- kanjiDna
```

Expected: `Error: Failed to resolve import`

- [ ] **Step 3: kanjiDna.ts を実装する**

`src/logic/kanjiDna.ts` を作成：

```typescript
import type { KanjiDNA } from '../types/game'

export interface HanziWriterData {
  strokes: string[]
  medians: number[][][]
}

// ---- ピュアな抽出関数 ----

export function extractDNA(char: string, data: HanziWriterData): KanjiDNA {
  const { strokes, medians } = data
  const strokeCount = strokes.length
  const hue = (char.codePointAt(0) ?? 0) % 360

  const hRatio =
    strokeCount === 0
      ? 0
      : medians.filter((m) => {
          if (m.length < 2) return false
          const dx = Math.abs(m[m.length - 1][0] - m[0][0])
          const dy = Math.abs(m[m.length - 1][1] - m[0][1])
          return dx > dy
        }).length / strokeCount

  const curvature =
    strokeCount === 0
      ? 0
      : medians.reduce((sum, m) => sum + strokeCurvature(m), 0) / strokeCount

  const allX = medians.flatMap((m) => m.map(([x]) => x))
  const symmetry = computeSymmetry(allX)

  return { strokeCount, hRatio, curvature, symmetry, hue }
}

export function combineDNA(dnaList: KanjiDNA[]): KanjiDNA {
  if (dnaList.length === 0) throw new Error('dnaList must not be empty')
  const n = dnaList.length
  return {
    strokeCount: dnaList.reduce((s, d) => s + d.strokeCount, 0),
    hRatio: dnaList.reduce((s, d) => s + d.hRatio, 0) / n,
    curvature: Math.max(...dnaList.map((d) => d.curvature)),
    symmetry: Math.min(...dnaList.map((d) => d.symmetry)),
    hue: dnaList[0].hue,
  }
}

// ---- ヘルパー ----

function strokeCurvature(median: number[][]): number {
  if (median.length < 3) return 0
  const start = median[0]
  const end = median[median.length - 1]
  const lineLen = Math.hypot(end[0] - start[0], end[1] - start[1])
  if (lineLen === 0) return 0
  let maxDev = 0
  for (const pt of median.slice(1, -1)) {
    maxDev = Math.max(maxDev, pointToLineDist(pt, start, end))
  }
  return Math.min(maxDev / lineLen, 1)
}

function pointToLineDist(pt: number[], a: number[], b: number[]): number {
  const num = Math.abs(
    (b[1] - a[1]) * pt[0] - (b[0] - a[0]) * pt[1] + b[0] * a[1] - b[1] * a[0],
  )
  const den = Math.hypot(b[1] - a[1], b[0] - a[0])
  return den === 0 ? 0 : num / den
}

function computeSymmetry(allX: number[]): number {
  if (allX.length === 0) return 1
  const cx = allX.reduce((s, x) => s + x, 0) / allX.length
  const leftMean = avg(allX.filter((x) => x < cx).map((x) => cx - x))
  const rightMean = avg(allX.filter((x) => x >= cx).map((x) => x - cx))
  const total = leftMean + rightMean
  return total === 0 ? 1 : 1 - Math.abs(leftMean - rightMean) / total
}

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npm test -- kanjiDna
```

Expected: `✓ kanjiDna.test.ts (8 tests)`

- [ ] **Step 5: コミット**

```bash
git add src/logic/kanjiDna.ts src/__tests__/logic/kanjiDna.test.ts
git commit -m "feat: add kanjiDna extraction and combination logic"
```

---

### Task 3: fetchWordDNA — CDNフェッチ実装

**Note:** fetchWordDNA のテストは Task 2 でまとめて書いた。Task 2 のテストが全部パスしている前提でこのタスクに入ること。

**Files:**
- Modify: `src/logic/kanjiDna.ts`（関数追加）

- [ ] **Step 1: テストが fetchWordDNA で失敗することを確認**

```bash
npm test -- kanjiDna
```

Expected: `fetchWordDNA is not a function` エラーが出る（Task 2 のテストが先にあるので）

- [ ] **Step 2: fetchWordDNA を kanjiDna.ts に追加**

`src/logic/kanjiDna.ts` のエクスポート群の末尾に追加：

```typescript
// ---- CDN フェッチ ----

const CDN = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest'

export async function fetchWordDNA(word: string): Promise<KanjiDNA> {
  const dnaList = await Promise.all(
    word.split('').map(async (char) => {
      const data = await fetchHanziData(char)
      return data ? extractDNA(char, data) : fallbackDNA(char)
    }),
  )
  return combineDNA(dnaList)
}

async function fetchHanziData(char: string): Promise<HanziWriterData | null> {
  try {
    const res = await fetch(`${CDN}/${char}.json`)
    if (!res.ok) return null
    return res.json() as Promise<HanziWriterData>
  } catch {
    return null
  }
}

function fallbackDNA(char: string): KanjiDNA {
  const hue = (char.codePointAt(0) ?? 0) % 360
  return { strokeCount: 4, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue }
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npm test -- kanjiDna
```

Expected: `✓ kanjiDna.test.ts (11 tests)`

- [ ] **Step 5: コミット**

```bash
git add src/logic/kanjiDna.ts src/__tests__/logic/kanjiDna.test.ts
git commit -m "feat: add fetchWordDNA with CDN fetch and fallback"
```

---

### Task 4: creatureGenerator — 5種族SVG生成 + テスト

**Files:**
- Create: `src/logic/creatureGenerator.ts`
- Create: `src/__tests__/logic/creatureGenerator.test.ts`

- [ ] **Step 1: テストを書く**

`src/__tests__/logic/creatureGenerator.test.ts` を作成：

```typescript
import { describe, it, expect } from 'vitest'
import { generateCreature, selectSpecies } from '../../logic/creatureGenerator'
import type { KanjiDNA } from '../../types/game'

const base: KanjiDNA = { strokeCount: 5, hRatio: 0.5, curvature: 0.3, symmetry: 0.8, hue: 120 }

describe('generateCreature', () => {
  it('同じDNA・単語から常に同じSVGを返す（決定的）', () => {
    expect(generateCreature(base, '花').svgString).toBe(generateCreature(base, '花').svgString)
  })

  it('有効なSVG文字列を返す', () => {
    const { svgString } = generateCreature(base, '花')
    expect(svgString).toMatch(/^<svg/)
    expect(svgString).toContain('</svg>')
  })

  it('species は 0〜4 の範囲', () => {
    for (let i = 0; i < 20; i++) {
      const dna: KanjiDNA = { ...base, strokeCount: i + 1 }
      const { species } = generateCreature(dna, `word${i}`)
      expect(species).toBeGreaterThanOrEqual(0)
      expect(species).toBeLessThanOrEqual(4)
    }
  })

  it('dna と species を CreatureSpec として返す', () => {
    const spec = generateCreature(base, '花')
    expect(spec.dna).toEqual(base)
    expect(typeof spec.species).toBe('number')
  })
})

describe('selectSpecies', () => {
  it('「三」と「一二」は同画数でも別種族', () => {
    // 三: wordHash=19977, (3+10+19977)%5=0
    const dna三: KanjiDNA = { strokeCount: 3, hRatio: 0.95, curvature: 0.05, symmetry: 0.95, hue: 177 }
    // 一二: wordHash=40076, (3+10+40076)%5=4
    const dna一二: KanjiDNA = { strokeCount: 3, hRatio: 1.0, curvature: 0.05, symmetry: 1.0, hue: 168 }
    expect(selectSpecies(dna三, '三')).toBe(0)
    expect(selectSpecies(dna一二, '一二')).toBe(4)
    expect(selectSpecies(dna三, '三')).not.toBe(selectSpecies(dna一二, '一二'))
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- creatureGenerator
```

Expected: `Error: Failed to resolve import`

- [ ] **Step 3: creatureGenerator.ts を実装する**

`src/logic/creatureGenerator.ts` を作成：

```typescript
import type { KanjiDNA, CreatureSpec } from '../types/game'

const f = (n: number) => n.toFixed(1)
const wrap = (parts: string[]) =>
  `<svg width="120" height="120" viewBox="0 0 120 120">${parts.join('')}</svg>`

function colors(hue: number) {
  return {
    main: `hsl(${hue},72%,52%)`,
    dark: `hsl(${hue},72%,32%)`,
    light: `hsl(${hue},72%,72%)`,
    accent: `hsl(${(hue + 180) % 360},80%,60%)`,
  }
}

function spikePolygon(
  cx: number, cy: number, rx: number, ry: number,
  n: number, sym: number, fill: string, stroke: string,
): string {
  let pts = ''
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    const outer = i % 2 === 0
    const s = outer ? 1.2 : 0.78
    const xs = sym < 0.5 && Math.cos(a) < 0 ? 0.65 : 1.0
    pts += `${f(cx + Math.cos(a) * rx * s * xs)},${f(cy + Math.sin(a) * ry * s)} `
  }
  return `<polygon points="${pts.trim()}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`
}

// ── 種族 0: 二足歩行 ──────────────────────────────────────────
function generateBiped(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = colors(hue)
  const scale = Math.min(0.65 + sc * 0.015, 0.95)
  const cx = 60, bodyCy = 70
  const bw = (11 + hRatio * 26) * scale
  const bh = (13 + (1 - hRatio) * 16 + sc * 0.55) * scale
  const hr = (9 + sc * 0.52) * scale
  const hy = bodyCy - bh - hr * 0.55
  const er = (2.2 + curvature * 2.8) * scale
  const esp = hr * 0.48
  const pairs = sc <= 4 ? 1 : sc <= 9 ? 2 : 3
  const parts: string[] = []

  // Body
  if (curvature > 0.55)
    parts.push(spikePolygon(cx, bodyCy, bw, bh, Math.round(4 + sc * 0.35), symmetry, c.main, c.dark))
  else if (curvature < 0.18)
    parts.push(`<rect x="${f(cx - bw)}" y="${f(bodyCy - bh)}" width="${f(bw * 2)}" height="${f(bh * 2)}" rx="${f(3 * scale)}" fill="${c.main}"/>`)
  else
    parts.push(`<ellipse cx="${cx}" cy="${f(bodyCy)}" rx="${f(bw)}" ry="${f(bh)}" fill="${c.main}"/>`)

  // Arms
  for (let p = 0; p < pairs; p++) {
    const ay = bodyCy - bh * (0.72 - p * 0.42)
    const al = (10 + sc * 0.85) * scale
    const lm = symmetry < 0.5 ? 0.65 : 1.0
    const sw = `stroke="${c.dark}" stroke-width="${f(4.5 * scale)}" fill="none" stroke-linecap="round"`
    if (curvature > 0.32) {
      parts.push(`<path d="M${f(cx - bw)},${f(ay)} Q${f(cx - bw - al * 0.4)},${f(ay - curvature * 14)} ${f(cx - bw - al * lm)},${f(ay + al * 0.35)}" ${sw}/>`)
      parts.push(`<path d="M${f(cx + bw)},${f(ay)} Q${f(cx + bw + al * 0.4)},${f(ay - curvature * 14)} ${f(cx + bw + al)},${f(ay + al * 0.35)}" ${sw}/>`)
    } else {
      parts.push(`<line x1="${f(cx - bw)}" y1="${f(ay)}" x2="${f(cx - bw - al * lm)}" y2="${f(ay + al * 0.4)}" ${sw}/>`)
      parts.push(`<line x1="${f(cx + bw)}" y1="${f(ay)}" x2="${f(cx + bw + al)}" y2="${f(ay + al * 0.4)}" ${sw}/>`)
    }
  }

  // Legs
  const ly = bodyCy + bh
  const ll = (11 + sc * 0.4) * scale
  const lsw = `stroke="${c.dark}" stroke-width="${f(5 * scale)}" stroke-linecap="round"`
  parts.push(`<line x1="${f(cx - bw * 0.5)}" y1="${f(ly)}" x2="${f(cx - bw * 0.4)}" y2="${f(ly + ll)}" ${lsw}/>`)
  parts.push(`<line x1="${f(cx + bw * 0.5)}" y1="${f(ly)}" x2="${f(cx + bw * 0.4)}" y2="${f(ly + ll)}" ${lsw}/>`)

  // Head
  parts.push(`<circle cx="${cx}" cy="${f(hy)}" r="${f(hr)}" fill="${c.light}"/>`)

  // Eyes
  const lEx = cx - esp * (symmetry < 0.5 ? 1.4 : 1.0)
  const lEy = hy + (symmetry < 0.4 ? -hr * 0.12 : 0)
  parts.push(`<circle cx="${f(lEx)}" cy="${f(lEy)}" r="${f(er)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${f(cx + esp)}" cy="${f(hy)}" r="${f(er)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${f(lEx + er * 0.28)}" cy="${f(lEy - er * 0.28)}" r="${f(er * 0.38)}" fill="white" opacity="0.8"/>`)
  parts.push(`<circle cx="${f(cx + esp + er * 0.28)}" cy="${f(hy - er * 0.28)}" r="${f(er * 0.38)}" fill="white" opacity="0.8"/>`)

  if (symmetry > 0.7) {
    const hh = (5 + symmetry * 7) * scale
    parts.push(`<polygon points="${f(cx)},${f(hy - hr - hh)} ${f(cx - 3.5 * scale)},${f(hy - hr + 1)} ${f(cx + 3.5 * scale)},${f(hy - hr + 1)}" fill="${c.dark}" opacity="0.9"/>`)
  }
  if (symmetry < 0.5) {
    const tx = cx + bw * 0.4, ty = bodyCy + bh * 0.4
    parts.push(`<path d="M${f(tx)},${f(ty)} Q${f(tx + 22 * scale)},${f(ty + 8 * scale)} ${f(tx + 16 * scale)},${f(ty + 26 * scale)}" stroke="${c.dark}" stroke-width="${f(3.8 * scale)}" fill="none" stroke-linecap="round"/>`)
  }
  if (sc >= 6) {
    const dots = Math.min(Math.floor(sc / 3), 4)
    for (let i = 0; i < dots; i++)
      parts.push(`<circle cx="${f(cx - (dots - 1) * 5 + i * 10)}" cy="${f(bodyCy)}" r="${f(2.4 * scale)}" fill="${c.accent}" opacity="0.75"/>`)
  }
  return wrap(parts)
}

// ── 種族 1: スライム ──────────────────────────────────────────
function generateSlime(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = colors(hue)
  const scale = Math.min(0.65 + sc * 0.015, 0.95)
  const cx = 60, cy = 48
  const rx = (16 + hRatio * 18 + sc * 0.5) * scale
  const ry = (15 + (1 - hRatio) * 10 + sc * 0.4) * scale
  const bumps = Math.round(4 + curvature * 6)
  const parts: string[] = []

  // Blob body
  {
    let pts = ''
    for (let i = 0; i < bumps * 2; i++) {
      const a = (i / (bumps * 2)) * Math.PI * 2 - Math.PI / 2
      const outer = i % 2 === 0
      const r = outer ? 1.15 : 0.85
      const xs = symmetry < 0.5 && Math.cos(a) < 0 ? 0.7 : 1.0
      pts += `${f(cx + Math.cos(a) * rx * r * xs)},${f(cy + Math.sin(a) * ry * r)} `
    }
    parts.push(`<polygon points="${pts.trim()}" fill="${c.main}"/>`)
  }

  // Drips
  const drips = Math.min(sc, 5)
  for (let i = 0; i < drips; i++) {
    const dx = cx - (drips - 1) * 7 + i * 14
    const dh = (5 + i * 1.5) * scale
    parts.push(`<ellipse cx="${f(dx)}" cy="${f(cy + ry + dh * 0.5)}" rx="${f(3.5 * scale)}" ry="${f(dh)}" fill="${c.main}"/>`)
  }

  // Eyes
  const eyeR = (5 + curvature * 3) * scale
  const eyeX = rx * 0.38
  const eyeY = cy - ry * 0.1
  parts.push(`<circle cx="${f(cx - eyeX)}" cy="${f(eyeY)}" r="${f(eyeR)}" fill="white"/>`)
  parts.push(`<circle cx="${f(cx + eyeX)}" cy="${f(eyeY)}" r="${f(eyeR)}" fill="white"/>`)
  parts.push(`<circle cx="${f(cx - eyeX + 1)}" cy="${f(eyeY + 1)}" r="${f(eyeR * 0.55)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${f(cx + eyeX + 1)}" cy="${f(eyeY + 1)}" r="${f(eyeR * 0.55)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${f(cx - eyeX + eyeR * 0.3)}" cy="${f(eyeY - eyeR * 0.3)}" r="${f(eyeR * 0.28)}" fill="white" opacity="0.8"/>`)
  parts.push(`<circle cx="${f(cx + eyeX + eyeR * 0.3)}" cy="${f(eyeY - eyeR * 0.3)}" r="${f(eyeR * 0.28)}" fill="white" opacity="0.8"/>`)

  if (symmetry > 0.65) {
    const cr = (6 + symmetry * 5) * scale
    parts.push(`<circle cx="${f(cx)}" cy="${f(cy - ry - cr * 0.5)}" r="${f(cr)}" fill="${c.light}"/>`)
  }
  return wrap(parts)
}

// ── 種族 2: 触手眼 ──────────────────────────────────────────
function generateEyeTentacle(dna: KanjiDNA): string {
  const { strokeCount: sc, curvature, symmetry, hue } = dna
  const c = colors(hue)
  const scale = Math.min(0.65 + sc * 0.015, 0.95)
  const cx = 60, cy = 55
  const bodyR = (14 + sc * 0.45) * scale
  const tentCount = Math.min(3 + Math.round(sc * 0.5), 8)
  const tentLen = (14 + sc * 0.9) * scale
  const parts: string[] = []

  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(bodyR)}" fill="${c.main}"/>`)

  for (let i = 0; i < tentCount; i++) {
    const a = (i / tentCount) * Math.PI * 2 - Math.PI / 2
    const sx = cx + Math.cos(a) * bodyR, sy = cy + Math.sin(a) * bodyR
    const lm = symmetry < 0.5 && Math.cos(a) < 0 ? 0.65 : 1.0
    const ex = cx + Math.cos(a) * (bodyR + tentLen * lm)
    const ey = cy + Math.sin(a) * (bodyR + tentLen * lm)
    const cpx = (sx + ex) / 2 - Math.sin(a) * curvature * tentLen * 0.7
    const cpy = (sy + ey) / 2 + Math.cos(a) * curvature * tentLen * 0.7
    parts.push(`<path d="M${f(sx)},${f(sy)} Q${f(cpx)},${f(cpy)} ${f(ex)},${f(ey)}" stroke="${c.dark}" stroke-width="${f(4 * scale)}" fill="none" stroke-linecap="round"/>`)
  }

  const eyeR = bodyR * (0.62 + symmetry * 0.08)
  const irisR = eyeR * 0.65
  const pupilR = irisR * 0.55
  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(eyeR)}" fill="white"/>`)
  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(irisR)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(pupilR)}" fill="#000"/>`)
  parts.push(`<circle cx="${f(cx + pupilR * 0.35)}" cy="${f(cy - pupilR * 0.35)}" r="${f(pupilR * 0.3)}" fill="white" opacity="0.8"/>`)
  return wrap(parts)
}

// ── 種族 3: 四足獣 ──────────────────────────────────────────
function generateBeast(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = colors(hue)
  const scale = Math.min(0.65 + sc * 0.015, 0.95)
  const bx = 52, by = 56
  const bw = (20 + hRatio * 16) * scale
  const bh = (11 + (1 - hRatio) * 8 + sc * 0.35) * scale
  const headR = (10 + sc * 0.35) * scale
  const legCount = sc >= 10 ? 6 : 4
  const legLen = (13 + sc * 0.3) * scale
  const tailLen = symmetry * 26 * scale
  const parts: string[] = []

  parts.push(`<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(bw)}" ry="${f(bh)}" fill="${c.main}"/>`)

  const hx = bx + bw + headR * 0.55, hy = by - bh * 0.2
  parts.push(`<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(headR)}" fill="${c.light}"/>`)

  const er = (3 + curvature * 2) * scale
  parts.push(`<circle cx="${f(hx + headR * 0.3)}" cy="${f(hy - headR * 0.15)}" r="${f(er)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${f(hx + headR * 0.3 + er * 0.3)}" cy="${f(hy - headR * 0.15 - er * 0.3)}" r="${f(er * 0.35)}" fill="white" opacity="0.8"/>`)

  if (symmetry > 0.6)
    parts.push(`<polygon points="${f(hx)},${f(hy - headR - 8 * scale)} ${f(hx - 4 * scale)},${f(hy - headR + 2)} ${f(hx + 4 * scale)},${f(hy - headR + 2)}" fill="${c.dark}"/>`)

  if (tailLen > 4) {
    const tx = bx - bw
    parts.push(`<path d="M${f(tx)},${f(by)} Q${f(tx - tailLen * 0.5)},${f(by - tailLen * 0.3)} ${f(tx - tailLen)},${f(by + tailLen * 0.1)}" stroke="${c.dark}" stroke-width="${f(5 * scale)}" fill="none" stroke-linecap="round"/>`)
  }

  for (let i = 0; i < legCount; i++) {
    const lx = bx - bw * 0.7 + (i / (legCount - 1)) * bw * 1.4
    const ex = lx + (i < legCount / 2 ? -2 : 2) * scale
    const ey = by + bh + legLen
    if (curvature > 0.3)
      parts.push(`<path d="M${f(lx)},${f(by + bh)} Q${f(lx)},${f(by + bh + legLen * 0.5)} ${f(ex)},${f(ey)}" stroke="${c.dark}" stroke-width="${f(5 * scale)}" fill="none" stroke-linecap="round"/>`)
    else
      parts.push(`<line x1="${f(lx)}" y1="${f(by + bh)}" x2="${f(ex)}" y2="${f(ey)}" stroke="${c.dark}" stroke-width="${f(5 * scale)}" stroke-linecap="round"/>`)
  }
  return wrap(parts)
}

// ── 種族 4: 浮遊体 ──────────────────────────────────────────
function generateOrb(dna: KanjiDNA): string {
  const { strokeCount: sc, hRatio, curvature, symmetry, hue } = dna
  const c = colors(hue)
  const scale = Math.min(0.65 + sc * 0.015, 0.95)
  const cx = 60, cy = 46
  const orbR = (14 + sc * 0.38) * scale
  const wingW = (10 + hRatio * 22) * scale
  const wingH = wingW * (0.5 + curvature * 0.5)
  const tentCount = Math.min(1 + Math.round(sc / 3), 4)
  const tentLen = (14 + sc * 0.5) * scale
  const parts: string[] = []

  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(orbR + 8 * scale)}" fill="none" stroke="${c.main}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4,3"/>`)
  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(orbR + 14 * scale)}" fill="none" stroke="${c.main}" stroke-width="1" opacity="0.15" stroke-dasharray="3,5"/>`)

  const wby = cy - orbR * 0.3
  const wb = `stroke="${c.dark}" stroke-width="${f(5 * scale)}" fill="none" stroke-linecap="round"`
  const rm = symmetry < 0.5 ? 0.7 : 1.0
  if (curvature > 0.3) {
    parts.push(`<path d="M${f(cx - orbR)},${f(wby)} Q${f(cx - orbR - wingW * 0.5)},${f(wby - wingH)} ${f(cx - orbR - wingW)},${f(wby - wingH * 0.3)}" ${wb}/>`)
    parts.push(`<path d="M${f(cx + orbR)},${f(wby)} Q${f(cx + orbR + wingW * 0.5 * rm)},${f(wby - wingH * rm)} ${f(cx + orbR + wingW * rm)},${f(wby - wingH * 0.3 * rm)}" ${wb}/>`)
  } else {
    parts.push(`<line x1="${f(cx - orbR)}" y1="${f(wby)}" x2="${f(cx - orbR - wingW)}" y2="${f(wby - wingH * 0.5)}" ${wb}/>`)
    parts.push(`<line x1="${f(cx + orbR)}" y1="${f(wby)}" x2="${f(cx + orbR + wingW * rm)}" y2="${f(wby - wingH * 0.5 * rm)}" ${wb}/>`)
  }

  parts.push(`<circle cx="${cx}" cy="${f(cy)}" r="${f(orbR)}" fill="${c.main}"/>`)

  const er = (3 + curvature * 2) * scale
  const esp = orbR * 0.35
  parts.push(`<circle cx="${f(cx - esp)}" cy="${f(cy - orbR * 0.05)}" r="${f(er)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${f(cx + esp)}" cy="${f(cy - orbR * 0.05)}" r="${f(er)}" fill="${c.dark}"/>`)
  parts.push(`<circle cx="${f(cx - esp + er * 0.3)}" cy="${f(cy - orbR * 0.05 - er * 0.3)}" r="${f(er * 0.35)}" fill="white" opacity="0.8"/>`)
  parts.push(`<circle cx="${f(cx + esp + er * 0.3)}" cy="${f(cy - orbR * 0.05 - er * 0.3)}" r="${f(er * 0.35)}" fill="white" opacity="0.8"/>`)

  for (let i = 0; i < tentCount; i++) {
    const tx = cx - ((tentCount - 1) * 8) / 2 + i * 8
    const cdx = (i - (tentCount - 1) / 2) * curvature * 12
    parts.push(`<path d="M${f(tx)},${f(cy + orbR)} Q${f(tx + cdx)},${f(cy + orbR + tentLen * 0.5)} ${f(tx + cdx * 0.5)},${f(cy + orbR + tentLen)}" stroke="${c.dark}" stroke-width="${f(3.5 * scale)}" fill="none" stroke-linecap="round"/>`)
  }
  return wrap(parts)
}

// ── パブリック API ──────────────────────────────────────────

const GENERATORS = [
  generateBiped,
  generateSlime,
  generateEyeTentacle,
  generateBeast,
  generateOrb,
]

export function selectSpecies(dna: KanjiDNA, word: string): number {
  const wordHash = word.split('').reduce((s, c) => s + (c.codePointAt(0) ?? 0), 0)
  return (dna.strokeCount + Math.round(dna.hRatio * 10) + wordHash) % 5
}

export function generateCreature(dna: KanjiDNA, word: string): CreatureSpec {
  const species = selectSpecies(dna, word)
  const svgString = GENERATORS[species](dna)
  return { species, dna, svgString }
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npm test -- creatureGenerator
```

Expected: `✓ creatureGenerator.test.ts (5 tests)`

- [ ] **Step 5: ビルドが通ることを確認**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`（エラーなし）

- [ ] **Step 6: コミット**

```bash
git add src/logic/creatureGenerator.ts src/__tests__/logic/creatureGenerator.test.ts
git commit -m "feat: add creature generator with 5 species"
```

---

### Task 5: ストアに creatureSvg / stageCounter を追加

**Files:**
- Modify: `src/store/gameStore.ts`

- [ ] **Step 1: GameStore インターフェースに追加**

`src/store/gameStore.ts` の `interface GameStore extends SaveData {` ブロックに追加：

```typescript
  // クリーチャー
  stageCounter: number          // startStage ごとにインクリメント（useEffect の依存値）
  creatureSvg: string | null    // null = 読み込み中

  // アクション
  setCreatureSvg: (svg: string) => void
```

- [ ] **Step 2: 初期値を追加**

`create` コールの初期値ブロックに追加：

```typescript
      stageCounter: 0,
      creatureSvg: null,
```

- [ ] **Step 3: startStage を更新**

既存の `startStage` を以下に差し替え：

```typescript
      startStage: (entry) =>
        set((state) => ({
          screen: 'game',
          currentEntry: entry,
          currentCharIndex: 0,
          hearts: MAX_HEARTS,
          endingResults: [],
          battlePhase: 'writing',
          battleMessage: `まがった「${entry.word}」があらわれた！`,
          stageCounter: state.stageCounter + 1,
          creatureSvg: null,
        })),
```

- [ ] **Step 4: setCreatureSvg アクションを追加**

`setBattleMessage` の近くに追加：

```typescript
      setCreatureSvg: (svg) => set({ creatureSvg: svg }),
```

- [ ] **Step 5: ビルドが通ることを確認**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 6: コミット**

```bash
git add src/store/gameStore.ts
git commit -m "feat: add creatureSvg and stageCounter to game store"
```

---

### Task 6: GameScreen でクリーチャーを事前生成

**Files:**
- Modify: `src/components/game/GameScreen.tsx`

- [ ] **Step 1: GameScreen.tsx を更新**

`src/components/game/GameScreen.tsx` を以下に差し替え：

```typescript
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { StrokeEndingResult, KanjiDNA } from '../../types/game'
import { CHAR_SIZE_PX } from '../../types/game'
import { useGameStore } from '../../store/gameStore'
import { getEffectiveLayout } from '../../logic/layoutLogic'
import { fetchWordDNA } from '../../logic/kanjiDna'
import { generateCreature } from '../../logic/creatureGenerator'
import { BattleStage } from './BattleStage'
import { WritingArea } from './WritingArea'

export function GameScreen() {
  const {
    currentEntry,
    currentCharIndex,
    hearts,
    battlePhase,
    writingAreaPosition,
    charSize,
    stageCounter,
    onStrokeMistake,
    onCharComplete,
    setCreatureSvg,
  } = useGameStore()

  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight,
  )

  useLayoutEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight)
    const observer = new ResizeObserver(update)
    observer.observe(document.documentElement)
    return () => observer.disconnect()
  }, [])

  // ステージが変わるたびにクリーチャーを生成
  useEffect(() => {
    if (!currentEntry) return
    let cancelled = false
    const word = currentEntry.word

    fetchWordDNA(word)
      .then((dna) => {
        if (!cancelled) setCreatureSvg(generateCreature(dna, word).svgString)
      })
      .catch(() => {
        if (!cancelled) {
          const fallback: KanjiDNA = {
            strokeCount: 4, hRatio: 0.5, curvature: 0.3, symmetry: 0.8,
            hue: (word.codePointAt(0) ?? 0) % 360,
          }
          setCreatureSvg(generateCreature(fallback, word).svgString)
        }
      })

    return () => { cancelled = true }
  }, [stageCounter]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveLayout = getEffectiveLayout(writingAreaPosition, isLandscape)
  const char = currentEntry?.word[currentCharIndex] ?? ''

  const handleComplete = useCallback(
    (results: StrokeEndingResult[]) => { onCharComplete(results) },
    [onCharComplete],
  )

  const writingPanel = battlePhase === 'writing' && (
    <div
      style={{
        flex: effectiveLayout === 'bottom' ? 'none' : 1,
        height: effectiveLayout === 'bottom' ? '45%' : '100%',
        width: effectiveLayout !== 'bottom' ? '40%' : '100%',
      }}
    >
      <WritingArea
        char={char}
        hearts={hearts}
        maxHearts={3}
        maxSize={CHAR_SIZE_PX[charSize]}
        onMistake={onStrokeMistake}
        onComplete={handleComplete}
      />
    </div>
  )

  const battlePanel = (
    <div style={{ flex: 1 }}>
      <BattleStage />
    </div>
  )

  if (effectiveLayout === 'bottom') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        {battlePanel}
        {writingPanel}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      {effectiveLayout === 'left' ? (
        <>{writingPanel}{battlePanel}</>
      ) : (
        <>{battlePanel}{writingPanel}</>
      )}
    </div>
  )
}
```

- [ ] **Step 2: ビルドが通ることを確認**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: コミット**

```bash
git add src/components/game/GameScreen.tsx
git commit -m "feat: fetch and generate creature on stage start"
```

---

### Task 7: EnemyDisplay をSVGクリーチャー表示に差し替え

**Files:**
- Modify: `src/components/game/EnemyDisplay.tsx`

- [ ] **Step 1: EnemyDisplay.tsx を差し替え**

`src/components/game/EnemyDisplay.tsx` を以下に差し替え：

```typescript
import { useGameStore } from '../../store/gameStore'

// creatureSvg は generateCreature() が返す信頼できるSVG文字列なので dangerouslySetInnerHTML は安全
export function EnemyDisplay() {
  const { creatureSvg } = useGameStore()

  return (
    <div
      style={{ display: 'inline-block', lineHeight: 1, width: 120, height: 120 }}
      dangerouslySetInnerHTML={
        creatureSvg
          ? { __html: creatureSvg }
          : { __html: '<svg width="120" height="120" viewBox="0 0 120 120"><text x="60" y="65" text-anchor="middle" fill="#555" font-size="14">...</text></svg>' }
      }
    />
  )
}
```

- [ ] **Step 2: ビルドが通ることを確認**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: コミット**

```bash
git add src/components/game/EnemyDisplay.tsx
git commit -m "feat: replace kakitori render with SVG creature in EnemyDisplay"
```

---

### Task 8: BattleStage に敵HPバーを追加

**Files:**
- Modify: `src/components/game/BattleStage.tsx`

- [ ] **Step 1: BattleStage.tsx を更新**

`src/components/game/BattleStage.tsx` を以下に差し替え：

```typescript
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { resolveBattle } from '../../logic/battleLogic'
import { calculateAccuracy } from '../../logic/accuracyLogic'
import { buildStrokeFeedback } from '../../logic/strokeFeedback'
import { EnemyDisplay } from './EnemyDisplay'
import { CharacterDisplay } from './CharacterDisplay'
import { MessageWindow } from './MessageWindow'
import { useGameStore } from '../../store/gameStore'

export function BattleStage() {
  const {
    currentEntry,
    currentCharIndex,
    battlePhase,
    endingResults,
    battleMessage,
    setBattleFeedback,
    confirmBattle,
  } = useGameStore()

  const char = currentEntry?.word[currentCharIndex] ?? ''
  const word = currentEntry?.word ?? ''
  const accuracy = calculateAccuracy(endingResults)
  const strokeFeedback = buildStrokeFeedback(endingResults)

  // 敵HP: battling/feedback フェーズ中は「この文字クリア後」の値を先取りして表示
  const isResolved = battlePhase === 'battling' || battlePhase === 'feedback' || battlePhase === 'won'
  const effectiveCleared = isResolved ? currentCharIndex + 1 : currentCharIndex
  const enemyHpRatio = word.length === 0 ? 1 : Math.max(0, (word.length - effectiveCleared) / word.length)

  useEffect(() => {
    if (battlePhase !== 'battling') return
    const result = resolveBattle(endingResults)
    const timer = setTimeout(() => {
      if (result === 'win') {
        setBattleFeedback('win', `${char}は かちのこった！`)
      } else {
        setBattleFeedback('lose', `まがった「${char}」の かちだ…`)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [battlePhase, char, endingResults, setBattleFeedback])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0014',
        padding: '12px',
        gap: '12px',
      }}
    >
      {/* 敵HPバー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-enemy)', fontSize: '0.65em', whiteSpace: 'nowrap' }}>
          まがった「{word}」
        </span>
        <div
          style={{
            flex: 1,
            height: '8px',
            background: '#2a0000',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #550000',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(enemyHpRatio * 100).toFixed(1)}%`,
              background: enemyHpRatio > 0.5 ? '#cc2200' : enemyHpRatio > 0.25 ? '#ff6600' : '#ffcc00',
              borderRadius: '4px',
              transition: 'width 0.6s ease-out, background 0.6s',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <AnimatePresence>
          <motion.div
            key="enemy-creature"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <EnemyDisplay />
          </motion.div>
        </AnimatePresence>

        <div style={{ color: '#555', fontSize: '0.8em' }}>VS</div>

        <motion.div
          animate={
            battlePhase === 'battling'
              ? { x: [-4, 4, -4, 0], transition: { duration: 0.4 } }
              : {}
          }
        >
          <CharacterDisplay
            char={char}
            accuracy={accuracy}
            visible={battlePhase === 'battling' || battlePhase === 'won' || battlePhase === 'feedback'}
          />
        </motion.div>
      </div>

      <MessageWindow
        message={battleMessage}
        detail={
          battlePhase === 'battling' || battlePhase === 'feedback'
            ? strokeFeedback ?? undefined
            : undefined
        }
      />

      {battlePhase === 'feedback' && (
        <button
          onClick={confirmBattle}
          style={{
            background: 'transparent',
            border: '2px solid var(--color-window-border)',
            color: 'var(--color-text)',
            fontFamily: 'inherit',
            fontSize: '0.9em',
            padding: '8px 16px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          ▼ タップして続ける
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: ビルドが通ることを確認**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: 全テストが通ることを確認**

```bash
npm test
```

Expected: 全テスト PASS（既存テスト含む）

- [ ] **Step 4: コミット**

```bash
git add src/components/game/BattleStage.tsx
git commit -m "feat: add enemy HP bar to BattleStage"
```

---

### Task 9: feature/phase2 ブランチを main にマージ

- [ ] **Step 1: ワークツリーで全テスト・ビルドを最終確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.worktrees/feature-phase2
npm test && npm run build 2>&1 | tail -5
```

Expected: 全テスト PASS、`✓ built in`

- [ ] **Step 2: main にマージ**

```bash
git checkout main
git merge feature/phase2 --no-ff -m "feat: Phase 2 - kanji DNA creature generation with enemy HP bar"
```

- [ ] **Step 3: ワークツリーを削除**

```bash
git worktree remove .worktrees/feature-phase2
git branch -d feature/phase2
```
