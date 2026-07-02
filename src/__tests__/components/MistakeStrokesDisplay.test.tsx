// Issue #11: 間違えた画をビジュアルで強調表示する
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createMock, mountMock, setStrokeColorMock, unmountMock } = vi.hoisted(() => {
  const setStrokeColorMock = vi.fn()
  const unmountMock = vi.fn()
  const instance: Record<string, unknown> = {}
  const mountMock = vi.fn((target: HTMLElement) => {
    // 実ライブラリ同様、マウント後に svg + path を描画する
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    for (let i = 0; i < 3; i++) {
      svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
    }
    target.appendChild(svg)
    return instance
  })
  Object.assign(instance, {
    mount: mountMock,
    setStrokeColor: setStrokeColorMock,
    unmount: unmountMock,
  })
  const createMock = vi.fn(() => instance)
  return { createMock, mountMock, setStrokeColorMock, unmountMock }
})

vi.mock('@k1low/kakitori', () => ({
  char: { create: createMock },
}))

import { MistakeStrokesDisplay } from '../../components/game/MistakeStrokesDisplay'
import { MISTAKE_DISPLAY } from '../../config/mistakeDisplay'

describe('MistakeStrokesDisplay', () => {
  beforeEach(() => {
    createMock.mockClear()
    mountMock.mockClear()
    setStrokeColorMock.mockClear()
    unmountMock.mockClear()
  })

  it('ミス画がなければ何も表示しない', () => {
    const { container } = render(<MistakeStrokesDisplay char="山" mistakeStrokeIndexes={[]} />)
    expect(container.firstChild).toBeNull()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('対象文字をマウントし、ミス画に強調色を適用する', async () => {
    render(<MistakeStrokesDisplay char="山" mistakeStrokeIndexes={[0, 2]} />)
    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith('山')
      expect(mountMock).toHaveBeenCalled()
      expect(setStrokeColorMock).toHaveBeenCalledWith(0, MISTAKE_DISPLAY.mistakeColor)
      expect(setStrokeColorMock).toHaveBeenCalledWith(2, MISTAKE_DISPLAY.mistakeColor)
    })
  })

  it('アンマウント時にライブラリ側も unmount する', async () => {
    const { unmount } = render(
      <MistakeStrokesDisplay char="山" mistakeStrokeIndexes={[1]} />,
    )
    await waitFor(() => expect(mountMock).toHaveBeenCalled())
    unmount()
    expect(unmountMock).toHaveBeenCalled()
  })
})
