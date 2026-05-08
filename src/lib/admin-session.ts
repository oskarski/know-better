import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "knowbetter_admin_session";
const adminCookieMaxAge = 60 * 60 * 12;

function adminUsername() {
  return process.env.ADMIN_USERNAME ?? "admin";
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "admin30";
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "knowbetter-admin-dev-secret";
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeCompare(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}

export function verifyAdminCredentials(username: string, password: string) {
  return safeCompare(username, adminUsername()) && safeCompare(password, adminPassword());
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + adminCookieMaxAge * 1000;
  const payload = `admin.${expiresAt}`;

  cookieStore.set(ADMIN_SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: adminCookieMaxAge,
    path: "/admin",
  });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return false;
  }

  const [subject, expiresAt, signature] = token.split(".");

  if (subject !== "admin" || !expiresAt || !signature || Number(expiresAt) < Date.now()) {
    return false;
  }

  const payload = `${subject}.${expiresAt}`;
  return safeCompare(signature, sign(payload));
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
