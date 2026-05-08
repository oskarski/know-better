"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearAdminSession,
  isAdminAuthenticated,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-session";
import { clearAllPlayerStates, clearPlayerState } from "@/lib/game-store";

export type AdminLoginState = {
  error?: string;
};

export type AdminMutationResult = {
  ok: boolean;
  message: string;
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

    return {
      ok: true,
      message: "Stan wszystkich graczy został wyczyszczony.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się wyczyścić stanu gry.",
    };
  }
}
