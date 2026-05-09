"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock3,
  Crown,
  LockKeyhole,
  LogOut,
  RotateCcw,
  Shuffle,
  Ticket,
  Trash2,
  Trophy,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminLogoutAction,
  clearAllPlayerStatesAction,
  clearPlayerStateAction,
  closeGameAction,
  deletePlayerAction,
  drawNextWinnerAction,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatScore } from "@/lib/formatting";
import type {
  AdminGameState,
  AdminPlayerView,
  DrawWinnerView,
  LotteryPoolEntryView,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminPanelProps = {
  players: AdminPlayerView[];
  gameState: AdminGameState;
};

type DrawPhase = "idle" | "rolling" | "revealed";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function buildDrawPool(lotteryPool: LotteryPoolEntryView[], winners: DrawWinnerView[]) {
  const winnerIds = new Set(winners.map((winner) => winner.playerId));

  return lotteryPool.flatMap((player) =>
    winnerIds.has(player.playerId)
      ? []
      : Array.from({ length: player.lotteryTickets }, () => player.username),
  );
}

function AdminMetric({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "accent" | "success" | "danger";
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
            tone === "danger" && "bg-destructive/12 text-destructive",
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

function WinnerBadge({ winner }: { winner: DrawWinnerView }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <p className="font-semibold">{winner.place}. miejsce</p>
        </div>
        <Badge variant="warning">{winner.lotteryTickets} losy</Badge>
      </div>
      <p className="truncate text-xl font-bold tracking-normal">{winner.username}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Wynik: {formatScore(winner.score)} pkt
      </p>
    </div>
  );
}

export function AdminPanel({ players, gameState }: AdminPanelProps) {
  const router = useRouter();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [drawPhase, setDrawPhase] = useState<DrawPhase>("idle");
  const [spotlightName, setSpotlightName] = useState("");
  const [revealedWinner, setRevealedWinner] = useState<DrawWinnerView | null>(null);
  const drawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, startTransition] = useTransition();
  const isBusy = pendingTarget !== null;
  const hasAnyState =
    players.length > 0 ||
    gameState.lotteryPool.length > 0 ||
    gameState.winners.length > 0 ||
    gameState.status === "closed";
  const topScore =
    players[0]?.score ?? Math.max(0, ...gameState.lotteryPool.map((player) => player.score));
  const totalTickets = gameState.totalTickets;
  const averageProgress =
    players.length > 0
      ? Math.round(players.reduce((sum, player) => sum + player.progressPercent, 0) / players.length)
      : gameState.lotteryPool.length > 0
        ? Math.round(
            gameState.lotteryPool.reduce(
              (sum, player) => sum + Math.min(100, Math.round((player.score / 18) * 100)),
              0,
            ) / gameState.lotteryPool.length,
          )
      : 0;
  const visibleWinners =
    revealedWinner && !gameState.winners.some((winner) => winner.playerId === revealedWinner.playerId)
      ? [...gameState.winners, revealedWinner]
      : gameState.winners;
  const nextPlace = Math.min(visibleWinners.length + 1, gameState.maxWinners);

  useEffect(() => {
    return () => {
      if (drawIntervalRef.current) {
        clearInterval(drawIntervalRef.current);
      }
    };
  }, []);

  function stopDrawTicker() {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
  }

  function startDrawTicker(pool: string[]) {
    stopDrawTicker();

    if (pool.length === 0) {
      setSpotlightName("Brak losów");
      return;
    }

    let tick = 0;
    setSpotlightName(pool[0]);
    drawIntervalRef.current = setInterval(() => {
      tick += 1;
      setSpotlightName(pool[tick % pool.length]);
    }, 80);
  }

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

  function deletePlayer(player: AdminPlayerView) {
    if (
      !window.confirm(
        `Usunąć gracza ${player.username}? Zniknie z listy i nie będzie brany pod uwagę w losowaniu.`,
      )
    ) {
      return;
    }

    runMutation(`delete-${player.id}`, () => deletePlayerAction(player.id));
  }

  function clearAllPlayers() {
    if (
      !window.confirm(
        "Wyczyścić stan gry dla wszystkich? Odpowiedzi, podpowiedzi, punkty i dotychczasowe losowanie wrócą do zera.",
      )
    ) {
      return;
    }

    setRevealedWinner(null);
    runMutation("all", clearAllPlayerStatesAction);
  }

  function closeGame() {
    if (
      !window.confirm(
        "Zamknąć grę i wyczyścić wszystkich graczy? Zachowamy tylko pulę losów do finałowego losowania.",
      )
    ) {
      return;
    }

    runMutation("close", closeGameAction);
  }

  async function drawNextWinner() {
    const pool = buildDrawPool(gameState.lotteryPool, visibleWinners);

    if (pool.length === 0) {
      toast.info("Nie ma już losów do wylosowania.");
      return;
    }

    setPendingTarget("draw");
    setDrawPhase("rolling");
    setRevealedWinner(null);
    startDrawTicker(pool);

    const [result] = await Promise.all([drawNextWinnerAction(), wait(1900)]);
    stopDrawTicker();

    if (!result.ok || !result.winner) {
      setDrawPhase("idle");
      setPendingTarget(null);
      toast.error(result.message);
      return;
    }

    setSpotlightName(result.winner.username);
    setRevealedWinner(result.winner);
    setDrawPhase("revealed");
    toast.success(result.message);
    router.refresh();

    window.setTimeout(() => {
      setDrawPhase("idle");
      setPendingTarget(null);
    }, 900);
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
                disabled={!hasAnyState || isBusy}
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

      <section className="mx-auto max-w-5xl space-y-4 pt-5">
        <section className="rounded-lg border border-white/10 bg-card/78 p-4 shadow-sm">
          <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold tracking-normal">Finał gry</h2>
                <Badge variant={gameState.status === "closed" ? "warning" : "success"}>
                  {gameState.status === "closed" ? "Zamknięta" : "Otwarta"}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Zamknij grę, gdy kończycie zbieranie odpowiedzi. Potem wylosuj zwycięzców po
                jednym, na bazie zapisanych losów.
              </p>
            </div>

            <Button
              type="button"
              variant={gameState.status === "closed" ? "outline" : "default"}
              disabled={gameState.status === "closed" || isBusy}
              onClick={closeGame}
              className="min-[520px]:shrink-0"
            >
              <LockKeyhole />
              {pendingTarget === "close"
                ? "Zamykam"
                : gameState.status === "closed"
                  ? "Gra zamknięta"
                  : "Zamknij grę"}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 min-[760px]:grid-cols-[1.1fr_0.9fr]">
            <div
              className={cn(
                "overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 text-center",
                drawPhase === "rolling" && "border-primary/45 bg-primary/10",
                drawPhase === "revealed" && "border-emerald-400/35 bg-emerald-400/10",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {visibleWinners.length >= gameState.maxWinners
                  ? "Komplet zwycięzców"
                  : `Losowanie miejsca ${nextPlace}`}
              </p>
              <div className="mt-3 flex min-h-24 items-center justify-center rounded-lg border border-white/10 bg-background/45 px-4">
                <p
                  className={cn(
                    "break-words text-3xl font-black tracking-normal transition-all",
                    drawPhase === "rolling" && "scale-105 text-primary",
                    drawPhase === "revealed" && "scale-105 text-emerald-200",
                  )}
                >
                  {spotlightName ||
                    (gameState.status === "closed" ? "Gotowi?" : "Najpierw zamknij grę")}
                </p>
              </div>

              <Button
                type="button"
                className="mt-4 w-full"
                size="lg"
                disabled={!gameState.canDraw || isBusy || drawPhase === "rolling"}
                onClick={drawNextWinner}
              >
                <Shuffle />
                {pendingTarget === "draw"
                  ? "Losuję..."
                  : visibleWinners.length >= gameState.maxWinners
                    ? "Wylosowano komplet"
                    : "Losuj kolejnego zwycięzcę"}
              </Button>

              {gameState.status === "closed" && gameState.remainingTickets === 0 ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Brak aktywnych losów do losowania.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <AdminMetric
                  icon={<Ticket className="h-3.5 w-3.5" />}
                  label="W puli"
                  value={String(gameState.remainingTickets)}
                  tone="accent"
                />
                <AdminMetric
                  icon={<UsersRound className="h-3.5 w-3.5" />}
                  label="Kandydaci"
                  value={String(gameState.eligiblePlayerCount)}
                  tone="success"
                />
              </div>

              <div className="space-y-2">
                {visibleWinners.length > 0 ? (
                  visibleWinners.map((winner) => <WinnerBadge key={winner.playerId} winner={winner} />)
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-muted-foreground">
                    Wyniki pojawią się tutaj po każdym losowaniu.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {players.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-center">
            {gameState.status === "closed" ? (
              <>
                <p className="font-semibold">Gra została zamknięta.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aktywna lista graczy została wyczyszczona. Finałowe losowanie
                  korzysta teraz z zapisanej puli losów.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Nie ma jeszcze graczy.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lista pojawi się, gdy ktoś pierwszy raz wejdzie do gry.
                </p>
              </>
            )}
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

              <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => clearPlayer(player)}
                >
                  <RotateCcw />
                  {pendingTarget === player.id ? "Czyszczę" : "Wyczyść"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => deletePlayer(player)}
                >
                  <Trash2 />
                  {pendingTarget === `delete-${player.id}` ? "Usuwam" : "Usuń"}
                </Button>
              </div>
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
