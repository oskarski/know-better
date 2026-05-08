import { GameShell } from "@/components/game/game-shell";
import { LoginForm } from "@/components/game/login-form";
import { getGameSnapshot } from "@/lib/game-store";
import { getSessionPlayerId } from "@/lib/session";

export default async function HomePage() {
  const playerId = await getSessionPlayerId();
  const snapshot = playerId ? await getGameSnapshot(playerId) : null;

  if (!snapshot) {
    return <LoginForm />;
  }

  return <GameShell initialGame={snapshot} />;
}
