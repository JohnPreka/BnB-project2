import { Hono } from "hono";
import type { Context } from "hono";
import { clearAuthCookies, setAuthCookies } from "../lib/auth-cookies.js";
import { supabaseAdmin, supabaseAuth } from "../lib/supabase.js";
import { mapProfile } from "../lib/mappers.js";
import { loginSchema, registerSchema } from "../schemas/validation.js";
import type { ProfileRow, UserProfile } from "../types/models.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

const auth = new Hono<{ Variables: AuthVariables }>();

async function fetchOrCreateProfile(
  userId: string,
  name: string,
  email: string
): Promise<UserProfile | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, is_admin, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (profile) {
    return mapProfile(profile);
  }

  const { data: created, error } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId, name, email })
    .select("id, name, email, is_admin, created_at")
    .single<ProfileRow>();

  if (error || !created) {
    return null;
  }

  return mapProfile(created);
}

async function respondWithSession(
  c: Context,
  userId: string,
  name: string,
  email: string,
  accessToken: string,
  refreshToken: string,
  status = 200
) {
  setAuthCookies(c, accessToken, refreshToken);
  const user = await fetchOrCreateProfile(userId, name, email);
  if (!user) {
    return c.json({ error: "Could not create user profile" }, 500);
  }
  return c.json({ user }, status === 201 ? 201 : 200);
}

auth.post("/register", async (c) => {
  const body: unknown = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { name, email, password } = parsed.data;

  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    let message = error.message;
    if (message.includes("Invalid path")) {
      message =
        "Check backend/.env: SUPABASE_URL must be https://YOUR_REF.supabase.co only (no /auth/v1 or /rest/v1 at the end).";
    }
    return c.json({ error: message }, 400);
  }

  if (!data.user) {
    return c.json({ error: "Registration failed" }, 400);
  }

  if (data.session) {
    return respondWithSession(
      c,
      data.user.id,
      name,
      email,
      data.session.access_token,
      data.session.refresh_token,
      201
    );
  }

  // No session — usually email confirmation is on; try immediate login
  const { data: loginData, error: loginError } =
    await supabaseAuth.auth.signInWithPassword({ email, password });

  if (loginData.session) {
    return respondWithSession(
      c,
      loginData.user.id,
      name,
      email,
      loginData.session.access_token,
      loginData.session.refresh_token,
      201
    );
  }

  return c.json(
    {
      error:
        "Account created but not signed in. Turn off “Confirm email” in Supabase (Authentication → Providers → Email), then log in.",
      detail: loginError?.message,
    },
    400
  );
});

auth.post("/login", async (c) => {
  const body: unknown = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    const msg =
      error?.message ??
      "Login failed. If you just registered, confirm your email or disable email confirmation in Supabase.";
    return c.json({ error: msg }, 401);
  }

  const name =
    (data.user.user_metadata?.name as string | undefined) ??
    data.user.email?.split("@")[0] ??
    "User";

  return respondWithSession(
    c,
    data.user.id,
    name,
    data.user.email ?? email,
    data.session.access_token,
    data.session.refresh_token
  );
});

auth.post("/logout", async (c) => {
  clearAuthCookies(c);
  return c.json({ message: "Logged out" });
});

auth.get("/me", requireAuth, (c) => {
  const user = c.get("user");
  return c.json({ user });
});

export default auth;
