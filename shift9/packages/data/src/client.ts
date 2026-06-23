import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/**
 * Public, read-only Supabase client built from the publishable (anon) key —
 * the single content source described in the blueprint (§5). Safe on server
 * or client: row-level security governs access, and the key is public by
 * design. Returns `null` when env vars are absent so every caller can fall
 * back to static content instead of throwing at build time.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;
  return cached;
}
