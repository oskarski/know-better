"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock3,
  LogOut,
  RotateCcw,
  Ticket,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminLogoutAction,
  clearAllPlayerStatesAction,
  clearPlayerStateAction,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AdminPlayerView } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminPanelProps = {
  players: AdminPlayerView[];
};

function formatScore(score: number) {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1).replace(".", ",");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function AdminMetric({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "accent" | "success";
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            tone === "primary" && "bg-primary/12 text-primary",
            tone === "accent" && "bg-accent/12 text-accent",
            tone === "success" && "bg-emerald-400/12 text-emerald-300",
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <p className="text-2xl font-bold leading-none">{value}</p>
    </div>
  );
}

export function AdminPanel({ players }: AdminPanelProps) {
  const router = useRouter();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const topScore = players[0]?.score ?? 0;
  const totalTickets = players.reduce((sum, player) => sum + player.lotteryTickets, 0);
  const averageProgress =
    players.length > 0
      ? Math.round(players.reduce((sum, player) => sum + player.progressPercent, 0) / players.length)
      : 0;

  function runMutation(target: string, mutation: () => Promise<{ ok: boolean; message: string }>) {
    setPendingTarget(target);

    startTransition(() => {
      void mutation()
        .then((result) => {
          if (result.ok) {
            toast.success(result.message);
            router.refresh();
            return;
          }

          toast.error(result.message);
        })
        .finally(() => setPendingTarget(null));
    });
  }

  function clearPlayer(player: AdminPlayerView) {
    if (
      !window.confirm(
        `Wyczyścić stan gracza ${player.username}? Odpowiedzi, podpowiedzi i punkty wrócą do zera.`,
      )
    ) {
      return;
    }

    runMutation(player.id, () => clearPlayerStateAction(player.id));
  }

  function clearAllPlayers() {
    if (
      !window.confirm(
        "Wyczyścić stan gry dla wszystkich graczy? Odpowiedzi, podpowiedzi i punkty wrócą do zera.",
      )
    ) {
      return;
    }

    runMutation("all", clearAllPlayerStatesAction);
  }

  return (
    <main className="min-h-svh px-4 pb-10 sm:px-6">
      <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-background/88 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <nav className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                KnowBetter
              </p>
              <h1 className="truncate text-base font-bold tracking-normal text-foreground sm:text-lg">
                Panel admina
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                aria-label="Wyczyść wszystkich"
                disabled={players.length === 0 || pendingTarget !== null}
                onClick={clearAllPlayers}
              >
                <Trash2 />
              </Button>
              <form action={adminLogoutAction}>
                <Button variant="ghost" size="icon" type="submit" aria-label="Wyloguj admina">
                  <LogOut />
                </Button>
              </form>
            </div>
          </nav>

          <section className="grid grid-cols-3 gap-2">
            <AdminMetric
              icon={<UsersRound className="h-3.5 w-3.5" />}
              label="Gracze"
              value={String(players.length)}
            />
            <AdminMetric
              icon={<Award className="h-3.5 w-3.5" />}
              label="Top"
              value={formatScore(topScore)}
              tone="success"
            />
            <AdminMetric
              icon={<Ticket className="h-3.5 w-3.5" />}
              label="Losy"
              value={String(totalTickets)}
              tone="accent"
            />
          </section>

          <section className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Średni postęp do 3 losów</span>
              <span>{averageProgress}%</span>
            </div>
            <Progress value={averageProgress} />
          </section>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-3 pt-5">
        {players.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-center">
            <p className="font-semibold">Nie ma jeszcze graczy.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lista pojawi się, gdy ktoś pierwszy raz wejdzie do gry.
            </p>
          </div>
        ) : null}

        {players.map((player, index) => (
          <article
            key={player.id}
            className="answer-card rounded-lg border border-white/10 bg-card/78 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={index < 3 ? "default" : "muted"}>#{index + 1}</Badge>
                  <h2 className="truncate text-lg font-bold tracking-normal">{player.username}</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Aktywność: {formatDate(player.updatedAt)}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pendingTarget !== null}
                onClick={() => clearPlayer(player)}
              >
                <RotateCcw />
                {pendingTarget === player.id ? "Czyszczę" : "Wyczyść"}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  Punkty
                </div>
                <p className="text-xl font-bold leading-none">{formatScore(player.score)}</p>
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Ticket className="h-3.5 w-3.5 text-accent" />
                  Losy
                </div>
                <p className="text-xl font-bold leading-none">{player.lotteryTickets}</p>
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  Trafione
                </div>
                <p className="text-xl font-bold leading-none">
                  {player.correctCount}
                  <span className="text-sm text-muted-foreground">/{player.totalQuestions}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Postęp do 3 losów</span>
                <span>{player.progressPercent}%</span>
              </div>
              <Progress value={player.progressPercent} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{player.answeredCount} sprawdzonych</Badge>
              <Badge variant="warning">{player.hintCount} z podpowiedzią</Badge>
              <Badge variant={player.incorrectCount > 0 ? "secondary" : "success"}>
                <AlertTriangle className="mr-1 h-3 w-3" />
                {player.incorrectCount} do poprawy
              </Badge>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
