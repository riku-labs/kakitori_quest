import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'

export function TitleScreen() {
  const { goToStageSelect, goToSettings } = useGameStore((s) => ({ goToStageSelect: s.goToStageSelect, goToSettings: s.goToSettings }))

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
      }}
    >
      <DQWindow style={{ width: '320px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '2em',
            color: 'var(--color-accent)',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}
        >
          かきとり
        </h1>
        <div
          style={{
            fontSize: '1.2em',
            color: 'var(--color-text-dim)',
            marginBottom: '32px',
            letterSpacing: '2px',
          }}
        >
          QUEST
        </div>
        <button
          onClick={goToStageSelect}
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
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        >
          ▶　あそぶ
        </button>
        <button
          onClick={goToSettings}
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
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        >
          　　せってい
        </button>
      </DQWindow>
    </div>
  )
}
