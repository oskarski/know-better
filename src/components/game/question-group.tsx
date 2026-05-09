"use client";

import type { Difficulty, QuestionView } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/game/question-card";

type QuestionGroupProps = {
  difficulty: Difficulty;
  questions: QuestionView[];
  values: Record<number, string>;
  busyQuestionId: number | null;
  disabled?: boolean;
  onValueChange: (questionId: number, value: string) => void;
  onCheck: (questionId: number) => void;
  onHint: (questionId: number) => void;
};

const groupCopy: Record<Difficulty, { title: string; description: string }> = {
  easy: {
    title: "Łatwe",
    description: "Na rozgrzewkę. Najczęściej wystarczy dobrze posłuchać rozmów przy stole.",
  },
  medium: {
    title: "Średnie",
    description: "Tu zaczyna się chodzenie po sali i łączenie wskazówek.",
  },
  hard: {
    title: "Trudne",
    description: "Dla tych, którzy naprawdę dobrze rozgryzą towarzystwo.",
  },
};

export function QuestionGroup({
  difficulty,
  questions,
  values,
  busyQuestionId,
  disabled = false,
  onValueChange,
  onCheck,
  onHint,
}: QuestionGroupProps) {
  const copy = groupCopy[difficulty];

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-normal">{copy.title}</h2>
            <Badge variant="outline">
              {questions.length} {questions.length === 1 ? "pytanie" : "pytań"}
            </Badge>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={values[question.id] ?? ""}
            busy={busyQuestionId === question.id}
            disabled={disabled}
            onValueChange={(value) => onValueChange(question.id, value)}
            onCheck={() => onCheck(question.id)}
            onHint={() => onHint(question.id)}
          />
        ))}
      </div>
    </section>
  );
}
