"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  BadgeAlert,
  MessageCircleMore,
  Sparkles,
  Ticket,
  UsersRound,
} from "lucide-react";

import { loginAction, type LoginState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Wchodzisz..." : "Wejdź do gry"}
      <ArrowRight />
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-6">
      <section className="w-full max-w-md space-y-4">
        <div className="mb-6 flex items-center justify-center gap-3 text-primary">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/12">
            <UsersRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gra urodzinowa
            </p>
            <h1 className="text-2xl font-bold tracking-normal text-foreground">
              KnowBetter
            </h1>
          </div>
        </div>

        <section className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Zanim wejdziesz
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal">
              Popytaj ludzi. Odkryj historie. Zgarnij losy.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              KnowBetter to luźna gra imprezowa, która dzieje się między
              rozmowami. W grze czekają na Was pytania, a odpowiedzi szuka się
              wśród osób na imprezie. Celem jest poznanie innych gości i przy
              okazji mnie: przez historie, wspomnienia i drobne tropy, które
              pojawią się w trakcie imprezy. Na koniec gry wylosujemy 3
              zwycięzców, a do zdobycia będą nagrody.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="rounded-md border border-primary/25 bg-primary/10 p-3">
              <div className="flex gap-3">
                <MessageCircleMore className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Najważniejsze
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground/90">
                    To nie ma być quizowanie się nawzajem. Celem gry jest
                    poznanie innych, otwieranie rozmów i wyciąganie informacji
                    od osób na imprezie bez zadawania pytań wprost.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 rounded-md border border-white/10 bg-background/35 p-3">
              <MessageCircleMore className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>
                  Możesz próbować odpowiedzieć na pytanie tyle razy, ile
                  chcesz, bez ujemnych punktów. Zamiast wypytywać wprost,
                  spróbuj dojść do odpowiedzi przez anegdotę, wspomnienie albo
                  luźny trop z rozmowy.
                </p>
                <p>
                  Na przykład: zamiast pytać{" "}
                  <span className="text-foreground">
                    „na jakiej uczelni studiował Oskar?”
                  </span>
                  , zapytaj{" "}
                  <span className="text-foreground">
                    „czy znałeś Oskara podczas studiów?” albo „skąd znacie się z
                    Oskarem?”
                  </span>
                  . Niech rozmowa sama nakieruje Cię na odpowiedź. Każde pytanie
                  ma też podpowiedź, jeśli utkniesz.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-md border border-white/10 bg-background/35 p-3">
              <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">
                Grasz solo albo w parze. Jeśli wpiszecie ten sam login na innym
                telefonie, pojawi się tam ten sam stan gry.
              </p>
            </div>
            <div className="flex gap-3 rounded-md border border-white/10 bg-background/35 p-3">
              <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-muted-foreground">
                Punkty zamieniają się w losy do finałowego losowania. Na końcu
                wylosujemy 3 zwycięzców, a do zdobycia będą nagrody. Podpowiedzi
                pomagają, ale obniżają maksymalny wynik za pytanie do 0,75
                punktu.
              </p>
            </div>
          </div>
        </section>

        <Card className="soft-card border-white/12">
          <CardHeader>
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Rozmowy zamiast quizu
            </div>
            <CardTitle className="text-2xl">
              Jak masz na imię albo jak nazywa się Wasza para?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-md border border-amber-400/25 bg-amber-400/10 p-3">
                  <div className="flex gap-3">
                    <BadgeAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Wpisz unikalny login
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Nie wpisuj samego imienia, bo ktoś inny na imprezie może
                        mieć takie samo. Użyj imienia i nazwiska, nazwy pary
                        albo czegoś unikalnego, na przykład{" "}
                        <span className="text-foreground">„Kasia Kowalska”</span>
                        , <span className="text-foreground">„Kasia i Tomek”</span>{" "}
                        albo <span className="text-foreground">„Wesoła Kasia”</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Login
                </label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="name"
                  placeholder="np. Kasia Kowalska albo Kasia i Tomek"
                  maxLength={32}
                  required
                />
                </div>
              </div>

              {state.error ? (
                <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-red-200">
                  {state.error}
                </p>
              ) : null}

              <LoginButton />
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
