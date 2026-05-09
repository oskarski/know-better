"use client";

import { Award, CheckCircle2, LogOut, Ticket } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { GameRulesDialog } from "@/components/game/game-rules-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatScore } from "@/lib/formatting";
import type { GameSnapshot } from "@/lib/types";

type StatsPanelProps = {
  game: GameSnapshot;
};

export function StatsPanel({ game }: StatsPanelProps) {
  return (
    <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-background/88 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <nav className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">KnowBetter</p>
            <h1 className="truncate text-base font-bold tracking-normal text-foreground sm:text-lg">
              Cześć, {game.player.username}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <GameRulesDialog />
            <form action={logoutAction}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Wyloguj">
                <LogOut />
              </Button>
            </form>
          </div>
        </nav>

        <section className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-primary" />
                Punkty
              </div>
              <p className="text-2xl font-bold leading-none">{formatScore(game.score)}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Ticket className="h-3.5 w-3.5 text-accent" />
                Losy
              </div>
              <p className="text-2xl font-bold leading-none">{game.lotteryTickets}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Trafione
              </div>
              <p className="text-2xl font-bold leading-none">
                {game.correctCount}
                <span className="text-sm text-muted-foreground">/{game.totalQuestions}</span>
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Postęp do 3 losów</span>
              <span>{game.progressPercent}%</span>
            </div>
            <Progress value={game.progressPercent} />
          </div>
        </section>
      </div>
    </header>
  );
}
