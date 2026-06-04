import { useEffect, useRef } from 'react'

interface CharacterDisplayProps {
  char: string
  accuracy: number
  visible: boolean
}

export function CharacterDisplay({ char, accuracy, visible }: CharacterDisplayProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const strength = Math.round(accuracy * 100)
  const color =
    accuracy >= 0.9
      ? '#7fff00'
      : accuracy >= 0.6
        ? '#ffd700'
        : '#ff8844'

  useEffect(() => {
    if (!hostRef.current) return
    const el = hostRef.current
    el.innerHTML = ''
    import('@k1low/kakitori').then(({ char: kakitoriChar }) => {
      kakitoriChar.render(el, char, { size: 80, strokeColor: color })
    })
  }, [char, color])

  return (
    <div style={{ textAlign: 'center', opacity: visible ? 1 : 0.2 }}>
      <div
        ref={hostRef}
        style={{
          display: 'inline-block',
          lineHeight: 1,
          filter: `drop-shadow(0 0 8px ${color})`,
        }}
      />
      {visible && (
        <div style={{ color, fontSize: '0.65em', marginTop: '4px' }}>
          ちから {strength}%
        </div>
      )}
    </div>
  )
}
