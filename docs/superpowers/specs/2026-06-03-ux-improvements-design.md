# UX改善設計書

**日付:** 2026-06-03  
**対象ブランチ:** feature+phase1  
**ステータス:** 承認済み

## 背景

プレイテストのフィードバックから、以下4点のUX問題を修正する。

---

## A. 入力場所の明確化

### 問題
お手本と入力ガイドが同じ見た目のため、どこで書けばよいかわからない。

### 解決策
- kakitori エリアのボーダーを pulse アニメーション（点滅）で強調し「操作待ち」を示す
- エリア内に「✏ なぞってかけ！」ラベルを表示
- 最初のストロークが検出されたら（`onCorrectStroke` 発火）アニメーションを止める
- 既存の「「X」をかけ！」ラベルはそのまま残す

### 変更ファイル
- `src/components/game/WritingArea.tsx`
- `src/index.css`（またはインラインスタイルで pulse keyframes 定義）

---

## B. ストロークフィードバック

### 問題
50%判定のとき、どのストロークで何が悪かったかわからない。

### 解決策
バトル「負け」時かつ `isCorrect=false` のストロークが存在する場合、MessageWindow にストロークごとの詳細メッセージを追加表示する。

表示例：
```
「あ」に まけた…
2かくめ：はらい → とめ に なっています
```

- `endingResults` の `detectedEnding`（実際値）を「とめ/はらい/はね」の日本語に変換して表示
- 正解 ending type は Phase 1 では vocabulary データから取得しない（"〇〇になっています" のみ表示）
- ○/× オーバーレイ（お手本の上に重ねる表示）は将来タスクとして記録

### 変更ファイル
- `src/components/game/BattleStage.tsx`
- `src/components/game/MessageWindow.tsx`（複数メッセージ or メッセージ配列に対応）

---

## C. ゲームオーバー画面の選択肢追加

### 問題
負けたとき「やりなおす」しか選べない。諦めて別の文字に挑む手段がない。

### 解決策
`GameOverScreen` に「別の文字をえらぶ」ボタンを追加し、StageSelectScreen へ遷移する。

ボタン配置：
```
▶　やりなおす
▶　別の文字をえらぶ
```

- `useGameStore` の `goToScreen('stageSelect')` アクション（既存）を使用

### 変更ファイル
- `src/screens/GameOverScreen.tsx`

---

## D. レイアウト自動検出

### 問題
書字エリアの余白が多く、縦/横どちらのレイアウトが最適かユーザーが判断しにくい。

### 解決策
画面の縦横比を自動検出し、最適なレイアウトを適用する。

| 画面比率 | レイアウト | 書字エリア幅/高 | バトルエリア幅/高 |
|----------|-----------|----------------|-----------------|
| Landscape（横長） | 左右分割 | width: 40% | width: 60% |
| Portrait（縦長） | 上下分割 | height: 45% | height: 55% |

実装：
- `useLayoutEffect` + `ResizeObserver` で `window.innerWidth > window.innerHeight` を監視
- `writingAreaPosition` の型に `'auto'` を追加し、デフォルト値を `'auto'` に変更
- SettingsScreen に「自動（推奨）」選択肢を追加
- `GameScreen` 内で `'auto'` のときは画面比率から実効レイアウトを計算

### 変更ファイル
- `src/components/game/GameScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/store/gameStore.ts`（`writingAreaPosition` 型の更新）

---

## 将来タスク（Phase 1 対象外）

- ストローク○/×オーバーレイ：お手本の上に各ストロークの正誤を重ねて表示
- 正解 ending type の vocabulary 紐付け：各文字の画ごとに期待する ending type を定義し、より詳細なフィードバックを提供
