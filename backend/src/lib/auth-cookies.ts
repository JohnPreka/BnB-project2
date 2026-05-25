import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { supabaseAuth } from "./supabase.js";

const cookieBase = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function setAuthCookies(
  c: Context,
  accessToken: string,
  refreshToken: string
): void {
  setCookie(c, "sb-access-token", accessToken, {
    ...cookieBase,
    maxAge: 60 * 60,
  });
  setCookie(c, "sb-refresh-token", refreshToken, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookies(c: Context): void {
  deleteCookie(c, "sb-access-token", { path: "/" });
  deleteCookie(c, "sb-refresh-token", { path: "/" });
}

/** Resolve access token from cookie, refreshing the session if needed. */
export async function resolveAccessToken(c: Context): Promise<string | null> {
  const access = getCookie(c, "sb-access-token");
  if (access) {
    return access;
  }

  const refresh = getCookie(c, "sb-refresh-token");
  if (!refresh) {
    return null;
  }

  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refresh,
  });

  if (error || !data.session) {
    return null;
  }

  setAuthCookies(
    c,
    data.session.access_token,
    data.session.refresh_token
  );

  return data.session.access_token;
}
