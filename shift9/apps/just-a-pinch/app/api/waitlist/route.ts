import { NextResponse } from "next/server";
import { addToWaitlist } from "@shift9/data";

/* POST /api/waitlist — capture a launch-waitlist email into Supabase.
   Body: { email: string }. All persistence goes through @shift9/data, which
   uses the public anon key with an insert-only RLS policy. */
export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: unknown };
    email = typeof body?.email === "string" ? body.email : "";
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const result = await addToWaitlist(email, "pinch-landing");
  if (result.ok) return NextResponse.json({ ok: true });

  const status =
    result.reason === "duplicate"
      ? 409
      : result.reason === "invalid"
        ? 400
        : result.reason === "unconfigured"
          ? 503
          : 500;
  return NextResponse.json(result, { status });
}
