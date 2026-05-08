import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/game-store";

const cookieMaxAge = 60 * 60 * 24 * 60;

export async function getSessionPlayerId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function setSessionPlayerId(playerId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, playerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: cookieMaxAge,
    path: "/",
  });
}

export async function clearSessionPlayerId() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
