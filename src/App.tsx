import { useGameStore } from './store/gameStore'
import { TitleScreen } from './screens/TitleScreen'
import { StageSelectScreen } from './screens/StageSelectScreen'
import { GameScreen } from './components/game/GameScreen'
import { StageCompleteScreen } from './screens/StageCompleteScreen'
import { GameOverScreen } from './screens/GameOverScreen'
import { SettingsScreen } from './screens/SettingsScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  switch (screen) {
    case 'title':         return <TitleScreen />
    case 'stageSelect':   return <StageSelectScreen />
    case 'game':          return <GameScreen />
    case 'stageComplete': return <StageCompleteScreen />
    case 'gameOver':      return <GameOverScreen />
    case 'settings':      return <SettingsScreen />
    default:              return <TitleScreen />
  }
}
