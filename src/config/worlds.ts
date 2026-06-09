export interface WorldConfig {
  id: string          // 'grade1', 'grade2', ...
  name: string        // '1ねんせいワールド'
  wordIds: string[]   // WORD_LIST の id を参照
  bossWord: string    // ボス単語（ひらがな or 漢字）
  bossHint: string    // ボスの絵文字ヒント
}

export function isWorldComplete(
  clearedWords: Record<string, number>,
  wordIds: string[],
): boolean {
  return wordIds.every((id) => (clearedWords[id] ?? 0) > 0)
}

export const WORLDS: WorldConfig[] = [
  {
    id: 'grade1',
    name: '1ねんせいワールド',
    wordIds: [
      // 1文字ひらがな
      'え', 'か', 'き', 'こ', 'て', 'ひ', 'め', 'や', 'ゆ', 'わ',
      // 2文字ひらがな
      'あめ', 'いぬ', 'うし', 'えび', 'かに', 'くも', 'さる', 'たこ', 'ねこ', 'はな',
      // 3文字ひらがな
      'いちご', 'うさぎ', 'きつね', 'さくら', 'りんご',
      // 4文字ひらがな
      'あおぞら', 'ひまわり', 'むらさき',
      // 5文字ひらがな
      'かたつむり',
      // 漢字1文字（小1）
      '山', '川', '木', '火', '水', '日', '月', '目', '耳', '口', '手',
      '花', '虫', '雨', '石', '草', '竹', '森', '空', '犬',
      // 漢字2文字（小1）
      '火山', '大木', '天気', '草木', '大空',
      // 追加語（カバー用）
      'けむし', 'しか', 'すずめ', 'せみ', 'ちょうちょ', 'つる', 'とり',
      'なし', 'にわとり', 'ぬいぐるみ', 'のはら', 'ふね', 'へび', 'ほたる',
      'まめ', 'もも', 'よる', 'れんこん', 'ろうそく',
    ],
    bossWord: 'かみなり',
    bossHint: '⚡',
  },
  {
    id: 'grade2',
    name: '2ねんせいワールド',
    wordIds: [],
    bossWord: 'しんりんのとり',
    bossHint: '🐦',
  },
  {
    id: 'grade3',
    name: '3ねんせいワールド',
    wordIds: [],
    bossWord: '',
    bossHint: '👾',
  },
  {
    id: 'grade4',
    name: '4ねんせいワールド',
    wordIds: [],
    bossWord: '',
    bossHint: '👾',
  },
  {
    id: 'grade5',
    name: '5ねんせいワールド',
    wordIds: [],
    bossWord: '',
    bossHint: '👾',
  },
  {
    id: 'grade6',
    name: '6ねんせいワールド',
    wordIds: [],
    bossWord: '',
    bossHint: '👾',
  },
]
