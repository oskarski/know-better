"use client";

import {
  HelpCircle,
  Medal,
  Repeat2,
  Sparkles,
  Ticket,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const rules = [
  {
    icon: Sparkles,
    title: "O co chodzi?",
    text: "Celem gry jest poznanie innych gości i przy okazji mnie. Rozmawiaj, słuchaj historii i odkrywaj fakty tak, żeby zabawa otwierała rozmowy, a nie zamieniała się w quiz przy stole. Na koniec gry wylosujemy 3 zwycięzców i będą nagrody.",
  },
  {
    icon: UsersRound,
    title: "Solo albo w parze",
    text: "Możesz grać samodzielnie albo połączyć siły z drugą osobą. Liczy się dobra rozmowa i wspólne tropienie odpowiedzi.",
  },
  {
    icon: Repeat2,
    title: "Odpowiedzi",
    text: "Wpisz odpowiedź i kliknij „Sprawdź”. Możesz próbować dowolną liczbę razy, a wynik zapisuje się automatycznie.",
  },
  {
    icon: HelpCircle,
    title: "Jak pytać?",
    text: "Unikaj pytań zadawanych wprost. Zamiast „jaki ma tytuł naukowy?”, spróbuj wyciągnąć informację z rozmowy, anegdoty albo wspólnego wspomnienia. Chodzi o poznawanie ludzi, nie o odpytywanie ich.",
  },
  {
    icon: Medal,
    title: "Podpowiedzi",
    text: "Podpowiedź zostaje zapisana na stałe. Dobra odpowiedź po podpowiedzi daje 0,75 punktu.",
  },
  {
    icon: Ticket,
    title: "Losy",
    text: "10 punktów daje 1 los, 14 punktów daje 2 losy, a 18 punktów daje 3 losy. To właśnie z tych losów na końcu wylosujemy 3 zwycięzców.",
  },
];

export function GameRulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="subtle" size="sm">
          <HelpCircle />
          Jak działa gra?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jak działa gra?</DialogTitle>
          <DialogDescription>
            Krótka wersja zasad, żeby szybko wrócić do rozmów i zabawy.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {rules.map((rule) => (
            <div
              key={rule.title}
              className={
                rule.title === "Jak pytać?"
                  ? "rounded-lg border border-primary/25 bg-primary/10 p-3"
                  : "rounded-lg border border-white/10 bg-white/5 p-3"
              }
            >
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <rule.icon className="h-4 w-4 text-primary" />
                {rule.title}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {rule.text}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
