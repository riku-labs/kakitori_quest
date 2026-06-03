# UX フィードバック対応 第2弾 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プレイテスト第2回の3件フィードバック（文字表示の薄化・2文字問題・バトル後タップ待ち・正しい終端表示）を実装する

**Architecture:** 変更Cで型を拡張してTDD→変更AでWritingAreaを修正→変更BでBattlePhaseを拡張しstoreとUIを更新、という依存順で実装する。純粋関数は TDD、UIコンポーネントはユニットテストなしで統合確認。

**Tech Stack:** React 18, TypeScript, Zustand, @k1low/kakitori (hanzi-writer ベース), Vitest, Vite

---

## ファイルマップ

| ファイル | 変更内容 |
|---|---|
| `src/types/game.ts` | `StrokeEndingResult` に `expectedEndings` 追加、`BattlePhase` に `'feedback'` 追加 |
| `src/__tests__/logic/strokeFeedback.test.ts` | `makeResult` ヘルパー更新、新フォーマットのテスト追加 |
| `src/logic/strokeFeedback.ts` | `expectedEndings` 対応のフォーマット分岐 |
| `src/components/game/WritingArea.tsx` | `expectedEndings` キャプチャ、`size` 計算、`opacity` dim/bright |
| `src/store/gameStore.ts` | `battleResult` フィールド、`setBattleFeedback`・`confirmBattle` アクション追加 |
| `src/components/game/BattleStage.tsx` | `setBattleFeedback` 呼び出しへ変更、`feedback` フェーズUI追加 |

---

## Task 1: StrokeEndingResult 型に expectedEndings を追加

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/__tests__/logic/strokeFeedback.test.ts`

- [ ] **Step 1: `StrokeEndingResult` に `expectedEndings` を追加**

`src/types/game.ts` の `StrokeEndingResult` を以下に変更：

```typescript
export interface StrokeEndingResult {
  strokeIndex: number
  detectedEnding: EndingType | null
  isCorrect: boolean
  expectedEndings: EndingType[]  // 追加: kakitori の strokeEnding.expected からマッピング
}
```

- [ ] **Step 2: テストヘルパーを更新**

`src/__tests__/logic/strokeFeedback.test.ts` の `makeResult` を更新（既存テストは変更不要）：

```typescript
const makeResult = (
  strokeIndex: number,
  isCorrect: boolean,
  detectedEnding: StrokeEndingResult['detectedEnding'] = null,
  expectedEndings: EndingType[] = [],
): StrokeEndingResult => ({ strokeIndex, isCorrect, detectedEnding, expectedEndings })
```

`import type` 行に `EndingType` を追加：

```typescript
import type { StrokeEndingResult, EndingType } from '../../types/game'
```

- [ ] **Step 3: テストがまだパスすることを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test
```

期待出力: `Tests 23 passed (23)`

- [ ] **Step 4: コミット**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
git add src/types/game.ts src/__tests__/logic/strokeFeedback.test.ts
git commit -m "feat: add expectedEndings to StrokeEndingResult type"
```

---

## Task 2: buildStrokeFeedback を TDD で更新（変更C）

**Files:**
- Modify: `src/__tests__/logic/strokeFeedback.test.ts`
- Modify: `src/logic/strokeFeedback.ts`

- [ ] **Step 1: 失敗するテストを追加**

`src/__tests__/logic/strokeFeedback.test.ts` に以下のテストを追加（既存テストの後）：

```typescript
  it('expectedEndings がある場合は「ではなく〇〇にしましょう」形式を返す', () => {
    const results = [makeResult(0, false, 'harai', ['tome'])]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：はらいではなくとめにしましょう')
  })

  it('expectedEndings が複数ある場合は最初の1つを使う', () => {
    const results = [makeResult(0, false, 'hane', ['tome', 'harai'])]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：はねではなくとめにしましょう')
  })

  it('expectedEndings が空の場合は「になっています」フォールバックを返す', () => {
    const results = [makeResult(0, false, 'tome', [])]
    expect(buildStrokeFeedback(results)).toBe('1かくめ：とめになっています')
  })

  it('複数不正解で expectedEndings あり・なし混在を処理する', () => {
    const results = [
      makeResult(0, false, 'harai', ['tome']),
      makeResult(1, true, 'tome'),
      makeResult(2, false, 'hane', []),
    ]
    expect(buildStrokeFeedback(results)).toBe(
      '1かくめ：はらいではなくとめにしましょう\n3かくめ：はねになっています',
    )
  })
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|✓|✗|×"
```

期待: 4件の新テストが FAIL

- [ ] **Step 3: buildStrokeFeedback を更新**

`src/logic/strokeFeedback.ts` を以下に置き換え：

```typescript
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
```

- [ ] **Step 4: 全テストがパスすることを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test
```

期待出力: `Tests 27 passed (27)`（既存23 + 新規4）

- [ ] **Step 5: コミット**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
git add src/__tests__/logic/strokeFeedback.test.ts src/logic/strokeFeedback.ts
git commit -m "feat: show correct stroke ending in feedback message"
```

---

## Task 3: WritingArea で expectedEndings を取得（変更C 完結）

**Files:**
- Modify: `src/components/game/WritingArea.tsx`

- [ ] **Step 1: WritingArea の onCorrectStroke を更新**

`src/components/game/WritingArea.tsx` の `init` 関数内、`onCorrectStroke` コールバックを以下に変更：

```typescript
onCorrectStroke: (data: any) => {
  setHasStarted(true)
  const result: StrokeEndingResult = {
    strokeIndex: strokeIndexRef.current++,
    detectedEnding: inferEndingType(data?.strokeEnding?.velocityProfile),
    isCorrect: data?.strokeEnding?.correct ?? true,
    expectedEndings: ((data?.strokeEnding?.expected ?? []) as string[])
      .filter((e): e is 'tome' | 'hane' | 'harai' =>
        e === 'tome' || e === 'hane' || e === 'harai',
      ),
  }
  strokeResultsRef.current.push(result)
},
```

- [ ] **Step 2: TypeScript エラーがないことを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npx tsc --noEmit
```

期待出力: エラーなし（0 errors）

- [ ] **Step 3: テストがパスすることを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test
```

期待出力: `Tests 27 passed (27)`

- [ ] **Step 4: コミット**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
git add src/components/game/WritingArea.tsx
git commit -m "feat: capture expectedEndings from kakitori strokeEnding data"
```

---

## Task 4: WritingArea のサイズ修正と dim/bright（変更A）

**Files:**
- Modify: `src/components/game/WritingArea.tsx`

kakitori マウント時に `size` を短辺に合わせることで「2文字表示」を修正し、`opacity` で書く前は薄く表示する。

- [ ] **Step 1: WritingArea を更新**

`src/components/game/WritingArea.tsx` の `init` 関数と `hostRef` div を以下のように変更する。

`init` 関数冒頭（`kakitoriChar` インポート後）に size 計算を追加し、`mount` に渡す：

```typescript
const init = async () => {
  const { char: kakitoriChar } = await import('@k1low/kakitori')

  charInstance = kakitoriChar.create(char)
  const rect = hostRef.current!.getBoundingClientRect()
  const size = Math.min(rect.width, rect.height)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  charInstance.mount(hostRef.current!, {
    size: size > 0 ? size : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCorrectStroke: (data: any) => {
      setHasStarted(true)
      const result: StrokeEndingResult = {
        strokeIndex: strokeIndexRef.current++,
        detectedEnding: inferEndingType(data?.strokeEnding?.velocityProfile),
        isCorrect: data?.strokeEnding?.correct ?? true,
        expectedEndings: ((data?.strokeEnding?.expected ?? []) as string[])
          .filter((e): e is 'tome' | 'hane' | 'harai' =>
            e === 'tome' || e === 'hane' || e === 'harai',
          ),
      }
      strokeResultsRef.current.push(result)
    },
    onMistake: () => {
      setHasStarted(true)
      onMistake()
    },
    onComplete: () => {
      handleComplete()
    },
  })
  charInstance.start()
}
```

`hostRef` div の `style` に `opacity` と transition を追加：

```tsx
<div
  ref={hostRef}
  className={hasStarted ? undefined : 'writing-pulse'}
  style={{
    flex: 1,
    position: 'relative',
    border: '2px solid transparent',
    transition: 'border-color 0.3s, opacity 0.5s',
    opacity: hasStarted ? 1 : 0.2,
  }}
/>
```

- [ ] **Step 2: TypeScript エラーがないことを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npx tsc --noEmit
```

期待出力: エラーなし

- [ ] **Step 3: テストがパスすることを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test
```

期待出力: `Tests 27 passed (27)`

- [ ] **Step 4: コミット**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
git add src/components/game/WritingArea.tsx
git commit -m "feat: fix kakitori size to container short-edge and add dim-before-writing effect"
```

---

## Task 5: BattlePhase と gameStore の拡張（変更B）

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/store/gameStore.ts`

- [ ] **Step 1: BattlePhase に 'feedback' を追加**

`src/types/game.ts` の `BattlePhase` を変更：

```typescript
export type BattlePhase = 'writing' | 'battling' | 'won' | 'lost' | 'feedback'
```

- [ ] **Step 2: gameStore に battleResult・setBattleFeedback・confirmBattle を追加**

`src/store/gameStore.ts` の `GameStore` インターフェースに追加：

```typescript
// 現在の行: battleMessage: string
// 下に追加:
battleResult: 'win' | 'lose' | null

// アクション欄に追加（setBattleMessage の下）:
setBattleFeedback: (result: 'win' | 'lose', message: string) => void
confirmBattle: () => void
```

`create` 内の初期値に追加（`battleMessage: ''` の下）：

```typescript
battleResult: null,
```

`create` 内のアクション実装に追加（`setBattleMessage` の下）：

```typescript
setBattleFeedback: (result, message) =>
  set({ battlePhase: 'feedback', battleResult: result, battleMessage: message }),

confirmBattle: () => {
  const { battleResult } = get()
  if (battleResult === 'win') get().onBattleWin()
  else if (battleResult === 'lose') get().onBattleLose()
},
```

- [ ] **Step 3: TypeScript エラーがないことを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npx tsc --noEmit
```

期待出力: エラーなし

- [ ] **Step 4: テストがパスすることを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test
```

期待出力: `Tests 27 passed (27)`

- [ ] **Step 5: コミット**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
git add src/types/game.ts src/store/gameStore.ts
git commit -m "feat: add feedback BattlePhase and confirmBattle action to gameStore"
```

---

## Task 6: BattleStage の feedback フェーズ UI（変更B 完結）

**Files:**
- Modify: `src/components/game/BattleStage.tsx`

- [ ] **Step 1: BattleStage を更新**

`src/components/game/BattleStage.tsx` を以下の内容に置き換える：

```typescript
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { resolveBattle } from '../../logic/battleLogic'
import { calculateAccuracy } from '../../logic/accuracyLogic'
import { buildStrokeFeedback } from '../../logic/strokeFeedback'
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
    setBattleFeedback,
    confirmBattle,
  } = useGameStore()

  const char = currentEntry?.word[currentCharIndex] ?? ''
  const accuracy = calculateAccuracy(endingResults)
  const strokeFeedback = buildStrokeFeedback(endingResults)

  useEffect(() => {
    if (battlePhase !== 'battling') return

    const result = resolveBattle(endingResults)
    const timer = setTimeout(() => {
      if (result === 'win') {
        setBattleFeedback('win', `${char}は かちのこった！`)
      } else {
        setBattleFeedback('lose', `まがった「${char}」の かちだ…`)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [battlePhase, char, endingResults, setBattleFeedback])

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
            visible={battlePhase === 'battling' || battlePhase === 'won' || battlePhase === 'feedback'}
          />
        </motion.div>
      </div>

      <MessageWindow
        message={battleMessage}
        detail={(battlePhase === 'battling' || battlePhase === 'feedback') ? strokeFeedback ?? undefined : undefined}
      />

      {battlePhase === 'feedback' && (
        <button
          onClick={confirmBattle}
          style={{
            background: 'transparent',
            border: '2px solid var(--color-window-border)',
            color: 'var(--color-text)',
            fontFamily: 'inherit',
            fontSize: '0.9em',
            padding: '8px 16px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          ▼ タップして続ける
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript エラーがないことを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npx tsc --noEmit
```

期待出力: エラーなし

- [ ] **Step 3: テストがパスすることを確認**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test
```

期待出力: `Tests 27 passed (27)`

- [ ] **Step 4: コミット**

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
git add src/components/game/BattleStage.tsx
git commit -m "feat: add feedback phase with tap-to-continue to BattleStage"
```

---

## 完了確認

全タスク完了後：

```bash
cd /Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1
npm test && npx tsc --noEmit
```

期待出力:
- `Tests 27 passed (27)`
- TypeScript エラーなし

worktree パス: `/Users/hiranyu1/repo/kakitori_quest/.claude/worktrees/feature+phase1`
ブランチ: `worktree-feature+phase1`
