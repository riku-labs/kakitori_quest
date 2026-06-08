import { REWARDS } from '../config/rewards'

export interface GoldRewardContext {
  species: number       // 将来: 種族別係数
  strokeCount: number   // 将来: 画数ボーナス
  wordLength: number
  bestStarRating: number
  playCount: number     // 将来: 繰り返し逓減
}

export function calcStageGold(ctx: GoldRewardContext): number {
  return (
    REWARDS.BASE_GOLD_PER_STAGE +
    ctx.wordLength * REWARDS.GOLD_PER_CHAR +
    ctx.bestStarRating * REWARDS.GOLD_PER_STAR
  )
}
