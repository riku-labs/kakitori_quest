import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import type { WritingAreaPosition, CharSize } from '../types/game'

const POSITIONS: { value: WritingAreaPosition; label: string }[] = [
  { value: 'auto',   label: 'じどう（おすすめ）' },
  { value: 'right',  label: 'みぎ' },
  { value: 'left',   label: 'ひだり' },
  { value: 'bottom', label: 'した' },
]

const CHAR_SIZES: { value: CharSize; label: string }[] = [
  { value: 'small',  label: 'ちいさい（100）' },
  { value: 'medium', label: 'ふつう（200）' },
  { value: 'large',  label: 'おおきい（300）' },
]

export function SettingsScreen() {
  const { writingAreaPosition, setWritingAreaPosition, charSize, setCharSize, goToTitle } = useGameStore()

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
      <DQWindow style={{ width: '300px' }}>
        <div style={{ color: 'var(--color-accent)', marginBottom: '16px', fontSize: '0.9em' }}>
          せってい
        </div>

        <div style={{ marginBottom: '8px', fontSize: '0.8em', color: 'var(--color-text-dim)' }}>
          かきとりエリアのいち
        </div>

        {POSITIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setWritingAreaPosition(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              background: 'none',
              border: 'none',
              color: writingAreaPosition === value ? 'var(--color-accent)' : 'var(--color-text)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '1em',
              padding: '8px',
              cursor: 'pointer',
            }}
          >
            {writingAreaPosition === value ? '▶' : '　'} {label}
          </button>
        ))}

        <div style={{ marginTop: '16px', marginBottom: '8px', fontSize: '0.8em', color: 'var(--color-text-dim)' }}>
          もじのおおきさ
        </div>

        {CHAR_SIZES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCharSize(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              background: 'none',
              border: 'none',
              color: charSize === value ? 'var(--color-accent)' : 'var(--color-text)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '1em',
              padding: '8px',
              cursor: 'pointer',
            }}
          >
            {charSize === value ? '▶' : '　'} {label}
          </button>
        ))}

        <button
          onClick={goToTitle}
          style={{
            marginTop: '24px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-dim)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.8em',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ◀　もどる
        </button>
      </DQWindow>
    </div>
  )
}
