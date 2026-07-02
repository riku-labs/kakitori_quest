import { useEffect, useRef } from 'react'
import { MISTAKE_DISPLAY } from '../../config/mistakeDisplay'

interface MistakeStrokesDisplayProps {
  char: string
  mistakeStrokeIndexes: number[]
}

/**
 * 書いた文字を小さく表示し、間違えた画を強調色で示す（Issue #11）。
 * 画数の多い漢字でも「どの画のことか」が一目でわかるようにする。
 */
export function MistakeStrokesDisplay({ char, mistakeStrokeIndexes }: MistakeStrokesDisplayProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const indexesKey = mistakeStrokeIndexes.join(',')

  useEffect(() => {
    if (!hostRef.current || mistakeStrokeIndexes.length === 0) return

    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let charInstance: any = null
    let timer: number | null = null

    const init = async () => {
      const { char: kakitoriChar } = await import('@k1low/kakitori')
      if (cancelled || !hostRef.current) return

      charInstance = kakitoriChar.create(char)
      charInstance.mount(hostRef.current, {
        size: MISTAKE_DISPLAY.size,
        showCharacter: true,
        showOutline: false,
        showGrid: false,
      })

      // ストローク path は文字データのロード後に非同期で描画されるため、
      // 描画を検知してから色を適用する
      const start = Date.now()
      const tryApplyColors = () => {
        if (cancelled || !hostRef.current) return
        if (hostRef.current.querySelector('svg path')) {
          for (const i of mistakeStrokeIndexes) {
            charInstance.setStrokeColor(i, MISTAKE_DISPLAY.mistakeColor)
          }
          return
        }
        if (Date.now() - start < MISTAKE_DISPLAY.pollTimeoutMs) {
          timer = window.setTimeout(tryApplyColors, MISTAKE_DISPLAY.pollIntervalMs)
        }
      }
      tryApplyColors()
    }

    init().catch(() => {})

    return () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
      charInstance?.unmount?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, indexesKey])

  if (mistakeStrokeIndexes.length === 0) return null

  return (
    <div
      style={{
        width: MISTAKE_DISPLAY.size,
        height: MISTAKE_DISPLAY.size,
        flexShrink: 0,
        border: '2px solid var(--color-window-border)',
        background: '#000',
      }}
    >
      <div ref={hostRef} />
    </div>
  )
}
