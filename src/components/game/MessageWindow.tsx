import { DQWindow } from '../ui/DQWindow'

interface MessageWindowProps {
  message: string
  detail?: string
}

export function MessageWindow({ message, detail }: MessageWindowProps) {
  return (
    <DQWindow style={{ minHeight: '60px' }}>
      <p style={{ fontSize: '0.9em', lineHeight: 1.8, color: 'var(--color-text)' }}>
        {message}
      </p>
      {detail && (
        <p
          style={{
            fontSize: '0.75em',
            lineHeight: 1.8,
            color: 'var(--color-text-dim)',
            marginTop: '4px',
            whiteSpace: 'pre-line',
          }}
        >
          {detail}
        </p>
      )}
    </DQWindow>
  )
}
