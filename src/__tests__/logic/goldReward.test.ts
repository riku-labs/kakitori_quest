import { describe, it, expect } from 'vitest'
import { calcStageGold } from '../../logic/goldReward'
import type { GoldRewardContext } from '../../logic/goldReward'

describe('calcStageGold', () => {
  it('ベースゴールド + 文字数 × GOLD_PER_CHAR + 星 × GOLD_PER_STAR を返す', () => {
    // BASE(10) + 2文字×5 + 1星×10 = 30
    const ctx: GoldRewardContext = {
      species: 0,
      strokeCount: 0,
      wordLength: 2,
      bestStarRating: 1,
      playCount: 1,
    }
    expect(calcStageGold(ctx)).toBe(30)
  })

  it('3文字・3つ星で正しい合計を返す', () => {
    // BASE(10) + 3文字×5 + 3星×10 = 55
    const ctx: GoldRewardContext = {
      species: 0,
      strokeCount: 0,
      wordLength: 3,
      bestStarRating: 3,
      playCount: 1,
    }
    expect(calcStageGold(ctx)).toBe(55)
  })

  it('星 0 でもベースゴールド + 文字数分は得られる', () => {
    // BASE(10) + 1文字×5 + 0星×10 = 15
    const ctx: GoldRewardContext = {
      species: 0,
      strokeCount: 0,
      wordLength: 1,
      bestStarRating: 0,
      playCount: 1,
    }
    expect(calcStageGold(ctx)).toBe(15)
  })
})
