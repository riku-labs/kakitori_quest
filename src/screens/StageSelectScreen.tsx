import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import { WORD_LIST } from '../data/wordList'

export function StageSelectScreen() {
  const { startStage, clearedWords, goToTitle } = useGameStore()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        padding: '16px',
      }}
    >
      <DQWindow style={{ width: '360px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            color: 'var(--color-accent)',
            fontSize: '0.9em',
            marginBottom: '12px',
            borderBottom: '1px solid #333',
            paddingBottom: '8px',
          }}
        >
          ことばをえらぼう
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {WORD_LIST.map((entry) => {
            const bestStar = clearedWords[entry.word] ?? 0
            return (
              <button
                key={entry.word}
                onClick={() => startStage(entry)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #1a1a1a',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '1em',
                  padding: '10px 8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#111')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: '1.4em' }}>{entry.hint}</span>
                <span style={{ flex: 1 }}>{entry.word}</span>
                <span style={{ color: 'var(--color-accent)', fontSize: '0.8em' }}>
                  {bestStar > 0 ? '★'.repeat(bestStar) + '☆'.repeat(3 - bestStar) : '　　　'}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={goToTitle}
          style={{
            marginTop: '12px',
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
