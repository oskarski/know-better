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
    text: "W grze czekają pytania, a odpowiedzi szuka się wśród osób na imprezie. Do pytań są też podpowiedzi, jeśli utkniecie. Celem gry jest poznanie innych gości i przy okazji mnie: przez historie, wspomnienia i drobne tropy, które pojawią się w trakcie imprezy. Na koniec gry wylosujemy 3 zwycięzców, a do zdobycia będą nagrody.",
  },
  {
    icon: UsersRound,
    title: "Solo albo w parze",
    text: "Możesz grać samodzielnie albo połączyć siły z drugą osobą. Jeśli wpiszecie ten sam login na innym telefonie, pojawi się tam ten sam stan gry.",
  },
  {
    icon: Repeat2,
    title: "Odpowiedzi",
    text: "Wpisz odpowiedź i kliknij „Sprawdź”. Możesz próbować odpowiedzieć na pytanie dowolną liczbę razy, a wynik zapisuje się automatycznie.",
  },
  {
    icon: HelpCircle,
    title: "Jak pytać?",
    text: "Unikaj pytań zadawanych wprost. Chodzi o poznawanie ludzi, nie o odpytywanie ich. Na przykład: zamiast „na jakiej uczelni studiował Oskar?”, zapytaj „czy znałeś Oskara podczas studiów?” albo „skąd znacie się z Oskarem?”. Niech rozmowa sama nakieruje Cię na odpowiedź.",
  },
  {
    icon: Medal,
    title: "Podpowiedzi",
    text: "Dobra odpowiedź po podpowiedzi daje 0,75 punktu.",
  },
  {
    icon: Ticket,
    title: "Losy",
    text: "10+ punktów daje 1 los, 14+ punktów daje 2 losy, a 18+ punktów daje 3 losy. To właśnie z tych losów na końcu wylosujemy 3 zwycięzców.",
  },
];

export function GameRulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="subtle"
          size="default"
          className="h-10 shrink-0 px-3 touch-manipulation sm:h-9"
          aria-label="Pokaż instrukcję gry"
        >
          <HelpCircle />
          <span className="sm:hidden">Zasady</span>
          <span className="hidden sm:inline">Jak działa gra?</span>
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
