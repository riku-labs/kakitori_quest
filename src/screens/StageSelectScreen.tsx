import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import { useGoldStore } from '../store/goldStore'
import { WORD_LIST } from '../data/wordList'
import { WORLDS, isWorldComplete, isBossCleared } from '../config/worlds'
import { MSG } from '../config/messages'

export function StageSelectScreen() {
  const { startStage, startBossStage, clearedWords, goToWorldSelect, currentWorldId } = useGameStore()
  const gold = useGoldStore((s) => s.gold)

  const world = WORLDS.find((w) => w.id === currentWorldId)
  const worldWords = world
    ? WORD_LIST.filter((e) => world.wordIds.includes(e.id))
    : []

  const allNormalCleared = world ? isWorldComplete(clearedWords, world.wordIds) : false
  const worldAlreadyCleared = world ? isBossCleared(clearedWords, world.id) : false
  const showBossStage = allNormalCleared && !worldAlreadyCleared && world?.bossWord

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        background: '#000',
        padding: '16px',
      }}
    >
      <DQWindow style={{ width: '360px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--color-accent)',
            fontSize: '0.9em',
            marginBottom: '12px',
            borderBottom: '1px solid #333',
            paddingBottom: '8px',
          }}
        >
          <span>{world?.name ?? 'ことばをえらぼう'}</span>
          <span>{MSG.goldBalance(gold)}</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {worldWords.map((entry) => {
            const bestStar = clearedWords[entry.id] ?? 0
            return (
              <button
                key={entry.id}
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

          {showBossStage && world && (
            <button
              onClick={() => startBossStage(world.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: 'none',
                border: '1px solid var(--color-accent)',
                borderRadius: '4px',
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '1em',
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: '8px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#111')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: '1.4em' }}>{world.bossHint}</span>
              <span style={{ flex: 1 }}>{MSG.world.bossLabel(world.bossHint)}</span>
              <span style={{ fontSize: '0.8em' }}>{MSG.world.bossStage}</span>
            </button>
          )}
        </div>

        <button
          onClick={goToWorldSelect}
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
