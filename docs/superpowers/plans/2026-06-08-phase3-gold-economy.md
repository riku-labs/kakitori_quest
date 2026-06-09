# Phase 3: Gold Economy & Equipment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ゴールド獲得→ショップ購入→装備/使用という経済ループを実装し、勇者のカスタマイズと消耗品活用で遊びの幅を広げる。

**Architecture:** ゴールドは `goldStore`（persist）、装備/ポーション所持は `wardrobeStore`（persist）で管理する。報酬計算は純粋関数 `calcStageGold` にまとめ、gameStore の `onBattleWin` からコールする。HeroDisplay を 64×64 グリッドにリファクタし、装飾品を SVG レイヤーとして重ねる。

**Tech Stack:** React 19, Zustand 5 (persist), Vite, Vitest, framer-motion, TypeScript 6

---

## ファイルマップ

### 新規作成

| ファイル | 責務 |
|---|---|
| `src/config/rewards.ts` | ゴールド報酬定数 |
| `src/config/items.ts` | 全アイテム定義（消耗品・装飾品） |
| `src/config/decorationSlots.ts` | 装飾スロット定義 |
| `src/logic/goldReward.ts` | ゴールド報酬計算関数 |
| `src/__tests__/logic/goldReward.test.ts` | goldReward のユニットテスト |
| `src/store/goldStore.ts` | ゴールド残高 Zustand ストア（persist） |
| `src/store/wardrobeStore.ts` | 購入済み/装備中アイテム Zustand ストア（persist） |
| `src/screens/ShopScreen.tsx` | ショップ画面（タブ切り替え） |
| `src/screens/WardrobeScreen.tsx` | そうび画面（勇者プレビュー付き） |

### 既存ファイル変更

| ファイル | 変更内容 |
|---|---|
| `src/types/game.ts` | Screen 型に `'shop' \| 'wardrobe'` 追加 |
| `src/config/messages.ts` | shop / wardrobe / potion 系メッセージ追加 |
| `src/store/gameStore.ts` | `goToShop` / `goToWardrobe` / `healHeart` / `lastStageGold` / `onBattleWin` 内ゴールド計算を追加 |
| `src/components/game/HeroDisplay.tsx` | 64×64 SVG グリッドリファクタ・装飾レイヤー追加 |
| `src/components/game/BattleStage.tsx` | ポーション使用ボタン追加 |
| `src/screens/TitleScreen.tsx` | おみせ / そうびメニュー追加 |
| `src/screens/StageSelectScreen.tsx` | ゴールド残高表示追加 |
| `src/screens/StageCompleteScreen.tsx` | 獲得ゴールド表示追加 |
| `src/App.tsx` | `shop` / `wardrobe` ルート追加 |

---

## Task 1: 型定義・設定ファイル（config 基盤）

**Files:**
- Modify: `src/types/game.ts`
- Create: `src/config/rewards.ts`
- Create: `src/config/decorationSlots.ts`
- Create: `src/config/items.ts`

- [ ] **Step 1: Screen 型に shop / wardrobe を追加**

`src/types/game.ts` の `Screen` 型を以下に変更：

```typescript
export type Screen =
  | 'title'
  | 'stageSelect'
  | 'game'
  | 'stageComplete'
  | 'gameOver'
  | 'settings'
  | 'shop'
  | 'wardrobe'
```

- [ ] **Step 2: rewards.ts を作成**

```typescript
// src/config/rewards.ts
export const REWARDS = {
  BASE_GOLD_PER_STAGE: 10,
  GOLD_PER_CHAR: 5,
  GOLD_PER_STAR: 10,
} as const
```

- [ ] **Step 3: decorationSlots.ts を作成**

```typescript
// src/config/decorationSlots.ts
export type DecorationSlotId = 'hat' | 'armor'

export const DECORATION_SLOTS: Record<DecorationSlotId, { label: string }> = {
  hat:   { label: 'ぼうし' },
  armor: { label: 'よろい' },
}
```

- [ ] **Step 4: items.ts を作成**

```typescript
// src/config/items.ts
import type { DecorationSlotId } from './decorationSlots'

export interface ConsumableItem {
  type: 'consumable'
  id: string
  name: string
  description: string
  price: number
  effect: 'healHeart'
  effectValue: number
}

export interface DecorationItem {
  type: 'decoration'
  id: string
  name: string
  description: string
  price: number
  slot: DecorationSlotId
  svgLayer: string  // 64×64 座標系の SVG フラグメント（<svg>タグなし）
}

export type Item = ConsumableItem | DecorationItem

export const ITEMS: Item[] = [
  // ── 消耗品 ──────────────────────────────────────────────────────
  {
    type: 'consumable',
    id: 'potion',
    name: 'かいふくやく',
    description: 'ハートが 1 かいふくする',
    price: 30,
    effect: 'healHeart',
    effectValue: 1,
  },

  // ── 帽子 ────────────────────────────────────────────────────────
  {
    type: 'decoration',
    id: 'helmet',
    name: 'ぼうし',
    description: 'てつのかぶと。まもりがあがる',
    price: 150,
    slot: 'hat',
    svgLayer: `
      <rect x="18" y="2" width="28" height="16" fill="#888" rx="2"/>
      <rect x="15" y="14" width="34" height="5" fill="#666"/>
      <rect x="22" y="5" width="20" height="6" fill="#9CA3AF"/>
    `,
  },
  {
    type: 'decoration',
    id: 'wizard-hat',
    name: 'まほうぼうし',
    description: 'まほうつかいのぼうし。まりょくアップ',
    price: 200,
    slot: 'hat',
    svgLayer: `
      <polygon points="32,0 19,22 45,22" fill="#7C3AED"/>
      <rect x="14" y="20" width="36" height="5" fill="#5B21B6"/>
      <circle cx="32" cy="11" r="3" fill="#FCD34D"/>
    `,
  },
  {
    type: 'decoration',
    id: 'crown',
    name: 'おうかん',
    description: 'おうさまのかんむり。こうきゅうひん',
    price: 500,
    slot: 'hat',
    svgLayer: `
      <rect x="19" y="10" width="26" height="7" fill="#EAB308"/>
      <rect x="19" y="5"  width="5"  height="8" fill="#EAB308"/>
      <rect x="30" y="3"  width="4"  height="10" fill="#EAB308"/>
      <rect x="40" y="5"  width="5"  height="8" fill="#EAB308"/>
      <rect x="21" y="7"  width="2"  height="2" fill="#DC2626"/>
      <rect x="31" y="5"  width="2"  height="2" fill="#DC2626"/>
      <rect x="41" y="7"  width="2"  height="2" fill="#DC2626"/>
    `,
  },

  // ── よろい ──────────────────────────────────────────────────────
  {
    type: 'decoration',
    id: 'leather-armor',
    name: 'かわのよろい',
    description: 'かわでできたかるいよろい',
    price: 120,
    slot: 'armor',
    svgLayer: `
      <rect x="16" y="35" width="32" height="16" fill="#92400E"/>
      <rect x="24" y="35" width="16" height="3"  fill="#A16207"/>
      <rect x="30" y="35" width="4"  height="16" fill="#78350F"/>
    `,
  },
  {
    type: 'decoration',
    id: 'iron-armor',
    name: 'てつのよろい',
    description: 'てつでできたかたいよろい',
    price: 300,
    slot: 'armor',
    svgLayer: `
      <rect x="16" y="35" width="32" height="16" fill="#6B7280"/>
      <rect x="20" y="35" width="24" height="4"  fill="#9CA3AF"/>
      <rect x="16" y="43" width="32" height="4"  fill="#4B5563"/>
      <rect x="28" y="35" width="8"  height="16" fill="#9CA3AF"/>
    `,
  },
  {
    type: 'decoration',
    id: 'robe',
    name: 'ローブ',
    description: 'まほうつかいのローブ。まりょくアップ',
    price: 350,
    slot: 'armor',
    svgLayer: `
      <rect x="16" y="35" width="32" height="29" fill="#7C3AED"/>
      <rect x="28" y="35" width="8"  height="29" fill="#6D28D9"/>
      <rect x="16" y="35" width="6"  height="29" fill="#6D28D9"/>
      <rect x="42" y="35" width="6"  height="29" fill="#6D28D9"/>
    `,
  },
]
```

- [ ] **Step 5: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/types/game.ts src/config/rewards.ts src/config/decorationSlots.ts src/config/items.ts
git commit -m "feat: add Phase 3 config — Screen types, rewards, items, decoration slots"
```

---

## Task 2: goldReward ロジック（TDD）

**Files:**
- Create: `src/logic/goldReward.ts`
- Create: `src/__tests__/logic/goldReward.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// src/__tests__/logic/goldReward.test.ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- goldReward
```

期待: `calcStageGold` が存在しないため FAIL

- [ ] **Step 3: 最小実装を書く**

```typescript
// src/logic/goldReward.ts
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
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npm test -- goldReward
```

期待: 3 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/logic/goldReward.ts src/__tests__/logic/goldReward.test.ts
git commit -m "feat: add calcStageGold logic with TDD"
```

---

## Task 3: goldStore

**Files:**
- Create: `src/store/goldStore.ts`

- [ ] **Step 1: goldStore を作成**

```typescript
// src/store/goldStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GoldState {
  gold: number
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
}

export const useGoldStore = create<GoldState>()(
  persist(
    (set, get) => ({
      gold: 0,

      addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

      spendGold: (amount) => {
        if (get().gold < amount) return false
        set((s) => ({ gold: s.gold - amount }))
        return true
      },
    }),
    { name: 'kakitori-quest-gold-v1' },
  ),
)
```

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/store/goldStore.ts
git commit -m "feat: add goldStore with persist"
```

---

## Task 4: wardrobeStore

**Files:**
- Create: `src/store/wardrobeStore.ts`

- [ ] **Step 1: wardrobeStore を作成**

```typescript
// src/store/wardrobeStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DecorationSlotId } from '../config/decorationSlots'
import { ITEMS } from '../config/items'
import { useGoldStore } from './goldStore'

interface WardrobeState {
  potionCount: number
  purchasedDecorations: string[]
  equippedItems: Partial<Record<DecorationSlotId, string>>

  buyItem: (itemId: string) => boolean
  equipDecoration: (itemId: string, slot: DecorationSlotId) => void
  unequipSlot: (slot: DecorationSlotId) => void
  usePotion: () => boolean
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      potionCount: 0,
      purchasedDecorations: [],
      equippedItems: {},

      buyItem: (itemId) => {
        const item = ITEMS.find((i) => i.id === itemId)
        if (!item) return false
        if (!useGoldStore.getState().spendGold(item.price)) return false
        if (item.type === 'consumable') {
          set((s) => ({ potionCount: s.potionCount + 1 }))
        } else {
          set((s) => ({ purchasedDecorations: [...s.purchasedDecorations, itemId] }))
        }
        return true
      },

      equipDecoration: (itemId, slot) => {
        set((s) => ({ equippedItems: { ...s.equippedItems, [slot]: itemId } }))
      },

      unequipSlot: (slot) => {
        set((s) => {
          const next = { ...s.equippedItems }
          delete next[slot]
          return { equippedItems: next }
        })
      },

      usePotion: () => {
        if (get().potionCount <= 0) return false
        set((s) => ({ potionCount: s.potionCount - 1 }))
        return true
      },
    }),
    { name: 'kakitori-quest-wardrobe-v1' },
  ),
)
```

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/store/wardrobeStore.ts
git commit -m "feat: add wardrobeStore with persist"
```

---

## Task 5: messages.ts にショップ/ポーション系追加

**Files:**
- Modify: `src/config/messages.ts`

- [ ] **Step 1: MSG にショップ/ワードローブ/ポーション系メッセージを追加**

`src/config/messages.ts` 全体を以下に置き換え：

```typescript
// src/config/messages.ts
export const MSG = {
  loading: 'よみこみちゅう...',
  enemyAppeared: (name: string) => `${name}があらわれた！`,
  battle: (name: string) => `${name}にこうげき！`,
  strokeMistake: 'まちがえた！',
  nextChar: (name: string) => `${name}にこうげき！`,
  attackSuccess: (hearts: number) => `ヒット！のこりライフ：${hearts}`,
  attackFail: (char: string) => `「${char}」ミス....`,
  defeat: (word: string) => `「${word}」にまけた…もういちどちょうせん！`,
  gameOver: 'もういちどちょうせん！',

  goldEarned: (amount: number) => `+${amount}G ゲット！`,
  goldBalance: (amount: number) => `G: ${amount}`,

  shop: {
    title: 'おみせ',
    tabConsumable: 'しょうひん',
    tabDecoration: 'そうしょく',
    buy: 'かう',
    insufficientGold: 'おかねがたりない',
    purchased: (name: string) => `${name}をかった！`,
    alreadyOwned: 'もっている',
  },

  wardrobe: {
    title: 'そうび',
    equip: 'そうびする',
    unequip: 'はずす',
    equippedBadge: '★そうびちゅう',
    notOwned: 'もっていない',
    equipped: (name: string) => `${name}をそうびした！`,
  },

  potion: {
    buttonLabel: 'かいふくやく',
    used: 'かいふくやくをつかった！',
  },
}
```

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/config/messages.ts
git commit -m "feat: add shop/wardrobe/potion messages to MSG config"
```

---

## Task 6: gameStore にゴールド統合 + healHeart

**Files:**
- Modify: `src/store/gameStore.ts`

- [ ] **Step 1: gameStore に以下の変更を加える**

`src/store/gameStore.ts` の変更点（インポート追加 + 型拡張 + 実装変更）：

1. インポートに追加（ファイル先頭）：

```typescript
import { calcStageGold } from '../logic/goldReward'
import { calculateStars } from '../logic/starLogic'
import { useGoldStore } from './goldStore'
import { useWardrobeStore } from './wardrobeStore'
import { REWARDS } from '../config/rewards'
```

2. `GameStore` インターフェースに追加（`battleResult` の直後）：

```typescript
  lastStageGold: number

  // アクション: ゴールド/ポーション
  goToShop: () => void
  goToWardrobe: () => void
  healHeart: () => void
```

3. `MAX_HEARTS` 定数の直下に追加：

```typescript
const MAX_HEARTS = 3
```

（すでに存在するので変更不要）

4. 初期値に追加（`creatureName: null,` の直後）：

```typescript
      lastStageGold: 0,
```

5. `goToTitle` の前に追加：

```typescript
      goToShop: () => set({ screen: 'shop' }),
      goToWardrobe: () => set({ screen: 'wardrobe' }),
```

6. `onBattleWin` の「全文字クリア → ステージクリア」ブロックを以下に変更：

```typescript
        if (nextIndex >= currentEntry.word.length) {
          // 全文字クリア → ゴールド計算してステージクリア
          const stars = calculateStars(get().endingResults)
          const goldEarned = calcStageGold({
            species: 0,
            strokeCount: 0,
            wordLength: currentEntry.word.length,
            bestStarRating: stars,
            playCount: 1,
          })
          useGoldStore.getState().addGold(goldEarned)
          set({ screen: 'stageComplete', battlePhase: 'won', lastStageGold: goldEarned })
        } else {
```

7. `setCharSize` の後に追加：

```typescript
      healHeart: () => {
        const { hearts } = get()
        if (hearts >= MAX_HEARTS) return
        if (!useWardrobeStore.getState().usePotion()) return
        set((s) => ({
          hearts: Math.min(s.hearts + 1, MAX_HEARTS),
          battleMessage: MSG.potion.used,
        }))
      },
```

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: テスト実行（既存テストが壊れていないことを確認）**

```bash
npm test
```

期待: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/store/gameStore.ts
git commit -m "feat: integrate gold reward and healHeart into gameStore"
```

---

## Task 7: HeroDisplay を 64×64 にリファクタ + 装飾レイヤー

**Files:**
- Modify: `src/components/game/HeroDisplay.tsx`

- [ ] **Step 1: HeroDisplay を書き換える**

`src/components/game/HeroDisplay.tsx` 全体を以下に置き換え：

```typescript
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useWardrobeStore } from '../../store/wardrobeStore'
import { ITEMS } from '../../config/items'
import type { DecorationItem } from '../../config/items'

// 勇者ベース SVG（64×64 座標系）
const HERO_BASE = `
  <rect x="21" y="5"  width="21" height="11" fill="#e8a020"/>
  <rect x="19" y="13" width="27" height="21" fill="#f5c99a"/>
  <rect x="24" y="21" width="5"  height="5"  fill="#3a3a3a"/>
  <rect x="35" y="21" width="5"  height="5"  fill="#3a3a3a"/>
  <rect x="16" y="35" width="32" height="16" fill="#4169e1"/>
  <rect x="8"  y="35" width="8"  height="13" fill="#4169e1"/>
  <rect x="48" y="35" width="8"  height="13" fill="#4169e1"/>
  <rect x="3"  y="37" width="8"  height="13" rx="2" fill="#8b6914"/>
  <rect x="5"  y="40" width="3"  height="8"  fill="#d4a017"/>
  <rect x="56" y="11" width="5"  height="27" fill="#c0c0c0"/>
  <rect x="51" y="35" width="16" height="5"  fill="#8b6914"/>
  <rect x="16" y="51" width="32" height="5"  fill="#8b6914"/>
  <rect x="19" y="56" width="11" height="8"  fill="#2c52b3"/>
  <rect x="35" y="56" width="11" height="8"  fill="#2c52b3"/>
`

function buildHeroSvg(hatLayer: string, armorLayer: string): string {
  return `<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    ${HERO_BASE}
    ${armorLayer}
    ${hatLayer}
  </svg>`
}

export function HeroDisplay() {
  const { battlePhase, battleResult } = useGameStore()
  const equippedItems = useWardrobeStore((s) => s.equippedItems)

  const getLayer = (slot: 'hat' | 'armor'): string => {
    const id = equippedItems[slot]
    if (!id) return ''
    const item = ITEMS.find((i) => i.id === id)
    if (!item || item.type !== 'decoration') return ''
    return (item as DecorationItem).svgLayer
  }

  const svgString = buildHeroSvg(getLayer('hat'), getLayer('armor'))

  const animate =
    battlePhase === 'won' || (battlePhase === 'feedback' && battleResult === 'win')
      ? { y: [0, -12, 0], transition: { duration: 0.4 } }
      : battlePhase === 'feedback' && battleResult === 'lose'
        ? { x: [-6, 6, -6, 6, 0], transition: { duration: 0.4 } }
        : {}

  return (
    <motion.div
      animate={animate}
      style={{ display: 'inline-block', lineHeight: 1, width: 128, height: 128 }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  )
}
```

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/game/HeroDisplay.tsx
git commit -m "feat: refactor HeroDisplay to 64x64 grid with decoration layers"
```

---

## Task 8: BattleStage にポーション使用ボタン追加

**Files:**
- Modify: `src/components/game/BattleStage.tsx`

- [ ] **Step 1: BattleStage にポーション使用ボタンを追加**

`src/components/game/BattleStage.tsx` の変更点：

1. インポートに追加：

```typescript
import { useWardrobeStore } from '../../store/wardrobeStore'
```

2. コンポーネント内、`useGameStore` の分割代入に `hearts` と `healHeart` が含まれていることを確認（すでに `hearts` は存在する）。`healHeart` を追加：

```typescript
  const {
    currentEntry,
    currentCharIndex,
    hearts,
    battlePhase,
    battleResult,
    endingResults,
    battleMessage,
    creatureName,
    setBattleFeedback,
    confirmBattle,
    healHeart,
  } = useGameStore()
```

3. `confirmBattle` の後、`potionCount` を取得：

```typescript
  const potionCount = useWardrobeStore((s) => s.potionCount)
```

4. JSX 末尾の `{battlePhase === 'feedback' && (...)}` ブロックの**前**に追加：

```typescript
      {battlePhase === 'writing' && potionCount > 0 && hearts < 3 && (
        <button
          onClick={healHeart}
          style={{
            background: 'transparent',
            border: '1px solid #555',
            color: 'var(--color-text-dim)',
            fontFamily: 'inherit',
            fontSize: '0.8em',
            padding: '6px 12px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {MSG.potion.buttonLabel}（のこり{potionCount}こ）をつかう
        </button>
      )}
```

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/game/BattleStage.tsx
git commit -m "feat: add recovery potion button to BattleStage"
```

---

## Task 9: StageCompleteScreen にゴールド表示

**Files:**
- Modify: `src/screens/StageCompleteScreen.tsx`

- [ ] **Step 1: ゴールド獲得表示を追加**

`src/screens/StageCompleteScreen.tsx` の変更点：

1. `useGameStore` の分割代入に `lastStageGold` を追加：

```typescript
  const { currentEntry, endingResults, clearedWords, goToStageSelect, lastStageGold } = useGameStore()
```

2. `<StarRating>` の下（`marginBottom: '24px'` のブロック閉じタグの後）に追加：

```typescript
          {lastStageGold > 0 && (
            <div style={{ color: 'var(--color-accent)', fontSize: '1.1em', marginBottom: '16px' }}>
              {MSG.goldEarned(lastStageGold)}
            </div>
          )}
```

3. インポートに追加：

```typescript
import { MSG } from '../config/messages'
```

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/screens/StageCompleteScreen.tsx
git commit -m "feat: show earned gold on StageCompleteScreen"
```

---

## Task 10: ShopScreen 作成

**Files:**
- Create: `src/screens/ShopScreen.tsx`

- [ ] **Step 1: ShopScreen を作成**

```typescript
// src/screens/ShopScreen.tsx
import { useState } from 'react'
import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import { useGoldStore } from '../store/goldStore'
import { useWardrobeStore } from '../store/wardrobeStore'
import { ITEMS } from '../config/items'
import { MSG } from '../config/messages'
import type { Item } from '../config/items'

type ShopTab = 'consumable' | 'decoration'

export function ShopScreen() {
  const goToTitle = useGameStore((s) => s.goToTitle)
  const gold = useGoldStore((s) => s.gold)
  const { buyItem, purchasedDecorations, potionCount } = useWardrobeStore()
  const [tab, setTab] = useState<ShopTab>('consumable')
  const [message, setMessage] = useState('')

  const filteredItems = ITEMS.filter((i) => i.type === tab)

  function handleBuy(item: Item) {
    if (gold < item.price) {
      setMessage(MSG.shop.insufficientGold)
      return
    }
    const alreadyOwned =
      item.type === 'decoration' && purchasedDecorations.includes(item.id)
    if (alreadyOwned) {
      setMessage(MSG.shop.alreadyOwned)
      return
    }
    buyItem(item.id)
    setMessage(MSG.shop.purchased(item.name))
  }

  function isOwned(item: Item): boolean {
    if (item.type === 'consumable') return false
    return purchasedDecorations.includes(item.id)
  }

  const TAB_STYLE = (active: boolean) => ({
    flex: 1,
    background: active ? '#222' : 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-text-dim)',
    fontFamily: 'var(--font-pixel)',
    fontSize: '0.85em',
    padding: '8px',
    cursor: 'pointer',
  })

  const BTN_STYLE = {
    background: 'none',
    border: '1px solid #555',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-pixel)',
    fontSize: '0.8em',
    padding: '4px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        background: '#000',
        padding: '16px',
      }}
    >
      <DQWindow style={{ width: '360px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--color-accent)', fontSize: '0.9em' }}>{MSG.shop.title}</span>
          <span style={{ color: 'var(--color-accent)', fontSize: '0.9em' }}>{MSG.goldBalance(gold)}</span>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', marginBottom: '8px' }}>
          <button style={TAB_STYLE(tab === 'consumable')} onClick={() => setTab('consumable')}>
            {MSG.shop.tabConsumable}
          </button>
          <button style={TAB_STYLE(tab === 'decoration')} onClick={() => setTab('decoration')}>
            {MSG.shop.tabDecoration}
          </button>
        </div>

        {/* アイテムリスト */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredItems.map((item) => {
            const owned = isOwned(item)
            const isPotion = item.id === 'potion'
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 4px',
                  borderBottom: '1px solid #1a1a1a',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95em' }}>
                    {item.name}
                    {isPotion && potionCount > 0 && (
                      <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8em' }}> ×{potionCount}</span>
                    )}
                  </div>
                  <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75em' }}>{item.description}</div>
                </div>
                <span style={{ color: 'var(--color-accent)', fontSize: '0.85em', whiteSpace: 'nowrap' }}>
                  {item.price}G
                </span>
                <button
                  style={{
                    ...BTN_STYLE,
                    opacity: owned ? 0.4 : 1,
                    cursor: owned ? 'default' : 'pointer',
                  }}
                  onClick={() => !owned && handleBuy(item)}
                  disabled={owned}
                >
                  {owned ? MSG.shop.alreadyOwned : MSG.shop.buy}
                </button>
              </div>
            )
          })}
        </div>

        {/* メッセージ */}
        {message && (
          <div style={{ color: 'var(--color-accent)', fontSize: '0.85em', padding: '8px 0', minHeight: '24px' }}>
            {message}
          </div>
        )}

        {/* もどる */}
        <button
          onClick={goToTitle}
          style={{
            marginTop: '8px',
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

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/screens/ShopScreen.tsx
git commit -m "feat: add ShopScreen with tabs for consumables and decorations"
```

---

## Task 11: WardrobeScreen 作成

**Files:**
- Create: `src/screens/WardrobeScreen.tsx`

- [ ] **Step 1: WardrobeScreen を作成**

```typescript
// src/screens/WardrobeScreen.tsx
import { DQWindow } from '../components/ui/DQWindow'
import { HeroDisplay } from '../components/game/HeroDisplay'
import { useGameStore } from '../store/gameStore'
import { useWardrobeStore } from '../store/wardrobeStore'
import { ITEMS } from '../config/items'
import { DECORATION_SLOTS } from '../config/decorationSlots'
import { MSG } from '../config/messages'
import type { DecorationItem } from '../config/items'
import type { DecorationSlotId } from '../config/decorationSlots'

export function WardrobeScreen() {
  const goToTitle = useGameStore((s) => s.goToTitle)
  const { purchasedDecorations, equippedItems, equipDecoration, unequipSlot } = useWardrobeStore()

  const decorationItems = ITEMS.filter((i): i is DecorationItem => i.type === 'decoration')

  function handleEquip(item: DecorationItem) {
    const currentlyEquipped = equippedItems[item.slot]
    if (currentlyEquipped === item.id) {
      unequipSlot(item.slot)
    } else {
      equipDecoration(item.id, item.slot)
    }
  }

  const BTN_STYLE = (isEquipped: boolean) => ({
    background: isEquipped ? '#333' : 'none',
    border: `1px solid ${isEquipped ? 'var(--color-accent)' : '#555'}`,
    color: isEquipped ? 'var(--color-accent)' : 'var(--color-text)',
    fontFamily: 'var(--font-pixel)',
    fontSize: '0.8em',
    padding: '4px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        background: '#000',
        padding: '16px',
      }}
    >
      <DQWindow style={{ width: '380px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* ヘッダー */}
        <div style={{ color: 'var(--color-accent)', fontSize: '0.9em' }}>{MSG.wardrobe.title}</div>

        {/* 勇者プレビュー */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HeroDisplay />
        </div>

        {/* スロット別アイテムリスト */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {(Object.keys(DECORATION_SLOTS) as DecorationSlotId[]).map((slot) => (
            <div key={slot} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  color: 'var(--color-text-dim)',
                  fontSize: '0.75em',
                  borderBottom: '1px solid #333',
                  paddingBottom: '4px',
                  marginBottom: '8px',
                }}
              >
                {DECORATION_SLOTS[slot].label}
              </div>
              {decorationItems
                .filter((i) => i.slot === slot)
                .map((item) => {
                  const owned = purchasedDecorations.includes(item.id)
                  const isEquipped = equippedItems[slot] === item.id
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 4px',
                        borderBottom: '1px solid #111',
                        opacity: owned ? 1 : 0.4,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9em' }}>{item.name}</div>
                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75em' }}>{item.description}</div>
                      </div>
                      {!owned ? (
                        <span style={{ fontSize: '0.75em', color: '#555' }}>{MSG.wardrobe.notOwned}</span>
                      ) : (
                        <button
                          style={BTN_STYLE(isEquipped)}
                          onClick={() => handleEquip(item)}
                        >
                          {isEquipped ? MSG.wardrobe.unequip : MSG.wardrobe.equip}
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>

        {/* もどる */}
        <button
          onClick={goToTitle}
          style={{
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

- [ ] **Step 2: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/screens/WardrobeScreen.tsx
git commit -m "feat: add WardrobeScreen with hero preview and slot-based equipment"
```

---

## Task 12: TitleScreen におみせ/そうび追加 + App ルーティング + StageSelect ゴールド表示

**Files:**
- Modify: `src/screens/TitleScreen.tsx`
- Modify: `src/screens/StageSelectScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: TitleScreen を書き換える**

`src/screens/TitleScreen.tsx` 全体を以下に置き換え：

```typescript
import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'

const MENU_BTN_STYLE = {
  display: 'block',
  width: '100%',
  background: 'none',
  border: 'none',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-pixel)',
  fontSize: '1em',
  padding: '8px',
  cursor: 'pointer',
  textAlign: 'left' as const,
}

export function TitleScreen() {
  const goToStageSelect = useGameStore((s) => s.goToStageSelect)
  const goToShop       = useGameStore((s) => s.goToShop)
  const goToWardrobe   = useGameStore((s) => s.goToWardrobe)
  const goToSettings   = useGameStore((s) => s.goToSettings)

  const hover = (e: React.MouseEvent<HTMLButtonElement>) =>
    (e.currentTarget.style.color = 'var(--color-accent)')
  const leave = (e: React.MouseEvent<HTMLButtonElement>) =>
    (e.currentTarget.style.color = 'var(--color-text)')

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
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
        <button style={MENU_BTN_STYLE} onClick={goToStageSelect} onMouseEnter={hover} onMouseLeave={leave}>
          ▶　あそぶ
        </button>
        <button style={MENU_BTN_STYLE} onClick={goToShop} onMouseEnter={hover} onMouseLeave={leave}>
          　　おみせ
        </button>
        <button style={MENU_BTN_STYLE} onClick={goToWardrobe} onMouseEnter={hover} onMouseLeave={leave}>
          　　そうび
        </button>
        <button style={MENU_BTN_STYLE} onClick={goToSettings} onMouseEnter={hover} onMouseLeave={leave}>
          　　せってい
        </button>
      </DQWindow>
    </div>
  )
}
```

- [ ] **Step 2: StageSelectScreen にゴールド残高表示を追加**

`src/screens/StageSelectScreen.tsx` の変更点：

1. インポートに追加：

```typescript
import { useGoldStore } from '../store/goldStore'
import { MSG } from '../config/messages'
```

2. コンポーネント内、`useGameStore` の後に追加：

```typescript
  const gold = useGoldStore((s) => s.gold)
```

3. 「ことばをえらぼう」の `div` の右側にゴールド表示を追加。現在の div を以下に変更：

```typescript
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--color-accent)',
            fontSize: '0.9em',
            marginBottom: '12px',
            borderBottom: '1px solid #333',
            paddingBottom: '8px',
          }}
        >
          <span>ことばをえらぼう</span>
          <span>{MSG.goldBalance(gold)}</span>
        </div>
```

- [ ] **Step 3: App.tsx に shop / wardrobe ルートを追加**

`src/App.tsx` を以下に書き換え：

```typescript
import { useGameStore } from './store/gameStore'
import { TitleScreen } from './screens/TitleScreen'
import { StageSelectScreen } from './screens/StageSelectScreen'
import { GameScreen } from './components/game/GameScreen'
import { StageCompleteScreen } from './screens/StageCompleteScreen'
import { GameOverScreen } from './screens/GameOverScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { ShopScreen } from './screens/ShopScreen'
import { WardrobeScreen } from './screens/WardrobeScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  switch (screen) {
    case 'title':         return <TitleScreen />
    case 'stageSelect':   return <StageSelectScreen />
    case 'game':          return <GameScreen />
    case 'stageComplete': return <StageCompleteScreen />
    case 'gameOver':      return <GameOverScreen />
    case 'settings':      return <SettingsScreen />
    case 'shop':          return <ShopScreen />
    case 'wardrobe':      return <WardrobeScreen />
    default:              return <TitleScreen />
  }
}
```

- [ ] **Step 4: TypeScript チェック**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 5: 全テスト実行**

```bash
npm test
```

期待: 全テスト PASS

- [ ] **Step 6: コミット**

```bash
git add src/screens/TitleScreen.tsx src/screens/StageSelectScreen.tsx src/App.tsx
git commit -m "feat: add shop/wardrobe navigation — title menu, stage select gold display, App routing"
```

---

## Task 13: 動作確認（手動テスト）

- [ ] **Step 1: dev サーバー起動**

```bash
npm run dev
```

- [ ] **Step 2: ゴールドループ確認**

1. タイトル → あそぶ → ステージ選択でゴールド `G: 0` が表示されること
2. ステージクリア → `+○G ゲット！` が表示されること
3. タイトル → おみせ → ゴールド残高が正しいこと

- [ ] **Step 3: ショップ購入確認**

1. ゴールド不足時に `おかねがたりない` が表示されること
2. かいふくやく購入後、所持数がインクリメントされること
3. 装飾品購入後、`もっている` に変わること

- [ ] **Step 4: そうび確認**

1. タイトル → そうび → 購入済みアイテムのみ操作可能なこと
2. `そうびする` → 勇者プレビューに装飾が反映されること
3. `はずす` → 装飾が外れること

- [ ] **Step 5: ポーション使用確認**

1. ステージ中にハートが 2 以下かつポーション所持時にボタンが表示されること
2. ボタンタップで `かいふくやくをつかった！` と表示されハートが回復すること
3. ポーション 0 のとき（またはハートが満タンのとき）ボタンが表示されないこと

- [ ] **Step 6: TypeScript + 全テスト最終確認**

```bash
npx tsc --noEmit && npm test
```

期待: エラーなし・全テスト PASS

- [ ] **Step 7: コミット（不要な場合はスキップ）**

動作確認中に修正が発生した場合のみコミット。

---

## セルフレビュー

### スペックカバレッジ確認

| 設計要件 | 対応タスク |
|---|---|
| ゴールドループ（バトル勝利→goldStore） | Task 6 |
| `GoldRewardContext` インターフェース（将来拡張） | Task 2 |
| かいふくやく（30G、ハート+1） | Task 1（items.ts）, Task 8 |
| 装飾品 6 種（帽子3・鎧3） | Task 1（items.ts）|
| DecorationSlot hat / armor | Task 1（decorationSlots.ts）|
| 64×64 HeroDisplay + 装飾レイヤー | Task 7 |
| goldStore persist | Task 3 |
| wardrobeStore persist | Task 4 |
| ShopScreen（消耗品/装飾タブ） | Task 10 |
| WardrobeScreen（プレビュー付き） | Task 11 |
| タイトル4メニュー | Task 12 |
| ステージ選択ゴールド表示 | Task 12 |
| ステージクリア獲得ゴールド表示 | Task 9 |
| ハードコード禁止（全数値は config/ に） | Task 1, 2 |

### プレースホルダーチェック

- 全ステップにコードあり ✅
- 「TBD」「TODO」「後で実装」なし ✅
- 型・関数名一貫性（`calcStageGold`, `GoldRewardContext`, `DecorationSlotId`, `useWardrobeStore`, `useGoldStore`）✅
