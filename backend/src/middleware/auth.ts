import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { resolveAccessToken } from "../lib/auth-cookies.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { mapProfile } from "../lib/mappers.js";
import type { ProfileRow, UserProfile } from "../types/models.js";

export type AuthVariables = {
  user: UserProfile;
  accessToken: string;
};

export const requireAuth = createMiddleware<{
  Variables: AuthVariables;
}>(async (c: Context, next: Next) => {
  const token = await resolveAccessToken(c);

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, is_admin, created_at")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (profileError || !profile) {
    return c.json({ error: "User profile not found" }, 401);
  }

  c.set("user", mapProfile(profile));
  c.set("accessToken", token);
  await next();
});
