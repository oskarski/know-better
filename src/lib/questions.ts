import "server-only";

import questions from "@/data/questions.json";
import type { Difficulty, PublicQuestion, Question } from "@/lib/types";

const typedQuestions = questions as Question[];

function assertQuestionSet() {
  const allowedDifficulties: Difficulty[] = ["easy", "medium", "hard"];

  if (typedQuestions.length !== 20) {
    throw new Error("Plik pytań musi zawierać dokładnie 20 pytań.");
  }

  for (const question of typedQuestions) {
    if (!allowedDifficulties.includes(question.difficulty)) {
      throw new Error(`Nieprawidłowy poziom trudności pytania ${question.id}.`);
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
