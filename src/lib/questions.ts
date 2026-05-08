import "server-only";

import questions from "@/data/questions.json";
import type { Difficulty, PublicQuestion, Question } from "@/lib/types";

const typedQuestions = questions as Question[];

function assertQuestionSet() {
  const expectedCounts: Record<Difficulty, number> = {
    easy: 5,
    medium: 10,
    hard: 5,
  };

  if (typedQuestions.length !== 20) {
    throw new Error("Plik pytań musi zawierać dokładnie 20 pytań.");
  }

  for (const difficulty of Object.keys(expectedCounts) as Difficulty[]) {
    const count = typedQuestions.filter((item) => item.difficulty === difficulty).length;

    if (count !== expectedCounts[difficulty]) {
      throw new Error(`Nieprawidłowa liczba pytań dla poziomu ${difficulty}.`);
    }
  }
}

assertQuestionSet();

export function getQuestions(): Question[] {
  return typedQuestions;
}

export function getPublicQuestions(): PublicQuestion[] {
  return typedQuestions.map(({ answer: _answer, hint: _hint, ...question }) => question);
}

export function getQuestionById(id: number): Question | undefined {
  return typedQuestions.find((question) => question.id === id);
}
