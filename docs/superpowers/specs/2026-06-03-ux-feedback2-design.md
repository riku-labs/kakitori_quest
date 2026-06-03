# UX フィードバック対応 第2弾 設計書

Date: 2026-06-03  
Branch: worktree-feature+phase1

## 背景

プレイテスト（第2回）で得られた3件のフィードバックへの対応。

---

## 変更A：WritingArea の文字表示修正

### 問題

1. kakitori がマウント要素内に「ガイドレイヤー」と「描画レイヤー」の2つのSVG要素を縦に並べてレンダリングするため、縦長コンテナ内で同じ文字が2つ見える
2. 書き始める前も文字が通常の明るさで表示されており、入力エリアであることが伝わりにくい

### 設計

#### サイズ修正

`WritingArea` の `useEffect` 内、kakitori マウント前に：

```typescript
const containerRect = hostRef.current!.getBoundingClientRect()
const size = Math.min(containerRect.width, containerRect.height)
charInstance.mount(hostRef.current!, { size, ...otherOptions })
```

`size` を短辺に合わせることで、kakitori が正方形内に収まり2文字問題が解消される。

#### 文字の薄い表示（dim → bright）

- `hostRef` div の `opacity` を `hasStarted` が `false` の間は `0.2`、`true` になったら `1.0` にする
- CSS `transition: opacity 0.5s` でなめらかに遷移
- `hasStarted` のセットタイミングは現状維持（`onCorrectStroke` コールバック = 初回ストローク完了時）
- `writing-pulse`（枠のパルスアニメーション）はそのまま維持

```tsx
<div
  ref={hostRef}
  className={hasStarted ? undefined : 'writing-pulse'}
  style={{
    flex: 1,
    position: 'relative',
    opacity: hasStarted ? 1 : 0.2,
    transition: 'opacity 0.5s',
  }}
/>
```

### 影響ファイル

- `src/components/game/WritingArea.tsx`

---

## 変更B：バトル後タップ待ち

### 問題

バトル結果とストロークフィードバックが自動で次の状態に遷移してしまい、ユーザーが確認しきれない。

### 設計

#### BattlePhase 型の拡張

`types/game.ts` の `BattlePhase` に `'feedback'` を追加：

```typescript
export type BattlePhase = 'writing' | 'battling' | 'won' | 'lost' | 'feedback'
```

#### 状態遷移の変更

```
writing → battling → feedback → [ユーザーがタップ] → (win処理 or lose処理)
```

`battling` → `feedback` 遷移時に勝敗結果を一緒に保存する必要があるため、`gameStore` に `battleResult: 'win' | 'lose' | null` フィールドを追加する。

#### gameStore の変更

```typescript
// 新規フィールド
battleResult: 'win' | 'lose' | null

// BattleStage の useEffect が呼んでいた onBattleWin/onBattleLose の代わりに
setBattleFeedback: (result: 'win' | 'lose', message: string) => void
// → battlePhase: 'feedback', battleResult: result, battleMessage: message をセット
// message 例: "ほはかちのこった！" (win) or "まがった「ほ」のかちだ…" (lose)

// タップで呼ぶ新規アクション
confirmBattle: () => void
// → battleResult を見て onBattleWin または onBattleLose の実処理を実行
```

#### BattleStage の変更

- `battlePhase === 'feedback'` のとき「タップして続ける」ボタンを表示
- ボタンタップで `confirmBattle()` を呼ぶ
- ストロークフィードバック（`detail` prop）は `'lost'` に加えて `'feedback'` フェーズでも表示する

### 影響ファイル

- `src/types/game.ts`（BattlePhase）
- `src/store/gameStore.ts`（battleResult, setBattleFeedback, confirmBattle）
- `src/components/game/BattleStage.tsx`

---

## 変更C：正しい終端の表示

### 問題

フィードバックに「何かくめがXXになっています」と間違いしか出ない。正しい終端も表示してほしい。

### 設計

#### StrokeEndingResult 型の拡張

kakitori の `strokeEnding.expected: StrokeEndingType[]` が正解の終端種別を持っているため、それを格納する：

```typescript
export interface StrokeEndingResult {
  strokeIndex: number
  detectedEnding: EndingType | null
  isCorrect: boolean
  expectedEndings: EndingType[]  // 追加
}
```

#### WritingArea の変更

`onCorrectStroke` コールバックで `expected` をマッピング：

```typescript
const mapEnding = (type: string): EndingType | null => {
  if (type === 'tome') return 'tome'
  if (type === 'hane') return 'hane'
  if (type === 'harai') return 'harai'
  return null
}

const result: StrokeEndingResult = {
  strokeIndex: strokeIndexRef.current++,
  detectedEnding: inferEndingType(data?.strokeEnding?.velocityProfile),
  isCorrect: data?.strokeEnding?.correct ?? true,
  expectedEndings: (data?.strokeEnding?.expected ?? [])
    .map(mapEnding)
    .filter((e): e is EndingType => e !== null),
}
```

#### buildStrokeFeedback の変更

フォーマット変更：「Xかくめ：はらいになっています → とめにしましょう」

```typescript
// 変更前
`${r.strokeIndex + 1}かくめ：${ENDING_JA[r.detectedEnding!]}になっています`

// 変更後（expectedEndings がある場合）
`${r.strokeIndex + 1}かくめ：${ENDING_JA[r.detectedEnding!]}ではなく${ENDING_JA[r.expectedEndings[0]]}にしましょう`

// expectedEndings が空の場合（フォールバック）
`${r.strokeIndex + 1}かくめ：${ENDING_JA[r.detectedEnding!]}になっています`
```

#### テスト

`strokeFeedback.test.ts` に `expectedEndings` を含むケースを追加。既存テストも `expectedEndings: []` を追加して更新。

### 影響ファイル

- `src/types/game.ts`（StrokeEndingResult）
- `src/components/game/WritingArea.tsx`
- `src/logic/strokeFeedback.ts`
- `src/logic/strokeFeedback.test.ts`

---

## 実装順序

1. 変更C（型拡張 + テスト）→ 既存テストへの影響を先に解消
2. 変更A（WritingArea）→ 独立した変更
3. 変更B（BattlePhase拡張 + store + BattleStage）→ 最も影響範囲が広い

## テスト方針

- 変更Cの `buildStrokeFeedback` はTDD（テスト先行）
- 変更Bの `confirmBattle` ロジックはテストなし（UIフロー、純粋関数ではないため）
- 変更Aの `size` 計算は副作用のため統合テストで確認
