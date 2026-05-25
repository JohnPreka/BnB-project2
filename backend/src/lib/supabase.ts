import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

/** Project root only, e.g. https://abcdefgh.supabase.co */
function normalizeSupabaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");

  // Common copy-paste mistakes from Supabase dashboard
  url = url.replace(/\/(auth\/v1|rest\/v1).*$/, "");

  if (url.includes("supabase.com/dashboard")) {
    throw new Error(
      "SUPABASE_URL must be Project Settings → API → Project URL, not the dashboard link"
    );
  }

  if (!url.startsWith("https://")) {
    throw new Error("SUPABASE_URL must start with https://");
  }

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error("SUPABASE_URL is not a valid URL");
  }

  if (!hostname.endsWith(".supabase.co")) {
    throw new Error(
      `SUPABASE_URL should look like https://YOUR_REF.supabase.co (got host: ${hostname})`
    );
  }

  return url;
}

const supabaseUrl = normalizeSupabaseUrl(requireEnv("SUPABASE_URL"));
const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
};

/** Auth sign-up / sign-in (use anon key) */
export const supabaseAuth: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  clientOptions
);

/** Database + admin operations (service role) */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  clientOptions
);

export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...clientOptions,
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
