import type { StrokeEndingResult, EndingType } from '../types/game'

const ENDING_JA: Record<EndingType, string> = {
  tome: 'とめ',
  hane: 'はね',
  harai: 'はらい',
}

export function buildStrokeFeedback(results: StrokeEndingResult[]): string | null {
  const wrongs = results.filter(
    (r) =>
      !r.isCorrect &&
      r.detectedEnding !== null &&
      !r.expectedEndings.includes(r.detectedEnding),
  )
  if (wrongs.length === 0) return null
  return wrongs
    .map((r) => {
      const detected = ENDING_JA[r.detectedEnding!]
      const firstExpected = r.expectedEndings[0]
      if (firstExpected) {
        return `${r.strokeIndex + 1}かくめ：${detected}ではなく${ENDING_JA[firstExpected]}にしましょう`
      }
      return `${r.strokeIndex + 1}かくめ：${detected}になっています`
    })
    .join('\n')
}
