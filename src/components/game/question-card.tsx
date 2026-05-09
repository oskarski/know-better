"use client";

import { Check, Lightbulb, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { QuestionView } from "@/lib/types";

type QuestionCardProps = {
  question: QuestionView;
  value: string;
  busy: boolean;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onCheck: () => void;
  onHint: () => void;
};

const statusCopy = {
  unanswered: "Bez odpowiedzi",
  incorrect: "Jeszcze nie",
  correct: "Dobrze",
};

export function QuestionCard({
  question,
  value,
  busy,
  disabled = false,
  onValueChange,
  onCheck,
  onHint,
}: QuestionCardProps) {
  const isCorrect = question.status === "correct";
  const isIncorrect = question.status === "incorrect";
  const isCorrectWithHint = isCorrect && question.hintUsed;
  const isHintRevealedByClosedGame = disabled && Boolean(question.hint) && !question.hintUsed;

  return (
    <Card
      data-testid={`question-${question.id}`}
      className={cn(
        "answer-card soft-card overflow-hidden border-white/10 transition-all duration-300",
        isCorrect && "border-emerald-400/35 bg-emerald-400/8",
        isIncorrect && "border-amber-400/30 bg-amber-400/6",
      )}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold leading-6 text-foreground">{question.question}</p>
          <Badge
            variant={isCorrect ? "success" : isIncorrect ? "warning" : "muted"}
            className="shrink-0"
          >
            {isCorrectWithHint ? "Dobrze z podpowiedzią" : statusCopy[question.status]}
          </Badge>
        </div>

        <div className="space-y-3">
          <Input
            data-testid={`answer-${question.id}`}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Wpisz odpowiedź"
            disabled={busy || disabled || isCorrect}
            aria-label={`Odpowiedź na pytanie ${question.id}`}
          />

          <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
            <Button
              data-testid={`check-${question.id}`}
              type="button"
              onClick={onCheck}
              disabled={busy || disabled || isCorrect}
              className="min-w-0"
            >
              {busy ? <Loader2 className="animate-spin" /> : isCorrect ? <Check /> : <Check />}
              {disabled && !isCorrect ? "Zamknięte" : isCorrect ? "Zaliczone" : "Sprawdź"}
            </Button>
            <Button
              data-testid={`hint-${question.id}`}
              type="button"
              variant="outline"
              onClick={onHint}
              disabled={busy || disabled || (isCorrect && !question.hintUsed) || question.hintUsed}
              className="min-w-0"
            >
              {question.hintUsed || isHintRevealedByClosedGame ? (
                <Lightbulb />
              ) : isCorrect ? (
                <X />
              ) : (
                <Lightbulb />
              )}
              {question.hintUsed
                ? "Podpowiedź użyta"
                : isHintRevealedByClosedGame
                  ? "Podpowiedź ujawniona"
                  : "Pokaż podpowiedź"}
            </Button>
          </div>
        </div>

        {question.hint ? (
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm leading-6 text-amber-100">
            <span className="font-semibold text-primary">Podpowiedź: </span>
            {question.hint}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
