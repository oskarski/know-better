"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearAdminSession,
  isAdminAuthenticated,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-session";
import {
  clearAllPlayerStates,
  clearPlayerState,
  closeGame,
  deletePlayerState,
  drawNextWinner,
} from "@/lib/game-store";
import type { DrawWinnerView } from "@/lib/types";

export type AdminLoginState = {
  error?: string;
};

export type AdminMutationResult = {
  ok: boolean;
  message: string;
};

export type AdminDrawResult = AdminMutationResult & {
  winner?: DrawWinnerView;
};

const accessDeniedResult: AdminMutationResult = {
  ok: false,
  message: "Brak dostępu do panelu admina.",
};

export async function adminLoginAction(
  _state: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminCredentials(username, password)) {
    return {
      error: "Nieprawidłowy login albo hasło.",
    };
  }

  await setAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function clearPlayerStateAction(playerId: string): Promise<AdminMutationResult> {
  if (!(await isAdminAuthenticated())) {
    return accessDeniedResult;
  }

  try {
    await clearPlayerState(playerId);
    revalidatePath("/admin");
    revalidatePath("/");

    return {
      ok: true,
      message: "Stan gracza został wyczyszczony.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się wyczyścić stanu gracza.",
    };
  }
}

export async function clearAllPlayerStatesAction(): Promise<AdminMutationResult> {
  if (!(await isAdminAuthenticated())) {
    return accessDeniedResult;
  }

  try {
    await clearAllPlayerStates();
    revalidatePath("/admin");
    revalidatePath("/");

    return {
      ok: true,
      message: "Stan wszystkich graczy i losowanie zostały wyczyszczone.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się wyczyścić stanu gry.",
    };
  }
}

export async function deletePlayerAction(playerId: string): Promise<AdminMutationResult> {
  if (!(await isAdminAuthenticated())) {
    return accessDeniedResult;
  }

  try {
    await deletePlayerState(playerId);
    revalidatePath("/admin");
    revalidatePath("/");

    return {
      ok: true,
      message: "Gracz został usunięty.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się usunąć gracza.",
    };
  }
}

export async function closeGameAction(): Promise<AdminMutationResult> {
  if (!(await isAdminAuthenticated())) {
    return accessDeniedResult;
  }

  try {
    await closeGame();
    revalidatePath("/admin");
    revalidatePath("/");

    return {
      ok: true,
      message: "Gra została zamknięta, gracze zostali wyczyszczeni, a pula losów jest gotowa do losowania.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się zamknąć gry.",
    };
  }
}

export async function drawNextWinnerAction(): Promise<AdminDrawResult> {
  if (!(await isAdminAuthenticated())) {
    return accessDeniedResult;
  }

  try {
    const winner = await drawNextWinner();
    revalidatePath("/admin");

    return {
      ok: true,
      message: `${winner.place}. miejsce: ${winner.username}`,
      winner,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się wylosować zwycięzcy.",
    };
  }
}
