"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Sparkles, UsersRound } from "lucide-react";

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
      <section className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3 text-primary">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/12">
            <UsersRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gra urodzinowa</p>
            <h1 className="text-2xl font-bold tracking-normal text-foreground">KnowBetter</h1>
          </div>
        </div>

        <Card className="soft-card border-white/12">
          <CardHeader>
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Start bez konta, stan wraca po imieniu
            </div>
            <CardTitle className="text-2xl">Jak masz na imię?</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-muted-foreground">
                  Imię
                </label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="given-name"
                  placeholder="np. Kasia"
                  maxLength={32}
                  required
                />
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
