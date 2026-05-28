# kakitori_quest Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ひらがな書き取り → 文字キャラ召喚 → 崩れた文字と自動バトル、のドラクエ風ゲームをブラウザで動かす。

**Architecture:** Zustand で画面状態・ゲーム状態を一元管理し、画面遷移はルーターを使わず store の `screen` フィールドで行う。ゲームロジック（精度計算・バトル判定・スター評価）は pure function として `src/logic/` に分離し、Vitest でテストする。kakitori の mount/unmount は `WritingArea` コンポーネントが責務を持つ。

**Tech Stack:** React 18 + Vite + TypeScript, Zustand (persist), @k1low/kakitori, Framer Motion, Vitest + React Testing Library, DotGothic16 (Google Fonts)

---

## ファイル構成

```
src/
  main.tsx                        # エントリポイント
  App.tsx                         # 画面ルーティング (screen state で分岐)
  types/
    game.ts                       # 全型定義
  data/
    wordList.ts                   # ひらがな単語 30〜50 語
  store/
    gameStore.ts                  # Zustand store
  logic/
    accuracyLogic.ts              # とめ/はね/はらい 精度計算
    battleLogic.ts                # バトル勝敗判定
    starLogic.ts                  # スター評価計算
  components/
    ui/
      DQWindow.tsx                # ドラクエ風ウィンドウ枠
      HeartDisplay.tsx            # ❤️ ハート表示
      StarRating.tsx              # ★ スター表示
    game/
      EnemyDisplay.tsx            # 崩れた文字（敵）表示
      CharacterDisplay.tsx        # 召喚キャラ表示
      MessageWindow.tsx           # DQ風メッセージウィンドウ
      BattleStage.tsx             # バトル画面全体
      WritingArea.tsx             # kakitori マウント・書き取りUI
      GameScreen.tsx              # 分割画面レイアウト
  screens/
    TitleScreen.tsx
    StageSelectScreen.tsx
    StageCompleteScreen.tsx
    GameOverScreen.tsx
  styles/
    global.css                    # DQ テーマ・フォント設定
src/__tests__/
  logic/
    accuracyLogic.test.ts
    battleLogic.test.ts
    starLogic.test.ts
```

---

## Task 1: プロジェクトスキャフォールド

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/styles/global.css`

- [ ] **Step 1: Vite プロジェクトを作成**

```bash
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: 依存パッケージをインストール**

```bash
npm install zustand @k1low/kakitori framer-motion
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: `vite.config.ts` にテスト設定を追加**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/kakitori_quest/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
```

- [ ] **Step 4: テストセットアップファイルを作成**

`src/__tests__/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: `src/styles/global.css` を作成**

```css
@import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');

:root {
  --color-bg: #000000;
  --color-window-border: #ffffff;
  --color-text: #ffffff;
  --color-text-dim: #aaaaaa;
  --color-accent: #ffd700;
  --color-hp: #ff4444;
  --color-summon: #7fff00;
  --color-enemy: #ff4444;
  --font-pixel: 'DotGothic16', 'MS Gothic', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-pixel);
  overflow: hidden;
}
```

- [ ] **Step 6: `src/main.tsx` を更新**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 7: 起動確認**

```bash
npm run dev
```

ブラウザで `http://localhost:5173/kakitori_quest/` が開き、黒画面になることを確認。

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "feat: scaffold vite+react+ts project with DQ theme"
```

---

## Task 2: 型定義と単語リスト

**Files:**
- Create: `src/types/game.ts`
- Create: `src/data/wordList.ts`

- [ ] **Step 1: `src/types/game.ts` を作成**

```typescript
// 画面識別子
export type Screen =
  | 'title'
  | 'stageSelect'
  | 'game'
  | 'stageComplete'
  | 'gameOver'

// 書き取りエリアの位置
export type WritingAreaPosition = 'right' | 'left' | 'bottom'

// とめ/はね/はらい の種別
export type EndingType = 'tome' | 'hane' | 'harai'

// 1画ぶんのとめ/はね/はらい結果
// ※ kakitori API 確認後に isCorrect の算出方法を確定する (Task 4 参照)
export interface StrokeEndingResult {
  strokeIndex: number
  detectedEnding: EndingType
  isCorrect: boolean   // kakitori が期待する ending と一致したか
}

// 崩れ文字スタイル（将来の拡張用差し込み口）
export type CorruptionStyle = 'default' | 'fire' | 'shadow' | 'shattered'

// 敵エンティティ
export interface Enemy {
  char: string
  corruptionStyle: CorruptionStyle
}

// ステージ1語ぶんの進捗
export interface StageProgress {
  word: string          // 例: "いぬ"
  currentCharIndex: number
  hearts: number
  endingResults: StrokeEndingResult[]  // 全文字通算
}

// ストアの永続化対象
export interface SaveData {
  clearedWords: Record<string, number>  // word -> best star count (1-3)
  writingAreaPosition: WritingAreaPosition
}

// バトルフェーズの状態
export type BattlePhase = 'writing' | 'battling' | 'won' | 'lost'
```

- [ ] **Step 2: `src/data/wordList.ts` を作成**

```typescript
export interface WordEntry {
  word: string     // ひらがな
  reading: string  // 同じ（将来漢字が入るときに分離）
  hint: string     // 画面表示用の意味ヒント（例: "🐕"）
}

export const WORD_LIST: WordEntry[] = [
  // 2文字
  { word: 'いぬ', reading: 'いぬ', hint: '🐕' },
  { word: 'ねこ', reading: 'ねこ', hint: '🐈' },
  { word: 'うみ', reading: 'うみ', hint: '🌊' },
  { word: 'やま', reading: 'やま', hint: '⛰️' },
  { word: 'かわ', reading: 'かわ', hint: '🏞️' },
  { word: 'はな', reading: 'はな', hint: '🌸' },
  { word: 'そら', reading: 'そら', hint: '🌤️' },
  { word: 'ほし', reading: 'ほし', hint: '⭐' },
  { word: 'つき', reading: 'つき', hint: '🌙' },
  { word: 'かぜ', reading: 'かぜ', hint: '💨' },
  { word: 'あめ', reading: 'あめ', hint: '🌧️' },
  { word: 'ゆき', reading: 'ゆき', hint: '❄️' },
  { word: 'ひ',   reading: 'ひ',   hint: '🔥' },
  { word: 'みず', reading: 'みず', hint: '💧' },
  { word: 'きの', reading: 'きの', hint: '🌳' },
  { word: 'とり', reading: 'とり', hint: '🐦' },
  { word: 'さな', reading: 'さな', hint: '🐟' },
  { word: 'むし', reading: 'むし', hint: '🐛' },
  // 3文字
  { word: 'さくら', reading: 'さくら', hint: '🌸🌸' },
  { word: 'かめ',   reading: 'かめ',   hint: '🐢' },
  { word: 'うさぎ', reading: 'うさぎ', hint: '🐰' },
  { word: 'くも',   reading: 'くも',   hint: '☁️' },
  { word: 'たいよ', reading: 'たいよ', hint: '☀️' },
  { word: 'なみ',   reading: 'なみ',   hint: '🌊🌊' },
  { word: 'もり',   reading: 'もり',   hint: '🌲🌲' },
  { word: 'いけ',   reading: 'いけ',   hint: '🪷' },
  { word: 'いわ',   reading: 'いわ',   hint: '🪨' },
  { word: 'しろ',   reading: 'しろ',   hint: '🏰' },
  { word: 'はし',   reading: 'はし',   hint: '🌉' },
  { word: 'みち',   reading: 'みち',   hint: '🛤️' },
  // 4文字
  { word: 'たいよう', reading: 'たいよう', hint: '☀️☀️' },
  { word: 'むらさき', reading: 'むらさき', hint: '💜' },
  { word: 'あおぞら', reading: 'あおぞら', hint: '🔵🌤️' },
  { word: 'こうのり', reading: 'こうのり', hint: '🦢' },
]
```

- [ ] **Step 3: コミット**

```bash
git add src/types/game.ts src/data/wordList.ts
git commit -m "feat: add game types and hiragana word list"
```

---

## Task 3: Zustand ゲームストア

**Files:**
- Create: `src/store/gameStore.ts`

- [ ] **Step 1: `src/store/gameStore.ts` を作成**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Screen,
  WritingAreaPosition,
  StrokeEndingResult,
  BattlePhase,
  SaveData,
} from '../types/game'
import { WORD_LIST, type WordEntry } from '../data/wordList'

const MAX_HEARTS = 3

interface GameStore extends SaveData {
  // 画面状態
  screen: Screen

  // 現在のステージ
  currentEntry: WordEntry | null
  currentCharIndex: number
  hearts: number
  endingResults: StrokeEndingResult[]
  battlePhase: BattlePhase
  battleMessage: string

  // アクション: 画面遷移
  goToTitle: () => void
  goToStageSelect: () => void
  startStage: (entry: WordEntry) => void

  // アクション: ゲームループ
  onStrokeMistake: () => void
  onCharComplete: (results: StrokeEndingResult[]) => void
  onBattleWin: () => void
  onBattleLose: () => void
  setBattleMessage: (msg: string) => void

  // アクション: 設定
  setWritingAreaPosition: (pos: WritingAreaPosition) => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 永続化対象の初期値
      clearedWords: {},
      writingAreaPosition: 'right',

      // セッション状態の初期値
      screen: 'title',
      currentEntry: null,
      currentCharIndex: 0,
      hearts: MAX_HEARTS,
      endingResults: [],
      battlePhase: 'writing',
      battleMessage: '',

      goToTitle: () => set({ screen: 'title' }),

      goToStageSelect: () => set({ screen: 'stageSelect' }),

      startStage: (entry) =>
        set({
          screen: 'game',
          currentEntry: entry,
          currentCharIndex: 0,
          hearts: MAX_HEARTS,
          endingResults: [],
          battlePhase: 'writing',
          battleMessage: `${entry.word[0]}があらわれた！`,
        }),

      onStrokeMistake: () => {
        const hearts = get().hearts - 1
        if (hearts <= 0) {
          // ハート0 → 単語の最初からリスタート
          set({
            hearts: MAX_HEARTS,
            currentCharIndex: 0,
            endingResults: [],
            battlePhase: 'writing',
            battleMessage: `やりなおし！${get().currentEntry!.word[0]}からはじめよう`,
          })
        } else {
          set({ hearts, battleMessage: 'まちがえた！' })
        }
      },

      onCharComplete: (results) => {
        set((state) => ({
          endingResults: [...state.endingResults, ...results],
          battlePhase: 'battling',
          battleMessage: 'バトル！',
        }))
      },

      onBattleWin: () => {
        const { currentEntry, currentCharIndex } = get()
        if (!currentEntry) return
        const nextIndex = currentCharIndex + 1

        if (nextIndex >= currentEntry.word.length) {
          // 全文字クリア → ステージクリア
          set({ screen: 'stageComplete', battlePhase: 'won' })
        } else {
          // 次の文字へ
          set({
            currentCharIndex: nextIndex,
            battlePhase: 'writing',
            battleMessage: `${currentEntry.word[nextIndex]}があらわれた！`,
          })
        }
      },

      onBattleLose: () => {
        const hearts = get().hearts - 1
        if (hearts <= 0) {
          set({ screen: 'gameOver', battlePhase: 'lost' })
        } else {
          set({
            hearts,
            battlePhase: 'writing',
            battleMessage: 'まけた…もういちど！',
          })
        }
      },

      setBattleMessage: (msg) => set({ battleMessage: msg }),

      setWritingAreaPosition: (pos) => set({ writingAreaPosition: pos }),
    }),
    {
      name: 'kakitori-quest-save-v1',
      partialize: (state) => ({
        clearedWords: state.clearedWords,
        writingAreaPosition: state.writingAreaPosition,
      }),
    },
  ),
)

// 単語リストのゲッター（store 外で使う）
export { WORD_LIST }
```

- [ ] **Step 2: コミット**

```bash
git add src/store/gameStore.ts
git commit -m "feat: add zustand game store with persist"
```

---

## Task 4: kakitori API 調査（プローブ）

**目的:** `onCorrectStroke` のデータ構造を実際に確認し、とめ/はね/はらいの正解判定方法を確定する。

**Files:**
- Create: `src/components/game/KakitoriProbe.tsx`

- [ ] **Step 1: `src/components/game/KakitoriProbe.tsx` を作成**

```typescript
import { useEffect, useRef, useState } from 'react'

// @k1low/kakitori の型は package の型定義を参照
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

export function KakitoriProbe() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `${new Date().toISOString().slice(11, 23)} ${msg}`])

  useEffect(() => {
    if (!hostRef.current) return
    let charInstance: AnyData = null

    const init = async () => {
      // kakitori の import 方法は package.json exports を確認する
      const kakitoriModule = await import('@k1low/kakitori')
      addLog(`kakitori exports: ${Object.keys(kakitoriModule).join(', ')}`)

      // char.create の存在を確認
      const char = kakitoriModule.char ?? kakitoriModule.default?.char
      if (!char) {
        addLog('ERROR: char not found in kakitori exports')
        return
      }

      charInstance = char.create('い')
      charInstance.mount(hostRef.current, {
        onCorrectStroke: (data: AnyData) => {
          addLog(`onCorrectStroke: ${JSON.stringify(data)}`)
        },
        onMistake: (data: AnyData) => {
          addLog(`onMistake: ${JSON.stringify(data)}`)
        },
        onComplete: (data: AnyData) => {
          addLog(`onComplete: ${JSON.stringify(data)}`)
        },
      })
    }

    init()
    return () => {
      charInstance?.unmount?.()
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace' }}>
      <div ref={hostRef} style={{ width: '50%', border: '1px solid #333' }} />
      <div style={{ width: '50%', padding: '8px', overflowY: 'auto', fontSize: '11px' }}>
        <div style={{ color: '#ffd700', marginBottom: '8px' }}>kakitori API probe — 「い」を書いてください</div>
        {log.map((l, i) => <div key={i} style={{ borderBottom: '1px solid #222', padding: '2px 0' }}>{l}</div>)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `src/App.tsx` を一時的にプローブ表示に変更**

```typescript
import { KakitoriProbe } from './components/game/KakitoriProbe'

export default function App() {
  return <KakitoriProbe />
}
```

- [ ] **Step 3: 起動してブラウザで「い」を書き、ログを確認**

```bash
npm run dev
```

確認すべき項目:
- `onCorrectStroke` の `data` に何が入っているか
- `data.ending` の構造（`type`, `correct` など）
- `onComplete` の `data` に何が入っているか
- とめ/はね/はらいの「正解判定」がどこで提供されているか

- [ ] **Step 4: 確認結果に基づいて `src/types/game.ts` の `StrokeEndingResult` を更新**

kakitori が `data.ending.correct: boolean` を返す場合:
```typescript
export interface StrokeEndingResult {
  strokeIndex: number
  detectedEnding: EndingType
  isCorrect: boolean   // data.ending.correct をそのまま使う
}
```

kakitori が ending の正誤を返さない場合（detected type のみ）:
```typescript
// isCorrect は常に true として扱い、精度はミス回数ベースに変更
// → battleLogic.ts の設計を見直す（Task 5 で対応）
```

- [ ] **Step 5: 調査結果をコメントとして `src/types/game.ts` に記録してコミット**

```bash
git add src/types/game.ts src/components/game/KakitoriProbe.tsx
git commit -m "feat: add kakitori probe and update types based on API findings"
```

---

## Task 5: ゲームロジック（TDD）

**Files:**
- Create: `src/logic/accuracyLogic.ts`
- Create: `src/logic/battleLogic.ts`
- Create: `src/logic/starLogic.ts`
- Create: `src/__tests__/logic/accuracyLogic.test.ts`
- Create: `src/__tests__/logic/battleLogic.test.ts`
- Create: `src/__tests__/logic/starLogic.test.ts`

> ⚠️ Task 4 の調査結果で `StrokeEndingResult.isCorrect` の算出方法が変わる。以下は `isCorrect` が正しく入っている前提で進める。

- [ ] **Step 1: `accuracyLogic.ts` のテストを書く**

`src/__tests__/logic/accuracyLogic.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateAccuracy } from '../../logic/accuracyLogic'
import type { StrokeEndingResult } from '../../types/game'

const makeResult = (strokeIndex: number, isCorrect: boolean): StrokeEndingResult => ({
  strokeIndex,
  detectedEnding: 'tome',
  isCorrect,
})

describe('calculateAccuracy', () => {
  it('全画正解なら 1.0 を返す', () => {
    const results = [makeResult(0, true), makeResult(1, true)]
    expect(calculateAccuracy(results)).toBe(1.0)
  })

  it('全画不正解なら 0.0 を返す', () => {
    const results = [makeResult(0, false), makeResult(1, false)]
    expect(calculateAccuracy(results)).toBe(0.0)
  })

  it('2画中1画正解なら 0.5 を返す', () => {
    const results = [makeResult(0, true), makeResult(1, false)]
    expect(calculateAccuracy(results)).toBe(0.5)
  })

  it('結果が空のとき 0.0 を返す', () => {
    expect(calculateAccuracy([])).toBe(0.0)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx vitest run src/__tests__/logic/accuracyLogic.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: `src/logic/accuracyLogic.ts` を実装**

```typescript
import type { StrokeEndingResult } from '../types/game'

export function calculateAccuracy(results: StrokeEndingResult[]): number {
  if (results.length === 0) return 0.0
  const correct = results.filter((r) => r.isCorrect).length
  return correct / results.length
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx vitest run src/__tests__/logic/accuracyLogic.test.ts
```

Expected: PASS

- [ ] **Step 5: `battleLogic.ts` のテストを書く**

`src/__tests__/logic/battleLogic.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { resolveBattle, BATTLE_WIN_THRESHOLD } from '../../logic/battleLogic'
import type { StrokeEndingResult } from '../../types/game'

const makeResult = (isCorrect: boolean): StrokeEndingResult => ({
  strokeIndex: 0,
  detectedEnding: 'tome',
  isCorrect,
})

describe('resolveBattle', () => {
  it('精度が閾値以上なら win を返す', () => {
    // 全画正解 = accuracy 1.0
    const results = [makeResult(true), makeResult(true)]
    expect(resolveBattle(results)).toBe('win')
  })

  it('精度が閾値未満なら lose を返す', () => {
    // 全画不正解 = accuracy 0.0
    const results = [makeResult(false), makeResult(false)]
    expect(resolveBattle(results)).toBe('lose')
  })

  it('閾値ちょうどなら win を返す', () => {
    // BATTLE_WIN_THRESHOLD が 0.6 の場合: 3画中2画正解 ≈ 0.667 → win
    const results = [makeResult(true), makeResult(true), makeResult(false)]
    expect(resolveBattle(results)).toBe('win')
  })

  it('結果が空なら lose を返す', () => {
    expect(resolveBattle([])).toBe('lose')
  })
})
```

- [ ] **Step 6: テストが失敗することを確認**

```bash
npx vitest run src/__tests__/logic/battleLogic.test.ts
```

Expected: FAIL

- [ ] **Step 7: `src/logic/battleLogic.ts` を実装**

> ⚠️ `BATTLE_WIN_THRESHOLD` の値は Task 4 の調査結果に基づいて調整する。kakitori の ending 正解率が厳しすぎる場合は下げる。

```typescript
import { calculateAccuracy } from './accuracyLogic'
import type { StrokeEndingResult } from '../types/game'

// Task 4 の kakitori API 調査後に調整する
export const BATTLE_WIN_THRESHOLD = 0.6

export function resolveBattle(
  results: StrokeEndingResult[],
  threshold = BATTLE_WIN_THRESHOLD,
): 'win' | 'lose' {
  const accuracy = calculateAccuracy(results)
  return accuracy >= threshold ? 'win' : 'lose'
}
```

- [ ] **Step 8: テストが通ることを確認**

```bash
npx vitest run src/__tests__/logic/battleLogic.test.ts
```

Expected: PASS

- [ ] **Step 9: `starLogic.ts` のテストを書く**

`src/__tests__/logic/starLogic.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateStars } from '../../logic/starLogic'
import type { StrokeEndingResult } from '../../types/game'

const allCorrect = (n: number): StrokeEndingResult[] =>
  Array.from({ length: n }, (_, i) => ({ strokeIndex: i, detectedEnding: 'tome' as const, isCorrect: true }))

const allWrong = (n: number): StrokeEndingResult[] =>
  Array.from({ length: n }, (_, i) => ({ strokeIndex: i, detectedEnding: 'tome' as const, isCorrect: false }))

describe('calculateStars', () => {
  it('全画正解なら ★3 を返す', () => {
    expect(calculateStars(allCorrect(4))).toBe(3)
  })

  it('全画不正解でもクリアなら ★1 を返す', () => {
    expect(calculateStars(allWrong(4))).toBe(1)
  })

  it('accuracy 0.5 なら ★2 を返す', () => {
    const results = [...allCorrect(2), ...allWrong(2)]
    expect(calculateStars(results)).toBe(2)
  })
})
```

- [ ] **Step 10: テストが失敗することを確認**

```bash
npx vitest run src/__tests__/logic/starLogic.test.ts
```

Expected: FAIL

- [ ] **Step 11: `src/logic/starLogic.ts` を実装**

```typescript
import { calculateAccuracy } from './accuracyLogic'
import type { StrokeEndingResult } from '../types/game'

// Task 4 の調査結果に基づいて調整する
const STAR3_THRESHOLD = 0.9
const STAR2_THRESHOLD = 0.5

export function calculateStars(results: StrokeEndingResult[]): 1 | 2 | 3 {
  const accuracy = calculateAccuracy(results)
  if (accuracy >= STAR3_THRESHOLD) return 3
  if (accuracy >= STAR2_THRESHOLD) return 2
  return 1
}
```

- [ ] **Step 12: 全テストが通ることを確認**

```bash
npx vitest run src/__tests__/logic/
```

Expected: 全 PASS

- [ ] **Step 13: コミット**

```bash
git add src/logic/ src/__tests__/
git commit -m "feat: add game logic with tests (accuracy, battle, star)"
```

---

## Task 6: ベース UI コンポーネント

**Files:**
- Create: `src/components/ui/DQWindow.tsx`
- Create: `src/components/ui/HeartDisplay.tsx`
- Create: `src/components/ui/StarRating.tsx`

- [ ] **Step 1: `src/components/ui/DQWindow.tsx` を作成**

```typescript
import type { ReactNode, CSSProperties } from 'react'

interface DQWindowProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function DQWindow({ children, style, className }: DQWindowProps) {
  return (
    <div
      className={className}
      style={{
        border: '3px solid var(--color-window-border)',
        background: '#000',
        padding: '12px',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: `src/components/ui/HeartDisplay.tsx` を作成**

```typescript
interface HeartDisplayProps {
  current: number
  max: number
}

export function HeartDisplay({ current, max }: HeartDisplayProps) {
  return (
    <div style={{ display: 'flex', gap: '4px', fontSize: '1.2em' }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{ color: i < current ? 'var(--color-hp)' : '#333' }}
        >
          ❤
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: `src/components/ui/StarRating.tsx` を作成**

```typescript
interface StarRatingProps {
  stars: 1 | 2 | 3
}

export function StarRating({ stars }: StarRatingProps) {
  return (
    <div style={{ display: 'flex', gap: '4px', fontSize: '1.8em' }}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          style={{ color: n <= stars ? 'var(--color-accent)' : '#333' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add src/components/ui/
git commit -m "feat: add DQWindow, HeartDisplay, StarRating UI components"
```

---

## Task 7: WritingArea コンポーネント（kakitori 統合）

**Files:**
- Create: `src/components/game/WritingArea.tsx`

- [ ] **Step 1: `src/components/game/WritingArea.tsx` を作成**

> ⚠️ kakitori の import パスは Task 4 で確認したものに合わせて調整すること。

```typescript
import { useEffect, useRef, useCallback } from 'react'
import type { StrokeEndingResult, EndingType } from '../../types/game'
import { HeartDisplay } from '../ui/HeartDisplay'

interface WritingAreaProps {
  char: string
  hearts: number
  maxHearts: number
  onMistake: () => void
  onComplete: (results: StrokeEndingResult[]) => void
}

export function WritingArea({
  char,
  hearts,
  maxHearts,
  onMistake,
  onComplete,
}: WritingAreaProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  // 1文字ぶんの画結果を蓄積する
  const strokeResultsRef = useRef<StrokeEndingResult[]>([])
  const strokeIndexRef = useRef(0)

  const handleComplete = useCallback(() => {
    onComplete(strokeResultsRef.current)
  }, [onComplete])

  useEffect(() => {
    if (!hostRef.current) return

    strokeResultsRef.current = []
    strokeIndexRef.current = 0

    let charInstance: ReturnType<typeof import('@k1low/kakitori')['char']['create']> | null = null

    const init = async () => {
      // ⚠️ Task 4 の調査で確定した import 方法に合わせる
      const { char: kakitoriChar } = await import('@k1low/kakitori')

      charInstance = kakitoriChar.create(char)
      charInstance.mount(hostRef.current!, {
        onCorrectStroke: (data) => {
          // ⚠️ data の構造は Task 4 で確認して調整する
          // data.ending.type: EndingType
          // data.ending.correct: boolean (存在すれば使う、なければ true とする)
          const result: StrokeEndingResult = {
            strokeIndex: strokeIndexRef.current++,
            detectedEnding: (data?.ending?.type ?? 'tome') as EndingType,
            isCorrect: data?.ending?.correct ?? true,
          }
          strokeResultsRef.current.push(result)
        },
        onMistake: () => {
          onMistake()
        },
        onComplete: () => {
          handleComplete()
        },
      })
    }

    init()

    return () => {
      charInstance?.unmount?.()
    }
  }, [char, onMistake, handleComplete])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '3px solid var(--color-window-border)',
        background: '#000',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: '4px 8px',
          borderBottom: '2px solid var(--color-window-border)',
          color: 'var(--color-accent)',
          fontSize: '0.8em',
        }}
      >
        「{char}」をかけ！
      </div>

      {/* kakitori マウント先 */}
      <div
        ref={hostRef}
        style={{ flex: 1, position: 'relative' }}
      />

      {/* ハート表示 */}
      <div
        style={{
          padding: '6px 8px',
          borderTop: '2px solid var(--color-window-border)',
        }}
      >
        <HeartDisplay current={hearts} max={maxHearts} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 動作確認（`App.tsx` を一時変更してテスト）**

```typescript
// App.tsx (一時)
import { WritingArea } from './components/game/WritingArea'

export default function App() {
  return (
    <div style={{ height: '100vh', padding: '20px' }}>
      <WritingArea
        char="い"
        hearts={3}
        maxHearts={3}
        onMistake={() => console.log('mistake!')}
        onComplete={(r) => console.log('complete:', r)}
      />
    </div>
  )
}
```

```bash
npm run dev
```

- 「い」が表示されて書き取れること
- ミス時に `onMistake` が呼ばれること
- 完成時に `onComplete` が StrokeEndingResult[] と共に呼ばれること を確認。

- [ ] **Step 3: コミット**

```bash
git add src/components/game/WritingArea.tsx
git commit -m "feat: add WritingArea component with kakitori integration"
```

---

## Task 8: バトル表示コンポーネント

**Files:**
- Create: `src/components/game/EnemyDisplay.tsx`
- Create: `src/components/game/CharacterDisplay.tsx`
- Create: `src/components/game/MessageWindow.tsx`
- Create: `src/components/game/BattleStage.tsx`

- [ ] **Step 1: `src/components/game/EnemyDisplay.tsx` を作成**

```typescript
import type { CorruptionStyle } from '../../types/game'

interface EnemyDisplayProps {
  char: string
  corruptionStyle: CorruptionStyle
}

const corruptionStyles: Record<CorruptionStyle, React.CSSProperties> = {
  default: {
    filter: 'hue-rotate(160deg) brightness(0.8) contrast(1.5)',
    transform: 'scaleX(-1)',
    color: 'var(--color-enemy)',
    textShadow: '2px 2px 0 #000, 0 0 8px #ff0000',
  },
  fire: {
    filter: 'hue-rotate(160deg) brightness(0.8) contrast(1.5)',
    transform: 'scaleX(-1)',
    color: '#ff6600',
    textShadow: '0 0 12px #ff3300',
  },
  shadow: {
    filter: 'brightness(0.3) contrast(2)',
    transform: 'scaleX(-1)',
    color: '#440044',
    textShadow: '0 0 8px #9900ff',
  },
  shattered: {
    filter: 'hue-rotate(160deg) brightness(0.8) contrast(1.5)',
    transform: 'scaleX(-1) rotate(15deg)',
    color: 'var(--color-enemy)',
    opacity: 0.8,
  },
}

export function EnemyDisplay({ char, corruptionStyle }: EnemyDisplayProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: '4em',
          fontFamily: 'serif',
          lineHeight: 1,
          display: 'inline-block',
          ...corruptionStyles[corruptionStyle],
        }}
      >
        {char}
      </div>
      <div style={{ color: 'var(--color-enemy)', fontSize: '0.7em', marginTop: '4px' }}>
        まがった「{char}」
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `src/components/game/CharacterDisplay.tsx` を作成**

```typescript
interface CharacterDisplayProps {
  char: string
  accuracy: number  // 0.0 〜 1.0
  visible: boolean  // 書き終わるまでは非表示
}

export function CharacterDisplay({ char, accuracy, visible }: CharacterDisplayProps) {
  const strength = Math.round(accuracy * 100)
  const color =
    accuracy >= 0.9
      ? '#7fff00'
      : accuracy >= 0.6
        ? '#ffd700'
        : '#ff8844'

  return (
    <div style={{ textAlign: 'center', opacity: visible ? 1 : 0.2 }}>
      <div
        style={{
          fontSize: '4em',
          fontFamily: 'serif',
          lineHeight: 1,
          color,
          textShadow: `0 0 12px ${color}`,
        }}
      >
        {char}
      </div>
      {visible && (
        <div style={{ color, fontSize: '0.65em', marginTop: '4px' }}>
          ちから {strength}%
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: `src/components/game/MessageWindow.tsx` を作成**

```typescript
import { DQWindow } from '../ui/DQWindow'

interface MessageWindowProps {
  message: string
}

export function MessageWindow({ message }: MessageWindowProps) {
  return (
    <DQWindow style={{ minHeight: '60px' }}>
      <p style={{ fontSize: '0.9em', lineHeight: 1.8, color: 'var(--color-text)' }}>
        {message}
      </p>
    </DQWindow>
  )
}
```

- [ ] **Step 4: `src/components/game/BattleStage.tsx` を作成**

```typescript
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StrokeEndingResult } from '../../types/game'
import { resolveBattle } from '../../logic/battleLogic'
import { calculateAccuracy } from '../../logic/accuracyLogic'
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
    setBattleMessage,
    onBattleWin,
    onBattleLose,
    onCharComplete,
  } = useGameStore()

  const char = currentEntry?.word[currentCharIndex] ?? ''
  const accuracy = calculateAccuracy(endingResults)

  // バトルフェーズに入ったら 1.5 秒後に自動決着
  useEffect(() => {
    if (battlePhase !== 'battling') return

    const result = resolveBattle(endingResults)
    const timer = setTimeout(() => {
      if (result === 'win') {
        setBattleMessage(`${char}は かちのこった！`)
        setTimeout(onBattleWin, 800)
      } else {
        setBattleMessage(`まがった「${char}」の かちだ…`)
        setTimeout(onBattleLose, 800)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [battlePhase, char, endingResults, onBattleWin, onBattleLose, setBattleMessage])

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
      {/* バトルエリア */}
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
            key={`enemy-${char}`}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <EnemyDisplay char={char} corruptionStyle="default" />
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
            visible={battlePhase === 'battling' || battlePhase === 'won'}
          />
        </motion.div>
      </div>

      {/* メッセージ */}
      <MessageWindow message={battleMessage} />
    </div>
  )
}
```

- [ ] **Step 5: コミット**

```bash
git add src/components/game/
git commit -m "feat: add battle display components (enemy, character, message, stage)"
```

---

## Task 9: GameScreen（分割画面）

**Files:**
- Create: `src/components/game/GameScreen.tsx`

- [ ] **Step 1: `src/components/game/GameScreen.tsx` を作成**

```typescript
import { useCallback } from 'react'
import type { StrokeEndingResult } from '../../types/game'
import { useGameStore } from '../../store/gameStore'
import { BattleStage } from './BattleStage'
import { WritingArea } from './WritingArea'

export function GameScreen() {
  const {
    currentEntry,
    currentCharIndex,
    hearts,
    battlePhase,
    writingAreaPosition,
    onStrokeMistake,
    onCharComplete,
  } = useGameStore()

  const char = currentEntry?.word[currentCharIndex] ?? ''

  const handleComplete = useCallback(
    (results: StrokeEndingResult[]) => {
      onCharComplete(results)
    },
    [onCharComplete],
  )

  const writingPanel = battlePhase === 'writing' && (
    <div
      style={{
        flex: writingAreaPosition === 'bottom' ? 'none' : 1,
        height: writingAreaPosition === 'bottom' ? '45%' : '100%',
      }}
    >
      <WritingArea
        char={char}
        hearts={hearts}
        maxHearts={3}
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

  if (writingAreaPosition === 'bottom') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {battlePanel}
        {writingPanel}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {writingAreaPosition === 'left' ? (
        <>
          {writingPanel}
          {battlePanel}
        </>
      ) : (
        <>
          {battlePanel}
          {writingPanel}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: `App.tsx` を一時変更して動作確認**

```typescript
import { useEffect } from 'react'
import { GameScreen } from './components/game/GameScreen'
import { useGameStore } from './store/gameStore'
import { WORD_LIST } from './data/wordList'

export default function App() {
  const startStage = useGameStore((s) => s.startStage)
  useEffect(() => { startStage(WORD_LIST[0]) }, [startStage])
  return <GameScreen />
}
```

```bash
npm run dev
```

「いぬ」の「い」を書いてバトルが起き、次の「ぬ」に進めることを確認。

- [ ] **Step 3: コミット**

```bash
git add src/components/game/GameScreen.tsx
git commit -m "feat: add split-screen GameScreen with configurable writing area position"
```

---

## Task 10: タイトル・ステージ選択画面

**Files:**
- Create: `src/screens/TitleScreen.tsx`
- Create: `src/screens/StageSelectScreen.tsx`

- [ ] **Step 1: `src/screens/TitleScreen.tsx` を作成**

```typescript
import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'

export function TitleScreen() {
  const goToStageSelect = useGameStore((s) => s.goToStageSelect)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
      }}
    >
      <DQWindow style={{ width: '320px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '2em',
            color: 'var(--color-accent)',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}
        >
          かきとり
        </h1>
        <div
          style={{
            fontSize: '1.2em',
            color: 'var(--color-text-dim)',
            marginBottom: '32px',
            letterSpacing: '2px',
          }}
        >
          QUEST
        </div>
        <button
          onClick={goToStageSelect}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '1em',
            padding: '8px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        >
          ▶　あそぶ
        </button>
      </DQWindow>
    </div>
  )
}
```

- [ ] **Step 2: `src/screens/StageSelectScreen.tsx` を作成**

```typescript
import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import { WORD_LIST } from '../data/wordList'

export function StageSelectScreen() {
  const { startStage, clearedWords, goToTitle } = useGameStore()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        padding: '16px',
      }}
    >
      <DQWindow style={{ width: '360px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            color: 'var(--color-accent)',
            fontSize: '0.9em',
            marginBottom: '12px',
            borderBottom: '1px solid #333',
            paddingBottom: '8px',
          }}
        >
          ことばをえらぼう
        </div>

        {/* 単語リスト */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {WORD_LIST.map((entry) => {
            const bestStar = clearedWords[entry.word] ?? 0
            return (
              <button
                key={entry.word}
                onClick={() => startStage(entry)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #1a1a1a',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '1em',
                  padding: '10px 8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#111')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: '1.4em' }}>{entry.hint}</span>
                <span style={{ flex: 1 }}>{entry.word}</span>
                <span style={{ color: 'var(--color-accent)', fontSize: '0.8em' }}>
                  {bestStar > 0 ? '★'.repeat(bestStar) + '☆'.repeat(3 - bestStar) : '　　　'}
                </span>
              </button>
            )
          })}
        </div>

        {/* 戻るボタン */}
        <button
          onClick={goToTitle}
          style={{
            marginTop: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-dim)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.8em',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ◀　もどる
        </button>
      </DQWindow>
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add src/screens/TitleScreen.tsx src/screens/StageSelectScreen.tsx
git commit -m "feat: add TitleScreen and StageSelectScreen"
```

---

## Task 11: ステージクリア・ゲームオーバー画面

**Files:**
- Create: `src/screens/StageCompleteScreen.tsx`
- Create: `src/screens/GameOverScreen.tsx`

- [ ] **Step 1: `src/screens/StageCompleteScreen.tsx` を作成**

```typescript
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { DQWindow } from '../components/ui/DQWindow'
import { StarRating } from '../components/ui/StarRating'
import { useGameStore } from '../store/gameStore'
import { calculateStars } from '../logic/starLogic'

export function StageCompleteScreen() {
  const { currentEntry, endingResults, clearedWords, goToStageSelect } = useGameStore()
  const stars = calculateStars(endingResults)
  const word = currentEntry?.word ?? ''

  // ベストスターを更新
  useEffect(() => {
    const prev = clearedWords[word] ?? 0
    if (stars > prev) {
      useGameStore.setState((s) => ({
        clearedWords: { ...s.clearedWords, [word]: stars },
      }))
    }
  }, [word, stars, clearedWords])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <DQWindow style={{ width: '300px', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-accent)', fontSize: '1.4em', marginBottom: '16px' }}>
            クリア！
          </div>
          <div style={{ fontSize: '2em', marginBottom: '8px' }}>
            {word}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <StarRating stars={stars} />
          </div>
          <button
            onClick={goToStageSelect}
            style={{
              display: 'block',
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '1em',
              padding: '8px',
              cursor: 'pointer',
            }}
          >
            ▶　もどる
          </button>
        </DQWindow>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: `src/screens/GameOverScreen.tsx` を作成**

```typescript
import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'

export function GameOverScreen() {
  const { currentEntry, startStage } = useGameStore()

  const handleRetry = () => {
    if (currentEntry) startStage(currentEntry)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
      }}
    >
      <DQWindow style={{ width: '300px', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-hp)', fontSize: '1.4em', marginBottom: '16px' }}>
          ゲームオーバー
        </div>
        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.8em', marginBottom: '24px' }}>
          {currentEntry?.word ?? ''} をもういちどためそう
        </div>
        <button
          onClick={handleRetry}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '1em',
            padding: '8px',
            cursor: 'pointer',
          }}
        >
          ▶　やりなおす
        </button>
      </DQWindow>
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add src/screens/StageCompleteScreen.tsx src/screens/GameOverScreen.tsx
git commit -m "feat: add StageCompleteScreen and GameOverScreen"
```

---

## Task 12: App.tsx（画面ルーティング）

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/App.tsx` を完成させる**

```typescript
import { useGameStore } from './store/gameStore'
import { TitleScreen } from './screens/TitleScreen'
import { StageSelectScreen } from './screens/StageSelectScreen'
import { GameScreen } from './components/game/GameScreen'
import { StageCompleteScreen } from './screens/StageCompleteScreen'
import { GameOverScreen } from './screens/GameOverScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  switch (screen) {
    case 'title':       return <TitleScreen />
    case 'stageSelect': return <StageSelectScreen />
    case 'game':        return <GameScreen />
    case 'stageComplete': return <StageCompleteScreen />
    case 'gameOver':    return <GameOverScreen />
    default:            return <TitleScreen />
  }
}
```

- [ ] **Step 2: 通しプレイを確認**

```bash
npm run dev
```

以下の流れを手動で確認:
1. タイトル画面が表示される
2. 「あそぶ」→ ステージ選択画面
3. 単語を選択 → 書き取り画面（分割）
4. 文字を書く → バトル → 次の文字
5. 全文字クリア → スター評価画面
6. 「もどる」→ ステージ選択画面
7. ミスを繰り返してハート0 → ゲームオーバー画面
8. 「やりなおす」→ 同じ単語から再スタート

- [ ] **Step 3: `KakitoriProbe.tsx` を削除**

```bash
rm src/components/game/KakitoriProbe.tsx
```

- [ ] **Step 4: コミット**

```bash
git add src/App.tsx
git rm src/components/game/KakitoriProbe.tsx
git commit -m "feat: wire up App.tsx screen routing, remove probe component"
```

---

## Task 13: 書き取りエリア位置設定 UI

**Files:**
- Create: `src/screens/SettingsScreen.tsx`
- Modify: `src/screens/TitleScreen.tsx`
- Modify: `src/store/gameStore.ts`（goToSettings / goBackFromSettings アクション追加）

- [ ] **Step 1: `gameStore.ts` に設定画面への遷移アクションを追加**

```typescript
// Screen 型に 'settings' を追加（types/game.ts）
export type Screen = 'title' | 'stageSelect' | 'game' | 'stageComplete' | 'gameOver' | 'settings'

// gameStore.ts に追加
goToSettings: () => set({ screen: 'settings' }),
```

- [ ] **Step 2: `src/screens/SettingsScreen.tsx` を作成**

```typescript
import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import type { WritingAreaPosition } from '../types/game'

const POSITIONS: { value: WritingAreaPosition; label: string }[] = [
  { value: 'right', label: 'みぎ' },
  { value: 'left',  label: 'ひだり' },
  { value: 'bottom', label: 'した' },
]

export function SettingsScreen() {
  const { writingAreaPosition, setWritingAreaPosition, goToTitle } = useGameStore()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
      }}
    >
      <DQWindow style={{ width: '300px' }}>
        <div style={{ color: 'var(--color-accent)', marginBottom: '16px', fontSize: '0.9em' }}>
          せってい
        </div>

        <div style={{ marginBottom: '8px', fontSize: '0.8em', color: 'var(--color-text-dim)' }}>
          かきとりエリアのいち
        </div>

        {POSITIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setWritingAreaPosition(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              background: 'none',
              border: 'none',
              color: writingAreaPosition === value ? 'var(--color-accent)' : 'var(--color-text)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '1em',
              padding: '8px',
              cursor: 'pointer',
            }}
          >
            {writingAreaPosition === value ? '▶' : '　'} {label}
          </button>
        ))}

        <button
          onClick={goToTitle}
          style={{
            marginTop: '24px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-dim)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.8em',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ◀　もどる
        </button>
      </DQWindow>
    </div>
  )
}
```

- [ ] **Step 3: `TitleScreen.tsx` に「せってい」ボタンを追加**

```typescript
// TitleScreen.tsx の ▶ あそぶ の下に追加
const goToSettings = useGameStore((s) => s.goToSettings)

// JSX に追加
<button onClick={goToSettings} style={/* 同じスタイル */}>
  　　せってい
</button>
```

- [ ] **Step 4: `App.tsx` に settings ケースを追加**

```typescript
case 'settings': return <SettingsScreen />
```

- [ ] **Step 5: 動作確認**

設定画面で「ひだり」を選択後、ゲームをプレイして書き取りエリアが左に来ることを確認。

- [ ] **Step 6: コミット**

```bash
git add src/screens/SettingsScreen.tsx src/screens/TitleScreen.tsx src/App.tsx src/store/gameStore.ts src/types/game.ts
git commit -m "feat: add settings screen for writing area position"
```

---

## Task 14: GitHub Pages デプロイ設定

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: `.github/workflows/deploy.yml` を作成**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 2: GitHub リポジトリの Pages 設定を有効化**

GitHub リポジトリ → Settings → Pages → Source: `GitHub Actions` を選択。

- [ ] **Step 3: `npm run build` がローカルで通ることを確認**

```bash
npm run build
```

Expected: `dist/` ディレクトリが生成される。エラーなし。

- [ ] **Step 4: コミットしてプッシュ**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Pages deploy workflow"
git push origin main
```

- [ ] **Step 5: GitHub Actions が成功することを確認**

GitHub リポジトリの Actions タブで deploy ジョブが緑になることを確認。
`https://<username>.github.io/kakitori_quest/` でアクセスできることを確認。

---

## 完了チェックリスト

- [ ] ひらがな文字を書いてバトルが発生する
- [ ] とめ/はね/はらいの精度でバトル勝敗が決まる
- [ ] ハートが正しく消費・リセットされる
- [ ] 単語クリアでスター評価が表示される
- [ ] クリア記録（ベストスター）がリロード後も保持される
- [ ] 書き取りエリア位置が左/右/下に切り替わる
- [ ] GitHub Pages でアクセスできる
- [ ] `npm run test` が全 PASS
