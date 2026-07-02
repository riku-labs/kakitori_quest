import type { EndingType } from '../types/game'

// kakitori の StrokeEndingChecker における検出種別と velocityProfile の対応:
//   tome  → 'decelerating'（離す前のポーズを検出）
//   hane  → 'accelerating'（方向転換 + 終端加速）
//   harai → 'constant'（上記以外）
export function inferEndingType(velocityProfile?: string): EndingType | null {
  if (velocityProfile === 'decelerating') return 'tome'
  if (velocityProfile === 'accelerating') return 'hane'
  if (velocityProfile === 'constant') return 'harai'
  return null
}
