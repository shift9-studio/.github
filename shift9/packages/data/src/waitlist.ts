import { getSupabase } from "./client";

/* Launch-waitlist capture. Uses the same public, RLS-protected anon client as
   the rest of @shift9/data — the `waitlist` table grants anon INSERT only (no
   SELECT), so a public key can add a row but never read the list. No
   service-role key is introduced anywhere (blueprint §Data). */

export type WaitlistReason = "duplicate" | "invalid" | "unconfigured" | "error";
export type WaitlistResult = { ok: true } | { ok: false; reason: WaitlistReason };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addToWaitlist(
  email: string,
  source = "pinch-landing",
): Promise<WaitlistResult> {
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
    return { ok: false, reason: "invalid" };
  }

  const supabase = getSupabase();
  // Env vars absent (e.g. a build with no secrets): fail soft so the caller can
  // show a graceful message instead of throwing.
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const { error } = await supabase
    .from("waitlist")
    .insert({ email: trimmed, source });

  if (error) {
    // 23505 = unique_violation → this email is already on the list.
    if (error.code === "23505") return { ok: false, reason: "duplicate" };
    return { ok: false, reason: "error" };
  }
  return { ok: true };
}
