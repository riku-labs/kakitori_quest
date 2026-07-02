import type { StrokeEndingResult } from '../types/game'
import { MSG } from '../config/messages'

export function buildStrokeFeedback(results: StrokeEndingResult[]): string | null {
  const incorrects = results.filter((r) => !r.isCorrect)
  if (incorrects.length === 0) return null

  const messages: string[] = []
  for (const r of incorrects) {
    const n = r.strokeIndex + 1
    const firstExpected = r.expectedEndings[0]

    if (r.detectedEnding !== null && r.expectedEndings.includes(r.detectedEnding)) {
      // 種別は期待どおりなのに不正解 = 方向ミス（はね・はらいの向き）
      messages.push(MSG.stroke.wrongDirection[r.detectedEnding](n))
    } else if (r.detectedEnding !== null && firstExpected) {
      messages.push(
        MSG.stroke.wrongType(
          n,
          MSG.stroke.ending[r.detectedEnding],
          MSG.stroke.ending[firstExpected],
          MSG.stroke.action[firstExpected],
        ),
      )
    } else if (r.detectedEnding !== null) {
      messages.push(MSG.stroke.unexpectedType(n, MSG.stroke.ending[r.detectedEnding]))
    } else if (firstExpected) {
      messages.push(
        MSG.stroke.unknownWithExpected(
          n,
          MSG.stroke.ending[firstExpected],
          MSG.stroke.action[firstExpected],
        ),
      )
    } else {
      messages.push(MSG.stroke.unknown(n))
    }
  }

  return messages.join('\n')
}
