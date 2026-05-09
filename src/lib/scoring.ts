import type { QuestionStatus } from "@/lib/types";

type StoredAnswerLike = {
  status: QuestionStatus;
  hintUsed: boolean;
};

export function calculateScore(answers: Record<string, StoredAnswerLike | undefined>) {
  return Object.values(answers).reduce((score, answer) => {
    if (answer?.status !== "correct") {
      return score;
    }

    return score + (answer.hintUsed ? 0.75 : 1);
  }, 0);
}

export function calculateLotteryTickets(score: number) {
  if (score >= 18) {
    return 3;
  }

  if (score >= 14) {
    return 2;
  }

  if (score >= 10) {
    return 1;
  }

  return 0;
}
