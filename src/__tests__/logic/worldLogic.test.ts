import { describe, it, expect } from 'vitest'
import { isWorldComplete } from '../../config/worlds'

describe('isWorldComplete', () => {
  it('全単語がクリア済みのとき true を返す', () => {
    const clearedWords = { 'あめ': 2, 'いぬ': 1, 'うし': 3 }
    const wordIds = ['あめ', 'いぬ', 'うし']
    expect(isWorldComplete(clearedWords, wordIds)).toBe(true)
  })

  it('未クリアの単語があるとき false を返す', () => {
    const clearedWords = { 'あめ': 2, 'いぬ': 0 }
    const wordIds = ['あめ', 'いぬ', 'うし']
    expect(isWorldComplete(clearedWords, wordIds)).toBe(false)
  })

  it('clearedWords に存在しない単語は未クリアとみなす', () => {
    const clearedWords = { 'あめ': 1 }
    const wordIds = ['あめ', 'いぬ']
    expect(isWorldComplete(clearedWords, wordIds)).toBe(false)
  })

  it('星が 0 の単語は未クリアとみなす', () => {
    const clearedWords = { 'あめ': 0, 'いぬ': 1 }
    const wordIds = ['あめ', 'いぬ']
    expect(isWorldComplete(clearedWords, wordIds)).toBe(false)
  })

  it('wordIds が空のとき true を返す（ボスのみワールド想定）', () => {
    expect(isWorldComplete({}, [])).toBe(true)
  })
})
