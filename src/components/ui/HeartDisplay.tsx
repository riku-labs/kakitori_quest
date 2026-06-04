interface HeartDisplayProps {
  current: number
  max: number
}

export function HeartDisplay({ current, max }: HeartDisplayProps) {
  return (
    <div style={{ display: 'flex', gap: '4px', fontSize: '1.2em' }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{ color: i < current ? 'var(--color-hp)' : '#333' }}
        >
          ❤
        </span>
      ))}
    </div>
  )
}
