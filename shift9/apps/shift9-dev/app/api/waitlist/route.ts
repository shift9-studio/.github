import { addToWaitlist } from "@shift9/data";
import { NextResponse } from "next/server";
import {
  createRateLimiter,
  publicWaitlistResponse,
} from "./waitlist-policy";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_MAX_BUCKETS = 2_000;
const isRateLimited = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1_000,
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
  maxBuckets: RATE_LIMIT_MAX_BUCKETS,
});

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/* POST /api/waitlist captures Flow State beta interest through the shared,
   insert-only Supabase waitlist. No service key is used or exposed here.
   The limiter is bounded; a hidden field adds a second low-cost bot check. */
export async function POST(request: Request) {
  let email = "";
  let website = "";
  try {
    const body = (await request.json()) as {
      email?: unknown;
      website?: unknown;
    };
    email = typeof body.email === "string" ? body.email : "";
    website = typeof body.website === "string" ? body.website : "";
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  if (website) return NextResponse.json({ ok: true });
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, reason: "rate_limited" },
      { status: 429 },
    );
  }

  const result = await addToWaitlist(email, "flow-state");
  const response = publicWaitlistResponse(result);
  return NextResponse.json(response.body, { status: response.status });
}
