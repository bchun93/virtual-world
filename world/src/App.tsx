import GameShell from "./components/game/GameShell";
import { GameProvider } from "./game/state/GameContext";

export default function App() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
