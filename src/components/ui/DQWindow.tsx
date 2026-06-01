import type { ReactNode, CSSProperties } from 'react'

interface DQWindowProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function DQWindow({ children, style, className }: DQWindowProps) {
  return (
    <div
      className={className}
      style={{
        border: '3px solid var(--color-window-border)',
        background: '#000',
        padding: '12px',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
