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
    tabConsumable: 'アイテム',
    tabDecoration: 'そうび',
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
    noItems: 'もちもののそうびはありません',
    equipped: (name: string) => `${name}をそうびした！`,
  },

  stroke: {
    // 終端種別の表示名
    ending: {
      tome: 'とめ',
      hane: 'はね',
      harai: 'はらい',
    },
    // 終端種別ごとの「どう書くか」のヒント
    action: {
      tome: 'ピタッととめよう',
      hane: 'シュッとはねよう',
      harai: 'スーッとはらおう',
    },
    // 検出種別 ≠ 期待種別
    wrongType: (n: number, detected: string, expected: string, action: string) =>
      `${n}かくめ：${detected}ではなく「${expected}」！さいごは${action}`,
    // 期待種別が未設定で検出種別のみわかる場合
    unexpectedType: (n: number, detected: string) => `${n}かくめ：${detected}になっているよ`,
    // 検出種別は期待どおりだが不正解（＝方向ミス）
    wrongDirection: {
      tome: (n: number) => `${n}かくめ：かきかたをたしかめよう`,
      hane: (n: number) => `${n}かくめ：はねるむきをたしかめよう`,
      harai: (n: number) => `${n}かくめ：はらうむきをたしかめよう`,
    },
    // 検出不能だが期待種別はわかる場合
    unknownWithExpected: (n: number, expected: string, action: string) =>
      `${n}かくめ：さいごは「${expected}」！${action}`,
    // 検出不能・期待種別も不明な場合の汎用メッセージ
    unknown: (n: number) => `${n}かくめ：かきかたをたしかめよう`,
  },

  potion: {
    buttonLabel: 'かいふくやく',
    used: 'かいふくやくをつかった！',
  },

  world: {
    locked: '🔒',
    cleared: '★',
    bossStage: 'ボスせん！',
    bossLabel: (hint: string) => `${hint} ボス`,
    clearTitle: 'ワールドクリア！',
    nextUnlocked: (name: string) => `${name}が かいほうされた！`,
    lastWorld: 'すべてのワールドをクリア！',
    backToWorlds: 'ワールドせんたく',
  },

  offline: {
    badge: 'オフライン',
    title: '📵 オフラインです',
    body1: 'いちどあそんだことばは',
    body2: 'そのままつかえます。',
    body3: 'はじめてのことばには',
    body4: 'インターネットが',
    body5: 'ひつようです。',
    close: 'とじる',
    goToTitle: 'タイトルにもどる',
    loadError: 'データをよみこめませんでした。',
    retry: 'もういちどためす',
  },
}
