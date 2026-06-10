import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import { WORLDS } from '../config/worlds'
import type { WritingAreaPosition, CharSize } from '../types/game'

const DEBUG_PASSWORD = 'ochansensusu'

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
  const { writingAreaPosition, setWritingAreaPosition, charSize, setCharSize, goToTitle, goToStageSelect, setCurrentWorld } = useGameStore()

  function handleDebugFromHere() {
    const pw = window.prompt('password')
    if (pw !== DEBUG_PASSWORD) return
    const worldId = window.prompt('world id (grade1~grade6)')
    if (!worldId) return
    const world = WORLDS.find((w) => w.id === worldId)
    if (!world) return
    const toSet = world.wordIds.slice(1)
    const patch: Record<string, number> = {}
    for (const id of toSet) patch[id] = 3
    useGameStore.setState((s) => ({ clearedWords: { ...s.clearedWords, ...patch } }))
    setCurrentWorld(worldId)
    goToStageSelect()
  }

  function handleClearAll() {
    const pw = window.prompt('password')
    if (pw !== DEBUG_PASSWORD) return
    useGameStore.setState({ clearedWords: {}, currentWorldId: 'grade1' })
    goToTitle()
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
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

        <div style={{ marginTop: '24px', borderTop: '1px solid #333', paddingTop: '12px', fontSize: '0.55em', color: '#444', lineHeight: 1.6 }}>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <span
            onClick={handleDebugFromHere}
            style={{ cursor: 'pointer', color: '#333' }}
          >and debug from here</span>
          {' / '}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <span
            onClick={handleClearAll}
            style={{ cursor: 'pointer', color: '#333' }}
          >clear all</span>
          {' '}
          Character stroke data via{' '}
          <a href="https://github.com/k1LoW/hanzi-writer-data-jp" target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>@k1low/hanzi-writer-data-jp</a>,
          derived from{' '}
          <a href="https://github.com/parsimonhi/animCJK" target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>animCJK</a> (LGPL v3+),{' '}
          <a href="https://github.com/k1LoW/subAnimJ" target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>subAnimJ</a> (Arphic PL),{' '}
          <a href="https://github.com/k1LoW/animNumber" target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>animNumber</a> (SIL OFL 1.1),{' '}
          <a href="https://www.unicode.org/charts/unihan.html" target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>Unihan</a> (Unicode license).
        </div>
      </DQWindow>
    </div>
  )
}
