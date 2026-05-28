# 漢字練習ゲーム(kakitori活用) 設計メモ

## 0. プロジェクト概要

k1LoW さんが開発中の npm package [`kakitori`](https://github.com/k1LoW/kakitori) を活用して、子供向けの漢字練習ゲームを作成する。

**目的**

- 漢字練習にゲーム要素を加えて、自発的にやる気が出る学習体験を提供する
- 静的Webアプリとして配布し、タブレットのブラウザで動作させる
- k1LoW さんの「kakitori を使ったゲームを教えてほしい」という呼びかけに応える

**前提条件**

- 静的サイトとして公開(サーバーレス)
- お子さんがタブレットで使う想定
- ホーム画面に追加して専用アプリのように使える(PWA化)

---

## 1. kakitori ライブラリの理解

### 1.1 概要

kakitori は「漢字や仮名の書き取り」を組み込むためのライブラリ。3層のプリミティブで構成されている。

| プリミティブ | 単位 | 役割 |
|---|---|---|
| `char` | 1文字 | 筆順判定 + とめはねはらい判定 |
| `block` | 1問(複数文字) | マス目とふりがな |
| `page` | 1ページ(複数block) | 漢字練習帳ライクなレイアウト |

### 1.2 提供される判定機能

- **筆順判定**: 画(stroke)単位での正解/不正解
- **とめ・はね・はらい判定**: 各画の終端の運筆角度・速度から判定
- **結果取得**: ツリー構造で完了状態、一致度、ミス回数を取得可能

### 1.3 コールバック

- `onCorrectStroke`: 画が正しく書けたとき
- `onMistake`: 画を間違えたとき
- `onComplete`: 文字が完成したとき

---

## 2. ゲームデザイン

### 2.1 コアコンセプト

**「書く = 筆の運び = キャラクターの移動」というメタファー**

正しい筆順でキャラクターを動かしてゴールまで導くゲーム。とめ・はね・はらいで移動の終端アクションが決まる。

### 2.2 技術的実現可能性

kakitori の API と素直に対応している。

```typescript
const c = char.create("石");
c.mount(host, {
  onCorrectStroke: (data) => {
    // 1画書き終わった = キャラが1区間移動完了
    player.moveAlongPath(data.strokePath);
    
    // 画の終端タイプで演出を分岐
    if (data.ending.type === "tome") player.stop();      // ピタッと停止
    if (data.ending.type === "hane") player.jump();      // 軽くジャンプ
    if (data.ending.type === "harai") player.slideOut(); // 滑るように消える
  },
  onMistake: (data) => player.takeDamage(1),
  onComplete: ({ totalMistakes }) => floor.clear(totalMistakes),
});
```

### 2.3 「折れ・方向判定」の扱い

- kakitori は **画(stroke)単位** で正解/不正解を判定する
- 画の内部の「折れ」「縦横斜め」はライブラリ側で吸収されている
- ゲームロジックは「画が正解だったか」を信じて進めれば良い
- Hanzi Writer の SVG path データを利用してキャラの移動経路を可視化できる

### 2.4 ステージ・フロア構成

- **1文字 = 1フロア** → `char` プリミティブに対応
- **熟語 = 1ステージ(複数フロア)** → `block` プリミティブに対応
- **1ワールド = 漢字練習帳1ページ** → `page` プリミティブに対応

例: 「いし」=1ステージ2フロア

```typescript
block.create(host, {
  spec: {
    cells: [
      { kind: "guided", char: "い", mode: "write" },
      { kind: "guided", char: "し", mode: "write" },
    ],
  },
});
```

### 2.5 とめ・はね・はらいのスキル化

画の終端アクションをそのままゲーム的なアクションに翻訳する。

| 終端 | ゲームアクション | 例 |
|---|---|---|
| とめ | 急ブレーキ・停止 | 敵を踏みつけて止める、トラップを起動 |
| はね | ジャンプ攻撃 | 上の敵に当たる、高い足場に乗る |
| はらい | スライド突撃 | 横の敵を吹き飛ばす、ロープを切る |

「とめはねはらいを意識して書く」 = 「ゲームを有利に進める」という直結を作る。k1LoW さんの「とめはねはらいを意識してほしい」という思想と合致する。

### 2.6 ゴールド経済

- ステージクリアでゴールド獲得
- 新規クリアの方がリプレイより報酬率が高い
- ただし「漢字練習は反復が重要」という学習特性とは矛盾するので、以下で調整:
  - 同じ漢字を連続でやるとゴールド減衰
  - 別の漢字を挟むと回復
  - 7日ぶりの復習にボーナス(エビングハウス忘却曲線連動)

### 2.7 アイテム

| 種類 | 例 |
|---|---|
| お助け | 筆順ヒント表示、ミス1回見逃しお守り、お手本再生、時間延長 |
| 修飾 | キャラスキン、筆の色・軌跡エフェクト、フロアの背景テーマ |

修飾アイテムは性能に影響しないという分離を明確にする。

### 2.8 追加アイデア

**ストーリー仕立て(RPG的)**

文字の世界が崩壊し、漢字を書くことで世界を取り戻す旅。

- 「火」を書くと村のかまどに火が灯る
- 「木」を書くと森が復活する
- 「学校」を書くと校舎が建つ

**ボス漢字**

画数の多い漢字(「鬱」「龍」「魔」など)をボス戦として配置。書けなくても「いつか書けるようになりたい」というモチベーションになる。

**部首コレクション**

「氵」を含む漢字を10回書いたら水の精霊が仲間になる、など。仲間にした精霊はパッシブスキル(「とめ」の判定が甘くなる、ゴールド+10%等)を持つ。

**ランキング機能**

- 先週の自分との対戦
- 兄弟ランキング
- クラスコード入力で学級内ランキング

グローバルランキングは小2の子には挫折要因になり得るので、競争範囲を絞る設計が望ましい。

**親子モード**

`page` プリミティブで複数 block を並べて、子が「い」、親が「し」を同時に書いて熟語を完成させる。

---

## 3. 実装ロードマップ

MVPから段階的に拡張する。

| Phase | 内容 |
|---|---|
| Phase 1 (MVP) | 1文字フロア + キャラ移動演出(ペン先=キャラ、画=道) |
| Phase 2 | 熟語ステージ化(block で2〜3文字) |
| Phase 3 | ゴールド経済とお助けアイテム1〜2種(筆順ヒント、ミス見逃し) |
| Phase 4 | とめはねはらいスキル化(ここでゲームらしくなる) |
| Phase 5 | ストーリー・世界復活演出 |
| Phase 6 | ボス、部首コレクション、ランキング(寿命延長機能) |

Phase 1〜3 が動けば、お子さんに見せて反応を見るところまでいける。

---

## 4. デプロイ戦略

### 4.1 配信方法の選択

| 配布方法 | 負荷 | 運用負担 | 推奨度 |
|---|---|---|---|
| GitHub Pages | なし | デプロイ自動化のみ | ◎(k1LoW さんの想定と一致) |
| Cloudflare Pages | なし | デプロイ自動化のみ | ◎(高速、機能豊富) |
| Cloudflare Tunnel + ローカル | 実質ほぼなし | Mac常時起動が必要 | △(理由がない) |

### 4.2 GitHub Pages vs Cloudflare Pages

| 項目 | GitHub Pages | Cloudflare Pages |
|---|---|---|
| 配信CDN | Fastly | Cloudflare(330+都市) |
| ビルド | GitHub Actions(自分で書く) | 内蔵(リポジトリ繋ぐだけ) |
| プレビュー環境 | なし | PRごとに自動生成 |
| ロールバック | git revert | ダッシュボードでワンクリック |
| 動的機能の追加 | できない | Pages Functions で可能 |
| 帯域 | ソフト100GB/月 | 無制限 |
| Web Analytics | 自前で入れる | 標準装備 |
| URL | `user.github.io/repo/` (サブパス) | `project.pages.dev` (ルート) |

### 4.3 推奨戦略

**MVPは GitHub Pages で始めて、動的機能が欲しくなったら Cloudflare Pages に移行**

理由:
1. 最初は「kakitori を使った最小ゲーム」を動かすのが大事
2. 静的アセットだけなら移行は容易(1日で終わる)
3. k1LoW さんに見せる段階では同じプラットフォーム(github.io)の方が話が早い

### 4.4 PWA化

`manifest.json` を追加することで:

- ホーム画面に追加可能
- アイコンタップでフルスクリーン起動
- iOS Safari の ITP (7日ルール) の影響を受けにくい
- オフラインでも動作可能(Service Worker 設定時)

---

## 5. 状態管理(静的サイト前提)

### 5.1 ブラウザストレージの選択

| 方式 | 容量 | 用途 |
|---|---|---|
| localStorage | 5〜10MB | ゴールド、進捗、設定 |
| IndexedDB | 数GB | 書いた履歴、画像、大量データ |

ゴールド・アイテム・進捗は **localStorage で十分**(数百KB程度)。

### 5.2 実装イメージ(Zustand + persist)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGameStore = create(persist(
  (set) => ({
    gold: 0,
    items: [] as string[],
    clearedStages: [] as string[],
    
    addGold: (amount: number) => 
      set(state => ({ gold: state.gold + amount })),
    
    buyItem: (item: string, cost: number) =>
      set(state => ({
        gold: state.gold - cost,
        items: [...state.items, item],
      })),
  }),
  { name: 'kanji-quest-save-v1' }
));
```

### 5.3 ブラウザストレージの落とし穴と対策

| リスク | 対策 |
|---|---|
| iOS Safari の ITP(7日ルール) | PWA化(ホーム画面追加)で対象外になる |
| プライベートブラウジング | お子さん利用では通常起きない |
| ブラウザ・端末変更 | セーブコード機能で対応 |
| 親のうっかり履歴削除 | セーブコード機能で対応 |

### 5.4 セーブコード機能(Phase 2 で追加)

データを暗号化して文字列化、コピーまたはQRコード表示できる機能。

- 月1回程度、親が「設定 → セーブコード表示」でコピーしてメモ
- 万一消えても「インポート」で復元可能
- **完全に静的ページのまま実現できる**

### 5.5 ファミリープロフィール(必要なら)

複数の子供で共有する場合、localStorage キーをプロフィール別に分ける。

```
kanji-quest-save-taro
kanji-quest-save-hanako
```

起動時にプロフィール選択画面を出す。

---

## 6. チート対策(AES-GCM暗号化)

### 6.1 設計方針

ゴールド獲得はインセンティブ設計の中核なので、**チートで増やせるパスは塞ぐ**。

### 6.2 採用方式: AES-GCM 暗号化

**選定理由**

- 暗号化と改竄検出が一体(認証付き暗号)
- ブラウザ標準の Web Crypto API で実装可能(ライブラリ不要)
- 中身が見えないため、HMAC署名より一段強い
- コード量は HMAC とほぼ同じ(30行程度)

### 6.3 強度の階層

| レベル | 手段 | 突破に必要なスキル |
|---|---|---|
| 0 | 平文JSON | 開発者ツール開ける人 |
| 1 | Base64 | `atob()` を知ってる人 |
| 2 | HMAC署名 | JSコードを読める人 |
| **3** | **AES-GCM暗号化(採択)** | **同上、鍵を探せる人** |
| 4 | 暗号化 + 鍵動的生成 + 整合性履歴 | 真面目に解析する人 |
| 5 | WASMで暗号化処理を隠蔽 | リバースエンジニアできる人 |

レベル3で実用上は十分過剰。

### 6.4 実装イメージ

```typescript
const KEY_STRING = "kanji-quest-secret-2026";

async function getKey(): Promise<CryptoKey> {
  const data = new TextEncoder().encode(KEY_STRING);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return crypto.subtle.importKey(
    "raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
  );
}

async function encryptSave(state: GameState): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(state))
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptSave(code: string): Promise<GameState | null> {
  try {
    const key = await getKey();
    const combined = Uint8Array.from(atob(code), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, key, ciphertext
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}
```

### 6.5 原理的な限界

鍵がクライアント側に存在する限り、**理論上は必ず突破可能**。完全防御を求めるならサーバー検証が必要だが、静的サイト前提を放棄することになる。AES-GCM は「カジュアルなチートを防ぐ」レベルでの最適解。

### 6.6 ゲームデザインによる補強

技術的な防御に加えて、ゲーム設計でチートの旨味を減らす。

- **ゴールドは装飾アイテムのみに使う**: スキン、エフェクト、背景。ゲーム進行に影響しない
- **達成感の中核を別の指標に置く**: 「学年クリア達成」「全部首コレクション」「100ステージ連続無ミス」等
- **お助けアイテム使用はスタンプの色が変わる**: ノーヒントは金、ヒント使用は銀

これらによって、ゴールドを盛っても「ゲーム本来の達成感」には踏み込めない設計にする。

### 6.7 追加の整合性チェック(オプション)

ゴールド残高履歴を別途保存して、現在残高と矛盾しないか検証する。

```typescript
type GoldHistory = {
  timestamp: number;
  stage: string;
  amount: number;  // 正=獲得、負=消費
};

function validateGold(state: GameState): boolean {
  const calculated = state.goldHistory.reduce((sum, h) => sum + h.amount, 0);
  return calculated === state.gold;
}
```

履歴ごと辻褄を合わせて改竄するハードルを上げる。

---

## 7. 技術スタック(暫定)

| 領域 | 採用予定 |
|---|---|
| 言語 | TypeScript |
| フレームワーク | React + Vite |
| 状態管理 | Zustand(persist ミドルウェア使用) |
| アニメーション | Framer Motion または GSAP |
| 漢字判定 | `@k1low/kakitori` |
| 暗号化 | Web Crypto API(AES-GCM) |
| QRコード生成 | `qrcode` (セーブコード機能用) |
| ホスティング | GitHub Pages(MVP)→ Cloudflare Pages(動的機能追加時) |
| CI/CD | GitHub Actions |

---

## 8. 次のアクション候補

- [ ] リポジトリ作成(`kanji-quest` 等)
- [ ] Vite + React + TypeScript プロジェクト初期化
- [ ] `@k1low/kakitori` 導入と動作確認
- [ ] Phase 1 実装: 1文字フロアでキャラ移動演出
- [ ] GitHub Pages デプロイ設定(GitHub Actions)
- [ ] PWA化(manifest.json + Service Worker)
- [ ] お子さんによる初期フィードバック取得

---

## 参考リンク

- [kakitori (k1LoW さんブログ記事)](https://k1low.hatenablog.com/entry/2026/05/25/083000)
- [kakitori GitHub](https://github.com/k1LoW/kakitori)
- [kakitori デモ](https://k1low.github.io/kakitori/)
- [Hanzi Writer](https://hanziwriter.org/)
- [Web Crypto API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
