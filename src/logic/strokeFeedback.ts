import type { StrokeEndingResult, EndingType } from '../types/game'

const ENDING_JA: Record<EndingType, string> = {
  tome: 'とめ',
  hane: 'はね',
  harai: 'はらい',
}

export function buildStrokeFeedback(results: StrokeEndingResult[]): string | null {
  const wrongs = results.filter((r) => !r.isCorrect && r.detectedEnding !== null)
  if (wrongs.length === 0) return null
  return wrongs
    .map((r) => `${r.strokeIndex + 1}かくめ：${ENDING_JA[r.detectedEnding!]}になっています`)
    .join('\n')
}
