import { motion } from 'framer-motion'
import { DQWindow } from '../components/ui/DQWindow'
import { useGameStore } from '../store/gameStore'
import { WORLDS } from '../config/worlds'
import { MSG } from '../config/messages'

export function WorldClearScreen() {
  const { goToWorldSelect, currentWorldId } = useGameStore()

  const currentIdx = WORLDS.findIndex((w) => w.id === currentWorldId)
  const currentWorld = WORLDS[currentIdx]
  const nextWorld = WORLDS[currentIdx + 1] ?? null

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
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <DQWindow style={{ width: '320px', textAlign: 'center' }}>
          <div
            style={{
              color: 'var(--color-accent)',
              fontSize: '1.4em',
              marginBottom: '16px',
            }}
          >
            {MSG.world.clearTitle}
          </div>

          <div style={{ fontSize: '2.5em', marginBottom: '8px' }}>
            {currentWorld?.bossHint ?? '⭐'}
          </div>

          <div
            style={{
              fontSize: '1em',
              marginBottom: '24px',
              color: 'var(--color-text-dim)',
            }}
          >
            {nextWorld
              ? MSG.world.nextUnlocked(nextWorld.name)
              : MSG.world.lastWorld}
          </div>

          <button
            onClick={goToWorldSelect}
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
            ▶　{MSG.world.backToWorlds}
          </button>
        </DQWindow>
      </motion.div>
    </div>
  )
}
