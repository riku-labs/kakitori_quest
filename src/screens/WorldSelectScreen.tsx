import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import { useWorldStore } from '../store/worldStore'
import { WORLDS } from '../config/worlds'
import { MSG } from '../config/messages'

export function WorldSelectScreen() {
  const { goToTitle } = useGameStore()
  const { clearedWorlds, setCurrentWorld } = useWorldStore()
  const goToStageSelect = useGameStore((s) => s.goToStageSelect)

  function handleSelectWorld(worldId: string) {
    setCurrentWorld(worldId)
    goToStageSelect()
  }

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
            color: 'var(--color-accent)',
            fontSize: '0.9em',
            marginBottom: '12px',
            borderBottom: '1px solid #333',
            paddingBottom: '8px',
          }}
        >
          ワールドをえらぼう
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {WORLDS.map((world, idx) => {
            const isCleared = clearedWorlds.includes(world.id)
            const isUnlocked = idx === 0 || clearedWorlds.includes(WORLDS[idx - 1].id)

            return (
              <button
                key={world.id}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && handleSelectWorld(world.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #1a1a1a',
                  color: isUnlocked ? 'var(--color-text)' : '#444',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '1em',
                  padding: '12px 8px',
                  cursor: isUnlocked ? 'pointer' : 'default',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (isUnlocked) e.currentTarget.style.background = '#111'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                }}
              >
                <span style={{ flex: 1 }}>{world.name}</span>
                <span style={{ color: 'var(--color-accent)', fontSize: '0.9em' }}>
                  {isCleared ? MSG.world.cleared : isUnlocked ? '' : MSG.world.locked}
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
