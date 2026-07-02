import type { TimedPoint } from '@k1low/kakitori'
import { LIFT_FLICK } from '../config/strokeJudge'

function dist(a: TimedPoint, b: TimedPoint): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/**
 * ストローク終端の「離し際フリック」ノイズを除去した点列を返す（Issue #12）。
 *
 * タッチパッド等では指を離す瞬間にわずかな移動が入り、kakitori が
 * ハネと誤判定することがある。以下のいずれかに該当する末尾の点を
 * ノイズとみなして除去する:
 * - ポーズ（PAUSE_MS 以上のサンプル間隔＝とめ動作）の後の小さな移動
 * - ポーズがなくても距離・時間ともに微小な移動
 *
 * 末尾には元のリリース時刻を持つリリース点（直前点と同座標）を
 * 再構築して付けるため、そのまま checkStrokeEnding に渡せる。
 * 除去対象がなければ null を返す。
 */
export function trimLiftFlick(points: readonly TimedPoint[]): TimedPoint[] | null {
  if (points.length < 4) return null

  const last = points[points.length - 1]
  const secondLast = points[points.length - 2]
  const hasReleaseDup = last.x === secondLast.x && last.y === secondLast.y
  const motion = hasReleaseDup ? points.slice(0, -1) : [...points]
  const releaseT = last.t
  const endIdx = motion.length - 1
  if (motion.length < 3) return null

  // split = 除去を開始する添字（motion[split..endIdx] を除去）。
  // 末尾から遡りながら、除去対象となる経路長・時間を累積して判定する。
  let cumDist = 0
  let pauseSplit: number | null = null
  let tinySplit: number | null = null
  for (let i = endIdx; i >= 2; i--) {
    cumDist += dist(motion[i - 1], motion[i])
    const gapBefore = motion[i].t - motion[i - 1].t
    const flickDuration = motion[endIdx].t - motion[i].t

    if (gapBefore >= LIFT_FLICK.PAUSE_MS && cumDist <= LIFT_FLICK.PAUSED_MAX_DIST) {
      pauseSplit = i
      break // ポーズ位置で切るのが最も自然なのでここで確定
    }
    if (cumDist <= LIFT_FLICK.TINY_MAX_DIST && flickDuration <= LIFT_FLICK.TINY_MAX_MS) {
      tinySplit = i
    }
  }

  const split = pauseSplit ?? tinySplit
  if (split === null) return null

  const kept = motion.slice(0, split)
  const keptLast = kept[kept.length - 1]
  return [...kept, { x: keptLast.x, y: keptLast.y, t: releaseT }]
}
