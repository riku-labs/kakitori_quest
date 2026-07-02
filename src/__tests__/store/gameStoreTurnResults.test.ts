// src/__tests__/store/gameStoreTurnResults.test.ts
// Issue #10: 間違い理由の表示が前のターンから持続する問題
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { StrokeEndingResult } from '../../types/game'

vi.mock('../../lib/soundManager', () => ({
  play: vi.fn(),
  setMuted: vi.fn(),
}))

import { useGameStore } from '../../store/gameStore'

const makeResult = (strokeIndex: number, isCorrect: boolean): StrokeEndingResult => ({
  strokeIndex,
  isCorrect,
  detectedEnding: 'tome',
  expectedEndings: ['hane'],
})

function resetStore() {
  useGameStore.setState({
    screen: 'game',
    currentEntry: { id: 'w', word: 'やま', reading: 'やま', hint: '⛰' },
    currentCharIndex: 0,
    hearts: 3,
    endingResults: [],
    currentTurnResults: [],
    battlePhase: 'writing',
    battleMessage: '',
    battleResult: null,
    isBossStage: false,
  })
}

describe('gameStore ターン単位の結果管理', () => {
  beforeEach(() => {
    resetStore()
  })

  it('onCharComplete は currentTurnResults にそのターンの結果のみをセットする', () => {
    const turn1 = [makeResult(0, false)]
    const turn2 = [makeResult(0, true), makeResult(1, true)]

    useGameStore.getState().onCharComplete(turn1)
    expect(useGameStore.getState().currentTurnResults).toEqual(turn1)

    useGameStore.getState().onCharComplete(turn2)
    expect(useGameStore.getState().currentTurnResults).toEqual(turn2)
  })

  it('endingResults は★計算のため累積し続ける', () => {
    const turn1 = [makeResult(0, false)]
    const turn2 = [makeResult(0, true)]

    useGameStore.getState().onCharComplete(turn1)
    useGameStore.getState().onCharComplete(turn2)
    expect(useGameStore.getState().endingResults).toEqual([...turn1, ...turn2])
  })

  it('startStage で currentTurnResults がクリアされる', () => {
    useGameStore.getState().onCharComplete([makeResult(0, false)])
    useGameStore.getState().startStage({ id: 'w2', word: 'かわ', reading: 'かわ', hint: '🏞' })
    expect(useGameStore.getState().currentTurnResults).toEqual([])
  })

  it('startBossStage で currentTurnResults がクリアされる', () => {
    useGameStore.getState().onCharComplete([makeResult(0, false)])
    useGameStore.getState().startBossStage('grade1')
    expect(useGameStore.getState().currentTurnResults).toEqual([])
  })
})
