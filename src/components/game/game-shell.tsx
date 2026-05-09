"use client";

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { revealHintAction, submitAnswerAction } from "@/app/actions";
import { ConfettiBurst } from "@/components/game/confetti-burst";
import { HintConfirmDialog } from "@/components/game/hint-confirm-dialog";
import { QuestionGroup } from "@/components/game/question-group";
import { StatsPanel } from "@/components/game/stats-panel";
import type { Difficulty, GameSnapshot } from "@/lib/types";

type GameShellProps = {
  initialGame: GameSnapshot;
};

const groups: Difficulty[] = ["easy", "medium", "hard"];

function valuesFromSnapshot(game: GameSnapshot) {
  return Object.fromEntries(game.questions.map((question) => [question.id, question.savedAnswer]));
}

export function GameShell({ initialGame }: GameShellProps) {
  const [game, setGame] = useState(initialGame);
  const [values, setValues] = useState<Record<number, string>>(() => valuesFromSnapshot(initialGame));
  const [busyQuestionId, setBusyQuestionId] = useState<number | null>(null);
  const [hintQuestionId, setHintQuestionId] = useState<number | null>(null);
  const [confettiRun, setConfettiRun] = useState(0);
  const isGameClosed = game.gameStatus.status === "closed";

  const questionsByDifficulty = useMemo(
    () =>
      Object.fromEntries(
        groups.map((difficulty) => [
          difficulty,
          game.questions.filter((question) => question.difficulty === difficulty),
        ]),
      ) as Record<Difficulty, GameSnapshot["questions"]>,
    [game.questions],
  );

  useEffect(() => {
    setValues(valuesFromSnapshot(game));
  }, [game]);

  async function checkAnswer(questionId: number) {
    if (isGameClosed) {
      toast.info("Gra jest zakończona. Odpowiedzi nie są już przyjmowane.");
      return;
    }

    setBusyQuestionId(questionId);
    const previousTickets = game.lotteryTickets;
    const result = await submitAnswerAction(questionId, values[questionId] ?? "");
    setBusyQuestionId(null);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const checkedQuestion = result.snapshot.questions.find((question) => question.id === questionId);
    setGame(result.snapshot);

    if (result.snapshot.lotteryTickets > previousTickets) {
      setConfettiRun((current) => current + 1);
      toast.success(`Masz nowy los! Teraz: ${result.snapshot.lotteryTickets}.`);
      return;
    }

    if (checkedQuestion?.status === "correct") {
      toast.success(result.message);
    } else {
      toast.info(result.message);
    }
  }

  async function confirmHint() {
    if (!hintQuestionId) {
      return;
    }

    if (isGameClosed) {
      setHintQuestionId(null);
      toast.info("Gra jest zakończona. Podpowiedzi nie są już dostępne.");
      return;
    }

    const questionId = hintQuestionId;
    setHintQuestionId(null);
    setBusyQuestionId(questionId);
    const result = await revealHintAction(questionId);
    setBusyQuestionId(null);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setGame(result.snapshot);
    toast.info(result.message);
  }

  return (
    <main className="min-h-svh px-4 pb-10 sm:px-6">
      <StatsPanel game={game} />
      <ConfettiBurst run={confettiRun} />
      <HintConfirmDialog
        open={hintQuestionId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setHintQuestionId(null);
          }
        }}
        onConfirm={confirmHint}
      />

      <div className="mx-auto max-w-5xl space-y-7 pt-5">
        {isGameClosed ? (
          <section className="rounded-lg border border-primary/25 bg-primary/10 p-4">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Gra została zakończona.</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Wyniki są zapisane, a prowadzący może teraz przejść do finałowego losowania.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {groups.map((difficulty) => (
          <QuestionGroup
            key={difficulty}
            difficulty={difficulty}
            questions={questionsByDifficulty[difficulty]}
            values={values}
            busyQuestionId={busyQuestionId}
            disabled={isGameClosed}
            onValueChange={(questionId, value) =>
              setValues((current) => ({
                ...current,
                [questionId]: value,
              }))
            }
            onCheck={checkAnswer}
            onHint={setHintQuestionId}
          />
        ))}
      </div>
    </main>
  );
}
