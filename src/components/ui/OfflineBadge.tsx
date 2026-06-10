import { useState } from 'react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { MSG } from '../../config/messages'
import { DQWindow } from './DQWindow'

export function OfflineBadge() {
  const isOnline = useOnlineStatus()
  const [open, setOpen] = useState(false)

  if (isOnline) return null

  return (
    <>
      <button
        aria-label={MSG.offline.badge}
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          top: '8px',
          left: '8px',
          zIndex: 9999,
          background: '#111',
          border: '1px solid var(--color-accent)',
          borderRadius: '4px',
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.7em',
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        📵 {MSG.offline.badge}
      </button>

      {open && (
        <>
          <div
            data-testid="offline-overlay"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.6)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10001,
              width: '280px',
            }}
          >
            <DQWindow>
              <p style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>
                {MSG.offline.title}
              </p>
              <p style={{ fontSize: '0.9em', lineHeight: 1.8, marginBottom: '16px' }}>
                <span style={{ display: 'block' }}>{MSG.offline.body1}</span>
                <span style={{ display: 'block' }}>{MSG.offline.body2}</span>
                <br />
                <span style={{ display: 'block' }}>{MSG.offline.body3}</span>
                <span style={{ display: 'block' }}>{MSG.offline.body4}</span>
                <span style={{ display: 'block' }}>{MSG.offline.body5}</span>
              </p>
              <button
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '1em',
                  padding: '8px',
                  cursor: 'pointer',
                }}
              >
                ▶　{MSG.offline.close}
              </button>
            </DQWindow>
          </div>
        </>
      )}
    </>
  )
}
