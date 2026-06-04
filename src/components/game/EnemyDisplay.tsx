import { useEffect, useRef } from 'react'
import type { CorruptionStyle } from '../../types/game'

interface EnemyDisplayProps {
  char: string
  corruptionStyle: CorruptionStyle
}

interface CorruptionCSS {
  filter: string
  transform: string
}

const corruptionCSS: Record<CorruptionStyle, CorruptionCSS> = {
  default: {
    filter: 'hue-rotate(160deg) brightness(0.8) contrast(1.5) drop-shadow(2px 2px 0px #000) drop-shadow(0 0 8px #ff0000)',
    transform: 'scaleX(-1)',
  },
  fire: {
    filter: 'hue-rotate(160deg) brightness(0.8) contrast(1.5)',
    transform: 'scaleX(-1)',
  },
  shadow: {
    filter: 'brightness(0.3) contrast(2)',
    transform: 'scaleX(-1)',
  },
  shattered: {
    filter: 'hue-rotate(160deg) brightness(0.8) contrast(1.5)',
    transform: 'scaleX(-1) rotate(15deg)',
  },
}

export function EnemyDisplay({ char, corruptionStyle }: EnemyDisplayProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const css = corruptionCSS[corruptionStyle]

  useEffect(() => {
    if (!hostRef.current) return
    const el = hostRef.current
    el.innerHTML = ''
    let cancelled = false
    import('@k1low/kakitori').then(({ char: kakitoriChar }) => {
      if (cancelled) return
      el.innerHTML = ''
      kakitoriChar.render(el, char, { size: 80, strokeColor: '#ff4444' })
    })
    return () => {
      cancelled = true
      el.innerHTML = ''
    }
  }, [char])

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        ref={hostRef}
        style={{
          display: 'inline-block',
          lineHeight: 1,
          filter: css.filter,
          transform: css.transform,
        }}
      />
      <div style={{ color: 'var(--color-enemy)', fontSize: '0.7em', marginTop: '4px' }}>
        まがった「{char}」
      </div>
    </div>
  )
}
