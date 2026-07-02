// Issue #12: タッチパッドから手を離す際のわずかな上方向移動が
// 「ハネ」と誤判定される問題。離し際フリックを除去して再判定する。
import { describe, it, expect } from 'vitest'
import { checkStrokeEnding, HANZI_PRESCALED_SIZE } from '@k1low/kakitori'
import type { TimedPoint } from '@k1low/kakitori'
import { trimLiftFlick } from '../../logic/liftFlick'

// 横棒ストローク: x を進めながら等速で描く（hanzi-writer 内部座標）
function makeBodyPoints(count: number, stepMs: number): TimedPoint[] {
  const points: TimedPoint[] = []
  for (let i = 0; i < count; i++) {
    points.push({ x: 100 + i * 40, y: 400, t: i * stepMs })
  }
  return points
}

// とめ（ポーズ）後に上方向へ小さくフリックして離したストローク
function tomeWithLiftFlick(): TimedPoint[] {
  const body = makeBodyPoints(12, 20) // 0..220ms
  const lastBody = body[body.length - 1]
  const pauseEnd = lastBody.t + 150 // 150ms 静止（とめ）
  const flick: TimedPoint[] = [
    { x: lastBody.x + 5, y: lastBody.y - 12, t: pauseEnd },
    { x: lastBody.x + 8, y: lastBody.y - 25, t: pauseEnd + 16 },
  ]
  const releaseT = pauseEnd + 32
  const last = flick[flick.length - 1]
  return [...body, ...flick, { x: last.x, y: last.y, t: releaseT }]
}

describe('trimLiftFlick', () => {
  it('ポーズ後の離し際フリックを除去し、リリース点を再構築する', () => {
    const points = tomeWithLiftFlick()
    const trimmed = trimLiftFlick(points)
    expect(trimmed).not.toBeNull()
    const t = trimmed!
    // 末尾はリリース点（直前と同座標・リリース時刻維持）
    const last = t[t.length - 1]
    const prev = t[t.length - 2]
    expect(last.x).toBe(prev.x)
    expect(last.y).toBe(prev.y)
    expect(last.t).toBe(points[points.length - 1].t)
    // フリック点（y が 12 以上上方向へ動いた点）が除去されている
    expect(t.every((p) => p.y === 400)).toBe(true)
  })

  it('フリックのない通常のストロークは null（除去対象なし）', () => {
    const body = makeBodyPoints(12, 20)
    const last = body[body.length - 1]
    const points = [...body, { x: last.x, y: last.y, t: last.t + 150 }]
    expect(trimLiftFlick(points)).toBeNull()
  })

  it('大きく明確なハネはポーズがないため除去しない', () => {
    const body = makeBodyPoints(12, 20)
    const lastBody = body[body.length - 1]
    // ポーズなしで大きく上方向へ速いフリック（本物のハネ）
    const hane: TimedPoint[] = [
      { x: lastBody.x + 10, y: lastBody.y - 60, t: lastBody.t + 16 },
      { x: lastBody.x + 20, y: lastBody.y - 130, t: lastBody.t + 32 },
      { x: lastBody.x + 28, y: lastBody.y - 200, t: lastBody.t + 48 },
    ]
    const last = hane[hane.length - 1]
    const points = [...body, ...hane, { x: last.x, y: last.y, t: last.t + 10 }]
    expect(trimLiftFlick(points)).toBeNull()
  })

  it('点数が少なすぎる場合は null', () => {
    expect(trimLiftFlick([{ x: 0, y: 0, t: 0 }])).toBeNull()
  })
})

describe('trimLiftFlick + checkStrokeEnding 統合', () => {
  it('とめ+離しフリックは元判定で不正解だが、除去後は とめ として正解になる', () => {
    const points = tomeWithLiftFlick()
    const expected = { types: ['tome' as const] }
    const options = { drawableSize: HANZI_PRESCALED_SIZE }

    const original = checkStrokeEnding(points, expected, options)
    expect(original.correct).toBe(false)

    const trimmed = trimLiftFlick(points)
    expect(trimmed).not.toBeNull()
    const rechecked = checkStrokeEnding(trimmed!, expected, options)
    expect(rechecked.correct).toBe(true)
    expect(rechecked.velocityProfile).toBe('decelerating')
  })
})
