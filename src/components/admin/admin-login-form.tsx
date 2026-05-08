"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

import { adminLoginAction, type AdminLoginState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: AdminLoginState = {};

function AdminLoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Sprawdzam..." : "Wejdź do panelu"}
      <ArrowRight />
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLoginAction, initialState);

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-6">
      <section className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3 text-primary">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/12">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">KnowBetter</p>
            <h1 className="text-2xl font-bold tracking-normal text-foreground">Panel admina</h1>
          </div>
        </div>

        <Card className="soft-card border-white/12">
          <CardHeader>
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <LockKeyhole className="h-3.5 w-3.5" />
              Dostęp tylko dla prowadzącego
            </div>
            <CardTitle className="text-2xl">Zaloguj się</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-muted-foreground">
                  Login
                </label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="admin"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Hasło
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="•••••••"
                  required
                />
              </div>

              {state.error ? (
                <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-red-200">
                  {state.error}
                </p>
              ) : null}

              <AdminLoginButton />
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
