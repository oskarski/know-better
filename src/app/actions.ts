"use server";

import { redirect } from "next/navigation";

import { clearSessionPlayerId, getSessionPlayerId, setSessionPlayerId } from "@/lib/session";
import { findOrCreatePlayer, revealHint, submitAnswer } from "@/lib/game-store";
import type { GameActionResult } from "@/lib/types";

export type LoginState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();

  try {
    const player = await findOrCreatePlayer(username);
    await setSessionPlayerId(player.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nie udało się wejść do gry.",
    };
  }

  redirect("/");
}

export async function logoutAction() {
  await clearSessionPlayerId();
  redirect("/");
}

export async function submitAnswerAction(
  questionId: number,
  answer: string,
): Promise<GameActionResult> {
  const playerId = await getSessionPlayerId();

  if (!playerId) {
    return {
      ok: false,
      message: "Sesja wygasła. Odśwież stronę i wejdź do gry ponownie.",
    };
  }

  try {
    const result = await submitAnswer(playerId, questionId, answer);
    const { outcome, snapshot } = result;
    const question = snapshot.questions.find((item) => item.id === questionId);
    const isCorrect = question?.status === "correct";

    return {
      ok: true,
      message:
        outcome === "already-correct"
          ? "To pytanie zostało już zaliczone na innym urządzeniu. Pokazuję aktualny stan."
          : isCorrect
            ? "Dobrze! Punkt zapisany."
            : "Jeszcze nie. Popytaj dalej.",
      snapshot,
      outcome,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się sprawdzić odpowiedzi.",
    };
  }
}

export async function revealHintAction(questionId: number): Promise<GameActionResult> {
  const playerId = await getSessionPlayerId();

  if (!playerId) {
    return {
      ok: false,
      message: "Sesja wygasła. Odśwież stronę i wejdź do gry ponownie.",
    };
  }

  try {
    const snapshot = await revealHint(playerId, questionId);

    return {
      ok: true,
      message: "Podpowiedź zapisana.",
      snapshot,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się pokazać podpowiedzi.",
    };
  }
}
